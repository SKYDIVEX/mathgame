/* ══════════════════════════════════════════════════════
   MathGame v3.5 — Yerel Auth Sistemi (Firebase YOK)
   Tüm veriler localStorage'da tutulur.
   ══════════════════════════════════════════════════════ */

/* Firebase stub'ları — kodun geri kalanı çökmemesi için */
let fbApp   = null;
let fbAuth  = null;
let fbDB    = null;
var fbReady = false;

var isOnlineMode = (location.protocol === 'https:' || location.protocol === 'http:');

const AUTH_KEY = 'mathgame_auth_v1';
const USERS_DB_KEY = 'mathgame_users_db';

/* ── Yerel kullanıcı veritabanı ──────────────────────── */
function _getUsersDB() {
  try { return JSON.parse(localStorage.getItem(USERS_DB_KEY)) || {}; }
  catch(e) { return {}; }
}
function _saveUsersDB(db) {
  try { localStorage.setItem(USERS_DB_KEY, JSON.stringify(db)); } catch(e) {}
}

function _generateUID() {
  return 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function _generateToken(uid) {
  return 'tok_' + uid + '_' + Date.now().toString(36);
}

/* ── Auth CRUD ───────────────────────────────────────── */
function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) authUser = JSON.parse(raw);
  } catch(e) { authUser = null; }
}

function saveAuth(user) {
  authUser = user;
  if (user && user.uid) {
    localStorage.setItem(CURRENT_UID_KEY, user.uid);
  }
  try {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_KEY);
  } catch(e) {}
}

function clearAuth() {
  saveAuth(null);
  updateProfileBtn();
}

/* ── Kullanıcı adı temizle ───────────────────────────── */
const BAD_WORDS_CLIENT = ['fuck','shit','orospu','sik','amk','piç','pezevenk','yarrak','nigger'];
function sanitizeUsername(name) {
  if (!name) return 'Oyuncu';
  let clean = name.trim().slice(0, 20);
  if (BAD_WORDS_CLIENT.some(w => clean.toLowerCase().includes(w)))
    return 'Oyuncu_' + Math.floor(Math.random() * 9999);
  return clean;
}

