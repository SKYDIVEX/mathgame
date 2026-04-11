
function showToast(msg, color){if(!color)color='#00ff66';
  if (!toastEl) { console.warn('toast:', msg); return; }
  const bar = document.getElementById('toast-bar');
  var msgEl = document.getElementById('toast-msg');
  if (msgEl) msgEl.textContent = msg;
  toastEl.style.background = color === '#00ff66' ? 'linear-gradient(135deg,#071022,#0a1e14)' : 'linear-gradient(135deg,#1a0f00,#1a1200)';
  toastEl.style.borderColor = color;
  toastEl.style.color = color;
  bar.style.background = color;
  // Animasyonu sıfırla
  bar.style.animation = 'none';
  bar.offsetHeight; // reflow
  bar.style.animation = 'toastBar 2.8s linear forwards';
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toastEl.classList.remove('show'), 2800);
}

/* ── SETTINGS SAVE ─────────────────────────────────── */
document.getElementById('saveSettingsBtn').addEventListener('click', ()=>{
  /* Draft geçerlilik kontrolü */
  if (!settingsDraft.ops || settingsDraft.ops.length === 0) {
    showToast('⚠️ En az bir işlem türü seçili olmalı!', '#f59e0b');
    return;
  }

  /* Draft → State'e yaz */
  state.ops          = [...settingsDraft.ops];
  state.levelUpEvery = settingsDraft.levelUpEvery;
  state.soundOn      = settingsDraft.soundOn;
  state.btnColor     = settingsDraft.btnColor;
  state.bgColor      = settingsDraft.bgColor;

  /* Renkleri kesin olarak uygula */
  document.documentElement.style.setProperty('--neon',   state.btnColor);
  document.documentElement.style.setProperty('--bg-mid', state.bgColor);

  /* Ses durumunu uygula */
  if (masterGain) {
    masterGain.gain.value = state.soundOn ? 1 : 0;
  }
  const quickSoundEl = document.getElementById('soundToggle');
  if (quickSoundEl) quickSoundEl.checked = state.soundOn;

  /* Kaydet */
  saveState();

  /* Liderlik & UI güncelle */
  state.score = getCurrentBoard()[state.player] || 0;
  renderLeaderboard();
  updateMiniInfo();
  if (scoreDisplay) scoreDisplay.innerText = state.score;
  if (levelDisplay) levelDisplay.innerText = state.level;

  /* Değişiklik bayrağını sıfırla */
  settingsChanged = false;

  clickSound();
  showToast('✅ Ayarlar kaydedildi!');

  /* Modalı kapat */
  setTimeout(() => {
    try { closeModal(settingsModal); } catch(e) {}
  }, 400);
});

/* ── LEADERBOARD ───────────────────────────────────── */
var _localLbOpsFilter = 'all'; /* all, +, -, *, / veya karma */

function renderLeaderboard(){
  const board = getCurrentBoard(); /* hep 'all' key'i */
  var entries = Object.entries(board); /* [name, {score, ops}] veya [name, score] */

  /* ops filtresi uygula */
  if (_localLbOpsFilter !== 'all') {
    entries = entries.filter(function(e) {
      var ops = (typeof e[1] === 'object' && e[1].ops) ? e[1].ops : 'all';
      return ops === _localLbOpsFilter || ops === 'all';
    });
  }

  /* skora göre sırala */
  entries.sort(function(a, b) {
    var sa = typeof a[1] === 'object' ? (a[1].score || 0) : a[1];
    var sb = typeof b[1] === 'object' ? (b[1].score || 0) : b[1];
    return sb - sa;
  });

  var filterLabel = _localLbOpsFilter === 'all' ? 'Tüm Modlar' : opsLabel([..._localLbOpsFilter]);
  var header = '<div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:#a855f7;margin-bottom:6px">📊 ' + filterLabel + '</div>';

  if (entries.length === 0) {
    leaderboardEl.innerHTML = header + '<i style="color:var(--muted)">Henüz kimse yok</i>';
    if (boardDiv) boardDiv.innerHTML = '';
    return;
  }

  var medals = ['🥇','🥈','🥉'];
  var html = header + entries.slice(0, 20).map(function(e, i) {
    var score = typeof e[1] === 'object' ? (e[1].score || 0) : e[1];
    var rank = i < 3 ? medals[i] : (i + 1) + '.';
    var isMe = e[0] === (authUser ? authUser.name : state.player);
    return '<div class="lbItem' + (isMe ? '" style="background:var(--neon-dim);border-color:rgba(0,255,136,0.25)' : '') + '">' +
      '<div>' + rank + ' ' + escapeHtml(e[0]) + (isMe ? ' ✦' : '') + '</div>' +
      '<div style="color:var(--neon);font-family:var(--font-mono)">' + score + 'p</div>' +
      '</div>';
  }).join('');

  leaderboardEl.innerHTML = html;
  if (boardDiv) boardDiv.innerHTML = entries.slice(0, 10).map(function(e, i) {
    var score = typeof e[1] === 'object' ? (e[1].score || 0) : e[1];
    return '<div style="display:flex;justify-content:space-between;padding:6px;border-radius:6px;background:rgba(255,255,255,0.02);margin-bottom:6px">' +
      (i + 1) + '. ' + escapeHtml(e[0]) + '<strong>' + score + 'p</strong></div>';
  }).join('');
}

