/* ══ MathGame · js/config.js ══ (index.html'de sırayla yüklenir) — kritik global değişkenler, en başta yüklenir */
/* Kritik global değişkenler — en başta tanımla */
var WORKER_URL = 'https://mathgame.enesseker2113.workers.dev';
var APP_VERSION = 'v4.0';

/* ── Service Worker kaydı ─────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').then(function(reg) {
      console.log('[SW] Kayıtlı:', reg.scope);
      window._swReg = reg;
    }).catch(function(e) {
      console.warn('[SW] Kayıt hatası:', e);
    });
  });
}

/* ── Klan davet linki — URL'de ?clan-invite=ID varsa işle ── */
(function() {
  try {
    var params = new URLSearchParams(window.location.search);
    var inviteId = params.get('clan-invite');
    if (inviteId) {
      window._pendingClanInvite = inviteId;
    }
  } catch(e) {}
})();

/* Zoom ve double-tap engelleyici */
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) { e.preventDefault(); }
}, { passive: false });

var lastTouch = 0;
document.addEventListener('touchend', function(e) {
  var now = Date.now();
  if (now - lastTouch < 300) {
    e.preventDefault();
  }
  lastTouch = now;
}, { passive: false });

/* iOS safari zoom fix */
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
}, { passive: false });

/* Hata tracking — GA4'e gönder */
window.onerror = function(msg, src, line, col, err) {
  /* Geliştirici debug — satır + kaynak göster */
  console.error('[MathGame Error]', msg, 'satır:', line, 'kaynak:', src);
  try {
    if (typeof gtag === 'function') {
      gtag('event', 'exception', {
        description: msg + ' (satır ' + line + ', ' + (src || '').split('/').pop() + ')',
        fatal: false,
      });
    }
  } catch(e) {}
  return false;
};

/* ── Modül yükleme kapısı ─────────────────────────────────────────────
   Oyun artık birçok dosyadan yüklendiği için, yavaş bağlantıda erken
   tetiklenen asenkron olaylar (ör. Firebase onAuthStateChanged) henüz
   yüklenmemiş modüllere denk gelebilir. mgOnReady(fn): tüm dosyalar
   yüklenene kadar bekler, sonra çalıştırır. js/boot/ready.js açar. */
var MG_READY = false;
var _mgReadyQueue = [];
function mgOnReady(fn) {
  if (MG_READY) { fn(); return; }
  _mgReadyQueue.push(fn);
}
function mgSetReady() {
  MG_READY = true;
  var queue = _mgReadyQueue;
  _mgReadyQueue = [];
  for (var i = 0; i < queue.length; i++) {
    try { queue[i](); } catch (e) { console.error('[mgOnReady]', e); }
  }
}
