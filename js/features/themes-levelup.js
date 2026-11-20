/* ══ MathGame · js/features/themes-levelup.js ══ (index.html'de sırayla yüklenir) */
/* ════════════════════════════════════════════════════════════
   MathGame — Günlük Görevler, Tema Sistemi, Level-Up Ekranı,
               Session İstatistikleri, Gelişmiş Sesler
   ════════════════════════════════════════════════════════════ */

/* ── TEMA SİSTEMİ ────────────────────────────────────────── */
var THEMES = {
  green:  { neon:'#00ff66', bg:'#060708', bgMid:'#0b1220', btnText:'#041a0c' },
  purple: { neon:'#a855f7', bg:'#07060d', bgMid:'#0f0b1a', btnText:'#18083a' },
  blue:   { neon:'#38bdf8', bg:'#060810', bgMid:'#090e1c', btnText:'#031524' },
  red:    { neon:'#ff6b6b', bg:'#0d0606', bgMid:'#180a0a', btnText:'#2a0505' },
  gold:   { neon:'#ffd700', bg:'#0a0900', bgMid:'#141200', btnText:'#1a1200' },
};

function applyTheme(themeId) {
  try {
    const t = THEMES[themeId];
    if (!t) return;

    const root = document.documentElement;
    root.style.setProperty('--neon',     t.neon);
    root.style.setProperty('--bg-dark',  t.bg);
    root.style.setProperty('--bg-mid',   t.bgMid);
    root.style.setProperty('--btn-text', t.btnText);
    /* bgLayer gradient güncelle */
    /* Fotoğraf yoksa bgLayer gradient güncelle */
    if(!document.body.classList.contains('has-bg-image')){
      bgLayer.style.background = 'linear-gradient(180deg,' + t.bg + ',' + t.bgMid + ')';
    }
    /* body background-color'u tema rengine güncelle */
    document.body.style.backgroundColor = t.bg;

    /* Tema butonlarını güncelle */
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeId);
    });

    /* State'e kaydet */
    if (!state) return;
    state.theme = themeId;
    saveState();
  } catch(e) {
    console.warn('applyTheme hata:', e);
  }
}

/* Tema butonlarına event listener — delegate ile */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.theme-btn');
  if (btn) { try { applyTheme(btn.dataset.theme); } catch(e) {} }
});

/* ── LEVEL-UP TAM EKRAN ──────────────────────────────────── */
let levelUpScreenTimer = null;
let levelUpPendingNext = false;

function showLevelUpScreen(newLevel, callback) {
  try {
    const screen   = document.getElementById('levelUpScreen');
    const levelNum = document.getElementById('luLevelNum');
    const subText  = document.getElementById('luSubText');
    if (!screen || !levelNum) { if(callback) callback(); return; }

    levelNum.textContent = newLevel;

    /* Seviyeye göre motivasyon mesajı */
    const msgs = [
      [1,  4,  '🌱 Harika başlangıç!'],
      [5,  9,  '🔥 Isındın gidiyor!'],
      [10, 14, '⚡ Artık tehlikeli hissettiriyorsun!'],
      [15, 19, '🌪️ Kasırga gibisin!'],
      [20, 29, '🛸 Uzay seviyesine geçtin!'],
      [30, 49, '👾 Efsane bölgesine girdin!'],
      [50, 99, '👑 SEN BİR MATEMATK TANRISIN!'],
    ];
    const msg = msgs.find(([min, max]) => newLevel >= min && newLevel <= max);
    subText.textContent = msg ? msg[2] : '🎯 Devam et!';

    screen.classList.add('show');
    levelUpPendingNext = true;

    /* Tıkla/dokun → kapat */
    const close = () => {
      try {
        screen.classList.remove('show');
        screen.removeEventListener('click', close);
        clearTimeout(levelUpScreenTimer);
        levelUpPendingNext = false;
        if (callback) callback();
      } catch(e) { if (callback) callback(); }
    };

    screen.addEventListener('click', close, { once: true });

    /* 3.5 saniye sonra otomatik kapat */
    clearTimeout(levelUpScreenTimer);
    levelUpScreenTimer = setTimeout(close, 3500);
  } catch(e) {
    console.warn('showLevelUpScreen hata:', e);
    if (callback) callback();
  }
}
