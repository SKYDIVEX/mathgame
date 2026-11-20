/* ══ MathGame · js/auth/auth-online.js ══ (index.html'de sırayla yüklenir) */
/* ══════════════════════════════════════════════════════
   FIREBASE GOOGLE AUTH + CLOUDFLARE WORKER Leaderboard
   ══════════════════════════════════════════════════════ */

/* authUser — var kullan, TDZ hatası önlenir */
var authUser = null;

/* Firebase başlat */
const firebaseConfig = {
  apiKey: "AIzaSyCAz3xkxVDodlPbZYks6zvLNHw__C35BLI",
  authDomain: "mathgame-skydivex.firebaseapp.com",
  projectId: "mathgame-skydivex",
  storageBucket: "mathgame-skydivex.firebasestorage.app",
  messagingSenderId: "836308920874",
  appId: "1:836308920874:web:622f1dcc0668856eaef153",
  databaseURL: "https://mathgame-skydivex-default-rtdb.europe-west1.firebasedatabase.app"
};

let fbApp  = null;
let fbAuth = null;
let fbDB   = null;
var fbReady = false; /* Firebase hazır mı? */

/* Protokol kontrolü — file/content protokolünde Firebase çalışmaz */
var isOnlineMode = (location.protocol === 'https:' || location.protocol === 'http:');

try {
  if (!isOnlineMode) throw new Error('Lokal protokol — Firebase devre dışı');
  if (typeof firebase === 'undefined') throw new Error('Firebase SDK yüklenmedi');
  fbApp  = firebase.initializeApp(firebaseConfig);
  fbAuth = firebase.auth();
  fbDB   = firebase.database();
  fbReady = true;

  /* Google giriş sonrası */
  /* Redirect sonucunu yakala (mobil Google girişi) */
  fbAuth.getRedirectResult().then(result => {
    /* onAuthStateChanged zaten tetiklenecek, burada ekstra işlem yok */
  }).catch(e => {
    if (e.code && e.code !== 'auth/no-auth-event')
      console.warn('getRedirectResult hata:', e.code);
  });

  var _mgAuthStateHandler = async (user) => {
    try { /* v3.2: Tüm auth bloğu try-catch içinde — donma engeli */

    if (!user) {
      if (authUser) {
        authUser = null;
        localStorage.removeItem('mathgame_auth_v1');
        updateProfileBtn();
      }
      return;
    }

    /* Kullanıcı adı temizle — hata varsa güvenli fallback */
    var name;
    try {
      name = sanitizeUsername(user.displayName || (user.email ? user.email.split('@')[0] : 'Oyuncu'));
    } catch(e) { name = 'Oyuncu' + user.uid.slice(0,4); }

    /* Worker'a firebase-login gönder — token yenile */
    var workerToken = null;
    var workerHasPin = false;
    try {
      var fbLoginResult = await workerPost('firebase-login', { uid: user.uid, name, email: user.email || '' });
      if (fbLoginResult && fbLoginResult.ok) {
        workerToken  = fbLoginResult.token;
        workerHasPin = fbLoginResult.hasPin === true;
      } else if (fbLoginResult && fbLoginResult.error === 'Oturum gecersiz') {
        /* Token geçersiz — güvenli çıkış */
        console.warn('v3.2: Token geçersiz, çıkış yapılıyor');
        try { await fbAuth.signOut(); } catch(e2) {}
        return;
      }
    } catch(e) { console.warn('Worker firebase-login hata:', e); }

    /* Token güncelle — eski token varsa koru, yeni geldiyse güncelle */
    var existingAuth = authUser;
    var finalToken = workerToken || (existingAuth ? existingAuth.token : null);
    saveAuth({ uid: user.uid, name, email: user.email || '', provider: 'google', token: finalToken });

    /* loginBtnHeader'ı kesin gizle — her zaman */
    var _lbhEl = document.getElementById('loginBtnHeader');
    if (_lbhEl) _lbhEl.style.display = 'none';

    /* Aynı kullanıcı zaten yüklüyse */
    if (existingAuth && existingAuth.uid === user.uid && state.player) {
      updateProfileBtn();
      /* Sayfa yenilenmiş olabilir — cloud'dan ekonomi/profil yükle */
      try { await syncOnlineScore(); } catch(e) {}
      try { await loadProfileFromCloud(); } catch(e) {}
      updateAllScoreDisplays();
      try { updateWallet(); } catch(e) {}
      try { scheduleDailyReset(); } catch(e) {}
      setTimeout(function() { try { checkDailyLogin(); } catch(e) {} }, 2500);
    } else {
      /* Farklı kullanıcı veya ilk giriş — state'i uid key'den yükle */
      loadState(user.uid);
      state.player = name;
      closeModal(document.getElementById('authModal'));
      hideLoginChoice();
      updateProfileBtn();
      showScreen('menu');
      refreshMenuPanels();
      showToast('✅ Hoş geldin, ' + name + '!');
      trackEvent('login', { method: 'google' });
      try { await syncOnlineScore(); } catch(e) { console.warn('syncOnlineScore hata:', e); }
      try { await loadProfileFromCloud(); } catch(e) { console.warn('loadProfileFromCloud hata:', e); }
      /* Cloud yüklendi — UI güncelle */
      updateAllScoreDisplays();
      try { updateWallet(); } catch(e) {}
      try { loadGroqDailyTasks().then(function() { updateDailyTasks(); }); } catch(e) {}
      try { loadGroqWeeklyTasks(); } catch(e) {}
      try { scheduleDailyReset(); } catch(e) {}
      try { setTimeout(checkTournamentPrizes, 3000); } catch(e) {}
      setTimeout(function() { try { checkDailyLogin(); } catch(e) {} }, 2500);
    }

    /* Okunmamış mesaj listener'ı başlat */
    try { startUnreadListener(); } catch(e) {}
    try { startOnlinePing(); } catch(e) {}
    try { loadAnnouncement(); } catch(e) {}

    /* PIN ayarlanmamışsa belirleme ekranı göster */
    if (workerToken && !workerHasPin) {
      var pinSkipped = localStorage.getItem('mathgame_pin_skipped_' + user.uid);
      if (!pinSkipped) {
        setTimeout(function() {
          openPinModal('set');
        }, 1000);
      }
    }

    } catch(authErr) {
      /* v3.2: Auth bloğu içinde beklenmedik hata — güvenli çıkış */
      console.error('v3.2 auth hata:', authErr);
      try { showToast('Oturum hatası. Tekrar giriş yapın.', '#ef4444'); } catch(e) {}
      try { fbAuth.signOut(); } catch(e) {}
    }
  };
  /* Tüm modüller yüklenmeden tetiklenmesin diye kapıdan geçir (bkz. js/config.js) */
  fbAuth.onAuthStateChanged(function (user) {
    mgOnReady(function () { _mgAuthStateHandler(user); });
  });
} catch(e) {
  console.warn('Firebase init hata:', e);
}

