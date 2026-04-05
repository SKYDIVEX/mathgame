/* ══════════════════════════════════════════════════════
   MathGame Service Worker — v3.2 SKYDIVEX
   scope: /mathgame/
   ══════════════════════════════════════════════════════ */

const CACHE_NAME = 'mathgame-v3.2';
const OFFLINE_URLS = ['/mathgame/', '/mathgame/index.html'];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(OFFLINE_URLS).catch(function() {});
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = event.request.url;
  if (url.includes('workers.dev') || url.includes('firebase') ||
      url.includes('googleapis') || url.includes('mymemory')) return;

  event.respondWith(
    fetch(event.request).then(function(resp) {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(event.request, clone); });
      }
      return resp;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('/mathgame/index.html');
      });
    })
  );
});

self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch(e) { data = { title: 'MathGame', body: event.data ? event.data.text() : '' }; }
  event.waitUntil(
    self.registration.showNotification(data.title || '🧮 MathGame', {
      body:    data.body    || 'Yeni bildirim!',
      icon:    '/mathgame/icon-192.png',
      badge:   '/mathgame/icon-192.png',
      tag:     data.tag     || 'mathgame',
      data:    { url: data.url || '/mathgame/' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/mathgame/';
  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes('mathgame') && 'focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
