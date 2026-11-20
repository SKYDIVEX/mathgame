/* ══ MathGame · js/auth/session-login-pin.js ══ (index.html'de sırayla yüklenir) */
/* ── Online Ping Sistemi ── */
var _onlinePingInterval = null;

function startOnlinePing() {
  if (!authUser || !authUser.token) return;
  sendOnlinePing();
  if (_onlinePingInterval) clearInterval(_onlinePingInterval);
  _onlinePingInterval = setInterval(sendOnlinePing, 60000); /* Her 60 saniyede bir */
}

function stopOnlinePing() {
  if (_onlinePingInterval) { clearInterval(_onlinePingInterval); _onlinePingInterval = null; }
}

async function sendOnlinePing() {
  if (!authUser || !authUser.token) return;
  var page = document.getElementById('gameArea') && document.getElementById('gameArea').style.display !== 'none' ? 'game' : 'menu';
  try {
    await workerPost('online-ping', { token: authUser.token, page: page });
  } catch(e) {}
}

/* Profildeki online durumu göster */
async function loadOnlineStatusForProfile(targetUid) {
  if (!targetUid) return;
  try {
    var r = await workerPost('online-status', { targetUid: targetUid });
    var el = document.getElementById('pubOnlineStatus');
    if (!el) return;
    if (r && r.isOnline) {
      el.innerHTML = '<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;color:#00ff88">🟢 Çevrimiçi</span>';
    } else if (r && r.lastSeen) {
      var diff = Date.now() - r.lastSeen;
      var diffMin = Math.floor(diff / 60000);
      var diffStr = diffMin < 60 ? diffMin + ' dk önce' : Math.floor(diffMin / 60) + ' sa önce';
      el.innerHTML = '<span style="display:inline-flex;align-items:center;gap:5px;background:var(--glass);border:1px solid var(--border);border-radius:20px;padding:3px 10px;font-size:11px;color:var(--muted)">⚫ Son görülme: ' + diffStr + '</span>';
    } else {
      el.innerHTML = '<span style="font-size:11px;color:var(--muted)">⚫ Çevrimdışı</span>';
    }
  } catch(e) {}
}


/* ══════════════════════════════════════════════════════
   DISCORD SESSION — /me otomatik profil kontrolü
   Sayfa yüklenince localStorage'daki discord token
   ile worker /me endpoint'ini çağırır.
   ══════════════════════════════════════════════════════ */
async function checkDiscordSession() {
  var token = null;
  try { token = localStorage.getItem('mathgame_discord_token'); } catch(e) {}
  if (!token) return;

  try {
    var resp = await fetch(WORKER_URL + '/me', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    if (!resp.ok) {
      /* Token geçersiz — temizle */
      try { localStorage.removeItem('mathgame_discord_token'); } catch(e) {}
      return;
    }
    var data = await resp.json();
    if (data && data.ok && data.discordId) {
      /* authUser'ı Discord bilgileriyle güncelle */
      if (authUser) {
        authUser.discordId       = data.discordId;
        authUser.discordUsername = data.name;
        authUser.discordAvatar   = data.avatar;
      }
      /* Discord bağlı etiketi güncelle */
      var lbl = document.getElementById('discordConnectLabel');
      if (lbl) lbl.textContent = '✅ ' + data.name + ' bağlı';
    }
  } catch(e) {
    console.warn('[/me] kontrol başarısız:', e.message);
  }
}

/* ── unlockAchievement — başarım aç + worker'a bildir ─────────
   Oyun içinden çağır: unlockAchievement('ilk_dogru_cevap')
   ─────────────────────────────────────────────────────────── */
async function unlockAchievement(achievementName) {
  var token = null;
  try { token = localStorage.getItem('mathgame_discord_token'); } catch(e) {}
  if (!token) return;  /* Discord bağlı değilse sessizce geç */

  try {
    var resp = await fetch(WORKER_URL + '/achievement/unlock', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token: token, achievement_name: achievementName }),
    });
    var data = await resp.json();
    if (data && data.ok && !data.alreadyHad) {
      showToast('🏅 Başarım kazanıldı: ' + achievementName, '#ffd700');
    }
  } catch(e) {
    console.warn('[achievement/unlock]', e.message);
  }
}