/* ── Worker API — Offline modda mock yanıt döner ─────── */
async function workerPost(endpoint, data) {
  /* Online modda gerçek Worker'a istek at */
  if (isOnlineMode && WORKER_URL) {
    try {
      const resp = await fetch(WORKER_URL + '/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const text = await resp.text();
      try {
        return JSON.parse(text);
      } catch(e) {
        if (text.includes('limit exceeded') || text.includes('KV put')) {
          return { error: 'KV limit doldu', kvLimit: true };
        }
        return { error: 'Sunucu hatası (' + resp.status + ')' };
      }
    } catch(e) {
      /* Bağlantı hatası — offline fallback */
    }
  }
  /* Offline mock yanıtlar */
  return _mockWorkerResponse(endpoint, data);
}

async function workerGet(endpoint, params) {
  if (isOnlineMode && WORKER_URL) {
    if (!params) { params = {}; }
    var parts = [];
    Object.keys(params).forEach(function(k) {
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    });
    var qs  = parts.join('&');
    var url = WORKER_URL + '/' + endpoint + (qs ? '?' + qs : '');
    try {
      var resp = await fetch(url);
      var text = await resp.text();
      try { return JSON.parse(text); }
      catch(e) { return null; }
    } catch(e) { /* offline fallback */ }
  }
  return _mockWorkerResponse(endpoint, params || {});
}

/* ── Offline mock yanıtlar ───────────────────────────── */
function _mockWorkerResponse(endpoint, data) {
  switch(endpoint) {
    case 'firebase-login':
    case 'pin-login':
      return { ok: true, token: _generateToken(data.uid || 'mock'), name: data.name || data.username || 'Oyuncu' };
    case 'check-name':
      return { ok: true, taken: false };
    case 'update-name':
    case 'set-pin':
    case 'daily-reward-claim':
    case 'request':
    case 'admin/ban':
    case 'admin/set-score':
      return { ok: true };
    case 'sync-score':
    case 'save-profile':
    case 'load-profile':
      return { ok: true, data: {} };
    case 'leaderboard':
      return { ok: true, entries: [] };
    case 'clan/search':
    case 'clan/info':
    case 'clan/leaderboard':
      return { ok: true, clans: [], clan: null };
    case 'clan/tournament/info':
      return { ok: true, tournament: null };
    default:
      return { ok: true };
  }
}

/* ── Auth Modal kontrol ──────────────────────────────── */
function openAuthModal() {
  const am = document.getElementById('authModal');
  if (am) am.classList.add('show');
  clearAuthError();
  /* Google butonu gizle (Firebase yok) */
  var gb = document.getElementById('authGoogleBtn');
  if (gb) gb.style.display = 'none';
  /* Divider gizle */
  var dividers = document.querySelectorAll('#authCard > div');
  dividers.forEach(function(d) {
    if (d.textContent.includes('veya e-posta ile')) d.style.display = 'none';
  });
}

/* ── Profil butonu durumunu garantile ──────────────────── */
var _pbGuardCount = 0;
var _pbGuardTimer = setInterval(function() {
  _pbGuardCount++;
  if (_pbGuardCount > 10) { clearInterval(_pbGuardTimer); return; }
  var loginH = document.getElementById('loginBtnHeader');
  var profBtn = document.getElementById('profileBtn');
  if (authUser) {
    if (loginH && loginH.style.display !== 'none') loginH.style.display = 'none';
    if (profBtn && profBtn.style.display === 'none') profBtn.style.display = 'flex';
  }
}, 300);

/* ── DOMContentLoaded — Event listener'lar ────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Profil Modal Eventleri ── */
  document.getElementById('pmCloseBtn')?.addEventListener('click', closeProfileModal);

  document.getElementById('profileModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeProfileModal();
  });

  /* Kaydet butonu */
  document.getElementById('pmSaveBtn')?.addEventListener('click', async function() {
    var bioEl = document.getElementById('pmBio');
    if (bioEl) {
      if (!state.profile) { state.profile = {}; }
      state.profile.bio = bioEl.value.trim();
    }
    if (state._selectedAvatar) {
      if (!state.profile) { state.profile = {}; }
      state.profile.avatar = state._selectedAvatar;
    }
    if (!authUser) return;
    const msg      = document.getElementById('pmMsg');
    const newName  = (document.getElementById('pmDisplayName')?.value || '').trim();

    if (!newName) { if(msg){msg.textContent='İsim boş olamaz';msg.style.color='#ef4444';} return; }
    if(msg){ msg.textContent='Kaydediliyor...'; msg.style.color='#9fb3b0'; }

    try {
      const sanitized = sanitizeUsername(newName);

      /* Yerel DB'de isim güncelle */
      var db = _getUsersDB();
      if (db[authUser.uid]) {
        db[authUser.uid].name = sanitized;
        _saveUsersDB(db);
      }

      authUser.name = sanitized;
      saveAuth(authUser);
      state.player = sanitized;
      const pl = document.getElementById('playerLabel');
      if(pl) pl.innerText = sanitized;
      updateProfileBtn();

      if(msg){msg.textContent='✅ Kaydedildi!';msg.style.color='#00ff66';}
      const pmNm = document.getElementById('pmName');
      if(pmNm) pmNm.textContent = sanitized;
      const pmAv = document.getElementById('pmAvatar');
      if(pmAv && sanitized.length > 0) pmAv.textContent = sanitized[0].toUpperCase();
      setTimeout(() => { if(msg) msg.textContent=''; }, 2500);
      saveState();
    } catch(e) {
      if(msg){msg.textContent='Hata: '+ (e.message || 'Bilinmeyen hata');msg.style.color='#ef4444';}
    }
  });

  /* Admin paneli butonu */
  var pmPinBtn = document.getElementById('pmPinBtn');
  if (pmPinBtn) {
    pmPinBtn.addEventListener('click', function() {
      closeProfileModal();
      setTimeout(function() { openPinModal('set'); }, 200);
    });
  }

  var pmAdminBtnEl = document.getElementById('pmAdminBtn');
  if (pmAdminBtnEl) {
    pmAdminBtnEl.addEventListener('click', function() {
      closeProfileModal();
      setTimeout(function() { openAdminPanel(); }, 200);
    });
  }

  /* İstek / Şikayet Gönder butonu */
  document.getElementById('pmRequestBtn')?.addEventListener('click', function() {
    closeProfileModal();
    const modal = document.getElementById('requestModal');
    if (modal) modal.style.display = 'flex';
  });

  /* İstek modal kapat */
  document.getElementById('closeRequestModal')?.addEventListener('click', function() {
    var rm = document.getElementById('requestModal');
    if (rm) rm.style.display = 'none';
  });
  document.getElementById('requestModal')?.addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });

  /* İstek gönder */
  document.getElementById('reqSendBtn')?.addEventListener('click', async function() {
    if (!authUser) { showToast('Önce giriş yap', '#ef4444'); return; }
    const type    = document.getElementById('reqType')?.value;
    const message = (document.getElementById('reqMessage')?.value || '').trim();
    const msg     = document.getElementById('reqMsg');
    if (!message || message.length < 5) { if(msg){msg.textContent='Mesaj çok kısa';msg.style.color='#ef4444';} return; }
    if(msg){msg.textContent='⏳ Gönderiliyor...';msg.style.color='#9fb3b0';}
    try {
      const r = await workerPost('request', { token: authUser.token, type, message });
      if (r?.ok) {
        if(msg){msg.textContent='✅ İstek gönderildi!';msg.style.color='#00ff66';}
        var reqMsg = document.getElementById('reqMessage');
        if (reqMsg) reqMsg.value = '';
        setTimeout(() => { if(msg) msg.textContent=''; }, 3000);
      } else {
        if(msg){msg.textContent='❌ '+(r?.error||'Hata');msg.style.color='#ef4444';}
      }
    } catch(e) {
      if(msg){msg.textContent='❌ Bağlantı hatası';msg.style.color='#ef4444';}
    }
  });

  /* Şifre sıfırlama */
  document.getElementById('resetRequestBtn')?.addEventListener('click', async function() {
    var msg = document.getElementById('resetMsg');
    if(msg){msg.textContent='Bu özellik yerel modda kullanılamaz';msg.style.color='#f59e0b';}
  });
  document.getElementById('resetConfirmBtn')?.addEventListener('click', async function() {
    var msg = document.getElementById('resetMsg');
    if(msg){msg.textContent='Bu özellik yerel modda kullanılamaz';msg.style.color='#f59e0b';}
  });

  /* Çıkış butonu */
  document.getElementById('pmLogoutBtn')?.addEventListener('click', async function() {
    closeProfileModal();
    clearAuth();
    authUser = null;
    state.player = null;
    state.score  = 0;
    saveState();
    if (typeof _adminChecked !== 'undefined') _adminChecked = false;
    if (typeof _adminVerified !== 'undefined') _adminVerified = false;
    showToast('👋 Çıkış yapıldı');
    const pb = document.getElementById('profileBtn');
    if (pb) pb.style.display = 'none';
    showLoginChoice();
  });

  /* Sekme event'leri */
  const tabLogin    = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');
  const submitBtn   = document.getElementById('authSubmitBtn');

  if (tabLogin)    { tabLogin.addEventListener('click',    function() { switchAuthTab('login'); }); }
  if (tabRegister) { tabRegister.addEventListener('click', function() { switchAuthTab('register'); }); }

  if (submitBtn) submitBtn.addEventListener('click', handleEmailAuth);
  ['authEmail','authDisplayName','authPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleEmailAuth(); });
  });

  /* Google — devre dışı */
  const googleBtn = document.getElementById('authGoogleBtn');
  if (googleBtn) {
    googleBtn.style.display = 'none';
    googleBtn.addEventListener('click', function() {
      showToast('Google girişi bu sürümde kullanılamıyor', '#f59e0b');
    });
  }

  /* Misafir */
  const skipBtn = document.getElementById('authSkipBtn');
  if (skipBtn) skipBtn.addEventListener('click', () => {
    var guestUid = _generateUID();
    var guestName = 'Misafir_' + Math.floor(Math.random()*9999);
    saveAuth({ uid: guestUid, name: guestName, email: '', provider: 'guest', token: _generateToken(guestUid) });
    loadState(guestUid);
    state.player = guestName;
    closeModal(document.getElementById('authModal'));
    updateProfileBtn();
    showScreen('menu');
    refreshMenuPanels();
    saveState();
    showToast('👤 Misafir olarak girdin — skorlar bu cihazda saklanır', '#f59e0b');
  });

  /* Profil butonu */
  const profileBtnEl = document.getElementById('profileBtn');
  if (profileBtnEl) profileBtnEl.addEventListener('click', () => {
    if (authUser) openProfileModal();
    else openAuthModal();
  });

  /* LB sekme */
  const lbLocal  = document.getElementById('lbTabLocal');
  const lbOnline = document.getElementById('lbTabOnline');
  if (lbLocal) lbLocal.addEventListener('click', function() {
    lbLocal.classList.add('active');
    if (lbOnline) lbOnline.classList.remove('active');
    var lb = document.getElementById('leaderboard');
    if (lb) lb.style.display = '';
    var olb = document.getElementById('onlineLbEl');
    if (olb) olb.style.display = 'none';
    var opsRow = document.getElementById('lbOpsRow');
    if (opsRow) opsRow.style.display = 'flex';
    try { stopLbAutoRefresh(); } catch(e) {}
    renderLeaderboard();
  });
  if (lbOnline) lbOnline.addEventListener('click', function() {
    lbOnline.classList.add('active');
    if (lbLocal) lbLocal.classList.remove('active');
    var lb = document.getElementById('leaderboard');
    if (lb) lb.style.display = 'none';
    var olb = document.getElementById('onlineLbEl');
    if (olb) olb.style.display = '';
    var opsRow = document.getElementById('lbOpsRow');
    if (opsRow) opsRow.style.display = 'flex';
    try { startLbAutoRefresh(); } catch(e) {}
  });
});

