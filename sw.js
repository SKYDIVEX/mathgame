/* MathGame — Service Worker v1.0 — SKYDIVEX
   Kapsam: /mathgame/
   Strateji: Network-first, offline fallback
*/

var CACHE_NAME = 'mathgame-v2-6';

/* Cache'e alınacak statik kaynaklar */
var STATIC_ASSETS = [
  '/mathgame/',
  '/mathgame/index.html',
];

/* ── Install ── */
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        console.warn('[SW] Statik asset cache hatası:', err);
      });
    })
  );
});

/* ── Activate ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  /* Cloudflare Worker isteklerini asla cache'leme — her zaman network */
  if (url.includes('workers.dev') || url.includes('firebase') || url.includes('google')) {
    event.respondWith(fetch(event.request));
    return;
  }

  /* POST isteklerini cache'leme */
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  /* Network-first stratejisi: önce network, başarısız olursa cache */
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        /* Sadece başarılı HTML/JS/CSS cevaplarını cache'le */
        if (response.ok && event.request.destination !== 'document') {
          return response;
        }
        if (response.ok) {
          var cloned = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(function() {
        /* Network yok — cache'ten sun */
        return caches.match(event.request).then(function(cached) {
          if (cached) { return cached; }
          /* Ana sayfa fallback */
          return caches.match('/mathgame/index.html');
        });
      })
  );
});