/* ── INIT ──────────────────────────────────────────── */
/* Önce auth durumunu yükle, sonra uid'e göre state yükle */
try { loadAuth(); } catch(e) {}
if (authUser && authUser.uid) {
  loadState(authUser.uid);
} else {
  loadState();
}
document.documentElement.style.setProperty('--accent', state.btnColor||'#00ff66');
document.documentElement.style.setProperty('--neon',   state.btnColor||'#00ff66');
document.documentElement.style.setProperty('--bg-mid', state.bgColor||'#0b1220');
try { applyBgImage(); } catch(e) {}

/* i18n — dil algıla ve uygula (async, arka planda) */
setTimeout(function() { try { initI18n(); } catch(e) {} }, 100);

/* Eski confetti kalıntılarını temizle */
try { document.querySelectorAll('.confetti-piece,.particle').forEach(function(el){ el.remove(); }); } catch(e) {}

/* Cüzdan güncelle */
try { updateWallet(); } catch(e) {}

if (quickSoundToggle) quickSoundToggle.checked = !!state.soundOn;
if (btnColorInput) btnColorInput.value = state.btnColor||'#00ff66';
if (bgColorInput) bgColorInput.value  = state.bgColor||'#0b1220';
if (settingBtnColor) settingBtnColor.value = state.btnColor||'#00ff66';
if (settingBgColor) settingBgColor.value  = state.bgColor||'#0b1220';
if (settingSound) settingSound.checked  = !!state.soundOn;

// Show correct initial screen — updateAllScoreDisplays henüz tanımlı olmayabilir
if (authUser && authUser.uid) {
  var _lbh = document.getElementById('loginBtnHeader');
  if (_lbh) _lbh.style.display = 'none';
  state.player = authUser.name;
  try { updateAllScoreDisplays(); } catch(e) {}
  try { updateProfileBtn(); } catch(e) {}
  try { updateWallet(); } catch(e) {}
  showScreen('menu');
  try { refreshMenuPanels(); } catch(e) {}
  try { updateMiniInfo(); } catch(e) {}
  setTimeout(async function() {
    if (!authUser || !authUser.token) return;
    try { await syncOnlineScore(); } catch(e) {}
    try { await loadProfileFromCloud(); } catch(e) {}
    try { updateAllScoreDisplays(); } catch(e) {}
    try { updateWallet(); } catch(e) {}
  }, 100);
} else if (state.player) {
  showScreen('menu');
  try { updateAllScoreDisplays(); } catch(e) {}
  try { updateMiniInfo(); } catch(e) {}
}
/* Auth yoksa window.load halleder */
renderLeaderboard();

/* ── ENTRY ─────────────────────────────────────────── */
/* enterBtn/guestBtn artık gizli — auth modal kullanılıyor */
try { enterBtn.addEventListener('click', () => openAuthModal()); } catch(e) {}
try { guestBtn.addEventListener('click',  () => openAuthModal()); } catch(e) {}

function startSession(name){
  try { stopSessionTimer(); } catch(e) {}
  const prev=state.player;
  state.player=name;
  if(prev!==name) state.level=1;
  state.level=state.level||1;
  state.score=getCurrentBoard()[name]||0;
  if(!state.stats) state.stats = {};
  if(!state.achievements) state.achievements = {};
  saveState();
  try { startSessionTimer(); } catch(e) {}
  playerLabel.innerText=name;
  playerDisplay.innerText=name;
  scoreDisplay.innerText=state.score;
  levelDisplay.innerText=state.level;
  showScreen('menu');
  clickSound();
  renderLeaderboard();
  updateMiniInfo();
}

/* ── GAME MODE ─────────────────────────────────────── */
let gameMode = 'math'; // 'math' | 'absurd'

