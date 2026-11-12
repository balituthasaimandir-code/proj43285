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
  const [status, setStatus] = useState("Allow location to show your position for evacuation planning.");
  function locate() {
    if (!navigator.geolocation) { setStatus("Location is unavailable on this device."); return; }
    setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition((p) => { setPosition(p.coords); setStatus("Your location is ready to share with responders."); }, () => setStatus("Location permission was unavailable. You can still use the safety guidance below."), { enableHighAccuracy: true, timeout: 10000 });
  }
  return <section>
    <div className="radar-head"><div><span className="eyebrow">EVACUATION RADAR</span><h2>Find your way to safety</h2><p>Share your live coordinates and follow official evacuation instructions.</p></div><div className="radar-art" aria-hidden="true"><span>⌖</span><i/><b/></div></div>
    <div className="panel radar-panel"><button onClick={locate}>◎ {position ? "Refresh my location" : "Locate me"}</button><p role="status" className="status">{status}</p>{position && <div className="coords"><strong>Your coordinates</strong><span>{position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}</span><a href={`https://maps.google.com/?q=${position.latitude},${position.longitude}`} target="_blank" rel="noreferrer">Open in Maps ↗</a></div>}</div>
    <div className="notice"><strong>Evacuation tip</strong><p>Use marked routes and official shelters. Never enter floodwater; move to higher ground when flooding threatens. This app does not have live shelter or hazard data.</p></div>
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
