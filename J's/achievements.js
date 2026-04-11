/* ════════════════════════════════════════════════════════════
   MathGame — Başarı, İstatistik, Partikül, Konfeti, Kombo
   ════════════════════════════════════════════════════════════ */

/* ── BAŞARI TANIMI ─────────────────────────────────────────── */
var ACHIEVEMENTS = [
  /* ── Seri ── */
  { id:'streak_3',   icon:'🔥', cat:'🔥 Seri',       name:'Isındım',         desc:'3 doğru arka arkaya',                   check: s => (s.stats ? (s.stats.bestStreak || 0) : 0) >= 3    },
  { id:'streak_5',   icon:'⚡', cat:'🔥 Seri',       name:'Voltaj',          desc:'5 doğru arka arkaya',                   check: s => (s.stats ? (s.stats.bestStreak || 0) : 0) >= 5    },
  { id:'streak_10',  icon:'🌩️', cat:'🔥 Seri',       name:'Elektrik',        desc:'10 doğru arka arkaya',                  check: s => (s.stats ? (s.stats.bestStreak || 0) : 0) >= 10   },
  { id:'streak_20',  icon:'🌪️', cat:'🔥 Seri',       name:'Kasırga',         desc:'20 doğru arka arkaya',                  check: s => (s.stats ? (s.stats.bestStreak || 0) : 0) >= 20   },
  { id:'streak_50',  icon:'💥', cat:'🔥 Seri',       name:'Patlamak Üzere',  desc:'50 doğru arka arkaya',                  check: s => (s.stats ? (s.stats.bestStreak || 0) : 0) >= 50   },
  { id:'streak_100', icon:'🐲', cat:'🔥 Seri',       name:'Ejderha',         desc:'100 doğru arka arkaya',                 check: s => (s.stats ? (s.stats.bestStreak || 0) : 0) >= 100  },

  /* ── Seviye ── */
  { id:'level_3',    icon:'🌱', cat:'📈 Seviye',     name:'Başlangıç',       desc:"Seviye 3'e ulaş",                       check: s => (s.stats ? (s.stats.highestLevel || 1) : 1) >= 3  },
  { id:'level_5',    icon:'🚀', cat:'📈 Seviye',     name:'Yükseliyorum',    desc:"Seviye 5'e ulaş",                       check: s => (s.stats ? (s.stats.highestLevel || 1) : 1) >= 5  },
  { id:'level_10',   icon:'🛸', cat:'📈 Seviye',     name:'Uzayda',          desc:"Seviye 10'a ulaş",                      check: s => (s.stats ? (s.stats.highestLevel || 1) : 1) >= 10 },
  { id:'level_20',   icon:'👾', cat:'📈 Seviye',     name:'Efsane',          desc:"Seviye 20'ye ulaş",                     check: s => (s.stats ? (s.stats.highestLevel || 1) : 1) >= 20 },
  { id:'level_50',   icon:'🏔️', cat:'📈 Seviye',     name:'Zirve',           desc:"Seviye 50'ye ulaş",                     check: s => (s.stats ? (s.stats.highestLevel || 1) : 1) >= 50 },
  { id:'level_100',  icon:'🌌', cat:'📈 Seviye',     name:'Tanrı Modu',      desc:"Seviye 100'e ulaş",                     check: s => (s.stats ? (s.stats.highestLevel || 1) : 1) >= 100},

  /* ── Puan ── */
  { id:'score_500',  icon:'💵', cat:'💰 Puan',       name:'İlk Beş Yüz',    desc:'500 puana ulaş',                        check: s => (s.score||0) >= 500   },
  { id:'score_1000', icon:'💰', cat:'💰 Puan',       name:'Bin Puan',        desc:'1000 puana ulaş',                       check: s => (s.score||0) >= 1000  },
  { id:'score_5000', icon:'💎', cat:'💰 Puan',       name:'Beş Bin',         desc:'5000 puana ulaş',                       check: s => (s.score||0) >= 5000  },
  { id:'score_10k',  icon:'👑', cat:'💰 Puan',       name:'Kral',            desc:'10.000 puana ulaş',                     check: s => (s.score||0) >= 10000 },
  { id:'score_50k',  icon:'🏆', cat:'💰 Puan',       name:'Efsane Skorer',   desc:'50.000 puana ulaş',                     check: s => (s.score||0) >= 50000 },

  /* ── Soru Sayısı ── */
  { id:'ans_1',      icon:'🎯', cat:'📚 Emek',       name:'İlk Adım',        desc:'İlk doğru cevabı ver',                  check: s => (s.stats ? (s.stats.totalCorrect || 0) : 0) >= 1  },
  { id:'ans_10',     icon:'✏️', cat:'📚 Emek',       name:'Kalem Kıran',     desc:'10 soru doğru cevapla',                 check: s => (s.stats ? (s.stats.totalCorrect || 0) : 0) >= 10 },
  { id:'ans_50',     icon:'📚', cat:'📚 Emek',       name:'Çalışkan',        desc:'50 soru doğru cevapla',                 check: s => (s.stats ? (s.stats.totalCorrect || 0) : 0) >= 50 },
  { id:'ans_200',    icon:'🧠', cat:'📚 Emek',       name:'Matematik Dehası',desc:'200 soru doğru cevapla',                check: s => (s.stats ? (s.stats.totalCorrect || 0) : 0) >= 200},
  { id:'ans_500',    icon:'🔬', cat:'📚 Emek',       name:'Araştırmacı',     desc:'500 soru doğru cevapla',                check: s => (s.stats ? (s.stats.totalCorrect || 0) : 0) >= 500},
  { id:'ans_1000',   icon:'🎓', cat:'📚 Emek',       name:'Profesör',        desc:'1000 soru doğru cevapla',               check: s => (s.stats ? (s.stats.totalCorrect || 0) : 0) >= 1000},

  /* ── Mükemmellik ── */
  { id:'perfect_10', icon:'✨', cat:'⭐ Mükemmellik', name:'Kusursuz 10',     desc:'Hiç yanlış yapmadan 10 soru',           check: s => (s.stats ? (s.stats.currentNoWrong || 0) : 0) >= 10 },
  { id:'perfect_25', icon:'💫', cat:'⭐ Mükemmellik', name:'Pırıl Pırıl',    desc:'Hiç yanlış yapmadan 25 soru',           check: s => (s.stats ? (s.stats.currentNoWrong || 0) : 0) >= 25 },
  { id:'accuracy_90',icon:'🎓', cat:'⭐ Mükemmellik', name:'Hassas Nişancı', desc:'%90+ doğruluk (min 20 soru)',           check: function(s) { var t = s.stats ? (s.stats.totalAnswered || 0) : 0; var c = s.stats ? (s.stats.totalCorrect || 0) : 0; return t >= 20 && c / t >= 0.9; } },
  { id:'accuracy_99',icon:'🌠', cat:'⭐ Mükemmellik', name:'Hatasız',        desc:'%99+ doğruluk (min 50 soru)',           check: function(s) { var t = s.stats ? (s.stats.totalAnswered || 0) : 0; var c = s.stats ? (s.stats.totalCorrect || 0) : 0; return t >= 50 && c / t >= 0.99; } },

  /* ── Absürt Mod ── */
  { id:'absurd_1',   icon:'🤔', cat:'🤪 Absürt',     name:'Ne Diyorsun?',    desc:'İlk absürt soruyu cevapla',             check: s => (s.stats ? (s.stats.absurdPlayed || 0) : 0) >= 1  },
  { id:'absurd_10',  icon:'🤪', cat:'🤪 Absürt',     name:'Kafayı Yedim',    desc:'Absürt modda 10 soru cevapla',          check: s => (s.stats ? (s.stats.absurdPlayed || 0) : 0) >= 10 },
  { id:'absurd_50',  icon:'🌀', cat:'🤪 Absürt',     name:'Boyut Atlayıcı',  desc:'Absürt modda 50 soru cevapla',          check: s => (s.stats ? (s.stats.absurdPlayed || 0) : 0) >= 50 },
  { id:'absurd_100', icon:'🧿', cat:'🤪 Absürt',     name:'Paralel Evren',   desc:'Absürt modda 100 soru cevapla',         check: s => (s.stats ? (s.stats.absurdPlayed || 0) : 0) >= 100},

  /* ── Özel ── */
  { id:'daily_3',    icon:'📅', cat:'🌟 Özel',       name:'Düzenli',         desc:'3 günlük görev tamamla',                check: s => (s.stats ? (s.stats.dailyLevelUps || 0) : 0) >= 3 },
  { id:'night_owl',  icon:'🦉', cat:'🌟 Özel',       name:'Gece Kuşu',       desc:'Saat 00:00-05:00 arasında oyna',        check: s => { const h=new Date().getHours(); return h>=0&&h<5&&(s.stats ? (s.stats.totalAnswered || 0) : 0)>0; } },
  { id:'speed_demon',icon:'⏱️', cat:'🌟 Özel',       name:'Hız Şeytanı',     desc:'Seviye atlama hızını maksimuma ayarla', check: s => (s.levelUpEvery||4) <= 2 },
];