/* ── MENU BUTTONS ──────────────────────────────────── */
try {
if(startGameBtn) startGameBtn.addEventListener('click', async ()=>{
  clickSound();
  gameMode = 'math';
  try { resetSessionCounters(); } catch(e) {}
  /* Event multiplier'ı her oyun başında taze al */
  try { await loadActiveEvents(); } catch(e) {}
  document.getElementById('modeBadge').style.display = 'none';
  document.getElementById('mathInputRow').style.display = 'flex';
  document.getElementById('absurdChoices').style.display = 'none';
  showScreen('game');
  loadGameUI();
  nextQuestion(true);
  try { updateJokerUI(); } catch(e) {}
  trackEvent('game_start', { mode: 'math', level: state.level || 1 });
});

if(startAbsurdBtn) startAbsurdBtn.addEventListener('click', async ()=>{
  clickSound();
  gameMode = 'absurd';
  try { resetSessionCounters(); } catch(e) {}
  absurdSessionUsed = new Set();
  absurdQueue = [];
  absurdFetching = false;
  document.getElementById('modeBadge').style.display = 'block';
  document.getElementById('mathInputRow').style.display = 'none';
  document.getElementById('absurdChoices').style.display = 'block';
  document.getElementById('rewardUI').parentElement.innerHTML = '<span style="font-size:12px;color:#a855f7">Puan yok, sadece eğlence 🎉</span>';
  showScreen('game');
  loadGameUI();
  showAbsurdLoading();
  await fetchAbsurdBatch();
  nextAbsurdQuestion();
  trackEvent('game_start', { mode: 'absurd' });
});

if(logoutBtn) logoutBtn.addEventListener('click', async ()=>{
  try { if(fbAuth && fbAuth.currentUser) await fbAuth.signOut(); } catch(e){}
  /* Çıkış öncesi cloud'a kaydet */
  try { await saveProfileToCloud(); } catch(e){}
  clearAuth();
  authUser = null;
  _adminChecked  = false;
  _adminVerified = false;
  /* State'i sıfırlama — sadece player alanını temizle */
  state.player = null;
  saveState();
  showToast('👋 Çıkış yapıldı');
  const pb = document.getElementById('profileBtn');
  if(pb) pb.style.display = 'none';
  updateProfileBtn();
  showLoginChoice();
});

if(openSettings) openSettings.addEventListener('click', function() { clickSound(); openSettingsModal(); });
if(openAbout) openAbout.addEventListener('click', ()=>{ clickSound(); aboutModal.classList.add('show'); });
document.getElementById('closeAboutModal').addEventListener('click', ()=>{ closeModal(aboutModal); clickSound(); });

if(resetScores) resetScores.addEventListener('click', async ()=>{
  const ok = await showConfirm('Skorları Sıfırla', 'Tüm skorlar silinecek.');
  if(!ok) return;
  state.leaderboard={}; saveState(); renderLeaderboard(); clickSound();
});

/* Quick sound toggle */
if(quickSoundToggle) quickSoundToggle.addEventListener('change', e=>{ state.soundOn=e.target.checked; saveState(); clickSound(); });

/* Old bg/color inputs still work (menu sidebar) */
if(btnColorInput) btnColorInput.addEventListener('input', e=>{
  state.btnColor=e.target.value; document.documentElement.style.setProperty('--neon',state.btnColor); saveState(); clickSound();
});
if(bgColorInput) bgColorInput.addEventListener('input', e=>{
  state.bgColor=e.target.value; document.documentElement.style.setProperty('--bg-mid',state.bgColor); saveState(); clickSound();
});
if(bgImageBtn && bgImageInput) bgImageBtn.addEventListener('click', ()=> bgImageInput.click());
if(bgImageInput) bgImageInput.addEventListener('change', (ev)=>{
  const f = ev.target.files[0];
  if(!f) return;
  /* Boyut kontrolü — 15MB üstü reddet */
  if(f.size > 15 * 1024 * 1024){
    showToast('⚠️ Fotoğraf çok büyük (max 15MB)', '#f59e0b');
    return;
  }
  showToast('⏳ Fotoğraf yükleniyor...', '#38bdf8');
  compressAndSetBgImage(f, (dataUrl) => {
    if(!dataUrl){ showToast('❌ Fotoğraf yüklenemedi', '#ff6b6b'); return; }
    state.bgImage = dataUrl;
    applyBgImage();
    try { saveState(); } catch(e){
      /* localStorage quota aşıldıysa fotoğrafı sadece bellekte tut */
      showToast('⚠️ Fotoğraf kaydedilemedi (depolama dolu), oturum süresince çalışır', '#f59e0b');
    }
    showToast('✅ Arka plan ayarlandı!');
  });
  ev.target.value = ''; /* Aynı dosyayı tekrar seçebilmek için sıfırla */
});
if(clearBgBtn) clearBgBtn.addEventListener('click', ()=>{
  state.bgImage = null;
  try { saveState(); } catch(e) {}
  clickSound();
  showToast('🗑 Arka plan temizlendi');
});

/**
 * Fotoğrafı canvas üzerinde sıkıştırır, max 1280px'e küçültür.
 * @param {File} file
 * @param {function(string|null)} callback — base64 dataUrl döner
 */
function compressAndSetBgImage(file, callback) {
  try {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);
        const MAX = 1280;
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        /* Oranı koru, max 1280px */
        if(w > MAX || h > MAX){
          if(w >= h){ h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }

        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if(!ctx){ callback(null); return; }

        ctx.drawImage(img, 0, 0, w, h);

        /* JPEG kalite 0.80 — iyi görüntü, küçük boyut */
        const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
        callback(dataUrl);
      } catch(e) {
        console.warn('compressAndSetBgImage canvas hata:', e);
        callback(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.warn('compressAndSetBgImage img yüklenemedi');
      callback(null);
    };
    img.src = objectUrl;
  } catch(e) {
    console.warn('compressAndSetBgImage hata:', e);
    callback(null);
  }
}

/* ── GAME ENGINE ───────────────────────────────────── */
var correctAnswer=null, questionCount=0;

function loadGameUI(){
  playerDisplay.innerText=state.player;
  levelUI.innerText=state.level;
  scoreUI.innerText=state.score;
  multiplierUI.innerText = state.level + ' × 5';
  rewardUI.innerText = Math.max(5, state.level * 5);
}

/*
  Zorluk tablosu (yaklaşık):
  Seviye  1 → toplama/çıkarma: 1–10,   çarpma: 1–5×1–5,    bölme: 2–5
  Seviye  5 → toplama/çıkarma: 1–50,   çarpma: 1–12×1–12,  bölme: 2–20
  Seviye 10 → toplama/çıkarma: 1–150,  çarpma: 1–25×1–25,  bölme: 2–50
  Seviye 20 → toplama/çıkarma: 1–600,  çarpma: 1–50×1–50,  bölme: 2–150
  Seviye 30 → toplama/çıkarma: 1–2000, çarpma: 1–99×1–99,  bölme: büyük
*/
function difficultyMax(lvl){
  /* lvl 1→12, lvl 5→50, lvl 10→250, lvl 20→3000, lvl 30→30000 */
  return Math.min(Math.floor(6 * Math.pow(1.45, lvl)), 99999);
}

/* Seviyeye göre soru tipi belirle */
function getQuestionType(lvl) {
  /* Seviye 1-4: normal işlem
     Seviye 5-9: eksik sayı (? + 3 = 7)
     Seviye 10-14: çift işlem (a + b + c)
     Seviye 15-19: denklem (2x + 3 = 11, x = ?)
     Seviye 20+: eşitsizlik (a + b > ? kaçtan büyükse doğru) */
  if (lvl >= 20) return 'equation';
  if (lvl >= 15) return 'equation';
  if (lvl >= 10) return 'missing';
  if (lvl >= 5)  return Math.random() < 0.4 ? 'missing' : 'normal';
  return 'normal';
}

/* ── MATH SORU HAVUZU ──────────────────────────────── */
var askedQuestions = new Set(); // "a|op|b" formatında
var MAX_POOL = 500; // sonsuz döngüyü önlemek için limit

function nextQuestion(reset=false){
  /* reset=true → yeni oyun başlıyor.
     Level'i SIFIRLAMIYORUZ — oyuncu kaldığı yerden devam eder.
     Sadece sorulan soru seti ve sayacı temizleniyor. */
  if(reset){ questionCount=0; askedQuestions.clear(); state.level=state.level||1; }
  questionCount++;
  const lvl = state.level||1;
  const max  = difficultyMax(lvl);
  const ops  = state.ops&&state.ops.length ? state.ops : ['+'];
  let a, b, op, key;
  let attempts = 0;
  let questionStr = '';
  let questionTypeUsed = 'normal';

  do {
    op = ops[randInt(0, ops.length-1)];
    if(op==='+'){
      a = randInt(Math.floor(max*0.1), max);
      b = randInt(Math.floor(max*0.1), max);
    } else if(op==='-'){
      a = randInt(Math.floor(max*0.2), max);
      b = randInt(1, a);
    } else if(op==='*'){
      const mulMax = Math.min(Math.floor(Math.sqrt(max) * 1.5), 999);
      const mulMin = Math.max(2, Math.floor(mulMax * 0.15));
      a = randInt(mulMin, mulMax);
      b = randInt(mulMin, mulMax);
    } else {
      /* Bölme — her zaman tam bölünen: a = b * k → sonuç tam sayı */
      const divMax = Math.min(Math.floor(max * 0.5), 500);
      b = randInt(2, Math.max(2, Math.floor(divMax * 0.3)));
      const maxMultiplier = Math.max(2, Math.floor(divMax / b));
      a = b * randInt(2, maxMultiplier);
    }
    key = a + '|' + op + '|' + b;
    attempts++;
    if(attempts > MAX_POOL){ askedQuestions.clear(); break; }
  } while(askedQuestions.has(key));

  askedQuestions.add(key);
  var rawResult = safeCalc(a, op, b);

  /* TAM SAYI GARANTİSİ — virgüllü cevap kesinlikle çıkmasın */
  rawResult = Math.floor(rawResult); /* her zaman tam sayıya yuvarla */
  /* Bölmede a'yı düzelt — a = b * rawResult olsun */
  if (op === '/') { a = b * rawResult; }
  /* Çıkarmada b'yi düzelt — a - b = rawResult */
  if (op === '-') { b = a - rawResult; if (b < 1) { b = 1; rawResult = a - b; } }
  /* Toplamada b'yi düzelt */
  if (op === '+') { rawResult = a + b; } /* toplama zaten tam sayı */
  /* Çarpmada sonuç zaten tam sayı */
  const result = Math.floor(rawResult); /* kesinlikle tam sayı */
  const opDisp = {'+':'+', '-':'−', '*':'×', '/':'÷'}[op]||op;

  /* Soru tipini belirle */
  const qType = getQuestionType(lvl);

  if (qType === 'missing' && Math.random() < 0.5) {
    /* Eksik sayı: ? + b = result veya a + ? = result */
    questionTypeUsed = 'missing';
    const missingA = Math.random() < 0.5;
    if (missingA) {
      correctAnswer = a;
      questionStr = '? ' + opDisp + ' ' + b + ' = ' + result;
    } else {
      correctAnswer = b;
      if (op === '-') {
        questionStr = a + ' ' + opDisp + ' ? = ' + result;
      } else {
        questionStr = a + ' ' + opDisp + ' ? = ' + result;
      }
    }
  } else if (qType === 'equation' && (op === '+' || op === '-') && Math.random() < 0.5) {
    /* Basit denklem: 2x + b = result → x = ? */
    questionTypeUsed = 'equation';
    const coeff = randInt(2, Math.min(10, Math.floor(lvl / 2) + 2));
    const eqB   = randInt(1, Math.max(1, Math.floor(max * 0.3)));
    const eqRes = coeff * a + eqB;
    correctAnswer = a;
    questionStr = coeff + 'x ' + opDisp + ' ' + eqB + ' = ' + eqRes + ',  x = ?';
  } else {
    /* Normal soru */
    questionTypeUsed = 'normal';
    correctAnswer = result;
    questionStr = a + ' ' + opDisp + ' ' + b + ' = ?';
  }

  var badge = document.getElementById('levelBadge');
  if (badge) {
    badge.innerText = 'Seviye ' + lvl + (questionTypeUsed === 'missing' ? ' — Eksik Sayı' : questionTypeUsed === 'equation' ? ' — Denklem' : '');
  }
  questionText.innerText = questionStr;

  /* Event multiplier dahil ödül göster */
  var _evMult = window._activeEventMultiplier || 1;
  var _baseReward = Math.max(5, lvl * 5);
  var _displayReward = _baseReward * _evMult;
  rewardUI.innerText = _evMult > 1
    ? (_baseReward + ' × ' + _evMult + ' = ' + _displayReward)
    : _baseReward;
  multiplierUI.innerText = lvl + ' × 5' + (_evMult > 1 ? ' 🔥×' + _evMult : '');

  resultMsg.style.opacity = 0;
  answerInput.value = '';
  answerInput.focus();
}

submitAnswerBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', e=>{ if(e.key==='Enter') checkAnswer(); });

function checkAnswer(){
  try {
    /* ── Girdi doğrulama ── */
    const raw = answerInput.value.trim();
    if (raw === '') {
      resultMsg.style.color = '#f59e0b';
      resultMsg.innerText   = 'Cevap gir!';
      resultMsg.style.opacity = 1;
      failSound();
      return;
    }

    const user = parseFloat(raw.replace(',', '.').replace(' ', ''));
    if (Number.isNaN(user)) {
      resultMsg.style.color   = '#f59e0b';
      resultMsg.innerText     = 'Sayı gir!';
      resultMsg.style.opacity = 1;
      failSound();
      return;
    }

    /* ── Stats güvenli başlat ── */
    if (!state.stats)              state.stats = {};
    if (!state.achievements)       state.achievements = {};
    state.stats.totalAnswered      = (state.stats.totalAnswered || 0) + 1;
    if (!state.stats.highestLevel) state.stats.highestLevel = 1;

    /* ── DOĞRU ── */
    /* Tolerans: bölme işlemlerinde daha geniş tut */
    var tolerance = Math.max(0.05, Math.abs(correctAnswer) * 0.01);
    /* Her ikisini de 2 ondalığa yuvarla */
    var userRounded    = Math.round(user * 100) / 100;
    var correctRounded = Math.round(correctAnswer * 100) / 100;
    /* Ayrıca tam sayıya da yuvarlanmış değerle karşılaştır */
    var userInt    = Math.round(user);
    var correctInt = Math.round(correctAnswer);
    var isCorrect  = (Math.abs(userRounded - correctRounded) < tolerance) ||
                     (Number.isInteger(correctAnswer) && userInt === correctInt);
    if (isCorrect) {
      successSound();

      /* Puan hesapla */
      const eventMult = window._activeEventMultiplier || 1;
      const doubleMult = window._jokerDoubleActive ? 2 : 1;
      if (window._jokerDoubleActive) {
        window._jokerDoubleActive = false;
        showFloatingReward('⚡ 2x!', '#ffd700');
      }
      const gained = Math.max(5, state.level * 5) * eventMult * doubleMult;
      state.score  = Math.max(0, (state.score || 0) + gained);
      const board  = getCurrentBoard();
      board[state.player] = state.score;
      setCurrentBoard(board);

      /* Coin kazanım */
      try { earnCoinForCorrect(state.level, (state.correctStreak||0) >= 3); } catch(e) {}

      /* Klan puanı katkısı */
      try {
        if (authUser && state.clanId) {
          /* Throttle: her 5 doğruda bir push */
          state._clanContribBuffer = (state._clanContribBuffer || 0) + gained;
          if ((state.stats.totalCorrect % 5) === 0) {
            var clanPush = state._clanContribBuffer;
            state._clanContribBuffer = 0;
            workerPost('clan/contribute', { token: authUser.token, amount: clanPush }).catch(function(){});
          }
        }
      } catch(e) {}

      /* Streak */
      state.correctStreak = (state.correctStreak || 0) + 1;
      if (!state.stats.currentNoWrong) state.stats.currentNoWrong = 0;
      state.stats.currentNoWrong++;

      /* İstatistik güncelle */
      state.stats.totalCorrect  = (state.stats.totalCorrect  || 0) + 1;
      try { sessionCorrect++; updateSessionStats(); } catch(e) {}
      try { updateDailyTasks(); } catch(e) {}
      state.stats.bestStreak    = Math.max(state.stats.bestStreak || 0, state.correctStreak);
      state.stats.highestLevel  = Math.max(state.stats.highestLevel, state.level);

      /* Sonuç mesajı */
      resultMsg.style.color   = '#00ff66';
      resultMsg.innerText     = ['Aferin! +'+gained+'p','Süper! +'+gained+'p','Bravo! +'+gained+'p',
                                  'Harika! +'+gained+'p','Mükemmel! +'+gained+'p'][randInt(0,4)];
      resultMsg.style.opacity = 1;

      /* Level up kontrolü */
      const every = state.levelUpEvery || 6;
      const didLevelUp = state.correctStreak > 0 && state.correctStreak % every === 0;
      if (didLevelUp) {
        state.level = Math.min(99, (state.level || 1) + 1);
        state.stats.highestLevel = Math.max(state.stats.highestLevel, state.level);
        trackEvent('level_up', { level: state.level, score: state.score || 0 });
        /* Konfeti patlat */
        setTimeout(() => { try { spawnConfetti(70); } catch(e){} }, 100);
        /* Level up ses: çıkrıcı arpej */
        try {
          playTone('triangle', 660, 0.12, 0.5);
          setTimeout(() => playTone('triangle', 880, 0.12, 0.5), 120);
          setTimeout(() => playTone('triangle', 1100, 0.2, 0.6), 240);
          setTimeout(() => playTone('triangle', 1320, 0.3, 0.7), 380);
        } catch(e) {}
        /* Level-up tam ekran göster */
        const _lvl = state.level;
        setTimeout(() => {
          try { showLevelUpScreen(_lvl, null); } catch(e) {}
        }, 600);
        /* Günlük görev: level up sayacı */
        try {
          if (!state.stats.dailyLevelUps) state.stats.dailyLevelUps = 0;
          state.stats.dailyLevelUps++;
        } catch(e) {}
      }

      /* Partikül */
      try { spawnParticlesFromElement(submitAnswerBtn, didLevelUp ? 30 : 16); } catch(e) {}

      /* Kombo göstergesi */
      try { showCombo(state.correctStreak); } catch(e) {}

      /* Streak badge */
      try { updateStreakBadge(state.correctStreak); } catch(e) {}

      saveState();
      loadGameUI();
      renderLeaderboard();
      try { renderStats(); } catch(e) {}
      updateMiniInfo();

      /* Online skoru gönder */
      try { pushScoreToWorker(); } catch(e) {}
      trackEvent('correct_answer', { level: state.level || 1, streak: state.correctStreak || 0, score: state.score || 0 });

      /* Her 5 doğruda bir profili buluta kaydet */
      if (state.stats && state.stats.totalCorrect && state.stats.totalCorrect % 5 === 0) {
        try { saveProfileToCloud(); } catch(e) {}
      }

      /* Başarı kontrol */
      try { checkAchievements(); } catch(e) {}

      setTimeout(() => { try { nextQuestion(false); } catch(e) {} }, 900);

    } else {
      /* ── YANLIŞ ── */
      failSound();

      const penalty = Math.max(10, Math.floor((state.level || 1) * 8));
      /* Freeze jokeri aktifse ceza yok */
      if (window._jokerFreezeActive) {
        window._jokerFreezeActive = false;
        showFloatingReward('🧊 Ceza donduruldu!', '#63b3ed');
      } else {
        state.score   = Math.max(0, (state.score || 0) - penalty);
      }
      const board   = getCurrentBoard();
      board[state.player] = state.score;
      setCurrentBoard(board);

      /* Streak sıfırla */
      state.correctStreak = 0;
      updateStreakBadge(0);
      if (state.stats) {
        state.stats.totalWrong      = (state.stats.totalWrong      || 0) + 1;
      try { sessionWrong++; updateSessionStats(); } catch(e) {}
        state.stats.currentNoWrong  = 0;  // mükemmel başarısı için sıfırla
      }

      /* Streak badge gizle */
      try { updateStreakBadge(0); } catch(e) {}

      resultMsg.style.color   = '#ff6b6b';
      resultMsg.innerText     = 'Yanlış! −' + penalty + 'p';
      resultMsg.style.opacity = 1;

      saveState();
      loadGameUI();
      renderLeaderboard();
      updateMiniInfo();

      /* Başarı kontrol (accuracy_90 için) */
      try { checkAchievements(); } catch(e) {}
      trackEvent('wrong_answer', { level: state.level || 1, score: state.score || 0 });

      setTimeout(() => {
        try {
          resultMsg.style.color = '#ffd166';
          resultMsg.innerText   = 'Doğrusu: ' + (Math.round(correctAnswer * 100) / 100);
        } catch(e) {}
      }, 900);

      setTimeout(() => { try { nextQuestion(false); } catch(e) {} }, 2000);
    }
  } catch(err) {
    console.error('checkAnswer kritik hata:', err);
    /* Kurtarma: oyunu dondurmak yerine sonraki soruya geç */
    try { nextQuestion(false); } catch(e) {}
  }
}

/* ── ABSURD GAME ENGINE — AI DESTEKLİ ─────────────── */
let currentAbsurd  = null;
let absurdQueue    = [];

/* Yerel fallback sorular — AI bağlanamayınca kullanılır */
function getLocalFallbackQuestions() {
  var pool = [
    { q: "Bir insanın günde ortalama kaç düşüncesi olur?", choices: ["Yaklaşık 100 🧠", "Yaklaşık 6.000 💭", "Yaklaşık 50.000 🌀", "Tam olarak 1 🤡"], correct: 2, noWrong: false },
    { q: "Hangi hayvan hiç uyumaz?", choices: ["Yunus 🐬", "Karınca 🐜", "Balık 🐟", "Hepsi uyur 😴"], correct: 3, noWrong: false },
    { q: "Uzayda en çok ne kokusu var?", choices: ["Çiçek 🌸", "Kaynak metali / et 🥩", "Hiçbir şey 🌌", "Süt 🥛"], correct: 1, noWrong: false },
    { q: "Bir salyangoz kaç yıl uyuyabilir?", choices: ["1 ay 😪", "6 ay 💤", "3 yıl 😴", "10 yıl 🐌"], correct: 2, noWrong: false },
    { q: "Hangi şehir hem Asya hem Avrupa'da yer alır?", choices: ["Moskova 🇷🇺", "İstanbul 🇹🇷", "Kahire 🇪🇬", "Dubai 🇦🇪"], correct: 1, noWrong: false },
    { q: "Pizza ilk olarak hangi ülkede icat edildi?", choices: ["ABD 🇺🇸", "Fransa 🇫🇷", "İtalya 🇮🇹", "Yunanistan 🇬🇷"], correct: 2, noWrong: false },
    { q: "Rüyasında hiç renk görmeden yaşayan insanlar var mı?", choices: ["Hayır, herkeste renkli 🌈", "Evet, bazı insanlar 🖤", "Sadece körler 👁️", "Rüya renksiz olur mu? 🤔"], correct: 1, noWrong: false },
    { q: "Hangi organ kendi kendini onarabilir?", choices: ["Beyin 🧠", "Kalp ❤️", "Karaciğer 🫁", "Kemik 🦴"], correct: 2, noWrong: false },
    { q: "Dünyanın en kısa savaşı ne kadar sürdü?", choices: ["38 dakika ⚔️", "3 gün 🏴", "1 hafta 🗓️", "2 saat ⏱️"], correct: 0, noWrong: false },
    { q: "Hangisi gerçek bir korku adıdır?", choices: ["Uzun kelime korkusu 📚", "Telefon korkusu 📞", "Sarı renk korkusu 💛", "Hepsi gerçek 😱"], correct: 3, noWrong: false },
    { q: "Bir ahtapotun kaç kalbi var?", choices: ["1 ❤️", "2 💕", "3 🫀", "5 💓"], correct: 2, noWrong: false },
    { q: "Hangi ülkede çatal bıçak kullanımı geleneksel olarak yoktur?", choices: ["Japonya 🇯🇵", "Çin 🇨🇳", "Hindistan 🇮🇳", "Tayland 🇹🇭"], correct: 0, noWrong: false },
    { q: "Rüyada koşmaya çalışıp yavaşlıyorsun. Bu neden olur?", choices: ["Bacakların uyuyor 😂", "Beyin kaslara sinyal göndermiyor 🧠", "Gerçekten yavaşsın 🐌", "Rüya modu 💤"], correct: 1, noWrong: false },
    { q: "Hangi rengi görmek en yorucu?", choices: ["Kırmızı ❤️", "Sarı 💛", "Yeşil 💚", "Mor 💜"], correct: 1, noWrong: false },
    { q: "Dünya üzerinde kaç tür mantar türü var?", choices: ["1.000 🍄", "10.000 🍄🍄", "144.000 🍄🍄🍄", "5.000.000 🤯"], correct: 3, noWrong: false },
  ];
  /* Kullanılmamış olanları filtrele, yoksa hepsini döndür */
  var unused = pool.filter(function(q) { return !absurdSessionUsed.has(q.q); });
  if (unused.length === 0) { absurdSessionUsed.clear(); return pool.slice().sort(function() { return Math.random()-0.5; }); }
  return unused.sort(function() { return Math.random()-0.5; });
}
let absurdFetching = false;
let absurdSessionUsed = new Set();

// 🔗 Cloudflare Worker URL — deploy ettikten sonra buraya yapıştır
// Örnek: 'https://mathgame-absurd.senin-adin.workers.dev'
var WORKER_URL = 'https://mathgame.enesseker2113.workers.dev';

async function fetchAbsurdBatch(){
  if(absurdFetching) return;
  absurdFetching = true;

  const usedList = Array.from(absurdSessionUsed).slice(-30).join('|');

  try {
    const resp = await fetch(WORKER_URL + '/absurd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usedList })
    });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);

    const raw = await resp.text();
    let questions = [];

    /* Parse — worker temiz JSON array döndürüyor ama yine de güvenli parse */
    try {
      const parsed = JSON.parse(raw);
      questions = Array.isArray(parsed) ? parsed : [];
    } catch(e) {
      const match = raw.match(/\[[\s\S]*\]/);
      try { questions = match ? JSON.parse(match[0]) : []; } catch(e2) { questions = []; }
    }

    /* Doğrula ve temizle */
    const valid = questions.filter(function(q) {
      return q && q.q && Array.isArray(q.choices) && q.choices.length === 4 &&
        typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 &&
        !absurdSessionUsed.has(q.q);
    }).map(function(q) {
      return { ...q, choices: q.choices.map(function(c) { return String(c).replace(/^[A-Da-d][\)\.\s]+/,'').trim(); }) };
    });

    if(valid.length > 0){
      absurdQueue.push(...valid);
    } else {
      throw new Error('Geçerli soru yok');
    }
  } catch(e){
    console.warn('⚠️ Absürt fetch hata:', e.message);
  }

  absurdFetching = false;
}