/* ══════════════════════════════════════════════════════
   BETA ŞİFRE KONTROLÜ
   ══════════════════════════════════════════════════════ */
window.addEventListener('load', function() {
  /* Discord session kontrolü — 1sn gecikmeyle */
  setTimeout(function() { try { checkDiscordSession(); } catch(e) {} }, 1000);
  try {
    var raw = localStorage.getItem('mathgame_auth_v1');
    if (raw) {
      var saved = JSON.parse(raw);
      if (saved && saved.uid && saved.name) {
        /* Firebase onAuthStateChanged zaten halledecek — 2sn fallback */
        setTimeout(function() {
          if (authUser) { return; } /* Firebase halletti */
          authUser = saved;
          loadState(saved.uid);
          state.player = saved.name;
          updateProfileBtn();
          updateAllScoreDisplays();
          updateWallet();
          showScreen('menu');
          refreshMenuPanels();
          saveState();
          /* Günlük ödül — fallback auth sonrası da tetikle */
          setTimeout(function() { try { checkDailyLogin(); } catch(e) {} }, 1500);
        }, 2000);
        return; /* Auth kaydı var — openAuthModal çağırma */
      }
    }
  } catch(e) {}
  /* Auth kaydı yok — 500ms bekle, hala auth yoksa giriş ekranı */
  setTimeout(function() {
    if (authUser) { return; } /* onAuthStateChanged halletti */
    try { openAuthModal(); } catch(e) {}
  }, 500);
});

/* ══════════════════════════════════════════════════════
   GİRİŞ SEÇİM EKRANI
   ══════════════════════════════════════════════════════ */

function showLoginChoice() {
  /* loginChoiceScreen kaldırıldı — direkt authModal açılır */
  if (!isOnlineMode) {
    /* Lokal modda Google butonu gizle */
    var gb = document.getElementById('authGoogleBtn');
    if (gb) { gb.style.display = 'none'; }
  }
  openAuthModal();
}

function hideLoginChoice(cb) {
  /* loginChoiceScreen yok — direkt callback */
  closeModal(document.getElementById('authModal'));
  if (cb) { cb(); }
}

/* loginChoiceScreen event listener'ları kaldırıldı */


function switchAuthTab(tab) {
  var tabLogin    = document.getElementById('authTabLogin');
  var tabRegister = document.getElementById('authTabRegister');
  var tabPin      = document.getElementById('authTabPin');
  var pinSection  = document.getElementById('authPinSection');
  var emailInput  = document.getElementById('authEmail');
  var nameField   = document.getElementById('authDisplayName');
  var passField   = document.getElementById('authPassword');
  var submitBtn   = document.getElementById('authSubmitBtn');
  var googleBtn   = document.getElementById('authGoogleBtn');
  var skipBtn     = document.getElementById('authSkipBtn');
  var divider     = document.querySelector('.auth-divider');

  /* Önce hepsini sıfırla */
  if (tabLogin)    { tabLogin.classList.remove('active'); }
  if (tabRegister) { tabRegister.classList.remove('active'); }
  if (tabPin)      { tabPin.classList.remove('active'); }
  if (pinSection)  { pinSection.style.display = 'none'; }
  if (emailInput)  { emailInput.style.display = ''; }
  if (nameField)   { nameField.style.display = 'none'; }
  if (passField)   { passField.style.display = ''; }
  if (submitBtn)   { submitBtn.style.display = ''; }
  if (googleBtn)   { googleBtn.style.display = ''; }
  if (skipBtn)     { skipBtn.style.display = ''; }
  if (divider)     { divider.style.display = ''; }

  if (tab === 'login') {
    if (tabLogin)  { tabLogin.classList.add('active'); }
    if (submitBtn) { submitBtn.textContent = 'Giris Yap'; }
  } else if (tab === 'register') {
    if (tabRegister) { tabRegister.classList.add('active'); }
    if (nameField)   { nameField.style.display = ''; }
    if (submitBtn)   { submitBtn.textContent = 'Kayit Ol'; }
  } else if (tab === 'pin') {
    if (tabPin)     { tabPin.classList.add('active'); }
    if (pinSection) { pinSection.style.display = 'flex'; pinSection.style.flexDirection = 'column'; pinSection.style.gap = '8px'; }
    if (emailInput) { emailInput.style.display = 'none'; }
    if (passField)  { passField.style.display = 'none'; }
    if (submitBtn)  { submitBtn.style.display = 'none'; }
    if (googleBtn)  { googleBtn.style.display = 'none'; }
    if (skipBtn)    { skipBtn.style.display = 'none'; }
    if (divider)    { divider.style.display = 'none'; }
  }
  try { clearAuthError(); } catch(e) {}
}