/* ── Auth helper fonksiyonlar ────────────────────────── */
function clearAuthError() {
  const el = document.getElementById('authError');
  if (el) { el.textContent = ''; el.classList.remove('show'); }
}
function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

function getFirebaseErrorMsg(code) {
  return 'Hata: ' + (code || 'bilinmeyen');
}

/* ── Yerel E-posta/Şifre Auth ────────────────────────── */
async function handleEmailAuth() {
  var tabReg = document.getElementById('authTabRegister');
  var isRegister = tabReg ? tabReg.classList.contains('active') : false;
  var email       = (document.getElementById('authEmail')?.value || '').trim();
  var displayName = (document.getElementById('authDisplayName')?.value || '').trim();
  var password    = (document.getElementById('authPassword')?.value || '');
  clearAuthError();

  if (!email)    { showAuthError('E-posta adresi gerekli'); return; }
  if (!password) { showAuthError('Şifre gerekli'); return; }
  if (password.length < 6) { showAuthError('Şifre en az 6 karakter olmalı'); return; }
  if (isRegister && displayName.length < 2) { showAuthError('Kullanıcı adı en az 2 karakter olmalı'); return; }

  var btn = document.getElementById('authSubmitBtn');
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

  try {
    var db = _getUsersDB();

    if (isRegister) {
      /* E-posta zaten var mı? */
      var existing = Object.values(db).find(u => u.email === email);
      if (existing) {
        showAuthError('Bu e-posta zaten kayıtlı.');
        if (btn) { btn.textContent = origText; btn.disabled = false; }
        return;
      }
      /* Yeni kullanıcı oluştur */
      var uid = _generateUID();
      var name = sanitizeUsername(displayName || email.split('@')[0]);
      var token = _generateToken(uid);
      db[uid] = { uid: uid, name: name, email: email, password: password, provider: 'email', createdAt: Date.now() };
      _saveUsersDB(db);

      saveAuth({ uid: uid, name: name, email: email, provider: 'email', token: token });
      loadState(uid);
      state.player = name;
      closeModal(document.getElementById('authModal'));
      updateProfileBtn();
      showScreen('menu');
      refreshMenuPanels();
      saveState();
      showToast('✅ Hoş geldin, ' + name + '!');
      try { trackEvent('login', { method: 'email-register' }); } catch(e) {}

    } else {
      /* Giriş yap */
      var user = Object.values(db).find(u => u.email === email);
      if (!user) {
        showAuthError('Bu e-posta ile kayıtlı hesap bulunamadı.');
        if (btn) { btn.textContent = origText; btn.disabled = false; }
        return;
      }
      if (user.password !== password) {
        showAuthError('Şifre yanlış.');
        if (btn) { btn.textContent = origText; btn.disabled = false; }
        return;
      }
      var token = _generateToken(user.uid);
      saveAuth({ uid: user.uid, name: user.name, email: user.email, provider: 'email', token: token });
      loadState(user.uid);
      state.player = user.name;
      closeModal(document.getElementById('authModal'));
      updateProfileBtn();
      showScreen('menu');
      refreshMenuPanels();
      saveState();
      showToast('✅ Hoş geldin, ' + user.name + '!');
      try { trackEvent('login', { method: 'email-login' }); } catch(e) {}
    }

    try { updateAllScoreDisplays(); } catch(e) {}
    try { updateWallet(); } catch(e) {}
    try { scheduleDailyReset(); } catch(e) {}
    setTimeout(function() { try { checkDailyLogin(); } catch(e) {} }, 2500);

  } catch(e) {
    showAuthError('Hata: ' + (e.message || 'bilinmeyen'));
    if (btn) { btn.textContent = origText; btn.disabled = false; }
  }
}

