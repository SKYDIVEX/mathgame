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

/* ── GÜNLÜK GÖREV SİSTEMİ ────────────────────────────────── */
var DAILY_TASK_POOL = [
  { id:'d_correct_5',   icon:'🎯', title:'İlk Adım',         desc:'5 doğru cevap ver',               target:5,   key:'totalCorrect',   type:'stat',  reward:{coins:60} },
  { id:'d_correct_10',  icon:'🎯', title:'Keskin Nişancı',   desc:'10 doğru cevap ver',              target:10,  key:'totalCorrect',   type:'stat',  reward:{coins:120} },
  { id:'d_correct_20',  icon:'⚡', title:'Hız Treni',        desc:'20 doğru cevap ver',              target:20,  key:'totalCorrect',   type:'stat',  reward:{coins:220} },
  { id:'d_correct_30',  icon:'💥', title:'Çarpıcı',          desc:'30 doğru cevap ver',              target:30,  key:'totalCorrect',   type:'stat',  reward:{coins:320} },
  { id:'d_correct_50',  icon:'🌟', title:'Yarım Yüz',        desc:'50 doğru cevap ver',              target:50,  key:'totalCorrect',   type:'stat',  reward:{coins:450, diamonds:2} },
  { id:'d_streak_3',    icon:'🔥', title:'Seri Başlangıç',   desc:'3 doğru arka arkaya yap',         target:3,   key:'bestStreak',     type:'stat',  reward:{coins:80} },
  { id:'d_streak_5',    icon:'🔥', title:'Seriye Gir',       desc:'5 doğru arka arkaya yap',         target:5,   key:'bestStreak',     type:'stat',  reward:{coins:160} },
  { id:'d_streak_10',   icon:'🌪️', title:'Durdurulamaz',     desc:'10 doğru arka arkaya yap',        target:10,  key:'bestStreak',     type:'stat',  reward:{coins:320} },
  { id:'d_streak_15',   icon:'💫', title:'Efsane Seri',      desc:'15 doğru arka arkaya yap',        target:15,  key:'bestStreak',     type:'stat',  reward:{coins:500, diamonds:3} },
  { id:'d_score_200',   icon:'💰', title:'İlk Kazanım',      desc:'200 puana ulaş',                  target:200, key:'score',          type:'score', reward:{coins:90} },
  { id:'d_score_500',   icon:'💰', title:'Beş Yüz',          desc:'500 puana ulaş',                  target:500, key:'score',          type:'score', reward:{coins:160} },
  { id:'d_score_1000',  icon:'💎', title:'Bin Puan',         desc:'1000 puana ulaş',                 target:1000,key:'score',          type:'score', reward:{coins:320} },
  { id:'d_score_2000',  icon:'💎', title:'İki Bin',          desc:'2000 puana ulaş',                 target:2000,key:'score',          type:'score', reward:{coins:500, diamonds:2} },
  { id:'d_answered_10', icon:'📚', title:'Meraklı',          desc:'10 soru cevapla',                 target:10,  key:'totalAnswered',  type:'stat',  reward:{coins:70} },
  { id:'d_answered_20', icon:'📚', title:'Çalışkan',         desc:'20 soru cevapla',                 target:20,  key:'totalAnswered',  type:'stat',  reward:{coins:130} },
  { id:'d_answered_50', icon:'📗', title:'Kitaplık',         desc:'50 soru cevapla',                 target:50,  key:'totalAnswered',  type:'stat',  reward:{coins:280} },
  { id:'d_level_1',     icon:'🚀', title:'Tırmanış',         desc:'1 seviye atla',                   target:1,   key:'dailyLevelUps',  type:'daily', reward:{coins:200} },
  { id:'d_level_3',     icon:'📈', title:'Sürekli Yüksel',   desc:'3 seviye atla',                   target:3,   key:'dailyLevelUps',  type:'daily', reward:{coins:400, diamonds:2} },
  { id:'d_absurd_3',    icon:'🤔', title:'Absürt Başlangıç', desc:'Absürt modda 3 soru cevapla',     target:3,   key:'absurdPlayed',   type:'stat',  reward:{coins:90} },
  { id:'d_absurd_5',    icon:'🤪', title:'Absürt Mod',       desc:'Absürt modda 5 soru cevapla',     target:5,   key:'absurdPlayed',   type:'stat',  reward:{coins:140} },
  { id:'d_absurd_10',   icon:'🌀', title:'Absürt Uzmanı',    desc:'Absürt modda 10 soru cevapla',    target:10,  key:'absurdPlayed',   type:'stat',  reward:{coins:220} },
  { id:'d_no_wrong_3',  icon:'✨', title:'Temiz Sayfa',      desc:'Hiç yanlış yapmadan 3 soru',      target:3,   key:'currentNoWrong', type:'stat',  reward:{coins:110} },
  { id:'d_no_wrong_5',  icon:'✨', title:'Hatasız',          desc:'Hiç yanlış yapmadan 5 soru',      target:5,   key:'currentNoWrong', type:'stat',  reward:{coins:210} },
  { id:'d_no_wrong_10', icon:'💎', title:'Kusursuz',         desc:'Hiç yanlış yapmadan 10 soru',     target:10,  key:'currentNoWrong', type:'stat',  reward:{coins:400, diamonds:3} },
  { id:'d_time_2min',   icon:'⏱️', title:'Isındım',          desc:'2 dakika oyna',                   target:120, key:'totalTimeSec',   type:'stat',  reward:{coins:70} },
  { id:'d_time_5min',   icon:'⏱️', title:'Adanmış',          desc:'5 dakika oyna',                   target:300, key:'totalTimeSec',   type:'stat',  reward:{coins:160} },
  { id:'d_time_10min',  icon:'⌛', title:'Maraton',          desc:'10 dakika oyna',                  target:600, key:'totalTimeSec',   type:'stat',  reward:{coins:300, diamonds:2} },
];
/* Havuz ek olarak Groq'tan gelen görevlerle birleşir — bkz. loadGroqDailyTasks() */

/* Haftalık görevler */
var WEEKLY_TASK_POOL = [
  { id:'w_correct_50',   icon:'🎯', title:'Elli Atış',          desc:'Bu hafta 50 doğru cevap ver',     target:50,   key:'totalCorrect',  type:'stat',  reward:{coins:300,  diamonds:3} },
  { id:'w_correct_100',  icon:'🎯', title:'Yüz Atış',           desc:'Bu hafta 100 doğru cevap ver',    target:100,  key:'totalCorrect',  type:'stat',  reward:{coins:500,  diamonds:5} },
  { id:'w_correct_200',  icon:'⚡', title:'İki Yüz Atış',       desc:'Bu hafta 200 doğru cevap ver',    target:200,  key:'totalCorrect',  type:'stat',  reward:{coins:1000, diamonds:10} },
  { id:'w_correct_500',  icon:'👑', title:'Beş Yüz Atış',       desc:'Bu hafta 500 doğru cevap ver',    target:500,  key:'totalCorrect',  type:'stat',  reward:{coins:2500, diamonds:25} },
  { id:'w_score_1000',   icon:'💰', title:'Bin Puan Haftası',   desc:'Bu hafta 1000 puana ulaş',        target:1000, key:'score',         type:'score', reward:{coins:400,  diamonds:5} },
  { id:'w_score_3000',   icon:'💎', title:'Büyük Skor',         desc:'Bu hafta 3000 puana ulaş',        target:3000, key:'score',         type:'score', reward:{coins:800,  diamonds:12} },
  { id:'w_score_5000',   icon:'🏆', title:'Skor Canavarı',      desc:'Bu hafta 5000 puana ulaş',        target:5000, key:'score',         type:'score', reward:{coins:1500, diamonds:20} },
  { id:'w_score_10000',  icon:'💫', title:'On Bin Haftası',     desc:'Bu hafta 10000 puana ulaş',       target:10000,key:'score',         type:'score', reward:{coins:3000, diamonds:40} },
  { id:'w_streak_10',    icon:'🔥', title:'Haftalık Seri',      desc:'10 doğru arka arkaya yap',        target:10,   key:'bestStreak',    type:'stat',  reward:{coins:400,  diamonds:5} },
  { id:'w_streak_20',    icon:'🌊', title:'Dalga',              desc:'20 doğru arka arkaya yap',        target:20,   key:'bestStreak',    type:'stat',  reward:{coins:800,  diamonds:10} },
  { id:'w_streak_30',    icon:'☄️', title:'Meteor',             desc:'30 doğru arka arkaya yap',        target:30,   key:'bestStreak',    type:'stat',  reward:{coins:1500, diamonds:20} },
  { id:'w_level_3',      icon:'📈', title:'Sürekli Yüksel',     desc:'Bu hafta 3 seviye atla',          target:3,    key:'dailyLevelUps', type:'daily', reward:{coins:400,  diamonds:5} },
  { id:'w_level_7',      icon:'🚀', title:'Roket',              desc:'Bu hafta 7 seviye atla',          target:7,    key:'dailyLevelUps', type:'daily', reward:{coins:800,  diamonds:10} },
  { id:'w_level_10',     icon:'🚀', title:'Haftalık 10 Seviye', desc:'Bu hafta 10 seviye atla',         target:10,   key:'dailyLevelUps', type:'daily', reward:{coins:1200, diamonds:15} },
  { id:'w_absurd_15',    icon:'🤪', title:'Absürt Haftası',     desc:'Absürt modda 15 soru cevapla',    target:15,   key:'absurdPlayed',  type:'stat',  reward:{coins:350,  diamonds:5} },
  { id:'w_absurd_30',    icon:'🌀', title:'Absürt Ustası',      desc:'Absürt modda 30 soru cevapla',    target:30,   key:'absurdPlayed',  type:'stat',  reward:{coins:700,  diamonds:10} },
  { id:'w_absurd_50',    icon:'🧿', title:'Absürt Efsanesi',    desc:'Absürt modda 50 soru cevapla',    target:50,   key:'absurdPlayed',  type:'stat',  reward:{coins:1200, diamonds:18} },
  { id:'w_answered_100', icon:'📚', title:'Yüz Soru',           desc:'Bu hafta 100 soru cevapla',       target:100,  key:'totalAnswered', type:'stat',  reward:{coins:600,  diamonds:8} },
  { id:'w_answered_200', icon:'📗', title:'İki Yüz Soru',       desc:'Bu hafta 200 soru cevapla',       target:200,  key:'totalAnswered', type:'stat',  reward:{coins:1200, diamonds:15} },
  { id:'w_time_30min',   icon:'⌛', title:'Haftalık Maraton',   desc:'Toplam 30 dakika oyna',           target:1800, key:'totalTimeSec',  type:'stat',  reward:{coins:500,  diamonds:6} },
  { id:'w_time_60min',   icon:'⏰', title:'Bir Saat',           desc:'Toplam 60 dakika oyna',           target:3600, key:'totalTimeSec',  type:'stat',  reward:{coins:1000, diamonds:12} },
  { id:'w_no_wrong_10',  icon:'💎', title:'Haftalık Kusursuz',  desc:'Hiç yanlış yapmadan 10 soru',     target:10,   key:'currentNoWrong',type:'stat',  reward:{coins:500,  diamonds:8} },
  { id:'w_no_wrong_20',  icon:'👑', title:'Haftalık Efsane',    desc:'Hiç yanlış yapmadan 20 soru',     target:20,   key:'currentNoWrong',type:'stat',  reward:{coins:1000, diamonds:15} },
];