async function handleGoogleLogin() {
  if (!fbAuth) { showToast('Google girişi şu an kullanılamıyor', '#ef4444'); return; }
  try {
    var provider = new firebase.auth.GoogleAuthProvider();
    var result = await fbAuth.signInWithPopup(provider);
    if (!result || !result.user) { return; }
    var user = result.user;
    var name = sanitizeUsername(user.displayName || user.email.split('@')[0]);
    var workerToken  = null;
    var workerHasPin = false;
    try {
      var fbRes = await workerPost('firebase-login', { uid: user.uid, name: name, email: user.email || '' });
      if (fbRes && fbRes.ok) {
        workerToken  = fbRes.token;
        workerHasPin = fbRes.hasPin === true;
      } else if (fbRes && fbRes.error && fbRes.error.indexOf('takma ad') !== -1) {
        /* Takma ad çakışması */
        var suggestion = fbRes.suggestion || (name + '_' + user.uid.slice(0,4));
        showToast('⚠️ "' + name + '" takma adı alınmış. Senin adın: ' + suggestion, '#f59e0b');
        /* Öneri isimle tekrar dene */
        var retry = await workerPost('firebase-login', { uid: user.uid, name: suggestion, email: user.email || '' });
        if (retry && retry.ok) {
          workerToken  = retry.token;
          workerHasPin = retry.hasPin === true;
          name = suggestion;
        }
      }
    } catch(e) { console.warn('Worker firebase-login hata:', e); }
    saveAuth({ uid: user.uid, name: name, email: user.email || '', provider: 'google', token: workerToken || null });
    loadState(user.uid);
    state.player = name;
    var pl = document.getElementById('playerLabel');
    if (pl) { pl.innerText = name; }
    closeModal(document.getElementById('authModal'));
    updateProfileBtn();
    showScreen('menu');
    refreshMenuPanels();
    showToast('✅ Hoş geldin, ' + name + '!');
    trackEvent('login', { method: 'pin' });
    try { stopSessionTimer(); startSessionTimer(); } catch(e) {}
    try { await syncOnlineScore(); } catch(e) {}
    try { await loadProfileFromCloud(); } catch(e) {}
    try { startUnreadListener(); } catch(e) {}
    try { startOnlinePing(); } catch(e) {}
    if (workerToken && !workerHasPin) {
      var pinSkipped = localStorage.getItem('mathgame_pin_skipped_' + user.uid);
      if (!pinSkipped) {
        setTimeout(function() { openPinModal('set'); }, 1000);
      }
    }
  } catch(e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      showToast('Google girişi başarısız: ' + (e.message || e.code), '#ef4444');
      try { showAuthError('Google girişi başarısız: ' + (e.message || e.code)); } catch(ex) {}
    }
  }
}

/* ══════════════════════════════════════════════════════
   PIN SİSTEMİ
   ══════════════════════════════════════════════════════ */

var _pinMode    = 'set';   /* 'set' | 'confirm' | 'login' */
var _pinBuffer  = '';
var _pinFirst   = '';      /* set mode'da ilk girilen PIN */
var _pinStep    = 1;       /* set mode: 1=gir, 2=tekrarla */

