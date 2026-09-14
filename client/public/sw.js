const CACHE_NAME = "baan-rao-shell-v2";
const APP_SHELL = ["/", "/manifest.json", "/icons/home-icon.svg", "/icons/home-icon-192.png", "/icons/home-icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/") .then(response => response || new Response("บ้านเราพร้อมใช้งานเมื่อกลับมาออนไลน์", { status: 503 })))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const update = fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || update;
    })
  );
});