/* Kalıcı görevler — 100 görev, oyun başından sonuna */
var PERM_TASK_POOL = [
  /* ── DOĞRU CEVAP (11 aşama) ── */
  { id:'p_c1',    icon:'✅', title:'İlk Doğru',            desc:'İlk doğru cevabını ver',           target:1,      key:'totalCorrect',   type:'stat',  reward:{coins:100,   diamonds:2} },
  { id:'p_c5',    icon:'🎯', title:'Beş Doğru',            desc:'Toplam 5 doğru cevap ver',         target:5,      key:'totalCorrect',   type:'stat',  reward:{coins:150,   diamonds:2} },
  { id:'p_c10',   icon:'🎯', title:'On Doğru',             desc:'Toplam 10 doğru cevap ver',        target:10,     key:'totalCorrect',   type:'stat',  reward:{coins:200,   diamonds:3} },
  { id:'p_c25',   icon:'🎯', title:'Yirmi Beş Doğru',      desc:'Toplam 25 doğru cevap ver',        target:25,     key:'totalCorrect',   type:'stat',  reward:{coins:300,   diamonds:4} },
  { id:'p_c50',   icon:'🎯', title:'Elli Doğru',           desc:'Toplam 50 doğru cevap ver',        target:50,     key:'totalCorrect',   type:'stat',  reward:{coins:400,   diamonds:5} },
  { id:'p_c100',  icon:'💯', title:'Yüz Doğru',            desc:'Toplam 100 doğru cevap ver',       target:100,    key:'totalCorrect',   type:'stat',  reward:{coins:600,   diamonds:8} },
  { id:'p_c250',  icon:'⚡', title:'İki Yüz Elli',         desc:'Toplam 250 doğru cevap ver',       target:250,    key:'totalCorrect',   type:'stat',  reward:{coins:1000,  diamonds:15} },
  { id:'p_c500',  icon:'⚡', title:'Beş Yüz Doğru',        desc:'Toplam 500 doğru cevap ver',       target:500,    key:'totalCorrect',   type:'stat',  reward:{coins:2000,  diamonds:30} },
  { id:'p_c1000', icon:'🌟', title:'Bin Doğru',            desc:'Toplam 1000 doğru cevap ver',      target:1000,   key:'totalCorrect',   type:'stat',  reward:{coins:5000,  diamonds:80} },
  { id:'p_c2500', icon:'👑', title:'İki Bin Beş Yüz',      desc:'Toplam 2500 doğru cevap ver',      target:2500,   key:'totalCorrect',   type:'stat',  reward:{coins:10000, diamonds:150} },
  { id:'p_c5000', icon:'💎', title:'Beş Bin Doğru',        desc:'Toplam 5000 doğru cevap ver',      target:5000,   key:'totalCorrect',   type:'stat',  reward:{coins:20000, diamonds:300} },
  /* ── PUAN (10 aşama) ── */
  { id:'p_s100',  icon:'💰', title:'Yüz Puan',             desc:'100 puana ulaş',                   target:100,    key:'score',          type:'score', reward:{coins:100,   diamonds:2} },
  { id:'p_s500',  icon:'💰', title:'Beş Yüz Puan',         desc:'500 puana ulaş',                   target:500,    key:'score',          type:'score', reward:{coins:200,   diamonds:3} },
  { id:'p_s1k',   icon:'💰', title:'Bin Puan',             desc:'1000 puana ulaş',                  target:1000,   key:'score',          type:'score', reward:{coins:300,   diamonds:5} },
  { id:'p_s2k5',  icon:'💎', title:'İki Bin Beş',          desc:'2500 puana ulaş',                  target:2500,   key:'score',          type:'score', reward:{coins:600,   diamonds:10} },
  { id:'p_s5k',   icon:'💎', title:'Beş Bin',              desc:'5000 puana ulaş',                  target:5000,   key:'score',          type:'score', reward:{coins:1000,  diamonds:20} },
  { id:'p_s10k',  icon:'🏆', title:'On Bin',               desc:'10000 puana ulaş',                 target:10000,  key:'score',          type:'score', reward:{coins:2000,  diamonds:40} },
  { id:'p_s25k',  icon:'🌟', title:'Yirmi Beş Bin',        desc:'25000 puana ulaş',                 target:25000,  key:'score',          type:'score', reward:{coins:5000,  diamonds:80} },
  { id:'p_s50k',  icon:'👑', title:'Elli Bin',             desc:'50000 puana ulaş',                 target:50000,  key:'score',          type:'score', reward:{coins:8000,  diamonds:150} },
  { id:'p_s100k', icon:'💫', title:'Yüz Bin',              desc:'100000 puana ulaş',                target:100000, key:'score',          type:'score', reward:{coins:20000, diamonds:350} },
  { id:'p_s500k', icon:'🌌', title:'Beş Yüz Bin',          desc:'500000 puana ulaş',                target:500000, key:'score',          type:'score', reward:{coins:80000, diamonds:1000} },
  /* ── SERİ (9 aşama) ── */
  { id:'p_st3',   icon:'🔥', title:'İlk Seri',             desc:'3 doğru arka arkaya yap',          target:3,      key:'bestStreak',     type:'stat',  reward:{coins:150,   diamonds:2} },
  { id:'p_st5',   icon:'🔥', title:'Beşli Seri',           desc:'5 doğru arka arkaya yap',          target:5,      key:'bestStreak',     type:'stat',  reward:{coins:300,   diamonds:5} },
  { id:'p_st10',  icon:'💥', title:'Onlu Seri',            desc:'10 doğru arka arkaya yap',         target:10,     key:'bestStreak',     type:'stat',  reward:{coins:500,   diamonds:10} },
  { id:'p_st15',  icon:'🌪️', title:'Kasırga',              desc:'15 doğru arka arkaya yap',         target:15,     key:'bestStreak',     type:'stat',  reward:{coins:800,   diamonds:15} },
  { id:'p_st20',  icon:'🌪️', title:'Efsane Seri',          desc:'20 doğru arka arkaya yap',         target:20,     key:'bestStreak',     type:'stat',  reward:{coins:1200,  diamonds:20} },
  { id:'p_st30',  icon:'☄️', title:'Meteor',               desc:'30 doğru arka arkaya yap',         target:30,     key:'bestStreak',     type:'stat',  reward:{coins:2000,  diamonds:35} },
  { id:'p_st50',  icon:'💎', title:'Elmas Seri',           desc:'50 doğru arka arkaya yap',         target:50,     key:'bestStreak',     type:'stat',  reward:{coins:3500,  diamonds:60} },
  { id:'p_st75',  icon:'🌟', title:'Yıldız Seri',          desc:'75 doğru arka arkaya yap',         target:75,     key:'bestStreak',     type:'stat',  reward:{coins:6000,  diamonds:100} },
  { id:'p_st100', icon:'👑', title:'Efsane 100',           desc:'100 doğru arka arkaya yap',        target:100,    key:'bestStreak',     type:'stat',  reward:{coins:10000, diamonds:200} },
  /* ── SEVİYE (14 aşama) ── */
  { id:'p_lv2',   icon:'🌱', title:'İlk Seviye',           desc:'2. seviyeye ulaş',                 target:2,      key:'highestLevel',   type:'stat',  reward:{coins:100,   diamonds:2} },
  { id:'p_lv5',   icon:'🌱', title:'Seviye 5',             desc:'5. seviyeye ulaş',                 target:5,      key:'highestLevel',   type:'stat',  reward:{coins:300,   diamonds:5} },
  { id:'p_lv10',  icon:'🚀', title:'Seviye 10',            desc:'10. seviyeye ulaş',                target:10,     key:'highestLevel',   type:'stat',  reward:{coins:600,   diamonds:10} },
  { id:'p_lv15',  icon:'🚀', title:'Seviye 15',            desc:'15. seviyeye ulaş',                target:15,     key:'highestLevel',   type:'stat',  reward:{coins:900,   diamonds:15} },
  { id:'p_lv20',  icon:'⭐', title:'Seviye 20',            desc:'20. seviyeye ulaş',                target:20,     key:'highestLevel',   type:'stat',  reward:{coins:1200,  diamonds:20} },
  { id:'p_lv25',  icon:'⭐', title:'Seviye 25',            desc:'25. seviyeye ulaş',                target:25,     key:'highestLevel',   type:'stat',  reward:{coins:1500,  diamonds:25} },
  { id:'p_lv30',  icon:'💫', title:'Seviye 30',            desc:'30. seviyeye ulaş',                target:30,     key:'highestLevel',   type:'stat',  reward:{coins:2000,  diamonds:35} },
  { id:'p_lv40',  icon:'🌟', title:'Seviye 40',            desc:'40. seviyeye ulaş',                target:40,     key:'highestLevel',   type:'stat',  reward:{coins:3000,  diamonds:50} },
  { id:'p_lv50',  icon:'🌟', title:'Seviye 50',            desc:'50. seviyeye ulaş',                target:50,     key:'highestLevel',   type:'stat',  reward:{coins:4000,  diamonds:70} },
  { id:'p_lv60',  icon:'👑', title:'Seviye 60',            desc:'60. seviyeye ulaş',                target:60,     key:'highestLevel',   type:'stat',  reward:{coins:5000,  diamonds:90} },
  { id:'p_lv75',  icon:'👑', title:'Seviye 75',            desc:'75. seviyeye ulaş',                target:75,     key:'highestLevel',   type:'stat',  reward:{coins:7000,  diamonds:120} },
  { id:'p_lv100', icon:'💎', title:'Seviye 100',           desc:'100. seviyeye ulaş',               target:100,    key:'highestLevel',   type:'stat',  reward:{coins:10000, diamonds:200} },
  { id:'p_lv150', icon:'💎', title:'Seviye 150',           desc:'150. seviyeye ulaş',               target:150,    key:'highestLevel',   type:'stat',  reward:{coins:15000, diamonds:300} },
  { id:'p_lv200', icon:'🌌', title:'Seviye 200',           desc:'200. seviyeye ulaş',               target:200,    key:'highestLevel',   type:'stat',  reward:{coins:25000, diamonds:500} },
  /* ── ABSÜRT (7 aşama) ── */
  { id:'p_ab1',   icon:'🤔', title:'Absürt Deneme',        desc:'İlk absürt soruyu cevapla',        target:1,      key:'absurdPlayed',   type:'stat',  reward:{coins:100,   diamonds:2} },
  { id:'p_ab5',   icon:'🤪', title:'Absürt Meraklı',       desc:'Absürt modda 5 soru cevapla',      target:5,      key:'absurdPlayed',   type:'stat',  reward:{coins:200,   diamonds:3} },
  { id:'p_ab10',  icon:'🤪', title:'Absürt Başlangıç',     desc:'Absürt modda 10 soru cevapla',     target:10,     key:'absurdPlayed',   type:'stat',  reward:{coins:300,   diamonds:5} },
  { id:'p_ab25',  icon:'🌀', title:'Absürt Tutkunu',       desc:'Absürt modda 25 soru cevapla',     target:25,     key:'absurdPlayed',   type:'stat',  reward:{coins:500,   diamonds:8} },
  { id:'p_ab50',  icon:'🌀', title:'Absürt Uzmanı',        desc:'Absürt modda 50 soru cevapla',     target:50,     key:'absurdPlayed',   type:'stat',  reward:{coins:1000,  diamonds:15} },
  { id:'p_ab100', icon:'🧿', title:'Absürt Efsanesi',      desc:'Absürt modda 100 soru cevapla',    target:100,    key:'absurdPlayed',   type:'stat',  reward:{coins:2000,  diamonds:30} },
  { id:'p_ab250', icon:'🌌', title:'Absürt Tanrısı',       desc:'Absürt modda 250 soru cevapla',    target:250,    key:'absurdPlayed',   type:'stat',  reward:{coins:5000,  diamonds:80} },
  /* ── ZAMAN (6 aşama) ── */
  { id:'p_t5m',   icon:'⏱️', title:'5 Dakika',             desc:'Toplam 5 dakika oyna',             target:300,    key:'totalTimeSec',   type:'stat',  reward:{coins:100,   diamonds:2} },
  { id:'p_t15m',  icon:'⏱️', title:'15 Dakika',            desc:'Toplam 15 dakika oyna',            target:900,    key:'totalTimeSec',   type:'stat',  reward:{coins:250,   diamonds:4} },
  { id:'p_t30m',  icon:'⌛', title:'Yarım Saat',           desc:'Toplam 30 dakika oyna',            target:1800,   key:'totalTimeSec',   type:'stat',  reward:{coins:500,   diamonds:8} },
  { id:'p_t1h',   icon:'⌛', title:'Bir Saat',             desc:'Toplam 1 saat oyna',               target:3600,   key:'totalTimeSec',   type:'stat',  reward:{coins:800,   diamonds:12} },
  { id:'p_t3h',   icon:'⏰', title:'Üç Saat',              desc:'Toplam 3 saat oyna',               target:10800,  key:'totalTimeSec',   type:'stat',  reward:{coins:2000,  diamonds:30} },
  { id:'p_t10h',  icon:'⏰', title:'On Saat',              desc:'Toplam 10 saat oyna',              target:36000,  key:'totalTimeSec',   type:'stat',  reward:{coins:5000,  diamonds:80} },
  /* ── HATASIZ (4 aşama) ── */
  { id:'p_nw5',   icon:'✨', title:'Temiz 5',              desc:'Hiç yanlış yapmadan 5 soru',       target:5,      key:'currentNoWrong', type:'stat',  reward:{coins:200,   diamonds:3} },
  { id:'p_nw10',  icon:'✨', title:'Temiz 10',             desc:'Hiç yanlış yapmadan 10 soru',      target:10,     key:'currentNoWrong', type:'stat',  reward:{coins:400,   diamonds:6} },
  { id:'p_nw20',  icon:'💎', title:'Temiz 20',             desc:'Hiç yanlış yapmadan 20 soru',      target:20,     key:'currentNoWrong', type:'stat',  reward:{coins:800,   diamonds:12} },
  { id:'p_nw30',  icon:'👑', title:'Temiz 30',             desc:'Hiç yanlış yapmadan 30 soru',      target:30,     key:'currentNoWrong', type:'stat',  reward:{coins:1500,  diamonds:25} },
  /* ── TOPLAM SORU (5 aşama) ── */
  { id:'p_a1',    icon:'🎮', title:'İlk Oyun',             desc:'İlk soruyu cevapla',               target:1,      key:'totalAnswered',  type:'stat',  reward:{coins:200,   diamonds:5} },
  { id:'p_a100',  icon:'📚', title:'Yüz Soru',             desc:'Toplam 100 soru cevapla',          target:100,    key:'totalAnswered',  type:'stat',  reward:{coins:400,   diamonds:6} },
  { id:'p_a500',  icon:'📗', title:'Beş Yüz Soru',         desc:'Toplam 500 soru cevapla',          target:500,    key:'totalAnswered',  type:'stat',  reward:{coins:1500,  diamonds:20} },
  { id:'p_a1000', icon:'📘', title:'Bin Soru',             desc:'Toplam 1000 soru cevapla',         target:1000,   key:'totalAnswered',  type:'stat',  reward:{coins:3000,  diamonds:50} },
  { id:'p_a5000', icon:'📙', title:'Beş Bin Soru',         desc:'Toplam 5000 soru cevapla',         target:5000,   key:'totalAnswered',  type:'stat',  reward:{coins:10000, diamonds:150} },
  /* ── GİRİŞ SERİSİ (7 aşama) ── */
  { id:'p_lg1',   icon:'📅', title:'İlk Giriş',            desc:'Oyuna giriş yap',                  target:1,      key:'loginStreak',    type:'stat',  reward:{coins:100,   diamonds:2} },
  { id:'p_lg3',   icon:'📅', title:'3 Gün Giriş',          desc:'3 gün üst üste giriş yap',         target:3,      key:'loginStreak',    type:'stat',  reward:{coins:300,   diamonds:5} },
  { id:'p_lg7',   icon:'🗓️', title:'Haftalık Giriş',       desc:'7 gün üst üste giriş yap',         target:7,      key:'loginStreak',    type:'stat',  reward:{coins:700,   diamonds:15} },
  { id:'p_lg14',  icon:'🗓️', title:'İki Haftalık',         desc:'14 gün üst üste giriş yap',        target:14,     key:'loginStreak',    type:'stat',  reward:{coins:1500,  diamonds:30} },
  { id:'p_lg30',  icon:'🏅', title:'Aylık Giriş',          desc:'30 gün üst üste giriş yap',        target:30,     key:'loginStreak',    type:'stat',  reward:{coins:3000,  diamonds:60} },
  { id:'p_lg60',  icon:'🥈', title:'İki Aylık',            desc:'60 gün üst üste giriş yap',        target:60,     key:'loginStreak',    type:'stat',  reward:{coins:6000,  diamonds:120} },
  { id:'p_lg100', icon:'🥇', title:'100 Gün',              desc:'100 gün üst üste giriş yap',       target:100,    key:'loginStreak',    type:'stat',  reward:{coins:10000, diamonds:200} },
  /* ── SOSYAL & DİĞER (11 aşama) ── */
  { id:'p_shop1', icon:'🏪', title:'İlk Alışveriş',        desc:'Mağazadan bir şey satın al',       target:1,      key:'shopBuys',       type:'stat',  reward:{coins:200,   diamonds:5} },
  { id:'p_shop5', icon:'🏪', title:'Alışveriş Tutkunu',    desc:'5 kez satın al',                   target:5,      key:'shopBuys',       type:'stat',  reward:{coins:500,   diamonds:10} },
  { id:'p_shop10',icon:'🏪', title:'VIP Müşteri',          desc:'10 kez satın al',                  target:10,     key:'shopBuys',       type:'stat',  reward:{coins:1200,  diamonds:25} },
  { id:'p_clan',  icon:'👥', title:'Sosyal Oyuncu',        desc:'Bir klana katıl veya kur',         target:1,      key:'clanJoined',     type:'stat',  reward:{coins:500,   diamonds:10} },
  { id:'p_jok1',  icon:'🃏', title:'İlk Joker',            desc:'İlk jokerini kullan',              target:1,      key:'jokersUsed',     type:'stat',  reward:{coins:200,   diamonds:3} },
  { id:'p_jok10', icon:'🃏', title:'Joker Ustası',         desc:'10 joker kullan',                  target:10,     key:'jokersUsed',     type:'stat',  reward:{coins:500,   diamonds:10} },
  { id:'p_jok50', icon:'🃏', title:'Joker Efsanesi',       desc:'50 joker kullan',                  target:50,     key:'jokersUsed',     type:'stat',  reward:{coins:2000,  diamonds:40} },
  { id:'p_wrong0',icon:'🛡️', title:'Dokunulmaz',           desc:'Hiç yanlış yapmadan 5 soru',       target:5,      key:'currentNoWrong', type:'stat',  reward:{coins:350,   diamonds:2} },
  { id:'p_wt10',  icon:'❌', title:'Hata Kabul',           desc:'Toplam 10 yanlış yap (olur)',      target:10,     key:'totalWrong',     type:'stat',  reward:{coins:50,    diamonds:1} },
  { id:'p_wt100', icon:'😅', title:'Hata Ustası',          desc:'Toplam 100 yanlış yap',            target:100,    key:'totalWrong',     type:'stat',  reward:{coins:200,   diamonds:3} },
  { id:'p_wt500', icon:'😂', title:'Hata Koleksiyoneri',   desc:'Toplam 500 yanlış yap',            target:500,    key:'totalWrong',     type:'stat',  reward:{coins:800,   diamonds:10} },
  /* ── ÖZEL (16 görev = toplam 100) ── */
  { id:'p_sp1',   icon:'💡', title:'Joker Harcayıcı',     desc:'Toplam 25 joker kullan',           target:25,     key:'jokersUsed',     type:'stat',  reward:{coins:800,   diamonds:15} },
  { id:'p_sp2',   icon:'🌙', title:'Gece Kuşu',           desc:'Toplam 2 saat oyna',               target:7200,   key:'totalTimeSec',   type:'stat',  reward:{coins:1200,  diamonds:18} },
  { id:'p_sp3',   icon:'🔮', title:'Kahin',               desc:'Seviye 20 ye ulaş',                target:20,     key:'highestLevel',   type:'stat',  reward:{coins:1200,  diamonds:20} },
  { id:'p_sp4',   icon:'🧠', title:'Matematik Dehası',    desc:'Toplam 200 doğru cevap ver',       target:200,    key:'totalCorrect',   type:'stat',  reward:{coins:800,   diamonds:12} },
  { id:'p_sp5',   icon:'⚗️', title:'Kimyager',             desc:'2500 puana ulaş',                  target:2500,   key:'score',          type:'score', reward:{coins:700,   diamonds:12} },
  { id:'p_sp6',   icon:'🎸', title:'Rock Yıldızı',        desc:'15 doğru arka arkaya yap',         target:15,     key:'bestStreak',     type:'stat',  reward:{coins:900,   diamonds:15} },
  { id:'p_sp7',   icon:'🦁', title:'Aslan Yürekli',       desc:'100 soru cevapla',                 target:100,    key:'totalAnswered',  type:'stat',  reward:{coins:500,   diamonds:8} },
  { id:'p_sp8',   icon:'🦅', title:'Kartal Göz',          desc:'50 doğru cevap ver',               target:50,     key:'totalCorrect',   type:'stat',  reward:{coins:500,   diamonds:8} },
  { id:'p_sp9',   icon:'🌊', title:'Okyanus',             desc:'Absürt modda 75 soru cevapla',     target:75,     key:'absurdPlayed',   type:'stat',  reward:{coins:1500,  diamonds:25} },
  { id:'p_sp10',  icon:'🧊', title:'Buz Gibi',            desc:'Hiç yanlış yapmadan 15 soru',      target:15,     key:'currentNoWrong', type:'stat',  reward:{coins:700,   diamonds:12} },
  { id:'p_sp11',  icon:'🎯', title:'Tam İsabet',          desc:'Toplam 750 doğru cevap ver',       target:750,    key:'totalCorrect',   type:'stat',  reward:{coins:3000,  diamonds:50} },
  { id:'p_sp12',  icon:'🌠', title:'Yıldız Toplayıcı',   desc:'15 gün üst üste giriş yap',        target:15,     key:'loginStreak',    type:'stat',  reward:{coins:2000,  diamonds:40} },
  { id:'p_sp13',  icon:'🎭', title:'Çok Yönlü',           desc:'1000 puana ulaş',                  target:1000,   key:'score',          type:'score', reward:{coins:400,   diamonds:7} },
  { id:'p_sp14',  icon:'🏆', title:'Skor Canavarı',       desc:'7500 puana ulaş',                  target:7500,   key:'score',          type:'score', reward:{coins:2500,  diamonds:45} },
  { id:'p_sp15',  icon:'🌈', title:'Gökkuşağı',           desc:'50 haftalık görevi tamamla',       target:50,     key:'totalAnswered',  type:'stat',  reward:{coins:600,   diamonds:10} },
  { id:'p_sp16',  icon:'💫', title:'Süpernova',           desc:'Toplam 3000 doğru cevap ver',      target:3000,   key:'totalCorrect',   type:'stat',  reward:{coins:12000, diamonds:200} },
];