function showAbsurdLoading(){
  document.getElementById('absurdChoices').innerHTML = `
    <div style="text-align:center;padding:32px;color:var(--muted)">
      <div style="font-size:32px;display:inline-block;animation:spin 1s linear infinite">🤪</div>
      <div style="margin-top:12px;font-size:13px">${t('absurd_loading','AI soru üretiyor...')}</div>
    </div>`;
  questionText.innerText = '';
  resultMsg.style.opacity = 0;
}

window.nextAbsurdQuestion = async function nextAbsurdQuestion(){
  // Kuyruk azalıyorsa arka planda yeni batch başlat
  if(absurdQueue.length <= 5 && !absurdFetching) fetchAbsurdBatch();

  // Kuyruk boşsa önce doldur, sonra devam et
  if(absurdQueue.length === 0){
    showAbsurdLoading();
    absurdFetching = false;
    fetchAbsurdBatch();
    // Yüklenene kadar bekle (max 8s — daha kısa!)
    let waited = 0;
    await new Promise(resolve => {
      const check = setInterval(() => {
        waited += 300;
        if(absurdQueue.length > 0 || waited >= 8000){
          clearInterval(check);
          resolve();
        }
      }, 300);
    });
    // AI bağlanamadıysa yerel fallback soruları kullan
    if(absurdQueue.length === 0){
      absurdQueue.push(...getLocalFallbackQuestions());
      showToast('🤪 AI meşgul — yerel sorular kullanılıyor', '#f59e0b');
    }
  }

  const q = absurdQueue.shift();
  absurdSessionUsed.add(q.q);
  currentAbsurd = q;

  questionText.innerText = q.q;
  resultMsg.style.opacity = 0;
  resultMsg.innerText = '';

  const indices = [0,1,2,3];
  for(let i=3;i>0;i--){ const j=randInt(0,i); [indices[i],indices[j]]=[indices[j],indices[i]]; }

  const container = document.getElementById('absurdChoices');
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'absurd-grid';
  var letters = ['A', 'B', 'C', 'D'];
  indices.forEach(function(origIdx, displayIdx) {
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.dataset.orig = origIdx;
    btn.dataset.letter = letters[displayIdx];
    btn.textContent = String(q.choices[origIdx]).replace(/^[A-Da-d][\)\.\s]+/, '').trim();
    btn.addEventListener('click', function() { handleAbsurdAnswer(btn, origIdx, grid); });
    grid.appendChild(btn);
  });
  container.appendChild(grid);
}

