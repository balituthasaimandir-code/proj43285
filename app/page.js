"use client";
import { useEffect, useState } from "react";
import { CONTACTS, GUIDES, KIT } from "./data";
import InstallApp from "./InstallApp";

const TABS = [["sos", "SOS"], ["radar", "Radar"], ["guides", "Guides"], ["kit", "Go-bag"], ["about", "About"]];

function Sos() {
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  async function copyMessage(withLocation) {
    let text = "EMERGENCY! I need immediate help. Please send assistance.";
    if (withLocation && navigator.geolocation) {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
        text += ` My location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      } catch { setStatus("Could not get your location. Copied the message without it."); }
    }
    setMessage(text);
    try { await navigator.clipboard.writeText(text); setStatus((s) => s || "Message copied. Paste it into a text or chat."); }
    catch { setStatus("Copy failed. Select and copy the message below."); }
  }
  const [note, setNote] = useState("");
  useEffect(() => { setNote(localStorage.getItem("saferoute-note") || ""); }, []);
  function saveNote(value) { setNote(value); try { localStorage.setItem("saferoute-note", value); } catch {} }
  return <>
    <section className="hero emergency-hero">
      <div><span className="eyebrow">NEED HELP NOW?</span><h2>Emergency help</h2><p>Call the national emergency number or choose a service below.</p></div>
      <a className="sos-button" href={`tel:${CONTACTS.find((c) => c.primary)?.number || "112"}`}><span aria-hidden>☎</span> CALL SOS <small>{CONTACTS.find((c) => c.primary)?.number || "112"}</small></a>
    </section>
    <section><h2>Emergency numbers</h2><ul className="contacts">{CONTACTS.map((c) => <li key={c.number}><a className={c.primary ? "call primary" : "call"} href={`tel:${c.number}`}><span>{c.label}{c.note && <small>{c.note}</small>}</span><strong>{c.number}</strong></a></li>)}</ul></section>
    <section className="panel"><h2>Generate an SOS message</h2><p>Copy a ready-made distress message to share with family or responders.</p><div className="row"><button onClick={() => copyMessage(true)}>Copy with my location</button><button className="ghost" onClick={() => copyMessage(false)}>Copy message only</button></div><p role="status" className="status">{status}</p>{message && <pre className="msg">{message}</pre>}</section>
    <section className="panel"><h2>My emergency note</h2><p>Save important details on this device, such as a meeting point or medical information.</p><label className="note-label" htmlFor="emergency-note">Your note <span>Saved automatically</span></label><textarea id="emergency-note" value={note} onChange={(e) => saveNote(e.target.value)} placeholder="Type your emergency details here…" rows={4}/></section>
  </>;
}

function Radar() {
  const [position, setPosition] = useState(null);
  const [radiusKm, setRadiusKm] = useState(100);
  const [events, setEvents] = useState([]);
  const [checkedAt, setCheckedAt] = useState(null);
  const [sources, setSources] = useState(null);
  const [status, setStatus] = useState("Share your location to check current reports near you.");
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  function locate() {
    if (!navigator.geolocation) { setStatus("Location is unavailable on this device."); return; }
    setStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition((p) => setPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude }), () => setStatus("Location permission was unavailable. Allow location to find reports near you."), { enableHighAccuracy: true, timeout: 10000 });
  }

  useEffect(() => {
    if (!position) return undefined;
    const key = `saferoute-nearby-${radiusKm}-${position.latitude.toFixed(2)}-${position.longitude.toFixed(2)}`;
    let active = true;
    const controller = new AbortController();
    setEvents([]);
    setCheckedAt(null);
    setSources(null);
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved?.events) {
        setEvents(saved.events);
        setCheckedAt(saved.checkedAt);
        setSources(saved.sources);
        setStatus("Showing the last saved reports while checking for updates.");
      }
    } catch {}

    async function refresh() {
      if (!navigator.onLine) {
        setStatus("Offline. Showing the last saved reports; they may be out of date.");
        return;
      }
      setLoading(true);
      try {
        const query = new URLSearchParams({ lat: position.latitude, lon: position.longitude, radius: radiusKm });
        const response = await fetch(`/api/nearby?${query}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Live hazard data is temporarily unavailable.");
        const result = await response.json();
        if (!active) return;
        setEvents(result.events || []);
        setCheckedAt(result.updatedAt);
        setSources(result.sources);
        const hasSource = result.sources?.gdacs || result.sources?.usgs;
        const message = !hasSource ? "Live sources are unavailable. Check the official alert links below." : result.sources.gdacs && result.sources.usgs ? "Nearby reports refreshed from both live sources." : "Nearby reports refreshed; one live source is unavailable.";
        setStatus(message);
        try { localStorage.setItem(key, JSON.stringify({ events: result.events || [], checkedAt: result.updatedAt, sources: result.sources })); } catch {}
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        setStatus("Live data could not be reached. Showing any saved reports; check official alerts below.");
      } finally { if (active) setLoading(false); }
    }
    refresh();
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [position?.latitude, position?.longitude, radiusKm]);

  const typeInfo = { EQ: ["Earthquake", "〰️"], TC: ["Cyclone", "🌀"], FL: ["Flood", "🌊"], WF: ["Wildfire", "🔥"], VO: ["Volcano", "🌋"] };
  const locationUrl = position ? `https://maps.google.com/?q=${position.latitude},${position.longitude}` : "#";

  return <section>
    <div className="radar-head"><div><span className="eyebrow">LIVE HAZARD RADAR</span><h2>Nearby reported hazards</h2><p>Check official event reports around your current location.</p></div><div className="radar-art" aria-hidden="true"><span>⌖</span><i/><b/></div></div>
    <div className="panel radar-panel">
      <div className="radar-controls"><button onClick={locate}>{position ? "Refresh my location" : "Use my location"}</button><label>Search radius<select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}><option value={100}>100 km</option><option value={250}>250 km</option><option value={500}>500 km</option></select></label></div>
      <p role="status" className="status">{loading ? "Checking live reports..." : status}</p>
      {position && <div className="coords"><strong>Search centered near you</strong><span>{position.latitude.toFixed(4)}, {position.longitude.toFixed(4)} · {radiusKm} km</span><a href={locationUrl} target="_blank" rel="noreferrer">Open location in Maps</a></div>}
      {checkedAt && <p className="checked-at">Last checked {new Date(checkedAt).toLocaleString()}{offline ? " · Offline; reports may be stale" : ""}</p>}
      {position && <div className="hazard-results" aria-live="polite">
        {events.length ? events.map((event) => {
          const [label, icon] = typeInfo[event.type] || [event.type, "⚠️"];
          return <article className="hazard-card" key={event.id}><span className="hazard-icon" aria-hidden="true">{icon}</span><div className="hazard-info"><div className="hazard-title"><strong>{event.name}</strong>{event.alertLevel && <span className={`alert-tag alert-${event.alertLevel.toLowerCase()}`}>{event.alertLevel}</span>}</div><p>{label} · {event.detail}</p><small>{event.distanceKm} km away · {event.source}{event.time ? ` · ${new Date(event.time).toLocaleDateString()}` : ""}</small></div><a href={event.url} target="_blank" rel="noreferrer" aria-label={`View ${event.name} source`}>↗</a></article>;
        }) : position && !loading && <div className="empty-hazards"><strong>{offline ? "No saved reports are available for this area yet." : sources?.gdacs || sources?.usgs ? `No active reports found in ${radiusKm} km.` : "Live reports are temporarily unavailable."}</strong><p>This feed may not include every local warning. Check official alerts before making safety decisions.</p></div>}
      </div>}
      {sources && <p className="source-status">Sources: {sources.gdacs ? "GDACS global hazards" : "GDACS unavailable"} · {sources.usgs ? "USGS earthquakes" : "USGS unavailable"}</p>}
    </div>
    <div className="notice"><strong>Reports are not predictions</strong><p>Earthquakes cannot currently be predicted. These feeds show reported events, not a forecast that a disaster will reach you. Distance is measured from the reported location and does not describe the affected area. Follow official instructions.</p><p className="official-links"><a href="https://sachet.ndma.gov.in/" target="_blank" rel="noreferrer">India NDMA SACHET alerts</a><a href="https://www.gdacs.org/" target="_blank" rel="noreferrer">GDACS global alerts</a></p></div>
  </section>;
}