/* Başarım görevleri — 20 aşama */
var ACHIEVE_TASKS = [
  { id:'a_a1',    icon:'🏅', title:'İlk Başarım',          desc:'İlk başarımını kazan',             target:1,      key:'achCount',         type:'stat', reward:{coins:300,   diamonds:5} },
  { id:'a_a3',    icon:'🥉', title:'3 Başarım',            desc:'3 başarım kazan',                  target:3,      key:'achCount',         type:'stat', reward:{coins:400,   diamonds:6} },
  { id:'a_a5',    icon:'🥉', title:'5 Başarım',            desc:'5 başarım kazan',                  target:5,      key:'achCount',         type:'stat', reward:{coins:500,   diamonds:8} },
  { id:'a_a8',    icon:'🥈', title:'8 Başarım',            desc:'8 başarım kazan',                  target:8,      key:'achCount',         type:'stat', reward:{coins:700,   diamonds:12} },
  { id:'a_a10',   icon:'🥈', title:'10 Başarım',           desc:'10 başarım kazan',                 target:10,     key:'achCount',         type:'stat', reward:{coins:1000,  diamonds:15} },
  { id:'a_a15',   icon:'🥈', title:'15 Başarım',           desc:'15 başarım kazan',                 target:15,     key:'achCount',         type:'stat', reward:{coins:1500,  diamonds:25} },
  { id:'a_a20',   icon:'🥇', title:'20 Başarım',           desc:'20 başarım kazan',                 target:20,     key:'achCount',         type:'stat', reward:{coins:2000,  diamonds:35} },
  { id:'a_a25',   icon:'🥇', title:'25 Başarım',           desc:'25 başarım kazan',                 target:25,     key:'achCount',         type:'stat', reward:{coins:3000,  diamonds:50} },
  { id:'a_a30',   icon:'💎', title:'30 Başarım',           desc:'30 başarım kazan',                 target:30,     key:'achCount',         type:'stat', reward:{coins:5000,  diamonds:80} },
  { id:'a_all',   icon:'👑', title:'Tam Koleksiyon',       desc:'Tüm başarımları kazan',             target:34,     key:'achCount',         type:'stat', reward:{coins:10000, diamonds:200} },
  { id:'a_val',   icon:'⭐', title:'Değerli Avcı',         desc:'Değerli başarım kazan',            target:1,      key:'valuableAchCount', type:'stat', reward:{coins:500,   diamonds:8} },
  { id:'a_val3',  icon:'⭐', title:'3 Değerli',            desc:'3 değerli başarım kazan',          target:3,      key:'valuableAchCount', type:'stat', reward:{coins:1200,  diamonds:20} },
  { id:'a_rare',  icon:'💜', title:'Nadir Avcı',           desc:'Nadir başarım kazan',              target:1,      key:'rareAchCount',     type:'stat', reward:{coins:800,   diamonds:15} },
  { id:'a_rare3', icon:'💜', title:'Nadir Koleksiyoner',   desc:'3 nadir başarım kazan',            target:3,      key:'rareAchCount',     type:'stat', reward:{coins:2000,  diamonds:40} },
  { id:'a_leg',   icon:'👑', title:'Efsane',               desc:'Efsane başarım kazan',             target:1,      key:'legendAchCount',   type:'stat', reward:{coins:2000,  diamonds:50} },
  { id:'a_leg3',  icon:'💎', title:'Efsane Koleksiyoner',  desc:'3 efsane başarım kazan',           target:3,      key:'legendAchCount',   type:'stat', reward:{coins:5000,  diamonds:100} },
  { id:'a_stach', icon:'🔥', title:'Seri Başarımcı',       desc:'Seri kategorisinde başarım kazan', target:1,      key:'streakAchCount',   type:'stat', reward:{coins:600,   diamonds:10} },
  { id:'a_scach', icon:'💰', title:'Puan Başarımcı',       desc:'Puan kategorisinde başarım kazan', target:1,      key:'scoreAchCount',    type:'stat', reward:{coins:600,   diamonds:10} },
  { id:'a_abach', icon:'🤪', title:'Absürt Başarımcı',     desc:'Absürt kategorisinde başarım kazan',target:1,     key:'absurdAchCount',   type:'stat', reward:{coins:600,   diamonds:10} },
  { id:'a_compl', icon:'🌟', title:'Görev Tamamlayıcı',    desc:'50 kalıcı görevi tamamla',         target:50,     key:'permDone',         type:'stat', reward:{coins:8000,  diamonds:150} },
];