function handleAbsurdAnswer(clickedBtn, origIdx, grid){
  const allBtns = grid.querySelectorAll('.choice-btn');
  allBtns.forEach(b => b.disabled = true);

  const isCorrect = origIdx === currentAbsurd.correct;
  const isNoWrong = !!currentAbsurd.noWrong;

  if(isCorrect || isNoWrong){
    clickedBtn.classList.add('correct');
    successSound();
    resultMsg.style.color = '#00ff66';
    resultMsg.innerText = isNoWrong
      ? ['Geçerli görüş! 😄','Mantıklı! 🤔','Bence de! 👍','Kabul 🤝'][randInt(0,3)]
      : ['Doğru! 🎯','Evet efendim! ✅','Harika! 🌟','Bravo! 🎊'][randInt(0,3)];
    resultMsg.style.opacity = 1;
    /* Stats */
    try {
      if (!state.stats) state.stats = {};
      state.stats.absurdPlayed   = (state.stats.absurdPlayed   || 0) + 1;
      state.stats.totalAnswered  = (state.stats.totalAnswered  || 0) + 1;
      state.stats.totalCorrect   = (state.stats.totalCorrect   || 0) + 1;
      saveState();
      checkAchievements();
    } catch(e) {}
    /* Partikül */
    try { spawnParticlesFromElement(clickedBtn, 14); } catch(e) {}
    setTimeout(()=>nextAbsurdQuestion(), 1400);
  } else {
    allBtns.forEach(b => {
      if(parseInt(b.dataset.orig) === currentAbsurd.correct) b.classList.add('correct');
    });
    clickedBtn.classList.add('wrong');
    failSound();
    resultMsg.style.color = '#ff6b6b';
    resultMsg.innerText = ['Yanlış! 😬','Olmadı 😅','Bu değildi 🙈','Tekrar dene!'][randInt(0,3)];
    resultMsg.style.opacity = 1;
    /* Stats */
    try {
      if (!state.stats) state.stats = {};
      state.stats.absurdPlayed  = (state.stats.absurdPlayed  || 0) + 1;
      state.stats.totalAnswered = (state.stats.totalAnswered || 0) + 1;
      state.stats.totalWrong    = (state.stats.totalWrong    || 0) + 1;
      saveState();
    } catch(e) {}
    setTimeout(()=>nextAbsurdQuestion(), 1800);
  }
}