const AUTH_KEY = 'mathgame_auth_v1'; /* localStorage key */

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) authUser = JSON.parse(raw);
  } catch(e) { authUser = null; }
}

function saveAuth(user) {
  authUser = user;
  /* uid'i ayrı key'e kaydet — getLsKey için hızlı erişim */
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

/* ── Kullanıcı adı temizle (client-side) ─────────────── */
const BAD_WORDS_CLIENT = ['fuck','shit','orospu','sik','amk','piç','pezevenk','yarrak','nigger'];
function sanitizeUsername(name) {
  if (!name) return 'Oyuncu';
  let clean = name.trim().slice(0, 20);
  if (BAD_WORDS_CLIENT.some(w => clean.toLowerCase().includes(w)))
    return 'Oyuncu_' + Math.floor(Math.random() * 9999);
  return clean;
}

/* ── Worker API yardımcısı ───────────────────────────── */
async function workerPost(endpoint, data) {
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
        return { error: 'KV limit doldu — gece 03:00\'de sıfırlanır', kvLimit: true };
      }
      return { error: 'Sunucu hatası (' + resp.status + ')' };
    }
  } catch(e) {
    return { error: e.message };
  }
}

async function workerGet(endpoint, params) {
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
  } catch(e) { return null; }
}

/* ── Auth Modal kontrol ──────────────────────────────── */
function openAuthModal() {
  const am = document.getElementById('authModal');
  if (am) am.classList.add('show');
  clearAuthError();
}

/* ── Profil butonu durumunu garantile ──────────────────── */
/* Sayfa yüklendikten sonra 3sn boyunca her 300ms kontrol et */
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