/* Aktif sekme */
var _currentQuestTab = 'daily';

function switchQuestTab(tab) {
  _currentQuestTab = tab;
  document.querySelectorAll('.quest-tab').forEach(function(b) { b.classList.remove('active'); });
  var btn = document.getElementById('qtab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (btn) btn.classList.add('active');
  renderQuestTab(tab);
}

function renderQuestTab(tab) {
  var list = document.getElementById('dailyTasksList');
  if (!list) return;

  if (tab === 'daily')   { updateDailyTasks(); return; }
  if (tab === 'weekly')  { renderTaskList(getWeeklyTasks(),  list, 'weekly');  return; }
  if (tab === 'perm')    { renderTaskList(getPermTasks(),    list, 'perm');    return; }
  if (tab === 'achieve') { renderTaskList(getAchieveTasks(), list, 'achieve'); return; }
}

/* Haftalık görevleri localStorage'dan yükle */
var _groqWeeklyTasksCache = null;

async function loadGroqWeeklyTasks() {
  var weekKey = getWeekKey();
  var cacheKey = 'mathgame_groq_weekly_' + weekKey;
  try {
    var cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Array.isArray(cached) && cached.length >= 3) {
      _groqWeeklyTasksCache = cached;
      return cached;
    }
  } catch(e) {}
  try {
    var r = await workerPost('groq-weekly-quests', { weekKey: weekKey });
    if (r && r.ok && Array.isArray(r.tasks) && r.tasks.length >= 3) {
      _groqWeeklyTasksCache = r.tasks;
      try { localStorage.setItem(cacheKey, JSON.stringify(r.tasks)); } catch(e) {}
      return r.tasks;
    }
  } catch(e) { console.warn('Groq haftalık görev hatası:', e); }
  return [];
}