function Guides() {
  const [key, setKey] = useState("Earthquake"); const g = GUIDES[key];
  return <section><span className="eyebrow">BE PREPARED</span><h2>Disaster guides</h2><div className="disaster-grid">{Object.entries(GUIDES).map(([name, v]) => <button key={name} className={`disaster-card ${key === name ? "selected" : ""} art-${v.art}`} onClick={() => setKey(name)} aria-pressed={key === name}><span className="disaster-art" aria-hidden="true">{v.icon}</span><strong>{name}</strong><span className="card-arrow">↗</span></button>)}</div><div className="guide-detail"><span className="eyebrow">{g.tagline}</span><h2>{g.icon} {key}</h2><ol className="steps">{g.steps.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}</ol></div></section>;
}

function Kit() {
  const [done, setDone] = useState({}); const [ready, setReady] = useState(false);
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem("saferoute-kit") || "{}")); } catch {} setReady(true); }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("saferoute-kit", JSON.stringify(done)); } catch {} }, [done, ready]);
  const count = KIT.filter((i) => done[i]).length;
  return <section><span className="eyebrow">PACK AHEAD</span><h2>Go-bag checklist</h2><p>Tick items off as you pack them. Your progress is saved on this device.</p><div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={KIT.length} aria-valuenow={count}><div style={{ width: `${(count / KIT.length) * 100}%` }} /></div><p className="count">{count} of {KIT.length} packed</p><ul className="kit">{KIT.map((item) => <li key={item}><label><input type="checkbox" checked={!!done[item]} onChange={(e) => setDone({ ...done, [item]: e.target.checked })}/><span>{item}</span></label></li>)}</ul>{count === KIT.length && <p className="done">Your go-bag is fully packed.</p>}{count > 0 && <button className="ghost" onClick={() => setDone({})}>Reset checklist</button>}</section>;
}

