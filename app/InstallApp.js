"use client";
import { useEffect, useState } from "react";

export default function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const capture = (event) => { event.preventDefault(); setPrompt(event); };
    const installed = () => { setPrompt(null); setMessage("SafeRoutePlus is installed on this device."); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function install() {
    if (!prompt) {
      setMessage("In Chrome, open the ⋮ menu and choose “Install app” or “Add to Home screen”.");
      return;
    }
    await prompt.prompt();
    setPrompt(null);
  }

  return <div className="install-wrap"><button className="install-button" onClick={install}>＋ Install app</button>{message && <p className="install-message" role="status">{message}</p>}</div>;
}