/* ── BAŞARI KONTROL & UNLOCK ─────────────────────────────── */
let achNotifTimer = null;
let _achQueue = [];
let _achShowing = false;

function checkAchievements() {
  try {
    if (!state.achievements) state.achievements = {};
    let newlyUnlocked = [];

    ACHIEVEMENTS.forEach(ach => {
      if (state.achievements[ach.id]) return;
      let passed = false;
      try { passed = ach.check(state); } catch(e) {}
      if (passed) {
        state.achievements[ach.id] = Date.now();
        newlyUnlocked.push(ach);
        trackEvent('achievement_unlock', { achievement_id: ach.id, achievement_name: ach.name, category: ach.cat || 'other' });
      }
    });

    if (newlyUnlocked.length > 0) {
      _achQueue.push(...newlyUnlocked);
      saveState();
      renderAchievements();
      if (!_achShowing) showNextAchPopup();
    }
  } catch(e) {
    console.warn('checkAchievements hata:', e);
  }
}

function showNextAchPopup() {
  if (_achQueue.length === 0) { _achShowing = false; return; }
  _achShowing = true;
  var ach = _achQueue.shift();
  showAchievementNotif(ach);
}

function showAchievementNotif(ach) {
  try {
    var popup = document.getElementById('achPopup');
    var iconEl = document.getElementById('achPopupIcon');
    var nameEl = document.getElementById('achPopupName');
    var descEl = document.getElementById('achPopupDesc');
    if (!popup) return;

    /* İçerikleri doldur */
    if (iconEl) iconEl.textContent = ach.icon || '🏆';
    if (nameEl) nameEl.textContent = ach.name || '';
    if (descEl) descEl.textContent = ach.desc || '';

    /* Shine elementini sıfırla */
    var shine = popup.querySelector('.ach-popup-shine');
    if (shine) { shine.style.animation = 'none'; shine.offsetHeight; shine.style.animation = ''; }

    /* Göster */
    popup.classList.remove('hide');
    popup.classList.add('show');

    /* Ses */
    try {
      playTone('triangle', 660, 0.08, 0.4);
      setTimeout(function() { playTone('triangle', 880, 0.08, 0.4); }, 120);
      setTimeout(function() { playTone('triangle', 1100, 0.15, 0.5); }, 240);
      setTimeout(function() { playTone('sine', 1320, 0.2, 0.4); }, 380);
    } catch(e) {}

    /* Konfeti patla */
    try { spawnConfetti(8); } catch(e) {}

    /* 3.5 saniye sonra gizle, sonraki varsa göster */
    clearTimeout(achNotifTimer);
    achNotifTimer = setTimeout(function() {
      popup.classList.add('hide');
      popup.addEventListener('animationend', function onEnd() {
        popup.removeEventListener('animationend', onEnd);
        popup.classList.remove('show', 'hide');
        /* Sıradaki başarımı 400ms sonra göster */
        setTimeout(showNextAchPopup, 400);
      }, { once: true });
    }, 3500);

  } catch(e) {
    console.warn('showAchievementNotif hata:', e);
  }
}