/* Sekme & submit event'leri */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Profil Modal Eventleri ── */
  document.getElementById('pmCloseBtn')?.addEventListener('click', closeProfileModal);

  /* Modalın dışına tıklayınca kapat */
  document.getElementById('profileModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeProfileModal();
  });

  /* Kaydet butonu */
  document.getElementById('pmSaveBtn')?.addEventListener('click', async function() {
    /* Bio kaydet */
    var bioEl = document.getElementById('pmBio');
    if (bioEl) {
      if (!state.profile) { state.profile = {}; }
      state.profile.bio = bioEl.value.trim();
    }
    /* Avatar kaydet */
    if (state._selectedAvatar) {
      if (!state.profile) { state.profile = {}; }
      state.profile.avatar = state._selectedAvatar;
    }
    if (!authUser) return;
    const msg      = document.getElementById('pmMsg');
    const newName  = (document.getElementById('pmDisplayName')?.value || '').trim();
    const newEmail = (document.getElementById('pmEmailInput')?.value || '').trim();
    const newPass  = (document.getElementById('pmPassword')?.value || '').trim();

    if (!newName) { if(msg){msg.textContent='İsim boş olamaz';msg.style.color='#ef4444';} return; }
    if(msg){ msg.textContent='Kaydediliyor...'; msg.style.color='#9fb3b0'; }

    try {
      /* Takma adı güncelle */
      const sanitized = sanitizeUsername(newName);

      /* İsim değiştiyse Worker'da çakışma kontrolü yap */
      if (sanitized !== authUser.name) {
        if(msg){ msg.textContent='⏳ İsim kontrol ediliyor...'; msg.style.color='#9fb3b0'; }
        try {
          var checkRes = await workerPost('check-name', { name: sanitized, uid: authUser.uid, token: authUser.token });
          if (checkRes && checkRes.taken) {
            if(msg){ msg.textContent='❌ Bu takma ad zaten alınmış!'; msg.style.color='#ef4444'; }
            return;
          }
          /* Worker'da ismi güncelle */
          await workerPost('update-name', { token: authUser.token, name: sanitized });
        } catch(e) { /* Worker erişilemiyorsa yine de devam et */ }
      }

      authUser.name = sanitized;
      saveAuth(authUser);
      state.player = sanitized;
      const pl = document.getElementById('playerLabel');
      if(pl) pl.innerText = sanitized;
      updateProfileBtn();

      /* Firebase e-posta/şifre güncelle */
      const user = fbAuth?.currentUser;
      if (user && authUser.provider !== 'google') {
        if (newEmail && newEmail !== authUser.email) {
          await user.updateEmail(newEmail);
          authUser.email = newEmail;
          saveAuth(authUser);
        }
        if (newPass && newPass.length >= 6) {
          await user.updatePassword(newPass);
        } else if (newPass && newPass.length < 6) {
          if(msg){msg.textContent='Şifre en az 6 karakter olmalı';msg.style.color='#ef4444';} return;
        }
      }

      if(msg){msg.textContent='✅ Kaydedildi!';msg.style.color='#00ff66';}
      const pmNm = document.getElementById('pmName');
      if(pmNm) pmNm.textContent = sanitized;
      const pmAv = document.getElementById('pmAvatar');
      if(pmAv) pmAv.textContent = sanitized[0].toUpperCase();
      setTimeout(() => { if(msg) msg.textContent=''; }, 2500);
    } catch(e) {
      if(msg){msg.textContent='Hata: '+getFirebaseErrorMsg(e.code||'');msg.style.color='#ef4444';}
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
    document.getElementById('requestModal').style.display = 'none';
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
        document.getElementById('reqMessage').value = '';
        setTimeout(() => { if(msg) msg.textContent=''; }, 3000);
      } else {
        if(msg){msg.textContent='❌ '+(r?.error||'Hata');msg.style.color='#ef4444';}
      }
    } catch(e) {
      if(msg){msg.textContent='❌ Bağlantı hatası';msg.style.color='#ef4444';}
    }
  });

  /* Şifre sıfırlama — kod iste */
  document.getElementById('resetRequestBtn')?.addEventListener('click', async function() {
    const username = (document.getElementById('resetUsername')?.value || '').trim();
    const msg = document.getElementById('resetMsg');
    if (!username) { if(msg){msg.textContent='Kullanıcı adı gir';msg.style.color='#ef4444';} return; }
    if(msg){msg.textContent='⏳ İstek gönderiliyor...';msg.style.color='#9fb3b0';}
    try {
      const r = await fetch(WORKER_URL + '/reset-request', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username })
      }).then(r => r.json());
      if(msg){msg.textContent = r.ok ? '✅ ' + r.message : '❌ ' + (r.error||'Hata');
              msg.style.color = r.ok ? '#00ff66' : '#ef4444';}
    } catch(e) { if(msg){msg.textContent='❌ Bağlantı hatası';msg.style.color='#ef4444';} }
  });

  /* Şifre sıfırlama — kodu kullan */
  document.getElementById('resetConfirmBtn')?.addEventListener('click', async function() {
    const code     = (document.getElementById('resetCode')?.value || '').trim();
    const newPass  = (document.getElementById('resetNewPass')?.value || '').trim();
    const msg = document.getElementById('resetMsg');
    if (!code || !newPass) { if(msg){msg.textContent='Kod ve yeni şifre gerekli';msg.style.color='#ef4444';} return; }
    if (newPass.length < 6) { if(msg){msg.textContent='Şifre en az 6 karakter';msg.style.color='#ef4444';} return; }
    if(msg){msg.textContent='⏳ Şifre sıfırlanıyor...';msg.style.color='#9fb3b0';}
    try {
      const r = await fetch(WORKER_URL + '/reset-confirm', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ code, newPassword: newPass })
      }).then(r => r.json());
      if(msg){msg.textContent = r.ok ? '✅ ' + r.message : '❌ ' + (r.error||'Hata');
              msg.style.color = r.ok ? '#00ff66' : '#ef4444';}
      if (r.ok) { document.getElementById('resetCode').value=''; document.getElementById('resetNewPass').value=''; }
    } catch(e) { if(msg){msg.textContent='❌ Bağlantı hatası';msg.style.color='#ef4444';} }
  });

  /* Çıkış butonu */
  document.getElementById('pmLogoutBtn')?.addEventListener('click', async function() {
    closeProfileModal();
    try { if(fbAuth && fbAuth.currentUser) await fbAuth.signOut(); } catch(e){ console.warn('signOut hata:', e); }
    clearAuth();
    authUser = null;
    state.player = null;
    state.score  = 0;
    saveState();
    _adminChecked  = false;
    _adminVerified = false;
    showToast('👋 Çıkış yapıldı');
    /* Profil butonunu gizle */
    const pb = document.getElementById('profileBtn');
    if (pb) pb.style.display = 'none';
    showLoginChoice();
  });

  const tabLogin    = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');
  const nameField   = document.getElementById('authDisplayName');
  const submitBtn   = document.getElementById('authSubmitBtn');
  const passField   = document.getElementById('authPassword');

  if (tabLogin)    { tabLogin.addEventListener('click',    function() { switchAuthTab('login'); }); }
  if (tabRegister) { tabRegister.addEventListener('click', function() { switchAuthTab('register'); }); }

  if (submitBtn) submitBtn.addEventListener('click', handleEmailAuth);
  ['authEmail','authDisplayName','authPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleEmailAuth(); });
  });

  /* Google */
  const googleBtn = document.getElementById('authGoogleBtn');
  if (googleBtn) googleBtn.addEventListener('click', function() { handleGoogleLogin(); });

  /* Misafir */
  const skipBtn = document.getElementById('authSkipBtn');
  if (skipBtn) skipBtn.addEventListener('click', () => {
    closeModal(document.getElementById('authModal'));
    state.player = 'Misafir_' + Math.floor(Math.random()*9999);
    showScreen('menu');
    refreshMenuPanels();
    saveState();
    showToast('👤 Misafir olarak girdin — skorlar sadece bu cihazda saklanır', '#f59e0b');
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
    lbLocal.classList.add('active'); lbOnline.classList.remove('active');
    document.getElementById('leaderboard').style.display = '';
    document.getElementById('onlineLbEl').style.display = 'none';
    var opsRow = document.getElementById('lbOpsRow');
    if (opsRow) opsRow.style.display = 'flex'; /* ops filtreleme lokal'de de aktif */
    stopLbAutoRefresh();
    renderLeaderboard();
  });
  if (lbOnline) lbOnline.addEventListener('click', function() {
    lbOnline.classList.add('active'); lbLocal.classList.remove('active');
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('onlineLbEl').style.display = '';
    var opsRow = document.getElementById('lbOpsRow');
    if (opsRow) opsRow.style.display = 'flex';
    startLbAutoRefresh();
  });
});