function openPinModal(mode) {
  _pinMode   = mode;
  _pinBuffer = '';
  _pinFirst  = '';
  _pinStep   = 1;

  var modal = document.getElementById('pinModal');
  var title = document.getElementById('pinTitle');
  var sub   = document.getElementById('pinSub');
  var skip  = document.getElementById('pinSkipBtn');
  var msg   = document.getElementById('pinMsg');

  if (msg)   { msg.textContent = ''; msg.style.color = ''; }
  if (modal) { modal.classList.add('show'); }

  if (mode === 'set') {
    if (title) { title.textContent = 'PIN Belirle'; }
    if (sub)   { sub.textContent = 'Google hesabına erişim olmadığında bu PIN ile girebilirsin.'; }
    if (skip)  { skip.style.display = ''; }
  } else if (mode === 'login') {
    if (title) { title.textContent = 'PIN ile Giriş'; }
    if (sub)   { sub.textContent = 'Hesabina erisim icin PIN gir.'; }
    if (skip)  { skip.style.display = 'none'; }
  }

  pinUpdateDots();
}

function closePinModal() {
  var modal = document.getElementById('pinModal');
  if (modal) { modal.classList.remove('show'); }
  _pinBuffer = '';
  _pinFirst  = '';
  _pinStep   = 1;
}

