/* ══════════════════════════════════════════════════════
   MathGame Service Worker — v4.0 SKYDIVEX (modüler)
   scope: /mathgame/
   ══════════════════════════════════════════════════════ */

const CACHE_NAME = 'mathgame-v4.0-modular';
const OFFLINE_URLS = [
  '/mathgame/',
  '/mathgame/index.html',
  '/mathgame/js/config.js?v=4.0',
  '/mathgame/css/base.css?v=4.0',
  '/mathgame/css/layout.css?v=4.0',
  '/mathgame/css/pages.css?v=4.0',
  '/mathgame/css/components.css?v=4.0',
  '/mathgame/css/modals-auth-profile.css?v=4.0',
  '/mathgame/css/modals-admin.css?v=4.0',
  '/mathgame/css/achievements.css?v=4.0',
  '/mathgame/css/modals-misc.css?v=4.0',
  '/mathgame/css/effects.css?v=4.0',
  '/mathgame/css/v4-additions.css?v=4.0',
  '/mathgame/js/analytics.js?v=4.0',
  '/mathgame/js/core/i18n.js?v=4.0',
  '/mathgame/js/core/state.js?v=4.0',
  '/mathgame/js/core/dom-refs.js?v=4.0',
  '/mathgame/js/core/audio.js?v=4.0',
  '/mathgame/js/core/storage-utils.js?v=4.0',
  '/mathgame/js/ui/navigation-modals.js?v=4.0',
  '/mathgame/js/features/economy.js?v=4.0',
  '/mathgame/js/features/clan.js?v=4.0',
  '/mathgame/js/ui/settings-leaderboard.js?v=4.0',
  '/mathgame/js/ui/entry.js?v=4.0',
  '/mathgame/js/game/game-core.js?v=4.0',
  '/mathgame/js/features/achievements.js?v=4.0',
  '/mathgame/js/features/stats-effects.js?v=4.0',
  '/mathgame/js/features/themes-levelup.js?v=4.0',
  '/mathgame/js/features/daily-tasks.js?v=4.0',
  '/mathgame/js/features/bg-library.js?v=4.0',
  '/mathgame/js/auth/auth-online.js?v=4.0',
  '/mathgame/js/admin/admin-panel.js?v=4.0',
  '/mathgame/js/admin/badges-scroll.js?v=4.0',
  '/mathgame/js/admin/super-admin.js?v=4.0',
  '/mathgame/js/auth/session-login-pin.js?v=4.0',
  '/mathgame/js/social/chat.js?v=4.0',
  '/mathgame/js/social/public-profile.js?v=4.0',
  '/mathgame/js/social/events-social.js?v=4.0',
  '/mathgame/js/social/announcements.js?v=4.0',
  '/mathgame/js/game/counters-patches.js?v=4.0',
  '/mathgame/js/social/feedback-chest-challenge.js?v=4.0',
  '/mathgame/js/social/clan-chat-notif.js?v=4.0',
  '/mathgame/js/boot/init.js?v=4.0',
  '/mathgame/js/features/task-counter-patches.js?v=4.0',
  '/mathgame/js/ui/ripple.js?v=4.0',
  '/mathgame/js/ui/event-bindings.js?v=4.0',
  '/mathgame/js/patches/v31-features.js?v=4.0',
  '/mathgame/js/patches/v32-patches.js?v=4.0',
  '/mathgame/js/boot/ready.js?v=4.0'
];

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
