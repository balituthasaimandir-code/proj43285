"use client";
import { useEffect, useState } from "react";

export default function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  const [message, setMessage] = useState("");
  const [online, setOnline] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkOfflineReady = () => navigator.serviceWorker?.controller?.postMessage({ type: "CHECK_OFFLINE_READY" });
    const onWorkerMessage = (event) => {
      if (mounted && event.data?.type === "OFFLINE_READY") setOfflineReady(true);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onWorkerMessage);
      navigator.serviceWorker.addEventListener("controllerchange", checkOfflineReady);
      navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready.then(checkOfflineReady)).catch(() => {});
    }
    const capture = (event) => { event.preventDefault(); setPrompt(event); };
    const installed = () => { setPrompt(null); setMessage("SafeRoutePlus is installed on this device."); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      mounted = false;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onWorkerMessage);
        navigator.serviceWorker.removeEventListener("controllerchange", checkOfflineReady);
      }
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function install() {
    if (!prompt) {
      setMessage("Open the browser menu and choose Install app or Add to Home screen.");
      return;
    }
    await prompt.prompt();
    setPrompt(null);
  }

  const status = !online ? "Offline mode" : offlineReady ? "Offline ready" : "Preparing offline";
  return <div className="install-wrap"><span className={`offline-status ${!online ? "offline" : offlineReady ? "ready" : "preparing"}`} role="status" title={offlineReady ? "SafeRoutePlus is saved on this device for offline use." : "Keep SafeRoutePlus open online until offline files finish downloading."}><span aria-hidden="true"/>{status}</span><button className="install-button" onClick={install}>Install app</button>{message && <p className="install-message" role="status">{message}</p>}</div>;
}