/* ── Google login — devre dışı ───────────────────────── */
async function handleGoogleLogin() {
  showToast('Google girişi bu sürümde kullanılamıyor', '#f59e0b');
}

/* ── Profil butonu güncelle ──────────────────────────── */
function updateProfileBtn() {
  var btn    = document.getElementById('profileBtn');
  var loginH = document.getElementById('loginBtnHeader');
  var avatar = document.getElementById('pbAvatar');
  var nameEl = document.getElementById('pbName');
  if (authUser) {
    if (btn)    { btn.style.display = 'flex'; }
    if (loginH) { loginH.style.display = 'none'; }
    if (avatar) { avatar.textContent = (authUser.name && authUser.name.length > 0) ? authUser.name[0].toUpperCase() : '?'; }
    if (nameEl) { nameEl.textContent = (authUser.name || '').slice(0, 12); }
  } else {
    if (btn)    { btn.style.display = 'none'; }
    if (loginH) { loginH.style.display = 'block'; }
  }
}

let profileMenuOpen = false;

function openProfileModal() {
  if (!authUser) return;
  const modal = document.getElementById('profileModal');
  if (!modal) return;

  const av = document.getElementById('pmAvatar');
  if (av) {
    if (authUser.avatar) { av.textContent = authUser.avatar; av.style.backgroundImage = ''; }
    else { av.textContent = (authUser.name && authUser.name.length > 0) ? authUser.name[0].toUpperCase() : '?'; av.style.backgroundImage = ''; }
  }

  var nm = document.getElementById('pmName');
  var em = document.getElementById('pmEmail');
  if (nm) nm.textContent = authUser.name || '—';
  if (em) em.textContent = authUser.email || 'Yerel hesap';

  var roleBadge = document.getElementById('pmRoleBadge');
  if (roleBadge) {
    var role = authUser.role || (typeof isSuperAdminUser === 'function' && isSuperAdminUser() ? 'superadmin' : '');
    if (role === 'superadmin') {
      roleBadge.innerHTML = '👑 Süper Admin';
      roleBadge.style.display = 'inline-flex';
      roleBadge.style.background = 'rgba(245,158,11,0.12)';
      roleBadge.style.color = '#f59e0b';
    } else if (role === 'admin') {
      roleBadge.innerHTML = '🛡️ Admin';
      roleBadge.style.display = 'inline-flex';
      roleBadge.style.background = 'rgba(0,255,136,0.08)';
      roleBadge.style.color = '#00ff88';
    } else {
      roleBadge.style.display = 'none';
    }
  }

  /* Form alanları doldur */
  var pmDN  = document.getElementById('pmDisplayName');
  var pmEM  = document.getElementById('pmEmailInput');
  var pmPW  = document.getElementById('pmPassword');
  var pmBio = document.getElementById('pmBio');
  if (pmDN)  pmDN.value  = authUser.name || '';
  if (pmEM)  pmEM.value  = authUser.email || '';
  if (pmPW)  pmPW.value  = '';
  if (pmBio) pmBio.value = (state.profile && state.profile.bio) || '';

  /* E-posta/şifre alanları — yerel modda göster */
  if (pmEM) pmEM.parentElement.style.display = '';
  if (pmPW) pmPW.parentElement.style.display = '';

  var pmMsg = document.getElementById('pmMsg');
  if (pmMsg) pmMsg.textContent = '';

  /* Admin butonu */
  var ab = document.getElementById('pmAdminBtn');
  if (ab) ab.style.display = 'none';
  if (typeof checkAdminStatus === 'function') {
    checkAdminStatus().then(function(isAdm) {
      if (isAdm && ab) ab.style.display = '';
    }).catch(function(){});
  }

  modal.classList.add('show');
}