function clearAuthError() {
  const el = document.getElementById('authError');
  if (el) { el.textContent = ''; el.classList.remove('show'); }
}
function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

function getFirebaseErrorMsg(code) {
  const map = {
    'auth/email-already-in-use':   'Bu e-posta zaten kayıtlı.',
    'auth/invalid-email':           'Geçersiz e-posta adresi.',
    'auth/weak-password':           'Şifre çok zayıf (en az 6 karakter).',
    'auth/wrong-password':          'Şifre yanlış.',
    'auth/user-not-found':          'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/invalid-credential':      'E-posta veya şifre hatalı.',
    'auth/too-many-requests':       'Çok fazla deneme, biraz bekle.',
    'auth/network-request-failed':  'İnternet bağlantısı yok.',
  };
  return map[code] || 'Hata: ' + code;
}

async function handleEmailAuth() {
  if (!fbAuth) { showAuthError('Firebase yüklenemedi, sayfayı yenile.'); return; }

  var isRegister  = document.getElementById('authTabRegister').classList.contains('active');
  var email       = (document.getElementById('authEmail').value || '').trim();
  var displayName = (document.getElementById('authDisplayName').value || '').trim();
  var password    = (document.getElementById('authPassword').value || '');
  clearAuthError();

  if (!email)    { showAuthError('E-posta adresi gerekli'); return; }
  if (!password) { showAuthError('Şifre gerekli'); return; }
  if (password.length < 6) { showAuthError('Şifre en az 6 karakter olmalı'); return; }
  if (isRegister && displayName.length < 2) { showAuthError('Kullanıcı adı en az 2 karakter olmalı'); return; }

  var btn = document.getElementById('authSubmitBtn');
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

  try {
    var cred;
    var name;
    if (isRegister) {
      /* Kayıt ol */
      cred = await fbAuth.createUserWithEmailAndPassword(email, password);
      name = sanitizeUsername(displayName || email.split('@')[0]);
      await cred.user.updateProfile({ displayName: name });
    } else {
      /* Giriş yap */
      cred = await fbAuth.signInWithEmailAndPassword(email, password);
      name = sanitizeUsername(cred.user.displayName || email.split('@')[0]);
    }

    /* Sonucu direkt işle — onAuthStateChanged'ı bekleme */
    var user = cred.user;
    var workerToken = null;
    try {
      var fbRes = await workerPost('firebase-login', { uid: user.uid, name: name, email: email, provider: 'email' });
      if (fbRes && fbRes.ok) {
        workerToken = fbRes.token;
      } else if (fbRes && fbRes.error && fbRes.error.indexOf('takma ad') !== -1) {
        var suggestion = fbRes.suggestion || (name + '_' + user.uid.slice(0,4));
        showToast('⚠️ "' + name + '" takma adı alınmış. Yeni adın: ' + suggestion, '#f59e0b');
        name = suggestion;
        var retry = await workerPost('firebase-login', { uid: user.uid, name: suggestion, email: email, provider: 'email' });
        if (retry && retry.ok) { workerToken = retry.token; }
      }
    } catch(e) { console.warn('Worker hata:', e); }

    saveAuth({ uid: user.uid, name: name, email: email, provider: 'email', token: workerToken || null });
    loadState(user.uid);
    state.player = name;
    closeModal(document.getElementById('authModal'));
    updateProfileBtn();
    showScreen('menu');
    refreshMenuPanels();
    showToast('✅ Hoş geldin, ' + name + '!');
    trackEvent('login', { method: 'email' });
    try { stopSessionTimer(); startSessionTimer(); } catch(e) {}
    try { await syncOnlineScore(); } catch(e) {}
    try { await loadProfileFromCloud(); } catch(e) {}
    /* Cloud yüklendi — UI güncelle */
    updateAllScoreDisplays();
    try { updateWallet(); } catch(e) {}
    try { loadGroqDailyTasks().then(function() { updateDailyTasks(); }); } catch(e) {}
    try { loadGroqWeeklyTasks(); } catch(e) {}
    try { scheduleDailyReset(); } catch(e) {}
    setTimeout(function() { try { checkDailyLogin(); } catch(e) {} }, 2500);
    try { startUnreadListener(); } catch(e) {}
    try { startOnlinePing(); } catch(e) {}

  } catch(e) {
    showAuthError(getFirebaseErrorMsg(e.code));
    if (btn) { btn.textContent = origText; btn.disabled = false; }
  }
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
    if (avatar) { avatar.textContent = (authUser.name || '?')[0].toUpperCase(); }
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

  /* Avatar */
  const av = document.getElementById('pmAvatar');
  if (av) {
    if (authUser.avatar) { av.textContent = authUser.avatar; av.style.backgroundImage = ''; }
    else if (authUser.photoURL) { av.style.backgroundImage = 'url(' + authUser.photoURL + ')'; av.textContent = ''; }
    else { av.textContent = (authUser.name || '?')[0].toUpperCase(); av.style.backgroundImage = ''; }
  }

  /* İsim / email */
  var nm = document.getElementById('pmName');
  var em = document.getElementById('pmEmail');
  if (nm) nm.textContent = authUser.name || '—';
  if (em) em.textContent = authUser.email || (authUser.provider === 'google' ? 'Google hesabı' : '—');

  /* Rol rozeti */
  var roleBadge = document.getElementById('pmRoleBadge');
  if (roleBadge) {
    var role = authUser.role || (isSuperAdminUser() ? 'superadmin' : '');
    if (role === 'superadmin') {
      roleBadge.innerHTML = '👑 Süper Admin';
      roleBadge.style.display = 'inline-flex';
      roleBadge.style.background = 'rgba(245,158,11,0.12)';
      roleBadge.style.color = '#f59e0b';
      roleBadge.style.borderColor = 'rgba(245,158,11,0.3)';
    } else if (role === 'admin') {
      roleBadge.innerHTML = '⚡ Admin';
      roleBadge.style.display = 'inline-flex';
      roleBadge.style.background = 'var(--neon-dim)';
      roleBadge.style.color = 'var(--neon)';
      roleBadge.style.borderColor = 'rgba(0,255,136,0.3)';
    } else if (role === 'moderator') {
      roleBadge.innerHTML = '🛡 Yetkili';
      roleBadge.style.display = 'inline-flex';
      roleBadge.style.background = 'rgba(56,189,248,0.1)';
      roleBadge.style.color = '#38bdf8';
      roleBadge.style.borderColor = 'rgba(56,189,248,0.3)';
    } else {
      roleBadge.style.display = 'none';
    }
  }

  /* İstatistikler */
  var sc = document.getElementById('pmStatScore');
  var lv = document.getElementById('pmStatLevel');
  var st = document.getElementById('pmStatStreak');
  if (sc) sc.textContent = (state.score || 0) + 'p';
  if (lv) lv.textContent = state.level || 1;
  if (st) st.textContent = (state.stats && state.stats.bestStreak) ? state.stats.bestStreak : 0;

  /* Form alanları */
  var dn = document.getElementById('pmDisplayName');
  var ei = document.getElementById('pmEmailInput');
  var ef = document.getElementById('pmEmailField');
  var pf = document.getElementById('pmPasswordField');
  var bioEl = document.getElementById('pmBio');
  var msg = document.getElementById('pmMsg');
  if (dn) dn.value = authUser.name || '';
  if (ei) ei.value = authUser.email || '';
  if (msg) { msg.textContent = ''; msg.classList.remove('show'); }
  if (bioEl) bioEl.value = authUser.bio || '';

  /* Google girişinde e-posta/şifre gizle */
  var isGoogle = authUser.provider === 'google' || authUser.isGoogle;
  if (ef) ef.style.display = isGoogle ? 'none' : '';
  if (pf) pf.style.display = isGoogle ? 'none' : '';

  /* PIN butonu */
  var pinBtn = document.getElementById('pmPinBtn');
  if (pinBtn) pinBtn.style.display = (authUser.provider === 'google' || authUser.isGoogle) ? '' : 'none';

  /* Admin butonu */
  var ab = document.getElementById('pmAdminBtn');
  if (ab) {
    ab.style.display = 'none';
    checkAdminStatus().then(function(isAdm) {
      if (isAdm && ab) ab.style.display = '';
    }).catch(function() {});
  }

  modal.classList.add('show');
  try { populateProfileSocial(); } catch(e) {}
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.remove('show');
}