function getWeeklyTasks() {
  var weekKey = getWeekKey();
  var storageKey = 'mathgame_weekly_' + (authUser ? authUser.uid : 'guest');
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch(e) {}
  if (saved && saved.key === weekKey && Array.isArray(saved.tasks) && saved.tasks.length > 0) {
    return saved.tasks.map(function(t) {
      if (!t.rewardGiven) {
        t.progress  = Math.min(getQuestProgress(t), t.target);
        t.completed = t.progress >= t.target;
      }
      return t;
    });
  }
  /* Yeni hafta — statik havuzdan + Groq */
  var tasks = WEEKLY_TASK_POOL.map(function(t) {
    return Object.assign({}, t, { progress: 0, completed: false, rewardGiven: false, source: 'static' });
  });
  if (_groqWeeklyTasksCache && _groqWeeklyTasksCache.length > 0) {
    var groqTasks = _groqWeeklyTasksCache.slice(0, 5).map(function(t) {
      return Object.assign({}, t, { progress: 0, completed: false, rewardGiven: false, source: 'groq' });
    });
    tasks = tasks.concat(groqTasks);
  }
  try { localStorage.setItem(storageKey, JSON.stringify({ key: weekKey, tasks: tasks })); } catch(e) {}
  return tasks;
}

/* Kalıcı görevleri state'den yükle */
function getPermTasks() {
  if (!state.permTasks) {
    state.permTasks = PERM_TASK_POOL.map(function(t) {
      return Object.assign({}, t, { progress: 0, completed: false, rewardGiven: false });
    });
  }
  return state.permTasks.map(function(t) {
    if (!t.rewardGiven) {
      t.progress  = Math.min(getQuestProgress(t), t.target);
      t.completed = t.progress >= t.target;
    }
    return t;
  });
}

function getAchieveTasks() {
  if (!state.achieveTasks) {
    state.achieveTasks = ACHIEVE_TASKS.map(function(t) {
      return Object.assign({}, t, { progress: 0, completed: false, rewardGiven: false });
    });
  }
  return state.achieveTasks.map(function(t) {
    if (!t.rewardGiven) {
      t.progress  = Math.min(getQuestProgress(t), t.target);
      t.completed = t.progress >= t.target;
    }
    return t;
  });
}

function getWeekKey() {
  var d = new Date();
  var jan1 = new Date(d.getFullYear(), 0, 1);
  var week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return 'week_' + d.getFullYear() + '_' + week;
}

function getQuestProgress(task) {
  if (!state || !state.stats) return 0;
  if (task.key === 'score') return state.score || 0;
  if (task.key === 'loginStreak') return state.loginStreak || 0;
  if (task.key === 'achCount') return Object.keys(state.achievements || {}).length;
  if (task.key === 'legendAchCount') {
    return Object.keys(state.achievements || {}).filter(function(k) {
      return ACH_RARITY && ACH_RARITY[k] === 'Efsane';
    }).length;
  }
  if (task.key === 'rareAchCount') {
    return Object.keys(state.achievements || {}).filter(function(k) {
      return ACH_RARITY && (ACH_RARITY[k] === 'Nadir' || ACH_RARITY[k] === 'Değerli');
    }).length;
  }
  if (task.key === 'valuableAchCount') {
    return Object.keys(state.achievements || {}).filter(function(k) {
      return ACH_RARITY && ACH_RARITY[k] === 'Değerli';
    }).length;
  }
  if (task.key === 'streakAchCount') {
    return Object.keys(state.achievements || {}).filter(function(k) { return k.startsWith('streak_'); }).length;
  }
  if (task.key === 'scoreAchCount') {
    return Object.keys(state.achievements || {}).filter(function(k) { return k.startsWith('score_'); }).length;
  }
  if (task.key === 'absurdAchCount') {
    return Object.keys(state.achievements || {}).filter(function(k) { return k.startsWith('absurd_'); }).length;
  }
  if (task.key === 'shopBuys') return state._shopBuys || 0;
  if (task.key === 'jokersUsed') return state._jokersUsed || 0;
  if (task.key === 'highestLevel') return state.stats.highestLevel || state.level || 0;
  if (task.key === 'clanJoined') return state.clanId ? 1 : 0;
  if (task.key === 'permDone') {
    return (state.permTasks || []).filter(function(t) { return t.rewardGiven; }).length;
  }
  return state.stats[task.key] || 0;
}

/* Claim için haftalık ve kalıcı görevler */
function claimAllQuests(tabType) {
  /* Tüm alınabilir görevleri tek seferde ver */
  var tasks;
  if (tabType === 'daily') {
    tasks = getTodaysTasks();
  } else if (tabType === 'weekly') {
    tasks = getThisWeeksTasks();
  } else if (tabType === 'perm') {
    tasks = state.permTasks || [];
  } else if (tabType === 'achieve') {
    tasks = state.achieveTasks || [];
  } else {
    return;
  }
  var claimable = tasks.filter(function(t) { return t.completed && !t.rewardGiven; });
  if (claimable.length === 0) { showToast('Alınacak görev yok', '#f59e0b'); return; }
  claimable.forEach(function(t) { claimQuestReward(t.id, tabType); });
  showToast('🎁 ' + claimable.length + ' görev ödülü alındı!', '#ffd700');
}

function claimQuestReward(taskId, tabType) {
  var tasks;
  var storageKey;
  if (tabType === 'weekly') {
    tasks = getWeeklyTasks();
    storageKey = 'mathgame_weekly_' + (authUser ? authUser.uid : 'guest');
  } else if (tabType === 'perm') {
    if (!state.permTasks) state.permTasks = getPermTasks();
    tasks = state.permTasks;
  } else if (tabType === 'achieve') {
    if (!state.achieveTasks) state.achieveTasks = getAchieveTasks();
    tasks = state.achieveTasks;
  } else {
    claimDailyReward(taskId); return;
  }

  var task = tasks.find(function(t) { return t.id === taskId; });
  if (!task || !task.completed || task.rewardGiven) return;

  task.rewardGiven = true;

  /* Ödülü ver */
  if (task.reward) {
    if (task.reward.coins)    addCoins(task.reward.coins, true);
    if (task.reward.diamonds) addDiamonds(task.reward.diamonds, true);
  }

  /* Kaydet */
  if (tabType === 'weekly' && storageKey) {
    var weekKey = getWeekKey();
    try { localStorage.setItem(storageKey, JSON.stringify({ key: weekKey, tasks: tasks })); } catch(e) {}
  } else {
    saveState();
  }

  spawnConfetti(20);
  showToast('🎁 +' + (task.reward.coins || 0) + ' 💰' + (task.reward.diamonds ? ' +' + task.reward.diamonds + ' 💎' : '') + ' kazandın!', '#ffd700');
  renderTaskList(tasks, document.getElementById('dailyTasksList'), tabType);
}

/* Genel görev listesi render — FC Mobile stili */
function renderTaskList(tasks, listEl, tabType) {
  if (!listEl) return;

  /* Sıralama: 1) Alınabilir (tamamlandı ama ödül alınmadı), 2) Devam eden, 3) Alındı */
  var sorted = tasks.slice().sort(function(a, b) {
    var aPri = a.completed && !a.rewardGiven ? 0 : (!a.completed ? 1 : 2);
    var bPri = b.completed && !b.rewardGiven ? 0 : (!b.completed ? 1 : 2);
    return aPri - bPri;
  });

  var done    = tasks.filter(function(t) { return t.rewardGiven; }).length;
  var claimable = tasks.filter(function(t) { return t.completed && !t.rewardGiven; }).length;

  var summaryHtml =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<div style="font-size:12px;color:var(--muted)">' +
        '<span style="color:var(--neon);font-weight:800">' + done + '</span>/' + tasks.length + ' tamamlandı' +
        (claimable > 0 ? ' · <span style="color:#ffd700;font-weight:800">' + claimable + ' alınabilir</span>' : '') +
      '</div>' +
      (claimable > 1
        ? '<button onclick="claimAllQuests(\'' + tabType + '\')" style="padding:6px 14px;border-radius:12px;background:linear-gradient(135deg,#ffd700,#f59e0b);border:none;color:#000;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">🎁 Tümünü Al (' + claimable + ')</button>'
        : '') +
    '</div>' +
    '<div style="height:4px;background:rgba(255,255,255,0.06);border-radius:4px;margin-bottom:14px">' +
      '<div style="height:100%;width:' + Math.round((done/Math.max(tasks.length,1))*100) + '%;background:linear-gradient(90deg,var(--neon),#00cc66);border-radius:4px"></div>' +
    '</div>';

  var cardsHtml = sorted.map(function(task) {
    var pct     = Math.min(100, Math.round(((task.progress||0) / task.target) * 100));
    var isClaim = task.completed && !task.rewardGiven;
    var isGiven = task.rewardGiven;
    var rewardStr = task.reward
      ? (task.reward.coins ? '+' + task.reward.coins + '💰' : '') + (task.reward.diamonds ? ' +' + task.reward.diamonds + '💎' : '')
      : ('+' + (task.bonus||0) + 'p');

    var cardBg = isGiven ? 'background:rgba(0,255,136,0.03);border-color:rgba(0,255,136,0.12)'
               : isClaim ? 'background:rgba(255,215,0,0.06);border-color:rgba(255,215,0,0.3)'
               : 'background:rgba(255,255,255,0.02);border-color:rgba(255,255,255,0.07)';

    var rightSide = isGiven
      ? '<div style="text-align:center;flex-shrink:0"><div style="font-size:18px">✅</div><div style="font-size:9px;color:var(--neon);font-weight:700;margin-top:2px">ALINDI</div></div>'
      : isClaim
      ? '<button onclick="claimQuestReward(\'' + task.id + '\',\'' + tabType + '\')" style="flex-shrink:0;padding:8px 14px;border-radius:12px;background:linear-gradient(135deg,#ffd700,#f59e0b);border:none;color:#000;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:0 4px 12px rgba(255,215,0,0.3)">🎁 AL</button>'
      : '<div style="text-align:center;flex-shrink:0;padding:0 4px"><div style="font-size:11px;font-weight:800;color:var(--muted)">' + rewardStr + '</div></div>';

    return '<div style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;border:1px solid;margin-bottom:8px;' + cardBg + '">' +
      '<div style="width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' + task.icon + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:13px;font-weight:800;color:' + (isGiven?'var(--muted)':'var(--text)') + '">' + escapeHtml(task.title) + (task.source === 'groq' ? ' <span style="font-size:9px;background:rgba(168,85,247,0.2);color:#a855f7;border-radius:6px;padding:1px 5px;font-weight:800">AI</span>' : '') + '</div>' +
        '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escapeHtml(task.desc) + '</div>' +
        (!isGiven
          ? '<div style="display:flex;justify-content:space-between;margin-top:6px">' +
              '<div style="font-size:10px;color:var(--muted2)">' + (task.progress||0) + ' / ' + task.target + '</div>' +
              '<div style="font-size:10px;font-weight:700;color:' + (isClaim?'#ffd700':'var(--neon)') + '">' + pct + '%</div>' +
            '</div>' +
            '<div style="height:4px;background:rgba(255,255,255,0.07);border-radius:4px;margin-top:4px;overflow:hidden">' +
              '<div style="height:100%;width:' + pct + '%;border-radius:4px;background:' + (isClaim?'#ffd700':'linear-gradient(90deg,var(--neon),#00cc66)') + '"></div>' +
            '</div>'
          : '<div style="font-size:10px;color:var(--neon);margin-top:4px">✓ Tamamlandı</div>'
        ) +
      '</div>' +
      rightSide +
    '</div>';
  }).join('');

  listEl.innerHTML = summaryHtml + cardsHtml;
}