function closeProfileModal() {
  var modal = document.getElementById('profileModal');
  if (modal) modal.classList.remove('show');
}

/* ── Auth sekmesi değiştir ───────────────────────────── */
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

  if (tabLogin)    { tabLogin.classList.remove('active'); }
  if (tabRegister) { tabRegister.classList.remove('active'); }
  if (tabPin)      { tabPin.classList.remove('active'); }
  if (pinSection)  { pinSection.style.display = 'none'; }
  if (emailInput)  { emailInput.style.display = ''; }
  if (nameField)   { nameField.style.display = 'none'; }
  if (passField)   { passField.style.display = ''; }
  if (submitBtn)   { submitBtn.style.display = ''; }
  if (googleBtn)   { googleBtn.style.display = 'none'; } /* Google devre dışı */
  if (skipBtn)     { skipBtn.style.display = ''; }
  if (divider)     { divider.style.display = 'none'; }

  if (tab === 'login') {
    if (tabLogin)  { tabLogin.classList.add('active'); }
    if (submitBtn) { submitBtn.textContent = 'Giriş Yap'; }
  } else if (tab === 'register') {
    if (tabRegister) { tabRegister.classList.add('active'); }
    if (nameField)   { nameField.style.display = ''; }
    if (submitBtn)   { submitBtn.textContent = 'Kayıt Ol'; }
  } else if (tab === 'pin') {
    if (tabPin)     { tabPin.classList.add('active'); }
    if (pinSection) { pinSection.style.display = 'flex'; pinSection.style.flexDirection = 'column'; pinSection.style.gap = '8px'; }
    if (emailInput) { emailInput.style.display = 'none'; }
    if (passField)  { passField.style.display = 'none'; }
    if (submitBtn)  { submitBtn.style.display = 'none'; }
    if (skipBtn)    { skipBtn.style.display = 'none'; }
  }
  try { clearAuthError(); } catch(e) {}
}