function About() {
  const url = "https://saferouteplus.vercel.app";
  return <section><span className="eyebrow">ABOUT THIS PROJECT</span><h2>SafeRoutePlus</h2><div className="about-card"><div className="about-copy"><span className="about-mark">S+</span><h3>Made to help in an emergency.</h3><p>A quick access companion for emergency calls, SOS messages, disaster guidance and preparedness.</p><strong>Created by Sai Sankar Dash</strong></div><div className="qr-card"><h3>Open SafeRoutePlus</h3><a href={url} target="_blank" rel="noreferrer"><img src="/saferouteplus.png" alt={`QR code linking to ${url}`} width="180" height="180"/></a><a href={url} target="_blank" rel="noreferrer">{url}</a><small>Scan with your phone camera</small></div></div><div className="notice"><strong>Share SafeRoutePlus</strong><p>Scan the QR code or visit <a href={url} target="_blank" rel="noreferrer">saferouteplus.vercel.app</a>.</p></div></section>;
}

export default function Home() {
  const [tab, setTab] = useState("sos"); const [theme, setTheme] = useState("light");
  useEffect(() => { const saved = localStorage.getItem("saferoute-theme"); if (saved) setTheme(saved); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem("saferoute-theme", theme); } catch {} }, [theme]);
  return <><header className="top"><a className="brand" href="#home" onClick={() => setTab("sos")}><span className="brand-icon">S+</span><span><strong>SafeRoutePlus</strong><small>Emergency &amp; disaster guide</small></span></a><div className="header-actions"><InstallApp/><button className="theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={`Switch to ${theme === "light" ? "dark" : "day"} mode`}>{theme === "light" ? "☾" : "☀"}<span>{theme === "light" ? "Dark" : "Day"}</span></button></div></header><main>{tab === "sos" && <Sos/>}{tab === "radar" && <Radar/>}{tab === "guides" && <Guides/>}{tab === "kit" && <Kit/>}{tab === "about" && <About/>}</main><nav className="nav" aria-label="Sections">{TABS.map(([id, label]) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}><span className="nav-icon" aria-hidden="true">{{sos:"✚",radar:"⌖",guides:"▤",kit:"✓",about:"ⓘ"}[id]}</span>{label}</button>)}</nav></>;
}