function getDailyKey() {
  try {
    var d = new Date();
    return 'daily_' + d.getFullYear() + '_' + d.getMonth() + '_' + d.getDate();
  } catch(e) { return 'daily_fallback'; }
}

function getDailyStorageKey() {
  if (authUser && authUser.uid) return 'mathgame_daily_' + authUser.uid;
  var storedUid = localStorage.getItem(CURRENT_UID_KEY);
  if (storedUid) return 'mathgame_daily_' + storedUid;
  return 'mathgame_daily_guest';
}

function forceResetDailyTasks() {
  try {
    var storageKey = getDailyStorageKey();
    localStorage.removeItem(storageKey);
    /* Groq görev cache'ini de sil */
    localStorage.removeItem('mathgame_groq_daily_' + getDailyKey());
    updateDailyTasks();
    showToast('📅 Günlük görevler yenilendi', '#38bdf8');
  } catch(e) {}
}

/* ── Groq ile günlük görev üretimi ── */
/* Her gün 23:59'da (veya ilk açılışta yeni gün algılanınca) Groq'tan üretilir */
var _groqDailyTasksCache = null;

async function loadGroqDailyTasks() {
  var dayKey = getDailyKey();
  var cacheKey = 'mathgame_groq_daily_' + dayKey;

  /* Local cache var mı? */
  try {
    var cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Array.isArray(cached) && cached.length >= 5) {
      _groqDailyTasksCache = cached;
      return cached;
    }
  } catch(e) {}

  /* Worker'dan iste */
  try {
    var r = await workerPost('groq-daily-quests', { dayKey: dayKey });
    if (r && r.ok && Array.isArray(r.tasks) && r.tasks.length >= 3) {
      _groqDailyTasksCache = r.tasks;
      try { localStorage.setItem(cacheKey, JSON.stringify(r.tasks)); } catch(e) {}
      return r.tasks;
    }
  } catch(e) { console.warn('Groq günlük görev hatası:', e); }

  return [];
}

function getMidnightCountdown() {
  var now  = new Date();
  var midnight = new Date(now);
  midnight.setHours(23, 59, 0, 0);
  if (now >= midnight) {
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(23, 59, 0, 0);
  }
  return Math.max(0, midnight - now);
}

/* Gece yarısı sıfırlama zamanlayıcısı */
function scheduleDailyReset() {
  var ms = getMidnightCountdown();
  setTimeout(function() {
    var storageKey = getDailyStorageKey();
    var dayKey     = getDailyKey();
    var saved      = null;
    try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch(e) {}
    if (!saved || saved.key !== dayKey) {
      /* Gün değişti — sıfırla */
      localStorage.removeItem(storageKey);
      localStorage.removeItem('mathgame_groq_daily_' + saved?.key);
      _groqDailyTasksCache = null;
      updateDailyTasks();
      showToast('🌅 Günlük görevler yenilendi!', '#38bdf8');
    }
    scheduleDailyReset(); /* Tekrar planla */
  }, ms);
}

function getTodaysTasks() {
  try {
    var dayKey = getDailyKey();
    var storageKey = getDailyStorageKey();
    var saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved.key === dayKey && Array.isArray(saved.tasks) && saved.tasks.length > 0) {
      return saved.tasks;
    }
    /* Yeni gün — statik havuzdan 8 tane seç */
    var shuffled = [...DAILY_TASK_POOL].sort(function() { return Math.random() - 0.5; });
    var tasks = shuffled.slice(0, 8).map(function(t) {
      return Object.assign({}, t, { progress: 0, completed: false, rewardGiven: false, source: 'static' });
    });
    /* Groq görevleri varsa ekle (max 4) */
    if (_groqDailyTasksCache && _groqDailyTasksCache.length > 0) {
      var groqTasks = _groqDailyTasksCache.slice(0, 4).map(function(t) {
        return Object.assign({}, t, { progress: 0, completed: false, rewardGiven: false, source: 'groq' });
      });
      tasks = tasks.concat(groqTasks);
    }
    localStorage.setItem(storageKey, JSON.stringify({ key: dayKey, tasks: tasks }));
    return tasks;
  } catch(e) {
    console.warn('getTodaysTasks hata:', e);
    return [];
  }
}

function saveTodaysTasks(tasks) {
  try {
    var dayKey = getDailyKey();
    var storageKey = getDailyStorageKey();
    localStorage.setItem(storageKey, JSON.stringify({ key: dayKey, tasks: tasks }));
  } catch(e) {}
}

function getDailyProgress(task) {
  try {
    if (!state || !state.stats) return 0;
    if (task.type === 'score')  return state.score || 0;
    if (task.type === 'daily')  return (state.stats[task.key] || 0);
    return state.stats[task.key] || 0;
  } catch(e) { return 0; }
}

function updateDailyTasks() {
  try {
    var tasks = getTodaysTasks();
    tasks.forEach(function(task) {
      var progress = getDailyProgress(task);
      task.progress = Math.min(progress, task.target);
      task.completed = task.progress >= task.target;
    });
    saveTodaysTasks(tasks);
    var list = document.getElementById('dailyTasksList');
    if (list) renderTaskList(tasks, list, 'daily');
    updateDailyTimer();
    try { updateQuestQuickInfo(); } catch(e) {}
    /* Diğer sekmeleri de güncelle (görünürse) */
    if (_currentQuestTab !== 'daily') renderQuestTab(_currentQuestTab);
  } catch(e) {
    console.warn('updateDailyTasks hata:', e);
  }
}

/* Ödülü claim et — butona basınca */
function claimDailyReward(taskId) {
  try {
    var tasks = getTodaysTasks();
    var task = tasks.find(function(t) { return t.id === taskId; });
    if (!task || !task.completed || task.rewardGiven) return;

    task.rewardGiven = true;
    saveTodaysTasks(tasks);

    /* Puan ver */
    state.score = (state.score || 0) + task.bonus;
    var board = getCurrentBoard();
    board[state.player] = state.score;
    setCurrentBoard(board);
    saveState();
    try { pushScoreToWorker(); } catch(e) {}
    try { updateAllScoreDisplays(); } catch(e) {}

    showToast('🎁 +' + task.bonus + 'p kazandın!', '#ffd700');
    try { spawnConfetti(25); } catch(e) {}

    /* Tüm görevler tamamlandı mı kontrol et */
    var allClaimed = tasks.every(function(t) { return !t.completed || t.rewardGiven; });
    if (allClaimed && tasks.every(function(t) { return t.completed; })) {
      setTimeout(function() {
        showToast('🌟 Tüm günlük görevler tamamlandı!', '#ffd700');
      }, 800);
    }

    renderDailyTasks(tasks);
    renderLeaderboard();
  } catch(e) { console.warn('claimDailyReward hata:', e); }
}