/* Eski showProfileMenu — geriye dönük uyumluluk */
function showProfileMenu() {
  openProfileModal();
}

/* ── Online skoru Worker'a gönder ────────────────────── */
var _lastPushScore = 0;
var _lastPushTime  = 0;

async function pushScoreToWorker() {
  if (!authUser || !authUser.uid) { return; }
  if (!authUser.token) {
    authUser.token = 'fb2_' + authUser.uid;
    saveAuth(authUser);
  }
  /* Sadece skor artmışsa gönder — 30sn throttle */
  var now = Date.now();
  if (state.score <= _lastPushScore) { return; } /* skor artmadıysa gönderme */
  if ((now - _lastPushTime) < 30000 && state.score < _lastPushScore + 50) { return; } /* 30sn içinde 50'den az artış varsa bekle */
  _lastPushScore = state.score;
  _lastPushTime  = now;
  try {
    var ops = 'all'; /* ops kaldırıldı — her zaman 'all' */
    var result = await workerPost('score', {
      token: authUser.token,
      score: state.score,
      ops: ops,
      level: state.level,
    });
    if (result && result.ok) {
      var board = getCurrentBoard();
      board[state.player] = state.score;
      setCurrentBoard(board);
      /* Lokal liderliği güncelle */
      renderLeaderboard();
      trackEvent('score_submit', {
        score: state.score,
        level: state.level || 1,
        rank: result.rank || 0,
        ops: ops || 'all',
      });
    }
  } catch(e) {
    console.warn('pushScore hata:', e);
  }
}

