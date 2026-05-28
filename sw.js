// ResumeCanvas service worker
// Bump CACHE_VERSION whenever shell files change so old clients refresh.
const CACHE_VERSION = "rc-v16-2026-05-28-import-review";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const FONTS_CACHE = `${CACHE_VERSION}-fonts`;

const SHELL_URLS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./vendor/pdf-writer.js",
  "./vendor/qr.js",
  "./vendor/resume-parse.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-maskable.svg",
  "./apple-touch-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== FONTS_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isFontRequest(url) {
  return url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Stale-while-revalidate for Google Fonts CSS + woff2.
  if (isFontRequest(url)) {
    event.respondWith(
      caches.open(FONTS_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((resp) => {
          if (resp && resp.status === 200) cache.put(req, resp.clone());
          return resp;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Same-origin: navigation = network-first w/ offline fallback to index.html.
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      event.respondWith(
        fetch(req).catch(() =>
          caches.match("./index.html").then((r) => r || Response.error())
        )
      );
      return;
    }
    // Static assets: cache-first, fall through to network, then cache the result.
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const copy = resp.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(req, copy));
          }
          return resp;
        });
      })
    );
  }
});

// Allows the page to ask us to update immediately after install.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
