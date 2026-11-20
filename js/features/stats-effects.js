/* ══ MathGame · js/features/stats-effects.js ══ (index.html'de sırayla yüklenir) */
/* ── İSTATİSTİKLER ──────────────────────────────────────── */
function renderStats() {
  try {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;

    const s = state.stats || {};

    const tot = s.totalAnswered || 0;
    const cor = s.totalCorrect || 0;
    const accuracy = tot > 0 ? Math.round((cor / tot) * 100) : 0;

    // Oynama süresini formatla
    const totalSec = Math.max(0, s.totalTimeSec || 0);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const timeStr = hrs > 0 ? hrs + 's ' + mins + 'd' : mins + ' dakika';

    const items = [
      { val: tot,               lbl: 'Toplam Soru'    },
      { val: cor,               lbl: 'Doğru'          },
      { val: s.totalWrong || 0, lbl: 'Yanlış'         },
      { val: accuracy + '%',    lbl: 'Doğruluk'       },
      { val: s.bestStreak || 0, lbl: 'En Uzun Seri'   },
      { val: s.highestLevel || 1, lbl: 'En Yüksek Seviye' },
      { val: s.absurdPlayed || 0, lbl: 'Absürt Soru'  },
      { val: timeStr,           lbl: 'Oynama Süresi'  },
    ];

    grid.innerHTML = items.map(item =>
      '<div class="stat-box">' +
        '<div class="stat-val">' + item.val + '</div>' +
        '<div class="stat-lbl">' + item.lbl + '</div>' +
      '</div>'
    ).join('');
  } catch(e) {
    console.warn('renderStats hata:', e);
  }
}

/* ── OYNAMA SÜRESİ SAYACI ───────────────────────────────── */
let sessionTimerInterval = null;
let sessionStartedAt = null;

function startSessionTimer() {
  try {
    sessionStartedAt = Date.now();
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = setInterval(() => {
      try {
        if (!sessionStartedAt) return;
        const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
        if (!state.stats) state.stats = {};
        // Her dakikada bir kaydet (performans)
        if (elapsed % 60 === 0) {
          state.stats.totalTimeSec = (state.stats.totalTimeSec || 0) + 60;
          saveState();
        }
      } catch(e) {}
    }, 1000);
  } catch(e) {
    console.warn('startSessionTimer hata:', e);
  }
}

function stopSessionTimer() {
  try {
    if (sessionStartedAt) {
      const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
      if (!state.stats) state.stats = {};
      state.stats.totalTimeSec = (state.stats.totalTimeSec || 0) + elapsed;
      saveState();
    }
    clearInterval(sessionTimerInterval);
    sessionStartedAt = null;
  } catch(e) {
    console.warn('stopSessionTimer hata:', e);
  }
}

/* ── PARTİKÜL PATLAMASI ─────────────────────────────────── */
const PARTICLE_COLORS = ['#00ff66','#ffd700','#ff6b6b','#a855f7','#38bdf8','#fb923c','#f472b6'];

function spawnParticles(x, y, count = 18) {
  try {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';

      const size   = randInt(5, 12);
      const angle  = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.8;
      const dist   = randInt(60, 160);
      const dur    = (0.6 + Math.random() * 0.6).toFixed(2);
      const color  = PARTICLE_COLORS[randInt(0, PARTICLE_COLORS.length - 1)];
      const tx     = Math.round(Math.cos(angle) * dist);
      const ty     = Math.round(Math.sin(angle) * dist);

      p.style.cssText =
        'width:' + size + 'px;height:' + size + 'px;' +
        'left:' + x + 'px;top:' + y + 'px;' +
        'background:' + color + ';' +
        '--tx:' + tx + 'px;--ty:' + ty + 'px;--dur:' + dur + 's;';

      document.body.appendChild(p);
      var pCleanup = function() { try { p.remove(); } catch(e) {} };
      p.addEventListener('animationend', pCleanup, { once: true });
      setTimeout(pCleanup, (parseFloat(dur) + 0.3) * 1000);
    }
  } catch(e) {
    console.warn('spawnParticles hata:', e);
  }
}

function spawnParticlesFromElement(el, count = 18) {
  try {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    spawnParticles(cx, cy, count);
  } catch(e) {
    console.warn('spawnParticlesFromElement hata:', e);
  }
}

/* ── KONFETİ (level up) ─────────────────────────────────── */
var CONFETTI_COLORS = ['#00ff66','#ffd700','#ff6b6b','#a855f7','#38bdf8','#fb923c','#f472b6','#fff'];
var CONFETTI_SHAPES = ['border-radius:50%', 'border-radius:2px', 'transform:rotate(45deg)'];

