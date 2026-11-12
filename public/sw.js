const CACHE_NAME = "saferouteplus-offline-v3";
const PUBLIC_FILES = ["/manifest.json", "/saferouteplus-icon.svg", "/saferouteplus.png"];
const STATIC_PATH = "/_next/static/";

async function precacheApp() {
  const cache = await caches.open(CACHE_NAME);
  const page = await fetch("/", { cache: "reload" });
  if (!page.ok) throw new Error("SafeRoutePlus could not be downloaded for offline use.");
  const html = await page.clone().text();
  await cache.put("/", page);

  const assets = new Set(PUBLIC_FILES);
  for (const match of html.matchAll(/(?:src|href)=["']([^"']*\/_next\/static\/[^"']+)["']/g)) {
    assets.add(new URL(match[1], self.location.origin).href);
  }

  const stylesheets = [...assets].filter((asset) => asset.includes("/_next/static/css/"));
  for (const stylesheet of stylesheets) {
    try {
      const response = await fetch(stylesheet);
      if (response.ok) {
        const css = await response.clone().text();
        await cache.put(stylesheet, response);
        for (const match of css.matchAll(/url\(["']?(\/\_next\/static\/[^)'"\s]+)["']?\)/g)) {
          assets.add(new URL(match[1], self.location.origin).href);
        }
      }
    } catch {}
  }

  const downloads = [...assets].filter((asset) => !asset.includes("/_next/static/css/"));
  const results = await Promise.allSettled(downloads.map(async (asset) => {
    const response = await fetch(asset);
    if (!response.ok) throw new Error(`Failed to cache ${asset}`);
    await cache.put(asset, response);
  }));
  if (results.some((result) => result.status === "rejected")) {
    throw new Error("Some SafeRoutePlus files could not be saved offline.");
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheApp().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((client) => client.postMessage({ type: "OFFLINE_READY", version: CACHE_NAME }));
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CHECK_OFFLINE_READY") return;
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.match("/")).then((page) => {
    event.source?.postMessage({ type: page ? "OFFLINE_READY" : "OFFLINE_NOT_READY", version: CACHE_NAME });
  }));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  const url = new URL(event.request.url);
  if (url.pathname.startsWith(STATIC_PATH) || PUBLIC_FILES.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
      }
      return response;
    }).catch(() => caches.match("/")));
  }
});