/* Başarım tooltip */
function showAchTooltip(achId, el) {
  var ach = ACHIEVEMENTS.find(function(a) { return a.id === achId; });
  if (!ach) { return; }
  var existing = document.getElementById('achTooltip');
  if (existing) { existing.remove(); }
  var tip = document.createElement('div');
  tip.id = 'achTooltip';
  tip.style.cssText = 'position:fixed;z-index:99999;background:#0b1220;border:1px solid #1a2f28;border-radius:10px;padding:8px 12px;font-size:12px;color:#e6f7ea;max-width:220px;box-shadow:0 8px 24px rgba(0,0,0,0.5);pointer-events:none';
  tip.innerHTML = '<b>' + ach.icon + ' ' + ach.name + '</b><br><span style="color:var(--muted)">' + ach.desc + '</span>';
  var rect = el.getBoundingClientRect();
  tip.style.top = (rect.top - 80) + 'px';
  tip.style.left = Math.max(8, rect.left - 60) + 'px';
  document.body.appendChild(tip);
  setTimeout(function() { var t = document.getElementById('achTooltip'); if (t) t.remove(); }, 2500);
}

function renderAchievements() {
  try {
    if (typeof ACHIEVEMENTS === 'undefined' || !ACHIEVEMENTS) return;
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    if (!state.achievements) state.achievements = {};
    const total    = ACHIEVEMENTS.length;
    const unlocked = ACHIEVEMENTS.filter(a => !!state.achievements[a.id]).length;

    /* Mini badge count menüde */
    const countEl = document.getElementById('achBadgeCount');
    if (countEl) countEl.textContent = unlocked + ' / ' + total + ' 🏅';

    /* Mini grid — sadece kazanılmış rozetler göster (max 8) */
    grid.innerHTML = '';
    const unlockedList = ACHIEVEMENTS.filter(a => !!state.achievements[a.id]);
    const show = unlockedList.slice(-8); /* son 8 kazanılan */
    show.forEach(ach => {
      const span = document.createElement('span');
      span.style.cssText = 'font-size:20px;cursor:pointer;';
      span.title = ach.name;
      span.textContent = ach.icon;
      span.addEventListener('click', (e) => { e.stopPropagation(); showAchievementDetail(ach); });
      grid.appendChild(span);
    });
    if (unlockedList.length === 0) {
      grid.innerHTML = '<span style="font-size:12px;color:var(--muted)">Henüz rozet yok — oynayarak kazan!</span>';
    } else if (unlockedList.length > 8) {
      const more = document.createElement('span');
      more.style.cssText = 'font-size:11px;color:var(--neon);cursor:pointer;align-self:center;';
      more.textContent = '+' + (unlockedList.length - 8) + ' daha';
      more.addEventListener('click', (e) => { e.stopPropagation(); openAchModal(); });
      grid.appendChild(more);
    }
  } catch(e) { console.warn('renderAchievements hata:', e); }
}