function spawnConfetti(count = 60) {
  try {
    const W = window.innerWidth;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';

      const x    = randInt(0, W);
      const tx   = randInt(-120, 120);
      const ty   = randInt(200, 500);
      const dur  = (1.0 + Math.random() * 1.0).toFixed(2);
      const rot  = randInt(180, 1080);
      const col  = CONFETTI_COLORS[randInt(0, CONFETTI_COLORS.length - 1)];
      const shp  = CONFETTI_SHAPES[randInt(0, CONFETTI_SHAPES.length - 1)];
      const delay= (Math.random() * 0.4).toFixed(2);
      const size = randInt(6, 12);

      el.style.cssText =
        'left:' + x + 'px;top:-20px;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'background:' + col + ';' +
        shp + ';' +
        '--tx:' + tx + 'px;--ty:' + ty + 'px;--dur:' + dur + 's;--rot:' + rot + 'deg;' +
        'animation-delay:' + delay + 's;';

      document.body.appendChild(el);
      /* animationend + timeout ile ikili güvence */
      var maxDur = (parseFloat(dur) + parseFloat(delay) + 0.2) * 1000;
      var cleanup = function() { try { el.remove(); } catch(e) {} };
      el.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, maxDur);
    }
  } catch(e) {
    console.warn('spawnConfetti hata:', e);
  }
}

/* ── KOMBO GÖSTERGESİ ───────────────────────────────────── */
let comboTimer = null;

function showCombo(streak) {
  try {
    if (streak < 3) return; // 3'ten küçük combolar gösterilmez
    const el = document.getElementById('comboDisplay');
    if (!el) return;

    const emojis = ['','','','🔥','⚡','💥','🌪️','🛸','👾','💎','👑'];
    const emoji = emojis[Math.min(streak, emojis.length - 1)] || '👑';

    el.textContent = emoji + ' ' + streak + ' Seri!';
    el.classList.remove('show');
    el.offsetHeight; // reflow
    el.classList.add('show');

    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      try { el.classList.remove('show'); } catch(e) {}
    }, 700);
  } catch(e) {
    console.warn('showCombo hata:', e);
  }
}

/* ── STREAK BADGE (sağ üst) ─────────────────────────────── */
function updateStreakBadge(streak) {
  try {
    var badge = document.getElementById('streakBadge');
    var count = document.getElementById('streakCount');
    if (!badge || !count) return;
    /* Sadece oyun ekranında göster */
    var gameScreen = document.getElementById('gameArea');
    var gameVisible = gameScreen && gameScreen.style.display !== 'none';
    if (streak >= 3 && gameVisible) {
      count.textContent = streak;
      badge.style.display = 'block';
      if (streak >= 20) {
        badge.style.background = 'rgba(168,85,247,0.2)';
        badge.style.borderColor = 'rgba(168,85,247,0.5)';
        badge.style.color = '#c084fc';
      } else if (streak >= 10) {
        badge.style.background = 'rgba(239,68,68,0.15)';
        badge.style.borderColor = 'rgba(239,68,68,0.4)';
        badge.style.color = '#ef4444';
      } else {
        badge.style.background = 'rgba(255,140,0,0.15)';
        badge.style.borderColor = 'rgba(255,140,0,0.4)';
        badge.style.color = '#ff8c00';
      }
    } else {
      badge.style.display = 'none';
    }
  } catch(e) {}
}

/* ══════════════════════════════════════════════════════════════════
   PANEL RENDER — çağrılacak her menü açıldığında
   ══════════════════════════════════════════════════════════════════ */
function refreshMenuPanels() {
  try { renderStats();        } catch(e) { console.warn('renderStats hata:', e); }
  try { renderAchievements(); } catch(e) { console.warn('renderAchievements hata:', e); }
  try { updateDailyTasks();   } catch(e) { console.warn('updateDailyTasks hata:', e); }
  try { fetchOnlineLeaderboard(); } catch(e) {}
  try { updateWallet(); } catch(e) {}
  try { updateQuestQuickInfo(); } catch(e) {}
  /* Klan quick info */
  try {
    var qi = document.getElementById('clanQuickInfo');
    if (qi) qi.textContent = state.clanId ? '✓ Klana üyesin' : 'Kur veya katıl';
  } catch(e) {}
  try {
    if (state && state.theme && THEMES[state.theme]) {
      applyTheme(state.theme);
    }
  } catch(e) {}
}
