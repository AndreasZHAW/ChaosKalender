// ChaosKalender Service Worker
// WICHTIG: CACHE_NAME bei jedem Deployment hochzählen (v5, v6, ...),
// sonst bleiben alte Dateien im Cache hängen und Updates kommen nicht an.
const CACHE_NAME = 'chaoskalender-v64';
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
// zwischengespeicherte Version als Fallback genutzt.
//
// SICHERHEIT/STABILITÄT: Es werden nur GET-Anfragen für die eigene Seite und
// für die (versionsfesten) Firebase-Skripte und Schriften zwischengespeichert.
// Alles andere – vor allem der Datenbank- und Login-Verkehr (Firestore, Auth) –
// läuft unberührt am Service-Worker vorbei. Vorher wurden auch diese
// Antworten mitgeschnitten: das hat dauerhaft Daten auf dem Gerät abgelegt und
// konnte langlebige Datenbank-Verbindungen stören.
const CACHEBARE_FREMDE_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

function istCachebar(request){
  if(request.method !== 'GET') return false;
  const url = new URL(request.url);
  if(url.origin === self.location.origin) return true;
  if(url.hostname === 'www.gstatic.com') return url.pathname.startsWith('/firebasejs/');
  return CACHEBARE_FREMDE_HOSTS.includes(url.hostname);
}

self.addEventListener('fetch', (event) => {
  if(!istCachebar(event.request)) return; // nicht anfassen -> normales Browser-Verhalten
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if(response && response.ok){
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