/* ── Online skoru çek + senkronize et ───────────────── */
async function syncOnlineScore() {
  if (!authUser || !authUser.uid) { return; }
  if (!authUser.token) { authUser.token = 'fb2_' + authUser.uid; saveAuth(authUser); }
  try {
    var boardAll = await workerGet('leaderboard', { ops: 'all' });
    if (!Array.isArray(boardAll)) { return; }
    var myEntry = null;
    for (var i = 0; i < boardAll.length; i++) {
      if (boardAll[i].uid === authUser.uid) { myEntry = boardAll[i]; break; }
    }
    if (myEntry) {
      /* Bulut her zaman kaynak — local'den düşükse bile bulutu al */
      if (myEntry.score !== (state.score || 0) || myEntry.level !== (state.level || 1)) {
        state.score = myEntry.score;
        state.level = myEntry.level || state.level;
        var localBoard = getCurrentBoard();
        localBoard[state.player] = state.score;
        setCurrentBoard(localBoard);
        saveState();
        if (myEntry.score > 0) showToast('☁️ Skor buluttan yüklendi: ' + myEntry.score + 'p', '#38bdf8');
      }
    } else if (state.score > 0) {
      try { pushScoreToWorker(); } catch(e) {}
    }
    /* Tüm göstergeleri senkronize et */
    updateAllScoreDisplays();
  } catch(e) { console.warn('syncScore hata:', e); }
}

/* Tüm puan/seviye göstergelerini tek yerden güncelle */
function updateAllScoreDisplays() {
  var s = state.score || 0;
  var l = state.level || 1;
  /* Player label */
  var pl = document.getElementById('playerLabel');
  if (pl && (authUser || state.player)) pl.textContent = (authUser ? authUser.name : state.player) || '—';
  /* Oyun içi */
  try { if (scoreDisplay) scoreDisplay.innerText = s; } catch(e) {}
  try { if (levelDisplay) levelDisplay.innerText = l; } catch(e) {}
  try { if (scoreUI) scoreUI.innerText = s; } catch(e) {}
  /* Profil modalı stats */
  var sc = document.getElementById('pmStatScore');
  var lv = document.getElementById('pmStatLevel');
  if (sc) sc.textContent = s + 'p';
  if (lv) lv.textContent = l;
  /* Menüdeki player strip */
  var pl = document.getElementById('playerLabel');
  if (pl && authUser) pl.innerText = authUser.name || state.player || '';
  updateProfileBtn();
}

