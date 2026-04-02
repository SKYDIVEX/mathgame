/* ══════════════════════════════════════════════════════
   MathGame Service Worker — v3.1 SKYDIVEX
   Push bildirimleri + offline cache
   ══════════════════════════════════════════════════════ */

const CACHE_NAME = 'mathgame-v3.1';
const OFFLINE_URLS = [
  './',
  './index.html',
];

/* ── Install: cache'e al ─────────────────────────────── */
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(OFFLINE_URLS).catch(function(e) {
        console.warn('[SW] Cache hatası:', e);
      });
    })
  );
});

/* ── Activate: eski cache'leri temizle ───────────────── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: network-first, offline fallback ──────────── */
self.addEventListener('fetch', function(event) {
  /* Sadece GET isteklerini yakala */
  if (event.request.method !== 'GET') { return; }
  /* Worker API isteklerini geçir */
  if (event.request.url.includes('workers.dev') || event.request.url.includes('firebase')) { return; }

  event.respondWith(
    fetch(event.request).then(function(response) {
      /* Başarılı yanıtı cache'e ekle */
      if (response && response.status === 200 && response.type === 'basic') {
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, cloned);
        });
      }
      return response;
    }).catch(function() {
      /* Network yoksa cache'ten sun */
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});

/* ── Push Bildirimleri ───────────────────────────────── */
self.addEventListener('push', function(event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = { title: 'MathGame', body: event.data ? event.data.text() : '' };
  }

  var title   = data.title || '🧮 MathGame';
  var options = {
    body:    data.body || 'Yeni bir bildirim var!',
    icon:    data.icon || './icon-192.png',
    badge:   './icon-72.png',
    tag:     data.tag || 'mathgame-notif',
    data:    { url: data.url || './' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* ── Bildirime tıklanınca ────────────────────────────── */
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      /* Açık pencere varsa focusla */
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('mathgame') && 'focus' in client) {
          return client.focus();
        }
      }
      /* Yoksa yeni sekme aç */
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/* ── Push subscription değişince ────────────────────── */
self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
    }).then(function(sub) {
      console.log('[SW] Push subscription yenilendi');
    })
  );
});