/* ── Login seçim ekranı ──────────────────────────────── */
function showLoginChoice() {
  openAuthModal();
}

function hideLoginChoice(cb) {
  closeModal(document.getElementById('authModal'));
  if (cb) { cb(); }
}

/* ── Sayfa yüklenince auth kontrolü ──────────────────── */
window.addEventListener('load', function() {
  try {
    loadAuth();
    if (authUser && authUser.uid && authUser.name) {
      loadState(authUser.uid);
      state.player = authUser.name;
      updateProfileBtn();
      try { updateAllScoreDisplays(); } catch(e) {}
      try { updateWallet(); } catch(e) {}
      showScreen('menu');
      try { refreshMenuPanels(); } catch(e) {}
      saveState();
      return;
    }
  } catch(e) {}
  /* Auth kaydı yok — giriş ekranı */
  setTimeout(function() {
    if (authUser) return;
    try { openAuthModal(); } catch(e) {}
  }, 500);
});

/* ── PIN sistemi (yerel) ─────────────────────────────── */
var _pinMode    = 'set';
var _pinBuffer  = '';
var _pinFirst   = '';
var _pinStep    = 1;

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
    if (sub)   { sub.textContent = 'Hesabını korumak için PIN belirle.'; }
    if (skip)  { skip.style.display = ''; }
  } else if (mode === 'login') {
    if (title) { title.textContent = 'PIN ile Giriş'; }
    if (sub)   { sub.textContent = 'Hesabına erişim için PIN gir.'; }
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
      if (i < _pinBuffer.length) { dot.classList.add('filled'); }
      else { dot.classList.remove('filled'); }
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
      /* PIN eşleşti — yerel DB'ye kaydet */
      if (authUser && authUser.uid) {
        var db = _getUsersDB();
        if (db[authUser.uid]) {
          db[authUser.uid].pin = _pinBuffer;
          _saveUsersDB(db);
        }
      }
      if (msg) { msg.textContent = '✅ PIN ayarlandı!'; msg.style.color = '#00ff66'; }
      setTimeout(closePinModal, 1200);
    }
  }
}