/* Profil verisini (stats + achievements) Worker'a kaydet */
async function saveProfileToCloud() {
  if (!authUser) { return; }
  if (!authUser.token) { return; }
  try {
    if (!state.profile) { state.profile = {}; }
    await workerPost('save-profile', {
      token: authUser.token,
      stats: state.stats,
      achievements: state.achievements,
      level: state.level,
      score: state.score || 0,
      correctStreak: state.correctStreak || 0,
      bio: state.profile.bio || '',
      avatar: state.profile.avatar || '',
      theme: state.theme || 'green',
      bg: state.bgImage || '',
      /* Ekonomi verileri */
      coins: state.coins || 0,
      diamonds: state.diamonds || 0,
      jokers: state.jokers || { skip:0, hint:0, freeze:0, double:0 },
      inventory: state.inventory || [],
      loginStreak: state.loginStreak || 0,
      lastLoginDate: state.lastLoginDate || null,
      clanId: state.clanId || null,
      _shopBuys: state._shopBuys || 0,
      _jokersUsed: state._jokersUsed || 0,
      _economyV26: true,
      /* Görev verileri */
      permTasks: state.permTasks || null,
      achieveTasks: state.achieveTasks || null,
      /* Günlük görev durumu */
      lastLoginDate: state.lastLoginDate || null,
      loginStreak: state.loginStreak || 0,
      dailyTasksKey: getDailyKey(),
      dailyTasksData: (function() { try { var s=getDailyStorageKey(); var v=localStorage.getItem(s); return v?JSON.parse(v):null; } catch(e){return null;} })(),
    });
  } catch(e) {
    console.warn('saveProfileToCloud hata:', e);
  }
}

/* Profil verisini Worker'dan yükle */
async function loadProfileFromCloud() {
  if (!authUser) { return; }
  if (!authUser.token) { return; }
  try {
    var result = await workerPost('load-profile', { token: authUser.token });
    if (!result || !result.ok) { return; }
    if (result.stats) {
      state.stats = Object.assign(state.stats || {}, result.stats);
    }
    if (result.achievements) {
      state.achievements = Object.assign(state.achievements || {}, result.achievements);
    }
    if (result.correctStreak && result.correctStreak > (state.correctStreak || 0)) {
      state.correctStreak = result.correctStreak;
    }
    if (result.level && result.level > (state.level || 1)) {
      state.level = result.level;
      if (levelDisplay) { levelDisplay.innerText = state.level; }
    }
    if (result.score && result.score > (state.score || 0)) {
      state.score = result.score;
    }
    /* Ekonomi — her zaman cloud'dan yükle (cloud kaynak of truth) */
    if (result.coins !== undefined) {
      state.coins    = result.coins    || 0;
      state.diamonds = result.diamonds || 0;
      state.jokers   = result.jokers   || { skip:0, hint:0, freeze:0, double:0 };
      state.inventory = result.inventory || [];
      state.loginStreak   = result.loginStreak   || 0;
      state.lastLoginDate = result.lastLoginDate || null;
      state.clanId        = result.clanId        || state.clanId || null;
      state._shopBuys     = result._shopBuys     || 0;
      state._jokersUsed   = result._jokersUsed   || 0;
      state._economyV26   = true;
    }
    /* Görevler */
    if (result.permTasks)    state.permTasks    = result.permTasks;
    if (result.achieveTasks) state.achieveTasks = result.achieveTasks;
    /* Günlük login tarihi ve serisi — cloud kazanır */
    if (result.lastLoginDate) state.lastLoginDate = result.lastLoginDate;
    if (result.loginStreak)   state.loginStreak   = result.loginStreak;
    /* Günlük görev verisi — aynı gün ise yükle */
    if (result.dailyTasksData && result.dailyTasksKey === getDailyKey()) {
      try {
        var storageKey = getDailyStorageKey();
        var localRaw = localStorage.getItem(storageKey);
        var localData = localRaw ? JSON.parse(localRaw) : null;
        /* Local'de daha çok tamamlanmış görev varsa local'i koru */
        var cloudDone  = (result.dailyTasksData.tasks || []).filter(function(t){return t.rewardGiven;}).length;
        var localDone  = localData ? (localData.tasks || []).filter(function(t){return t.rewardGiven;}).length : 0;
        if (cloudDone >= localDone) {
          localStorage.setItem(storageKey, JSON.stringify(result.dailyTasksData));
        }
      } catch(e) {}
    }
    if (!state.profile) { state.profile = {}; }
    if (result.bio !== undefined) { state.profile.bio = result.bio; }
    if (result.avatar) { state.profile.avatar = result.avatar; applyAvatar(result.avatar); }
    if (result.theme) {
      state.theme = result.theme;
      localStorage.setItem('mathgame_theme', result.theme);
      try { applyTheme(result.theme); } catch(e) {}
    }
    if (result.bg !== undefined && result.bg) {
      state.bgImage = result.bg;
      localStorage.setItem('mathgame_bg', result.bg);
      try { applyBg(result.bg); } catch(e) {}
    }
    saveState();
    updateAllScoreDisplays();
    updateWallet();
    refreshMenuPanels();
    showToast('☁️ İstatistikler buluttan yüklendi', '#38bdf8');
  } catch(e) {
    console.warn('loadProfileFromCloud hata:', e);
  }
}

