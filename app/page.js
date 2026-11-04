"use client";
import { useEffect, useState } from "react";
import { CONTACTS, GUIDES, KIT } from "./data";

const TABS = [
  ["sos", "SOS"],
  ["guides", "Guides"],
  ["kit", "Go-bag"],
];

function Sos() {
  const [status, setStatus] = useState("");

  async function copyMessage(withLocation) {
    let text = "EMERGENCY! I need immediate help. Please send assistance.";
    if (withLocation && navigator.geolocation) {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
        );
        const { latitude, longitude } = pos.coords;
        text += ` My location: https://maps.google.com/?q=${latitude},${longitude}`;
      } catch {
        setStatus("Could not get your location. Copied the message without it.");
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus((s) => s || "Message copied. Paste it into a text or chat.");
    } catch {
      setStatus("Copy failed. Select and copy the message below.");
    }
    setMessage(text);
  }
  const [message, setMessage] = useState("");

  return (
    <section>
      <h2>Call for help</h2>
      <p className="warn">In immediate danger? Call your emergency number now.</p>
      <ul className="contacts">
        {CONTACTS.map((c) => (
          <li key={c.number}>
            <a className={c.primary ? "call primary" : "call"} href={`tel:${c.number}`}>
              <span>
                {c.label}
                {c.note && <small>{c.note}</small>}
              </span>
              <strong>{c.number}</strong>
            </a>
          </li>
        ))}
      </ul>

      <h2>Send an SOS message</h2>
      <p>Copy a ready-made distress message to share with family or responders.</p>
      <div className="row">
        <button onClick={() => copyMessage(true)}>Copy with my location</button>
        <button className="ghost" onClick={() => copyMessage(false)}>Copy message only</button>
      </div>
      <p role="status" className="status">{status}</p>
      {message && <pre className="msg">{message}</pre>}
    </section>
  );
}

function Guides() {
  const [key, setKey] = useState("Earthquake");
  const g = GUIDES[key];
  return (
    <section>
      <h2>What to do</h2>
      <div className="chips" role="tablist">
        {Object.entries(GUIDES).map(([name, v]) => (
          <button
            key={name}
            role="tab"
            aria-selected={key === name}
            className={key === name ? "chip on" : "chip"}
            onClick={() => setKey(name)}
          >
            <span aria-hidden>{v.icon}</span> {name}
          </button>
        ))}
      </div>
      <ol className="steps">
        {g.steps.map(([title, body]) => (
          <li key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Kit() {
  const [done, setDone] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem("saferoute-kit") || "{}"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("saferoute-kit", JSON.stringify(done));
    } catch {}
  }, [done, ready]);

  const count = KIT.filter((i) => done[i]).length;
  const full = count === KIT.length;
  return (
    <section>
      <h2>Go-bag checklist</h2>
      <p>Tick items off as you pack them. Your progress is saved on this device.</p>
      <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={KIT.length} aria-valuenow={count}>
        <div style={{ width: `${(count / KIT.length) * 100}%` }} />
      </div>
      <p className="count">{count} of {KIT.length} packed</p>
      <ul className="kit">
        {KIT.map((item) => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                checked={!!done[item]}
                onChange={(e) => setDone({ ...done, [item]: e.target.checked })}
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      {full && <p className="done">Your go-bag is fully packed.</p>}
      {count > 0 && <button className="ghost" onClick={() => setDone({})}>Reset checklist</button>}
    </section>
  );
}

export default function Home() {
  const [tab, setTab] = useState("sos");
  return (
    <>
      <header className="top">
        <h1>SafeRoute</h1>
        <p>Community disaster and emergency guide</p>
      </header>
      <main>
        {tab === "sos" && <Sos />}
        {tab === "guides" && <Guides />}
        {tab === "kit" && <Kit />}
      </main>
      <nav className="nav" aria-label="Sections">
        {TABS.map(([id, label]) => (
          <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