/* ── PAUSE ─────────────────────────────────────────── */
document.getElementById('pauseBtn').addEventListener('click', ()=>{
  clickSound(); pauseOverlay.classList.add('show'); bgLayer.style.filter='blur(4px)';
  trackEvent('game_pause', { score: state.score || 0, level: state.level || 1 });
});
resumeBtn.addEventListener('click', ()=>{
  clickSound(); pauseOverlay.classList.remove('show'); bgLayer.style.filter='';
  trackEvent('game_resume');
});
pauseSettingsBtn.addEventListener('click', ()=>{
  clickSound();
  pauseOverlay.classList.remove('show'); bgLayer.style.filter='';
  openSettingsModal();
});
pauseMenuBtn.addEventListener('click', async ()=>{
  const ok = await showConfirm('Ana Menü', 'Ana menüye dön? Oyun durumu kaydedildi.');
  if(!ok) return;
  clickSound();
  pauseOverlay.classList.remove('show'); bgLayer.style.filter='';
  gameMode = 'math';
  showScreen('menu');
  updateMiniInfo();
});

/* Settings inside old pause panel (still wire up for compat) */
settingSound.addEventListener('change', ()=>{ state.soundOn=settingSound.checked; saveState(); clickSound(); });
settingBtnColor.addEventListener('input', ()=>{ state.btnColor=settingBtnColor.value; document.documentElement.style.setProperty('--neon',state.btnColor); saveState(); clickSound(); });
settingBgColor.addEventListener('input', ()=>{ state.bgColor=settingBgColor.value; document.documentElement.style.setProperty('--bg-mid',state.bgColor); saveState(); clickSound(); });