function pinUpdateDots() {
  for (var i = 0; i < 4; i++) {
    var dot = document.getElementById('pd' + i);
    if (dot) {
      if (i < _pinBuffer.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    }
  }
}

function pinPress(digit) {
  if (_pinBuffer.length >= 4) { return; }
  _pinBuffer += digit;
  pinUpdateDots();
  if (_pinBuffer.length === 4) {
    setTimeout(pinConfirm, 200);
  }
}

function pinDel() {
  if (_pinBuffer.length > 0) {
    _pinBuffer = _pinBuffer.slice(0, _pinBuffer.length - 1);
    pinUpdateDots();
  }
}

function pinSkip() {
  closePinModal();
  /* Bir daha sorma — kullanıcı bilerek atladı */
  if (authUser && authUser.uid) {
    localStorage.setItem('mathgame_pin_skipped_' + authUser.uid, '1');
  }
  showToast('PIN atlandı — profil ayarlarından ekleyebilirsin', '#f59e0b');
}

async function pinConfirm() {
  var msg = document.getElementById('pinMsg');

  if (_pinMode === 'set') {
    if (_pinStep === 1) {
      _pinFirst  = _pinBuffer;
      _pinBuffer = '';
      _pinStep   = 2;
      var title = document.getElementById('pinTitle');
      if (title) { title.textContent = 'PIN Tekrarla'; }
      if (msg)   { msg.textContent = 'PIN bir kez daha gir'; msg.style.color = '#9fb3b0'; }
      pinUpdateDots();
    } else {
      if (_pinBuffer !== _pinFirst) {
        _pinBuffer = '';
        _pinFirst  = '';
        _pinStep   = 1;
        var title = document.getElementById('pinTitle');
        if (title) { title.textContent = 'PIN Belirle'; }
        if (msg)   { msg.textContent = 'PIN eşleşmedi, tekrar dene'; msg.style.color = '#ef4444'; }
        pinUpdateDots();
        return;
      }
      /* PIN eşleşti — kaydet */
      if (msg)   { msg.textContent = '⏳ Kaydediliyor...'; msg.style.color = '#9fb3b0'; }
      try {
        var result = await workerPost('set-pin', { token: authUser.token, pin: _pinBuffer });
        if (result && result.ok) {
          if (msg) { msg.textContent = '✅ PIN ayarlandı!'; msg.style.color = '#00ff66'; }
          /* Artık PIN var — atlandı flag'ini temizle */
          if (authUser && authUser.uid) {
            localStorage.removeItem('mathgame_pin_skipped_' + authUser.uid);
          }
          setTimeout(closePinModal, 1200);
        } else {
          if (msg) { msg.textContent = '❌ ' + (result ? result.error : 'Hata'); msg.style.color = '#ef4444'; }
          _pinBuffer = '';
          pinUpdateDots();
        }
      } catch(e) {
        if (msg) { msg.textContent = '❌ Bağlantı hatası'; msg.style.color = '#ef4444'; }
        _pinBuffer = '';
        pinUpdateDots();
      }
    }
  }
}

/* ── auth modal PIN sekmesi ── */
document.addEventListener('DOMContentLoaded', function() {
  /* PIN sekme butonu */
  var tabPin = document.getElementById('authTabPin');
  var tabLogin = document.getElementById('authTabLogin');
  var tabReg = document.getElementById('authTabRegister');
  var pinSection = document.getElementById('authPinSection');
  var emailInput = document.getElementById('authEmail');
  var nameInput  = document.getElementById('authDisplayName');
  var passInput  = document.getElementById('authPassword');
  var submitBtn  = document.getElementById('authSubmitBtn');
  var googleBtn  = document.getElementById('authGoogleBtn');
  var skipBtn    = document.getElementById('authSkipBtn');
  var divider    = document.querySelector('.auth-divider');

  if (tabPin) {
    tabPin.addEventListener('click', function() {
      /* switchAuthTab — DOMContentLoaded içinde tanımlı, PIN sekmesini seç */
      if (typeof switchAuthTab === 'function') {
        switchAuthTab('pin');
      }
    });
  }

  /* PIN giriş butonu */
  var pinLoginBtn = document.getElementById('pinLoginBtn');
  if (pinLoginBtn) {
    pinLoginBtn.addEventListener('click', async function() {
      var nameVal  = document.getElementById('pinLoginName') ? document.getElementById('pinLoginName').value.trim() : '';
      var pinVal   = document.getElementById('pinLoginPin')  ? document.getElementById('pinLoginPin').value.trim()  : '';
      var errEl    = document.getElementById('authPinError');

      if (!nameVal) {
        if (errEl) { errEl.textContent = 'Kullanıcı adı gir'; errEl.classList.add('show'); }
        return;
      }
      if (!pinVal || pinVal.length < 4) {
        if (errEl) { errEl.textContent = 'PIN en az 4 hane'; errEl.classList.add('show'); }
        return;
      }

      if (errEl) { errEl.textContent = '⏳ Giriş yapılıyor...'; errEl.classList.add('show'); errEl.style.color = '#9fb3b0'; }

      try {
        var result = await workerPost('pin-login', { username: nameVal, pin: pinVal });

        if (result && result.ok) {
          /* Giriş başarılı */
          saveAuth({ uid: result.uid, name: result.name, token: result.token, provider: result.provider || 'google', email: '' });
          loadState(result.uid);
          state.player = result.name;
          closeModal(document.getElementById('authModal'));
          updateProfileBtn();
          showScreen('menu');
          refreshMenuPanels();
          saveState();
          showToast('✅ PIN ile giriş yapıldı, hoş geldin ' + result.name + '!');
          try { await syncOnlineScore(); } catch(e) {}
          try { await loadProfileFromCloud(); } catch(e) {}
        } else {
          if (errEl) {
            errEl.textContent = '❌ ' + (result ? result.error : 'Hata');
            errEl.classList.add('show');
            errEl.style.color = '#ef4444';
          }
        }
      } catch(e) {
        if (errEl) { errEl.textContent = '❌ Bağlantı hatası'; errEl.classList.add('show'); errEl.style.color = '#ef4444'; }
      }
    });
  }

  /* PIN giriş alanında Enter */
  var pinLoginPinEl = document.getElementById('pinLoginPin');
  if (pinLoginPinEl) {
    pinLoginPinEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var btn = document.getElementById('pinLoginBtn');
        if (btn) { btn.click(); }
      }
    });
  }
});

/* Profil modalına PIN değiştir butonu */
