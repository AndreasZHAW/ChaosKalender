// ChaosKalender Service Worker
// WICHTIG: CACHE_NAME bei jedem Deployment hochzählen (v5, v6, ...),
// sonst bleiben alte Dateien im Cache hängen und Updates kommen nicht an.
const CACHE_NAME = 'chaoskalender-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Netzwerk-zuerst-Strategie: versucht IMMER zuerst die aktuelle Version
// aus dem Netz zu laden. Nur wenn kein Internet da ist, wird die
// zwischengespeicherte Version als Fallback genutzt (Offline-Fähigkeit
// bleibt erhalten, aber Updates kommen jetzt sofort an statt hängen zu
// bleiben).
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