function renderDailyTasks(tasks) {
  try {
    var list = document.getElementById('dailyTasksList');
    if (!list) return;

    /* Özet satırı */
    var done    = tasks.filter(function(t) { return t.completed; }).length;
    var claimed = tasks.filter(function(t) { return t.rewardGiven; }).length;
    var totalBonus = tasks.reduce(function(s,t){ return s + (t.rewardGiven ? t.bonus : 0); }, 0);

    var summaryHtml =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<div style="font-size:12px;color:var(--muted)">' +
          '<span style="color:var(--neon);font-weight:800">' + claimed + '</span>/' + tasks.length + ' tamamlandı' +
        '</div>' +
        '<div style="font-size:12px;color:#ffd700;font-weight:700">+' + totalBonus + 'p kazanıldı</div>' +
      '</div>' +
      /* Progress bar */
      '<div style="height:6px;background:rgba(255,255,255,0.06);border-radius:6px;margin-bottom:14px;overflow:hidden">' +
        '<div style="height:100%;width:' + Math.round((claimed/tasks.length)*100) + '%;background:linear-gradient(90deg,var(--neon),#00cc66);border-radius:6px;transition:width 0.4s"></div>' +
      '</div>';

    var cardsHtml = tasks.map(function(task) {
      var pct     = Math.min(100, Math.round((task.progress / task.target) * 100));
      var isDone  = task.completed;
      var isClaim = isDone && !task.rewardGiven;
      var isGiven = isDone && task.rewardGiven;

      var cardBg  = isGiven ? 'background:rgba(0,255,136,0.04);border-color:rgba(0,255,136,0.15)'
                  : isClaim ? 'background:rgba(255,215,0,0.06);border-color:rgba(255,215,0,0.3)'
                  : 'background:rgba(255,255,255,0.02);border-color:rgba(255,255,255,0.07)';

      var progressBar =
        '<div style="height:4px;background:rgba(255,255,255,0.07);border-radius:4px;margin-top:8px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;border-radius:4px;transition:width 0.4s;' +
          'background:' + (isGiven ? '#00ff88' : isClaim ? '#ffd700' : 'linear-gradient(90deg,var(--neon),#00cc66)') + '"></div>' +
        '</div>';

      var rightSide = isGiven
        ? '<div style="text-align:center;flex-shrink:0">' +
            '<div style="font-size:20px">✅</div>' +
            '<div style="font-size:10px;color:var(--neon);font-weight:700;margin-top:2px">ALINDI</div>' +
          '</div>'
        : isClaim
        ? '<button onclick="claimDailyReward(\'' + task.id + '\')" style="' +
            'flex-shrink:0;padding:8px 14px;border-radius:12px;' +
            'background:linear-gradient(135deg,#ffd700,#f59e0b);' +
            'border:none;color:#000;font-size:12px;font-weight:800;cursor:pointer;' +
            'font-family:inherit;white-space:nowrap;box-shadow:0 4px 12px rgba(255,215,0,0.3)">' +
            '🎁 AL' +
          '</button>'
        : '<div style="text-align:center;flex-shrink:0;padding:0 4px">' +
            '<div style="font-size:12px;font-weight:800;color:var(--muted)">+' + task.bonus + '</div>' +
            '<div style="font-size:9px;color:var(--muted2)">puan</div>' +
          '</div>';

      return '<div style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;border:1px solid;margin-bottom:8px;' + cardBg + '">' +
        /* Icon kutusu */
        '<div style="width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,0.06);' +
          'display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' +
          task.icon +
        '</div>' +
        /* İçerik */
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:13px;font-weight:800;color:' + (isGiven ? 'var(--muted)' : 'var(--text)') + '">' +
            escapeHtml(task.title) + (task.source === 'groq' ? ' <span style="font-size:9px;background:rgba(168,85,247,0.2);color:#a855f7;border-radius:6px;padding:1px 5px;font-weight:800">AI</span>' : '') +
          '</div>' +
          '<div style="font-size:11px;color:var(--muted);margin-top:2px">' +
            escapeHtml(task.desc) +
          '</div>' +
          /* İlerleme */
          (!isGiven
            ? '<div style="display:flex;justify-content:space-between;margin-top:6px">' +
                '<div style="font-size:10px;color:var(--muted2)">' + task.progress + ' / ' + task.target + '</div>' +
                '<div style="font-size:10px;font-weight:700;color:' + (isClaim ? '#ffd700' : 'var(--neon)') + '">' + pct + '%</div>' +
              '</div>' +
              progressBar
            : '<div style="font-size:10px;color:var(--neon);margin-top:4px">✓ Tamamlandı</div>'
          ) +
        '</div>' +
        /* Sağ taraf */
        rightSide +
      '</div>';
    }).join('');

    list.innerHTML = summaryHtml + cardsHtml;
    updateDailyTimer();
  } catch(e) {
    console.warn('renderDailyTasks hata:', e);
  }
}

function updateDailyTimer() {
  try {
    const el = document.getElementById('dailyTimer');
    if (!el) return;
    const now  = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    const diffMs   = next - now;
    const diffHrs  = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    el.textContent = 'Yenileme: ' + diffHrs + 'sa ' + diffMins + 'dk';
  } catch(e) {}
}

/* Günlük timer — her dakika güncelle */
setInterval(() => { try { updateDailyTimer(); } catch(e) {} }, 60000);

/* ── SESSION İSTATİSTİĞİ (oyun içi) ─────────────────────── */
let sessionCorrect  = 0;
let sessionWrong    = 0;
let sessionStart    = Date.now();

function resetSessionCounters() {
  try {
    sessionCorrect = 0;
    sessionWrong   = 0;
    sessionStart   = Date.now();
  } catch(e) {}
}

function updateSessionStats() {
  try {
    const el = document.getElementById('sessionStats');
    if (!el) return;
    const total = sessionCorrect + sessionWrong;
    const acc   = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;
    const secs  = Math.floor((Date.now() - sessionStart) / 1000);
    const mins  = Math.floor(secs / 60);
    const s     = secs % 60;
    const timeStr = mins > 0 ? mins + 'd ' + s + 's' : s + 's';

    el.innerHTML =
      '<div class="session-stat-chip">✅ <strong>' + sessionCorrect + '</strong></div>' +
      '<div class="session-stat-chip">❌ <strong>' + sessionWrong + '</strong></div>' +
      '<div class="session-stat-chip">🎯 <strong>' + acc + '%</strong></div>' +
      '<div class="session-stat-chip">⏱️ <strong>' + timeStr + '</strong></div>';
  } catch(e) {}
}

/* Session stats her 5 saniyede güncelle */
setInterval(() => { try { if(document.getElementById('gameArea').style.display !== 'none') updateSessionStats(); } catch(e){} }, 5000);




/* ════════════════════════════════════════════════════════════
   ARKA PLAN KÜTÜPHANESİ — CSS gradient koleksiyonu
   ════════════════════════════════════════════════════════════ */

var BG_LIBRARY = [
  {
    cat: '🌿 Doğa & Orman',
    items: [
      { id:'n_forest1',  name:'Sisli Orman',     photo:'1448375240586-882707db888b', fallback:'linear-gradient(135deg,#0a2e0a,#1a5e1a,#2d8a2d)' },
      { id:'n_forest2',  name:'Orman Işığı',     photo:'1542601906990-b4d3fb778b09', fallback:'linear-gradient(160deg,#0a1e06,#1a4010,#2d6020)' },
      { id:'n_forest3',  name:'Ormanlık Yol',    photo:'1425913397705-9d9b0d5c3b5a', fallback:'linear-gradient(180deg,#061008,#102010,#204020)' },
      { id:'n_forest4',  name:'Bambu',           photo:'1518495973542-4542adad0218', fallback:'linear-gradient(160deg,#0a1a04,#1c3808,#2e5010)' },
      { id:'n_mtn1',     name:'Dağ Zirvesi',     photo:'1464822759023-fed622ff2c3b', fallback:'linear-gradient(180deg,#0d1b2e,#2e5f8a,#e8e8ee)' },
      { id:'n_mtn2',     name:'Karlı Dağ',       photo:'1501854140801-50d01698950b', fallback:'linear-gradient(180deg,#0a1020,#2040a0,#e0e8ff)' },
      { id:'n_mtn3',     name:'Göl Manzarası',   photo:'1506905925346-21bda4d32df4', fallback:'linear-gradient(180deg,#061428,#104070,#4090c0)' },
      { id:'n_aurora',   name:'Kuzey Işığı',     photo:'1531366936337-7c912a4589a7', fallback:'linear-gradient(135deg,#020810,#083820,#00c870,#00a850)' },
      { id:'n_waterfall',name:'Şelale',          photo:'1432405972618-c3b346fe0a9f', fallback:'linear-gradient(160deg,#021018,#066090,#40c8e0)' },
    ]
  },
  {
    cat: '🌊 Deniz & Sahil',
    items: [
      { id:'w_ocean1',   name:'Okyanus',         photo:'1505118380757-91f5f5632de0', fallback:'linear-gradient(180deg,#020b18,#0556a0,#04a8e4)' },
      { id:'w_beach1',   name:'Sahil',           photo:'1507525428034-b723cf961d3e', fallback:'linear-gradient(160deg,#021b2e,#0576a8,#038cc4)' },
      { id:'w_beach2',   name:'Tropikal',        photo:'1519046904884-53103b34b206', fallback:'linear-gradient(180deg,#021828,#0880a0,#40c0d8)' },
      { id:'w_wave',     name:'Dalga',           photo:'1518020382113-a7e8fc38eac9', fallback:'linear-gradient(180deg,#020c18,#0c4890,#20a8e0)' },
      { id:'w_under',    name:'Su Altı',         photo:'1682687219573-3fd75b570f1d', fallback:'linear-gradient(180deg,#000408,#002840,#004870)' },
      { id:'w_sunset',   name:'Deniz Günbatımı', photo:'1507003211169-0a1dd7228f2d', fallback:'linear-gradient(180deg,#0a0208,#600820,#f08020)' },
    ]
  },
  {
    cat: '🌅 Gökyüzü & Gün Batımı',
    items: [
      { id:'s_sunset1',  name:'Gün Batımı',      photo:'1470252649378-9c29740c9fa8', fallback:'linear-gradient(180deg,#0a0208,#c02010,#f8c030)' },
      { id:'s_sunset2',  name:'Turuncu Gökyüzü', photo:'1502481851512-e9e2529bfbf9', fallback:'linear-gradient(180deg,#080410,#d04010,#f8a820)' },
      { id:'s_clouds1',  name:'Bulutlar',        photo:'1517483000871-1dbf64a6e1c6', fallback:'linear-gradient(180deg,#060810,#304878,#90a8d0)' },
      { id:'s_clouds2',  name:'Fırtına Bulutu',  photo:'1492011221367-f47e3ccd77a0', fallback:'linear-gradient(160deg,#04060a,#101824,#283848)' },
      { id:'s_milkyway', name:'Samanyolu',       photo:'1419242902214-272b3f66ee7a', fallback:'radial-gradient(ellipse at 50% 50%,#1a1060,#06041a,#000008)' },
      { id:'s_stars',    name:'Yıldızlı Gece',   photo:'1534796636912-3b952d2ba7b9', fallback:'radial-gradient(ellipse at 70% 20%,#14043a,#06020e,#000005)' },
    ]
  },
  {
    cat: '🌌 Uzay',
    items: [
      { id:'sp_nebula',  name:'Nebula',          photo:'1462331940025-496dfbfc7564', fallback:'radial-gradient(ellipse at 60% 40%,#2a0050,#500080,#0a0020)' },
      { id:'sp_galaxy',  name:'Galaksi',         photo:'1543722530-d2c3201371e6', fallback:'radial-gradient(ellipse at 50% 50%,#1a1060,#06041a)' },
      { id:'sp_earth',   name:'Dünyadan Uzay',   photo:'1446776811953-b23d57bd21aa', fallback:'linear-gradient(160deg,#00040e,#001030,#002060)' },
      { id:'sp_moon',    name:'Ay',              photo:'1532693322450-2cb5c511067d', fallback:'radial-gradient(circle at 40% 40%,#c0c0d0,#404050,#000008)' },
    ]
  },
  {
    cat: '🏙 Şehir & Gece',
    items: [
      { id:'c_night1',   name:'Gece Şehri',      photo:'1477959858617-67f85cf4f1df', fallback:'linear-gradient(180deg,#020408,#0c2034,#101828)' },
      { id:'c_night2',   name:'Neon Sokak',      photo:'1514565131-ffa0fcde5f8b', fallback:'linear-gradient(180deg,#020408,#183060,#244080)' },
      { id:'c_bridge',   name:'Köprü Geceleri',  photo:'1426122402199-be02db90eb90', fallback:'linear-gradient(160deg,#04060a,#101824,#303e50)' },
      { id:'c_rain',     name:'Yağmurlu Cam',    photo:'1501691223387-dd0500403074', fallback:'linear-gradient(180deg,#04060a,#101828,#181e2c)' },
      { id:'c_tokyo',    name:'Tokyo',           photo:'1540959733332-eab4deabeeaf', fallback:'linear-gradient(180deg,#040208,#200840,#400060)' },
    ]
  },
  {
    cat: '🔮 Neon & Soyut',
    items: [
      { id:'ab_cyber1',  name:'Cyberpunk',       photo:'1518770660439-4636190af475', fallback:'linear-gradient(135deg,#040010,#1a0050,#000818)' },
      { id:'ab_neon1',   name:'Neon Işıklar',    photo:'1558618666-fcd25c85cd64', fallback:'linear-gradient(160deg,#000a04,#001808,#00ff66 40%)' },
      { id:'ab_geo',     name:'Geometrik',       photo:'1557682250-33bd709cbe85', fallback:'linear-gradient(135deg,#040814,#1428a0,#2840c0)' },
      { id:'ab_lava',    name:'Lav Lambası',     photo:'1560015534-cee980ba7e13', fallback:'radial-gradient(ellipse at 50% 80%,#800010,#200000,#000000)' },
      { id:'ab_liquid',  name:'Sıvı Renk',       photo:'1579546929518-9e396f3cc809', fallback:'linear-gradient(135deg,#0a0018,#1a0040,#300060)' },
      { id:'ab_smoke',   name:'Duman',           photo:'1520034475321-cbe63696469a', fallback:'linear-gradient(160deg,#04060a,#0c101a,#202030)' },
    ]
  },
  {
    cat: '🌸 Çiçek & Doğa Detay',
    items: [
      { id:'fl_cherry',  name:'Kiraz Çiçeği',    photo:'1522748906645-95d8adfd52c7', fallback:'linear-gradient(160deg,#0e0410,#702860,#f0a0c0)' },
      { id:'fl_sunfl',   name:'Ayçiçeği',        photo:'1490750967868-88df5691240e', fallback:'linear-gradient(160deg,#0c0800,#503010,#f8d060)' },
      { id:'fl_lavnd',   name:'Lavanta',         photo:'1499002238440-d264edd596ec', fallback:'linear-gradient(160deg,#0e0818,#6040a0,#a080d8)' },
      { id:'fl_autumn',  name:'Sonbahar',        photo:'1507003211169-0a1dd7228f2d', fallback:'linear-gradient(160deg,#0c0800,#602010,#d06020)' },
      { id:'fl_snow',    name:'Karlı Orman',     photo:'1418985991508-e47386d96a71', fallback:'linear-gradient(180deg,#060810,#204060,#c0dce8)' },
    ]
  },
];