/* ── auth modal PIN sekmesi ── */
document.addEventListener('DOMContentLoaded', function() {
  var tabPin = document.getElementById('authTabPin');
  if (tabPin) {
    tabPin.addEventListener('click', function() {
      if (typeof switchAuthTab === 'function') {
        switchAuthTab('pin');
      }
    });
  }

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

      /* Yerel DB'de ara */
      var db = _getUsersDB();
      var found = Object.values(db).find(u => u.name === nameVal && u.pin === pinVal);
      if (found) {
        var token = _generateToken(found.uid);
        saveAuth({ uid: found.uid, name: found.name, token: token, provider: 'pin', email: found.email || '' });
        loadState(found.uid);
        state.player = found.name;
        closeModal(document.getElementById('authModal'));
        updateProfileBtn();
        showScreen('menu');
        try { refreshMenuPanels(); } catch(e) {}
        saveState();
        showToast('✅ PIN ile giriş yapıldı, hoş geldin ' + found.name + '!');
      } else {
        if (errEl) {
          errEl.textContent = '❌ Kullanıcı adı veya PIN yanlış';
          errEl.classList.add('show');
          errEl.style.color = '#ef4444';
        }
      }
    });
  }
});

/* ── Online fonksiyon stub'ları ───────────────────────── */
/* Bu fonksiyonlar orijinalde Firebase/Worker bağımlıydı.
   admin.js'de gerçek implementasyonlar varsa override edilir. */
function syncOnlineScore() { return Promise.resolve(); }
function loadProfileFromCloud() { return Promise.resolve(); }
function saveProfileToCloud() { return Promise.resolve(); }
function startUnreadListener() {}
function startOnlinePing() {}
function stopOnlinePing() {}
function loadGroqDailyTasks() { return Promise.resolve(); }
function loadGroqWeeklyTasks() { return Promise.resolve(); }
function updateDailyTasks() {}
function checkTournamentPrizes() {}