/* ── Başarılar Modal Render ───────────────────────────── */
function renderAchModal() {
  try {
    var body = document.getElementById('achModalBody');
    if (!body) return;
    if (!state.achievements) state.achievements = {};

    var total    = ACHIEVEMENTS.length;
    var unlocked = ACHIEVEMENTS.filter(function(a) { return !!state.achievements[a.id]; }).length;

    var countEl = document.getElementById('achUnlockedCount');
    var totalEl = document.getElementById('achTotalCount');
    var fillEl  = document.getElementById('achProgressFill');
    if (countEl) countEl.textContent = unlocked;
    if (totalEl) totalEl.textContent = total;
    if (fillEl)  fillEl.style.width  = Math.round(unlocked / total * 100) + '%';

    /* Kategorilere göre grupla */
    var cats = {};
    ACHIEVEMENTS.forEach(function(a) {
      var cat = a.cat || '🎖 Diğer';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(a);
    });

    var RARITY_CONFIG = {
      'Efsane':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  icon: '🔥', cls: 'rarity-efsane' },
      'Nadir':   { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)', icon: '💎', cls: 'rarity-nadir'  },
      'Değerli': { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.35)', icon: '⭐', cls: 'rarity-degerli'},
    };

    body.innerHTML = '';
    Object.entries(cats).forEach(function(entry) {
      var cat = entry[0];
      var items = entry[1];

      var title = document.createElement('div');
      title.className = 'ach-cat-title';
      /* Kaç tanesi açık? */
      var catUnlocked = items.filter(function(a) { return !!state.achievements[a.id]; }).length;
      title.innerHTML = cat + ' <span style="color:var(--neon);font-size:9px">' + catUnlocked + '/' + items.length + '</span>';
      body.appendChild(title);

      var grid = document.createElement('div');
      grid.className = 'ach-grid-new';

      items.forEach(function(ach) {
        var isUnlocked = !!state.achievements[ach.id];
        var rarity = ACH_RARITY ? ACH_RARITY[ach.id] : '';
        var rc = rarity ? RARITY_CONFIG[rarity] : null;

        var card = document.createElement('div');
        card.className = 'ach-card ' + (isUnlocked ? 'ach-unlocked' : 'ach-locked') + (rc ? ' ' + rc.cls : '');

        var rarityTag = rc ? '<div class="ac-rarity" style="background:' + rc.bg + ';color:' + rc.color + ';border:1px solid ' + rc.border + '">' + rc.icon + ' ' + rarity + '</div>' : '';
        var lockTag = !isUnlocked ? '<span class="ac-lock">🔒</span>' : '';

        card.innerHTML = lockTag +
          '<div class="ac-icon">' + (isUnlocked ? ach.icon : '❓') + '</div>' +
          '<div class="ac-name">' + ach.name + '</div>' +
          rarityTag;

        card.addEventListener('click', function() {
          try { clickSound(); showAchievementDetail(ach); } catch(e) {}
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    });
  } catch(e) { console.warn('renderAchModal hata:', e); }
}

function showAchievementDetail(ach) {
  try {
    var modal   = document.getElementById('achDetailModal');
    var iconEl  = document.getElementById('achDetailIcon');
    var nameEl  = document.getElementById('achDetailName');
    var catEl   = document.getElementById('achDetailCat');
    var descEl  = document.getElementById('achDetailDesc');
    var statusEl  = document.getElementById('achDetailStatus');
    var statusIcon= document.getElementById('achDetailStatusIcon');
    var dateRow = document.getElementById('achDetailDateRow');
    var dateEl  = document.getElementById('achDetailDate');
    var rarityRow = document.getElementById('achDetailRarityRow');
    var rarityEl  = document.getElementById('achDetailRarity');
    var rarityIconEl = document.getElementById('achDetailRarityIcon');
    var rarityBadge = document.getElementById('achDetailRarityBadge');
    var hero = document.getElementById('achDetailHero');
    if (!modal) return;

    var isUnlocked = !!(state.achievements && state.achievements[ach.id]);

    /* İkon + isim + kategori */
    if (iconEl) iconEl.textContent = isUnlocked ? ach.icon : '🔒';
    if (nameEl) nameEl.textContent = ach.name;
    if (catEl)  catEl.textContent  = ach.cat || '🎖 Başarım';
    if (descEl) descEl.textContent = ach.desc;

    /* Nadirlik */
    var RARITY_CONFIG = {
      'Efsane':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  icon: '🔥' },
      'Nadir':   { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', icon: '💎' },
      'Değerli': { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.25)', icon: '⭐' },
    };
    var rarity = ACH_RARITY ? ACH_RARITY[ach.id] : '';
    var rc = rarity ? RARITY_CONFIG[rarity] : null;

    /* Hero arkaplan */
    if (hero) {
      hero.style.background = rc
        ? 'linear-gradient(135deg, ' + rc.bg + ', transparent)'
        : (isUnlocked ? 'linear-gradient(135deg, rgba(0,255,136,0.06), transparent)' : 'transparent');
    }

    /* Nadirlik rozeti — hero içinde */
    if (rarityBadge) {
      if (rc) {
        rarityBadge.style.display = 'flex';
        rarityBadge.style.justifyContent = 'center';
        rarityBadge.innerHTML = '<span class="ach-detail-rarity-badge" style="background:' + rc.bg + ';color:' + rc.color + ';border:1px solid ' + rc.border + '">' + rc.icon + ' ' + rarity + ' Başarım</span>';
      } else {
        rarityBadge.style.display = 'none';
      }
    }

    /* Durum */
    if (statusEl && statusIcon) {
      if (isUnlocked) {
        statusIcon.textContent = '✅';
        statusEl.textContent = 'Kazanıldı!';
        statusEl.style.color = 'var(--neon)';
      } else {
        statusIcon.textContent = '🔒';
        statusEl.textContent = 'Henüz kazanılmadı';
        statusEl.style.color = 'var(--muted)';
      }
    }

    /* Tarih */
    if (dateRow && dateEl) {
      if (isUnlocked && state.achievements[ach.id]) {
        var d = new Date(state.achievements[ach.id]);
        dateEl.textContent = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
        dateRow.style.display = 'flex';
      } else {
        dateRow.style.display = 'none';
      }
    }

    /* Nadirlik satırı */
    if (rarityRow && rarityEl && rarityIconEl) {
      if (rc) {
        rarityIconEl.textContent = rc.icon;
        rarityEl.textContent = rarity;
        rarityEl.style.color = rc.color;
        rarityRow.style.display = 'flex';
      } else {
        rarityRow.style.display = 'none';
      }
    }

    modal.classList.add('show');
    clickSound();
  } catch(e) { console.warn('showAchievementDetail hata:', e); }
}

function openAchModal() {
  try {
    renderAchModal();
    document.getElementById('achModal').classList.add('show');
    clickSound();
  } catch(e) {}
}

document.addEventListener('click', e => {
  if (e.target.closest('#closeAchModal')) {
    try {
      closeModal(document.getElementById('achModal'));
      clickSound();
    } catch(e) {}
  }
});

/* Başarı popup kapat */
document.addEventListener('click', (e) => {
  if (e.target.closest('#achPopupClose') || e.target === document.getElementById('achPopup')) {
    try {
      closeModal(document.getElementById('achPopup'));
      clickSound();
    } catch(e) {}
  }
});

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