/* ── Kütüphane Render ──────────────────────────────────── */
const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';
const UNSPLASH_THUMB_PARAMS = '?w=400&q=65&fit=crop&auto=format';
const UNSPLASH_FULL_PARAMS  = '?w=1920&q=85&fit=crop&auto=format';

function renderBgLibrary() {
  try {
    const content = document.getElementById('bgLibContent');
    if (!content) return;

    content.innerHTML = '';

    BG_LIBRARY.forEach(category => {
      /* Kategori başlığı */
      const catTitle = document.createElement('div');
      catTitle.className = 'bglib-cat-title';
      catTitle.textContent = category.cat;
      content.appendChild(catTitle);

      /* Grid */
      const grid = document.createElement('div');
      grid.className = 'bglib-grid';

      category.items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'bglib-item' + (state.bgLibId === item.id ? ' active' : '');
        el.dataset.id = item.id;

        /* Fallback gradient arka plan */
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'bg-fallback';
        fallbackDiv.style.background = item.fallback || '#0a1020';
        el.appendChild(fallbackDiv);

        /* Gerçek fotoğraf varsa img ekle */
        if (item.photo) {
          const img = document.createElement('img');
          img.className = 'loading';
          img.loading   = 'lazy';
          img.alt       = item.name;
          img.src       = UNSPLASH_BASE + item.photo + UNSPLASH_THUMB_PARAMS;

          img.onload = () => {
            try {
              img.classList.remove('loading');
              /* Yüklendi — fallback'i gizle */
              fallbackDiv.style.opacity = '0';
            } catch(e) {}
          };
          img.onerror = () => {
            try {
              /* Hata — fallback göster */
              img.style.display = 'none';
              fallbackDiv.style.opacity = '1';
            } catch(e) {}
          };

          el.appendChild(img);

          /* Wifi göstergesi */
          const netBadge = document.createElement('span');
          netBadge.className = 'bglib-net-badge';
          netBadge.textContent = '📡';
          el.appendChild(netBadge);
        }

        /* İsim etiketi */
        const label = document.createElement('span');
        label.textContent = item.name;
        el.appendChild(label);

        /* Tıklama */
        el.addEventListener('click', () => {
          try {
            content.querySelectorAll('.bglib-item.active').forEach(a => a.classList.remove('active'));
            el.classList.add('active');

            state.bgLibId = item.id;
            state.bgImage = null;

            if (item.photo) {
              /* Gerçek fotoğraf URL'si */
              const fullUrl = UNSPLASH_BASE + item.photo + UNSPLASH_FULL_PARAMS;
              state.bgLibGradient = null;
              state.bgLibPhotoUrl = fullUrl;
              applyBgLibPhoto(fullUrl, item.fallback);
            } else {
              state.bgLibGradient = item.fallback;
              state.bgLibPhotoUrl = null;
              applyBgLibGradient(item.fallback);
            }

            try { saveState(); } catch(e) {}
            showToast('🖼 ' + item.name + ' uygulandı');
          } catch(e) { console.warn('bglib click hata:', e); }
        });

        grid.appendChild(el);
      });

      content.appendChild(grid);
    });
  } catch(e) {
    console.warn('renderBgLibrary hata:', e);
  }
}

/* Gerçek fotoğrafı uygula — yüklenirken fallback göster */
function applyBgLibPhoto(url, fallback) {
  try {
    /* Önce fallback gradient göster */
    if (fallback) {
      document.body.style.backgroundImage    = fallback;
      document.body.style.backgroundSize     = 'cover';
    }
    document.body.classList.add('has-bg-image');
    if (bgLayer) bgLayer.style.background = 'rgba(4,6,14,0.55)';
    /* card-bg CSS class üzerinden yönetiliyor */

    /* Arka planda gerçek fotoğrafı yükle */
    const preloader = new Image();
    preloader.onload = () => {
      try {
        document.body.style.backgroundImage    = 'url(' + url + ')';
        document.body.style.backgroundSize     = 'cover';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundRepeat   = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
      } catch(e) {}
    };
    preloader.onerror = () => {
      /* Yüklenemedi — fallback yeterli */
      showToast('⚠️ Fotoğraf yüklenemedi, gradient kullanılıyor', '#f59e0b');
    };
    preloader.src = url;
  } catch(e) { console.warn('applyBgLibPhoto hata:', e); }
}

/* ── Gradient arka planı uygula ──────────────────────── */
function applyBgLibGradient(gradient) {
  try {
    /* Önce custom fotoğrafı temizle */
    document.body.style.backgroundImage    = gradient;
    document.body.style.backgroundSize     = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat   = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';

    /* card-bg CSS class üzerinden yönetiliyor */
    document.body.classList.add('has-bg-image');

    /* bgLayer'ı şeffaf yap, gradient görünsün */
    bgLayer.style.background = 'rgba(4,6,14,0.55)';
  } catch(e) { console.warn('applyBgLibGradient hata:', e); }
}

/* ── Kaydedilmiş kütüphane seçimini uygula ─────────── */
function applyStoredBgLib() {
  try {
    if (state.bgLibGradient && !state.bgImage) {
      applyBgLibGradient(state.bgLibGradient);
    }
  } catch(e) {}
}

/* ── Modal aç/kapa ──────────────────────────────────── */
function openBgLib() {
  try {
    renderBgLibrary();
    document.getElementById('bgLibModal').classList.add('show');
  } catch(e) { console.warn('openBgLib hata:', e); }
}
function closeBgLib() {
  try {
    closeModal(document.getElementById('bgLibModal'));
  } catch(e) {}
}

/* ── Event listeners ─────────────────────────────────── */
document.addEventListener('click', (e) => {
  const libBtn   = e.target.closest('#bgLibBtn');
  const closeBtn = e.target.closest('#bgLibClose');
  if (libBtn)   { try { clickSound(); openBgLib();  } catch(e) {} }
  if (closeBtn) { try { clickSound(); closeBgLib(); } catch(e) {} }
});


/* ── Modal kapatma yardımcısı — animasyonlu ─────────── */
function closeModal(el, cb) {
  try {
    if (!el || !el.classList.contains('show')) return;
    el.classList.add('modal-closing');
    setTimeout(() => {
      try {
        el.classList.remove('show', 'modal-closing');
        if (cb) cb();
      } catch(e) {}
    }, 240);
  } catch(e) {
    if (el) el.classList.remove('show');
    if (cb) cb();
  }
}


