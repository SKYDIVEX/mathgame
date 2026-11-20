/* ══ MathGame · js/analytics.js ══ (index.html'de sırayla yüklenir) — Google Analytics yardımcıları */
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-0315CE76DC');

/* ── GA4 Event Helper ── */
function trackEvent(name, params) {
  try {
    if (typeof gtag === 'function') {
      gtag('event', name, params || {});
    }
  } catch(e) {}
}