/* ── Online Leaderboard çek ──────────────────────────── */
var _lbAutoRefreshTimer = null;

function startLbAutoRefresh() {
  stopLbAutoRefresh();
  fetchOnlineLeaderboard();
  _lbAutoRefreshTimer = setInterval(function() {
    var lbEl = document.getElementById('onlineLbEl');
    if (lbEl && lbEl.style.display !== 'none') {
      fetchOnlineLeaderboard();
    }
  }, 30000); /* 30 saniyede bir */
}

function stopLbAutoRefresh() {
  if (_lbAutoRefreshTimer !== null) {
    clearInterval(_lbAutoRefreshTimer);
    _lbAutoRefreshTimer = null;
  }
}

var _currentLbOps = 'all'; /* Seçili ops filtresi */

function switchOnlineLbOps(ops) {
  _currentLbOps = ops;
  _localLbOpsFilter = ops; /* lokal tablo için de filtre */
  var ids = { 'all':'lbOpsAll', '+':'lbOpsPlus', '-':'lbOpsMinus', '*':'lbOpsMul', '/':'lbOpsDiv', '+-*/':'lbOpsMixed' };
  Object.values(ids).forEach(function(id) {
    var btn = document.getElementById(id); if (btn) btn.classList.remove('active');
  });
  var activeBtn = document.getElementById(ids[ops]);
  if (activeBtn) activeBtn.classList.add('active');

  /* Hangi sekme aktifse onu güncelle */
  var lbOnline = document.getElementById('lbTabOnline');
  if (lbOnline && lbOnline.classList.contains('active')) {
    fetchOnlineLeaderboard();
  } else {
    renderLeaderboard();
  }
}

async function fetchOnlineLeaderboard() {
  const el       = document.getElementById('onlineLbEl');
  const statusEl = document.getElementById('onlineLbStatus');
  if (!el) return;

  el.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px">⏳ Yükleniyor...</div>';

  try {
    const ops   = _currentLbOps; /* Direkt kullan — zaten doğru format */
    const board = await workerGet('leaderboard', { ops });

    const opsLabels = { 'all':'Tüm Kategoriler', '+':'Toplama', '-':'Çıkarma', '*':'Çarpma', '/':'Bölme', '+-*/':'Karma (+-×÷)' };
    const opsLabel = opsLabels[_currentLbOps] || _currentLbOps;

    if (board === null || board === undefined) {
      if (statusEl) statusEl.textContent = '🔴 hata';
      el.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px">🔴 Sunucuya bağlanılamadı</div>';
      return;
    }

    if (statusEl) statusEl.textContent = '🟢 online';

    if (!Array.isArray(board) || board.length === 0) {
      el.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px">' + (opsLabels[_currentLbOps] || 'Tüm Kategoriler') + ': Henüz kayıt yok — ilk sen ol!</div>';
      return;
    }
    el.innerHTML = '<div style="font-size:11px;color:var(--neon);font-weight:700;margin-bottom:6px;opacity:0.7">' + (opsLabels[_currentLbOps] || 'Tüm Kategoriler') + '</div>';

    /* Board verisini global'e kaydet — onclick index ile erişir */
    window._lbBoardCache = board;
    var boardHtml = board.map(function(entry, i) {
      var isMe  = authUser && entry.uid === authUser.uid;
      var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1) + '.';
      var nameHtml = isMe
        ? '<span class="lb-name" style="color:var(--neon);font-weight:800">' + escapeHtml(entry.name) + ' 👈🏿</span>'
        : '<span class="lb-name" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px;text-decoration-color:rgba(255,255,255,0.2)" onclick="openPublicProfileByIndex(' + i + ')">' + escapeHtml(entry.name) + '</span>';
      return '<div class="lb-online-item' + (isMe ? ' lb-me' : '') + '" style="' + (isMe ? 'background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);border-radius:10px;padding:4px 8px;' : '') + '">' +
        '<span class="lb-rank">' + medal + '</span>' +
        nameHtml +
        '<span class="lb-score">' + entry.score + 'p</span>' +
        '</div>';
    }).join('');
    el.innerHTML += boardHtml;
  } catch(fetchErr) {
    var lbEl = document.getElementById('onlineLbEl');
    if (lbEl) lbEl.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px">🔴 Bağlantı hatası</div>';
    var stEl = document.getElementById('onlineLbStatus');
    if (stEl) stEl.textContent = '🔴 hata';
    console.warn('fetchOnlineLeaderboard hata:', fetchErr);
  }
}