/* ── MISC ──────────────────────────────────────────── */
document.addEventListener('click', function resumeAudioOnce(){
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
  document.removeEventListener('click',resumeAudioOnce);
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    if(confirmModal.classList.contains('show')){ confirmCancel.click(); return; }
    if(settingsModal.classList.contains('show')){ tryCloseSettings(); return; }
    if(aboutModal.classList.contains('show')){ document.getElementById('closeAboutModal').click(); return; }
    const achModalEl = document.getElementById('achModal');
    if(achModalEl && achModalEl.classList.contains('show')){ closeModal(achModalEl); clickSound(); return; }
    const achPopupEl = document.getElementById('achPopup');
    if(achPopupEl && achPopupEl.classList.contains('show')){ closeModal(achPopupEl); clickSound(); return; }
    if(pauseOverlay.classList.contains('show')){ resumeBtn.click(); }
    else if(gameArea.style.display!=='none'){ document.getElementById('pauseBtn').click(); }
  }
});
window.addEventListener('beforeunload', function() { try { saveState(); } catch(e) {} });
/* Mobil için — beforeunload her zaman çalışmaz */
window.addEventListener('pagehide', function() { try { saveState(); } catch(e) {} });
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') { try { saveState(); } catch(e) {} }
});
} catch(evErr) { console.error('❌ Event listener hata:', evErr.message, evErr.stack); }

