// Minimal service worker — makes the app installable and caches the shell
// for a faster repeat load. Deliberately NOT doing offline write-queueing or
// background sync (per product spec: keep this simple and reliable).
const CACHE_NAME = "expense-tracker-shell-v1";
const SHELL_URLS = ["/", "/dashboard"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first: always prefer fresh data, fall back to cache only if offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
