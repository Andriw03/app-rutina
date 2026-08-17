/* Service worker de Rutina TKD.
   Sube CACHE_VERSION cada vez que cambies index.html o los assets. */
const CACHE_VERSION = 'rutina-tkd-v1';
const THUMBS_CACHE  = 'rutina-tkd-thumbs-v1';
const THUMBS_MAX    = 80;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './fonts/inter-latin.woff2',
  './fonts/oswald-latin.woff2',
  './fonts/plexmono-500-latin.woff2',
  './fonts/plexmono-600-latin.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION && k !== THUMBS_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Recorta el cache de miniaturas para que no crezca sin control. */
async function trimCache(name, max){
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if(keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // Navegación: red primero (para recibir actualizaciones), cache como respaldo.
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html', {ignoreSearch:true}))
    );
    return;
  }

  // Assets propios: cache primero.
  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if(res.ok){
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  // Miniaturas de YouTube: cache primero (respuesta opaca, sirve igual como imagen).
  if(url.hostname === 'i.ytimg.com'){
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(THUMBS_CACHE).then(c => {
          c.put(req, copy).then(() => trimCache(THUMBS_CACHE, THUMBS_MAX));
        });
        return res;
      }).catch(() => Response.error()))
    );
    return;
  }

  // El resto (reproductor de YouTube) va directo a la red.
});
