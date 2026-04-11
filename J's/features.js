(function(){
  /* Event listeners */
  var scb=document.getElementById('startChallengeBtn');
  if(scb)scb.addEventListener('click',function(){openChallengeModal();});
  var cmb=document.getElementById('chestMenuBtn');
  if(cmb)cmb.addEventListener('click',function(){openChestModal();});
  /* Enter ile sohbet gönder */
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&document.activeElement&&document.activeElement.id==='ccInp')sendCC();
  });
  /* Admin panel klan sıfırlama butonu */
  var acp=document.getElementById('adminTab-clans');
  if(acp){
    var rb=document.createElement('button');
    rb.className='admin-btn admin-btn-red';
    rb.style.cssText='width:100%;margin-bottom:12px';
    rb.textContent='🔄 Kendi Klan Verimi Sıfırla';
    rb.onclick=adminForceResetMyClan;
    var fb2=acp.querySelector('button');
    if(fb2)acp.insertBefore(rb,fb2.nextSibling);
  }
  /* loadActiveEvents'e event bildirimi */
  var origLAE=typeof loadActiveEvents==='function'?loadActiveEvents:null;
  if(origLAE){
    loadActiveEvents=async function(){
      var prevMult=window._activeEventMultiplier||1;
      await origLAE.apply(this,arguments);
      var newMult=window._activeEventMultiplier||1;
      if(newMult>1&&prevMult<=1){
        try{showNotif('🎉','Event aktif!','×'+newMult+' puan çarpanı!','#ffd700');}catch(e){}
      }
    };
  }
})();
/* ── PWA Install ─────────────────────────────────────── */
var _deferredInstallPrompt = null;
var _pwaInstalled = false;

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _deferredInstallPrompt = e;
  /* Tüm PWA butonlarını görünür yap */
  document.querySelectorAll('.pwa-install-btn').forEach(function(btn) {
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  });
});

window.addEventListener('appinstalled', function() {
  _pwaInstalled = true;
  _deferredInstallPrompt = null;
  showToast('✅ MathGame ana ekrana eklendi!', '#00ff88');
});

function installPWA() {
  /* Android Chrome — native prompt */
  if (_deferredInstallPrompt) {
    _deferredInstallPrompt.prompt();
    _deferredInstallPrompt.userChoice.then(function(result) {
      if (result.outcome === 'accepted') {
        showToast('✅ Ana ekrana ekleniyor...', '#00ff88');
      }
      _deferredInstallPrompt = null;
    });
    return;
  }

  /* Zaten yüklüyse bildir */
  if (_pwaInstalled || window.matchMedia('(display-mode: standalone)').matches) {
    showToast('✅ Uygulama zaten yüklü!', '#00ff88');
    return;
  }

  /* iOS Safari tespiti */
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isIOS) {
    showIOSInstallGuide();
    return;
  }

  /* Samsung Browser, Firefox, diğerleri */
  showPWAFallbackGuide();
}

/* iOS için adım adım kılavuz modal */
function showIOSInstallGuide() {
  var existing = document.getElementById('iosInstallModal');
  if (existing) { existing.remove(); }

  var modal = document.createElement('div');
  modal.id = 'iosInstallModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);display:flex;align-items:flex-end;justify-content:center;padding:0';

  modal.innerHTML =
    '<div style="width:100%;max-width:480px;background:#0d1117;border:1px solid rgba(255,255,255,0.12);border-radius:24px 24px 0 0;padding:28px 24px 40px;animation:slideUp 0.3s ease">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
        '<div>' +
          '<div style="font-family:var(--font-head);font-size:18px;font-weight:900;color:var(--text)">🍎 iOS\'a Ekle</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-top:3px">MathGame\'i ana ekranına ekle</div>' +
        '</div>' +
        '<button onclick="document.getElementById(\'iosInstallModal\').remove()" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:var(--muted);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>' +
      '</div>' +
      /* Adım 1 */
      '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">1</div>' +
        '<div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">Safari\'de aşağıdaki butona bas</div>' +
          '<div style="font-size:12px;color:var(--muted)">Ekranın altındaki <strong style="color:#38bdf8">⬆️ Paylaş</strong> (Share) butonuna dokun</div>' +
        '</div>' +
      '</div>' +
      /* Adım 2 */
      '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">2</div>' +
        '<div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">"Ana Ekrana Ekle" seç</div>' +
          '<div style="font-size:12px;color:var(--muted)">Açılan menüde <strong style="color:#38bdf8">Ana Ekrana Ekle</strong> (Add to Home Screen) seçeneğine bas</div>' +
        '</div>' +
      '</div>' +
      /* Adım 3 */
      '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:24px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:rgba(0,255,136,0.15);border:1px solid rgba(0,255,136,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">3</div>' +
        '<div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--neon);margin-bottom:4px">Ekle\'ye bas — bitti! 🎉</div>' +
          '<div style="font-size:12px;color:var(--muted)">Sağ üstten <strong style="color:var(--neon)">Ekle</strong> (Add) butonuna basarak tamamla</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted2);text-align:center">⚠️ Sadece Safari\'de çalışır. Chrome veya başka tarayıcıda değil.</div>' +
    '</div>';

  modal.addEventListener('click', function(e) {
    if (e.target === modal) { modal.remove(); }
  });
  document.body.appendChild(modal);
}

/* Diğer tarayıcılar için genel kılavuz */
function showPWAFallbackGuide() {
  var isChrome = /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
  var isFirefox = /firefox/i.test(navigator.userAgent);
  var isSamsung = /samsungbrowser/i.test(navigator.userAgent);

  var msg = '';
  if (isFirefox) {
    msg = '📱 Firefox: Menü (⋮) → "Ana Ekrana Ekle" seçeneğini kullan';
  } else if (isSamsung) {
    msg = '📱 Samsung Browser: Menü (≡) → "Ana ekrana ekle" seçeneğini kullan';
  } else if (isChrome) {
    msg = '📱 Chrome: Siteyi birkaç kez ziyaret etmen gerekebilir. Adres çubuğundaki ⊕ simgesine veya Menü (⋮) → "Ana ekrana ekle"yi dene';
  } else {
    msg = '📱 Tarayıcı menüsünden "Ana Ekrana Ekle" seçeneğini kullan';
  }

  showToast(msg, '#a855f7');
}

/* ── Web Push Bildirimleri ─────────────────────────────── */
function togglePushNotifications() {
  if (!('Notification' in window)) {
    showToast('❌ Tarayıcın bildirim desteklemiyor', '#ef4444');
    return;
  }
  if (Notification.permission === 'granted') {
    showToast('✅ Bildirimler zaten açık', '#00ff88');
    updatePushBtnState('granted');
    return;
  }
  if (Notification.permission === 'denied') {
    showToast('⚠️ Bildirimler engellendi — tarayıcı ayarlarından izin ver', '#f59e0b');
    return;
  }
  Notification.requestPermission().then(function(permission) {
    if (permission === 'granted') {
      showToast('🔔 Bildirimler açıldı!', '#00ff88');
      updatePushBtnState('granted');
      subscribeToPush();
    } else {
      showToast('Bildirim izni reddedildi', '#ef4444');
    }
  });
}

function updatePushBtnState(permission) {
  var btns = ['pushToggleBtn', 'desktopPushBtn'];
  btns.forEach(function(id) {
    var btn = document.getElementById(id);
    if (!btn) { return; }
    if (permission === 'granted') {
      btn.textContent = '🔔 Bildirimler Açık';
      btn.style.color = 'var(--neon)';
      btn.style.borderColor = 'rgba(0,255,136,0.3)';
    } else {
      btn.textContent = '🔔 Bildirimleri Aç';
    }
  });
}

function subscribeToPush() {
  if (!window._swReg) { return; }
  /* VAPID public key — worker.js'e de eklenecek */
  var VAPID_PUBLIC = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBlt60e8a6oOFVQ'; /* demo key */
  window._swReg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
  }).then(function(sub) {
    console.log('[Push] Abone olundu');
    /* Aboneliği worker'a kaydet (opsiyonel) */
    try {
      workerPost('push/subscribe', { subscription: JSON.stringify(sub), token: authUser ? authUser.token : '' });
    } catch(e) {}
  }).catch(function(e) {
    console.warn('[Push] Abone olma hatası:', e);
  });
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* Sayfa yüklenince push durumunu güncelle */
if ('Notification' in window) {
  updatePushBtnState(Notification.permission);
}

/* ── Accordion ─────────────────────────────────────────── */
function toggleAccordion(header) {
  var body = header.nextElementSibling;
  var isOpen = header.classList.contains('open');
  if (isOpen) {
    header.classList.remove('open');
    body.classList.remove('open');
  } else {
    header.classList.add('open');
    body.classList.add('open');
  }
}

/* ── Masaüstü nav ──────────────────────────────────────── */
function desktopNavTo(section) {
  document.querySelectorAll('.desktop-nav-item').forEach(function(item) {
    item.classList.remove('active');
  });
  var clicked = (typeof event !== 'undefined' && event) ? event.currentTarget : null;
  if (clicked) { clicked.classList.add('active'); }

  if (section === 'play') {
    var btn = document.getElementById('startGameBtn');
    if (btn) { btn.click(); }
  } else if (section === 'absurd') {
    var btn = document.getElementById('startAbsurdBtn');
    if (btn) { btn.click(); }
  } else if (section === 'challenge') {
    var btn = document.getElementById('startChallengeBtn');
    if (btn) { btn.click(); }
  }
}

/* Masaüstü cüzdanı güncelle */
function updateDesktopWallet() {
  var coins = state ? (state.coins || 0) : 0;
  var diamonds = state ? (state.diamonds || 0) : 0;
  var els = [
    ['desktopCoin', 'desktopTopCoin'],
    ['desktopDiamond', 'desktopTopDiamond'],
  ];
  var coinIds = ['desktopCoin', 'desktopTopCoin'];
  var diaIds  = ['desktopDiamond', 'desktopTopDiamond'];
  coinIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = coins; }
  });
  diaIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = diamonds; }
  });
  /* Sağ panel stats */
  var sg = document.getElementById('desktopStatsGrid');
  if (sg && state) {
    var sc = state.score || 0;
    var lv = state.level || 1;
    sg.innerHTML =
      '<div style="background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.15);border-radius:10px;padding:10px;text-align:center">' +
        '<div style="font-size:16px;font-weight:900;color:var(--neon)">' + sc.toLocaleString() + '</div>' +
        '<div style="font-size:9px;color:var(--muted);margin-top:2px">PUAN</div>' +
      '</div>' +
      '<div style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15);border-radius:10px;padding:10px;text-align:center">' +
        '<div style="font-size:16px;font-weight:900;color:#a855f7">' + lv + '</div>' +
        '<div style="font-size:9px;color:var(--muted);margin-top:2px">SEVİYE</div>' +
      '</div>' +
      '<div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.15);border-radius:10px;padding:10px;text-align:center">' +
        '<div style="font-size:16px;font-weight:900;color:#ffd700">' + coins + '</div>' +
        '<div style="font-size:9px;color:var(--muted);margin-top:2px">COIN</div>' +
      '</div>' +
      '<div style="background:rgba(99,179,237,0.06);border:1px solid rgba(99,179,237,0.15);border-radius:10px;padding:10px;text-align:center">' +
        '<div style="font-size:16px;font-weight:900;color:#63b3ed">' + diamonds + '</div>' +
        '<div style="font-size:9px;color:var(--muted);margin-top:2px">ELMAS</div>' +
      '</div>';
  }
  /* Profil widget */
  var pw = document.getElementById('desktopProfileWidget');
  if (pw && authUser) {
    pw.style.display = 'block';
    var na = document.getElementById('desktopWidgetName');
    if (na) { na.textContent = authUser.name || '—'; }
    var la = document.getElementById('desktopWidgetLevel');
    if (la) { la.textContent = lv; }
    var av = document.getElementById('desktopWidgetAvatar');
    if (av) { av.textContent = state.avatar || (authUser.name ? authUser.name[0].toUpperCase() : '?'); }
    /* Topbar profil btn */
    var dpb = document.getElementById('desktopProfileBtn');
    if (dpb) { dpb.style.display = 'flex'; }
    var dpbn = document.getElementById('desktopPbName');
    if (dpbn) { dpbn.textContent = authUser.name || '—'; }
    var dpba = document.getElementById('desktopPbAvatar');
    if (dpba) { dpba.textContent = state.avatar || (authUser.name ? authUser.name[0].toUpperCase() : '?'); }
  }
}

/* Desktop sağ panel liderlik */
function updateDesktopLb(entries) {
  var el = document.getElementById('desktopLbList');
  if (!el || !entries || entries.length === 0) { return; }
  el.innerHTML = entries.slice(0, 5).map(function(e, i) {
    var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)">' +
      '<div style="width:20px;font-size:12px;text-align:center">' + medal + '</div>' +
      '<div style="flex:1;font-size:12px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(e.name || '?') + '</div>' +
      '<div style="font-size:11px;font-weight:800;color:var(--neon)">' + (e.score || 0).toLocaleString() + '</div>' +
    '</div>';
  }).join('');
}

/* Desktop search input */
function onDesktopSearchInput(val) {
  if (val.length >= 2) {
    openPlayerSearch();
    var input = document.getElementById('playerSearchInput');
    if (input) {
      input.value = val;
      onPlayerSearchInput(val);
    }
  }
}

/* ── Oyuncu Arama Sayfası ─────────────────────────────── */
var _playerSearchTimer = null;
var _playerSearchCache = {};

function openPlayerSearch() {
  document.getElementById('playerSearchPage').classList.add('show');
  setTimeout(function() {
    var input = document.getElementById('playerSearchInput');
    if (input) { input.focus(); }
  }, 100);
  loadPlayerSearchSuggestions();
}

function closePlayerSearch() {
  document.getElementById('playerSearchPage').classList.remove('show');
  var input = document.getElementById('playerSearchInput');
  if (input) { input.value = ''; }
  document.getElementById('playerSearchResults').style.display = 'none';
  document.getElementById('playerSearchSuggestions').style.display = 'block';
  document.getElementById('playerSearchEmpty').style.display = 'none';
}

function loadPlayerSearchSuggestions() {
  var list = document.getElementById('playerSearchSuggestList');
  if (!list) { return; }
  /* Liderlik tablosundaki oyuncuları öner */
  var board = window._lbBoardCache;
  if (!board || board.length === 0) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted)">Oyun oynandıkça öneriler burada çıkar</div>';
    return;
  }
  list.innerHTML = board.slice(0, 8).map(function(p) {
    return renderPlayerCard(p, true);
  }).join('');
}

function onPlayerSearchInput(val) {
  if (_playerSearchTimer) { clearTimeout(_playerSearchTimer); }
  if (val.length < 2) {
    document.getElementById('playerSearchResults').style.display = 'none';
    document.getElementById('playerSearchSuggestions').style.display = 'block';
    document.getElementById('playerSearchEmpty').style.display = 'none';
    return;
  }
  document.getElementById('playerSearchSuggestions').style.display = 'none';
  document.getElementById('playerSearchLoading').style.display = 'block';
  document.getElementById('playerSearchResults').style.display = 'none';
  document.getElementById('playerSearchEmpty').style.display = 'none';

  _playerSearchTimer = setTimeout(function() {
    doPlayerSearch(val);
  }, 400);
}

async function doPlayerSearch(query) {
  var loadEl = document.getElementById('playerSearchLoading');
  var resEl  = document.getElementById('playerSearchResults');
  var emptyEl = document.getElementById('playerSearchEmpty');
  try {
    var cached = _playerSearchCache[query.toLowerCase()];
    if (cached) {
      renderPlayerSearchResults(cached, resEl, emptyEl);
      if (loadEl) { loadEl.style.display = 'none'; }
      return;
    }
    var r = await workerPost('player/search', { query: query, limit: 20 });
    if (loadEl) { loadEl.style.display = 'none'; }
    if (!r || !r.ok || !r.players || r.players.length === 0) {
      resEl.style.display = 'none';
      emptyEl.style.display = 'block';
      return;
    }
    _playerSearchCache[query.toLowerCase()] = r.players;
    renderPlayerSearchResults(r.players, resEl, emptyEl);
  } catch(e) {
    if (loadEl) { loadEl.style.display = 'none'; }
    /* Fallback: liderlik tablosunda ara */
    var board = window._lbBoardCache || [];
    var q = query.toLowerCase();
    var matches = board.filter(function(p) {
      return (p.name || '').toLowerCase().includes(q);
    });
    renderPlayerSearchResults(matches, resEl, emptyEl);
  }
}

function renderPlayerSearchResults(players, resEl, emptyEl) {
  if (!players || players.length === 0) {
    resEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }
  resEl.style.display = 'block';
  emptyEl.style.display = 'none';
  resEl.innerHTML = players.map(function(p) {
    return renderPlayerCard(p, false);
  }).join('');
}

function renderPlayerCard(p, compact) {
  var avatar = p.avatar || (p.name ? p.name[0].toUpperCase() : '?');
  var isEmoji = avatar.length > 1;
  var avatarStyle = isEmoji ? '' : 'background:linear-gradient(135deg,var(--neon),#00cc66);color:#030608';
  return '<div class="player-result-card" onclick="openProfilePage(' + JSON.stringify(p).replace(/"/g, '&quot;') + ')">' +
    '<div class="player-result-avatar" style="' + avatarStyle + '">' + escapeHtml(avatar) + '</div>' +
    '<div class="player-result-info">' +
      '<div class="player-result-name">' + escapeHtml(p.name || '?') + '</div>' +
      '<div class="player-result-meta">' +
        'Seviye ' + (p.level || 1) + ' · ' + (p.score || 0).toLocaleString() + 'p' +
        (p.clanName ? ' · 👥 ' + escapeHtml(p.clanName) : '') +
      '</div>' +
    '</div>' +
    '<div style="color:var(--muted);font-size:16px">›</div>' +
  '</div>';
}

/* ── Profil Tam Sayfa ─────────────────────────────────── */
async function openProfilePage(data) {
  var page = document.getElementById('profileFullPage');
  page.classList.add('show');

  /* Temel bilgiler hemen doldur */
  var avatar = data.avatar || (data.name ? data.name[0].toUpperCase() : '?');
  var avEl = document.getElementById('pfpAvatar');
  if (avEl) { avEl.textContent = avatar; }
  var nameEl = document.getElementById('pfpName');
  if (nameEl) { nameEl.textContent = data.name || '—'; }
  var scoreEl = document.getElementById('pfpScore');
  if (scoreEl) { scoreEl.textContent = (data.score || 0).toLocaleString() + 'p'; }
  var levelEl = document.getElementById('pfpLevel');
  if (levelEl) { levelEl.textContent = data.level || 1; }
  var rankEl = document.getElementById('pfpRank');
  if (rankEl) { rankEl.textContent = '...'; }
  var bioEl = document.getElementById('pfpBio');
  if (bioEl) { bioEl.textContent = ''; }

  /* Worker'dan detay çek */
  try {
    var r = await workerPost('public-profile', { targetName: data.name, targetUid: data.uid || '' });
    if (r && r.ok) {
      if (rankEl) { rankEl.textContent = r.rank ? '#' + r.rank : '—'; }
      var joinedEl = document.getElementById('pfpJoined');
      if (joinedEl) { joinedEl.textContent = r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR') : '?'; }
      if (bioEl && r.bio) { bioEl.textContent = '"' + r.bio + '"'; }
      var provEl = document.getElementById('pfpProviderBadge');
      if (provEl) { provEl.textContent = r.provider === 'google' ? '🔵 Google' : '📧 E-posta'; }
      /* Avatar güncelle */
      if (r.avatar && avEl) { avEl.textContent = r.avatar; }
      /* Online durum */
      var statusEl = document.getElementById('pfpStatus');
      if (statusEl) {
        if (r.isOnline) {
          statusEl.innerHTML = '<span style="color:var(--neon)">🟢 Online</span>';
        } else if (r.lastSeen) {
          statusEl.textContent = '⚫ ' + new Date(r.lastSeen).toLocaleString('tr-TR');
        } else {
          statusEl.textContent = '—';
        }
      }
      /* Klan */
      var clanBadge = document.getElementById('pfpClanBadge');
      var clanName  = document.getElementById('pfpClanName');
      if (clanBadge && r.clanName) {
        clanBadge.style.display = 'inline-flex';
        if (clanName) { clanName.textContent = r.clanName; }
      } else if (clanBadge) {
        clanBadge.style.display = 'none';
      }
      /* Rozetler */
      var badgesSection = document.getElementById('pfpBadgesSection');
      var badgesEl = document.getElementById('pfpBadges');
      if (badgesEl && r.badges && r.badges.length > 0) {
        if (badgesSection) { badgesSection.style.display = 'block'; }
        badgesEl.innerHTML = r.badges.map(function(b) {
          return '<div style="display:inline-flex;align-items:center;gap:4px;background:rgba(' + (b.color || '245,158,11') + ',0.15);border:1px solid rgba(' + (b.color || '245,158,11') + ',0.3);border-radius:20px;padding:4px 10px">' +
            '<span style="font-size:14px">' + (b.icon || '🏅') + '</span>' +
            '<span style="font-size:11px;font-weight:700;color:#' + (b.textColor || 'f59e0b') + '">' + escapeHtml(b.label || '') + '</span>' +
          '</div>';
        }).join('');
      } else if (badgesSection) {
        badgesSection.style.display = 'none';
      }
      /* Admin butonları */
      var isAdmin = await checkAdminStatus();
      var adminActions = document.getElementById('pfpAdminActions');
      var adminBtns = document.getElementById('pfpAdminButtons');
      if (adminActions && isAdmin && r.uid) {
        adminActions.style.display = 'block';
        adminBtns.innerHTML =
          '<button onclick="adminBanFromProfile(\'' + escapeHtml(r.uid) + '\',\'' + escapeHtml(data.name) + '\')" class="btn danger" style="font-size:12px;padding:8px 14px">🚫 Banla</button>' +
          '<button onclick="adminSetScoreFromProfile(\'' + escapeHtml(data.name) + '\')" class="btn ghost" style="font-size:12px;padding:8px 14px">🏆 Skor Ayarla</button>';
      } else if (adminActions) {
        adminActions.style.display = 'none';
      }
    }
  } catch(e) {
    console.warn('Profil yüklenemedi:', e);
  }
}

function closeProfileFullPage() {
  document.getElementById('profileFullPage').classList.remove('show');
}

function adminBanFromProfile(uid, name) {
  var reason = prompt('Ban sebebi:');
  if (!reason) { return; }
  workerPost('admin/ban', { token: authUser.token, targetUid: uid, targetName: name, reason: reason }).then(function(r) {
    showToast(r && r.ok ? '🚫 Banlandi' : '❌ Hata', r && r.ok ? '#ef4444' : '#ef4444');
  });
}

function adminSetScoreFromProfile(name) {
  var score = prompt('Yeni skor:');
  if (!score || isNaN(parseInt(score))) { return; }
  workerPost('admin/set-score', { token: authUser.token, targetName: name, score: parseInt(score) }).then(function(r) {
    showToast(r && r.ok ? '✅ Skor ayarlandı' : '❌ Hata', r && r.ok ? '#00ff88' : '#ef4444');
  });
}

/* ── Klan Davet URL fonksiyonları ────────────────────────── */
function copyInviteUrl(url) {
  navigator.clipboard.writeText(url).then(function() {
    showToast('📋 Davet linki kopyalandı!', '#00ff88');
  }).catch(function() {
    showToast(url, '#00ff88');
  });
}

function shareInviteUrl(url) {
  if (navigator.share) {
    navigator.share({ title: 'MathGame Klan Daveti', text: 'Benim klanıma katıl!', url: url });
  } else {
    copyInviteUrl(url);
  }
}

/* Klan davet sayfasını göster */
async function showClanInvitePage(clanId) {
  var page = document.getElementById('clanInvitePage');
  page.classList.add('show');
  document.getElementById('clanInviteName').textContent = 'Yükleniyor...';
  document.getElementById('clanInviteTag').textContent = '';
  document.getElementById('clanInviteDesc').textContent = '';
  document.getElementById('clanInviteMsg').textContent = '';
  try {
    var r = await workerPost('clan/info-by-id', { clanId: clanId });
    if (!r || !r.ok || !r.clan) {
      document.getElementById('clanInviteName').textContent = 'Klan bulunamadı';
      return;
    }
    var clan = r.clan;
    document.getElementById('clanInviteName').textContent = clan.name || '—';
    document.getElementById('clanInviteTag').textContent = '[' + (clan.tag || '?') + ']';
    document.getElementById('clanInviteDesc').textContent = clan.description || '';
    document.getElementById('clanInviteMemberCount').textContent = (clan.memberCount || 0) + ' üye';
    document.getElementById('clanInviteScore').textContent = 'Min. ' + (clan.minScore || 0) + ' puan';
    document.getElementById('clanInviteBanner').textContent = clan.icon || '👥';
    window._pendingInviteClanData = clan;
  } catch(e) {
    document.getElementById('clanInviteName').textContent = 'Bağlantı hatası';
  }
}

function declineClanInvite() {
  document.getElementById('clanInvitePage').classList.remove('show');
  window._pendingClanInvite = null;
  window._pendingInviteClanData = null;
  /* URL'den clan-invite parametresini temizle */
  var url = new URL(window.location.href);
  url.searchParams.delete('clan-invite');
  window.history.replaceState({}, '', url.toString());
}

async function acceptClanInvite() {
  if (!authUser) {
    showToast('Önce giriş yap!', '#f59e0b');
    openAuthModal();
    return;
  }
  var clanId = window._pendingClanInvite;
  if (!clanId) { return; }
  var btn = document.getElementById('clanInviteAcceptBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Katılınıyor...'; }
  try {
    var r = await workerPost('clan/join-by-id', { token: authUser.token, clanId: clanId });
    if (r && r.ok) {
      showToast('✅ Klana katıldın!', '#00ff88');
      state.clanId = clanId;
      declineClanInvite();
      openClanModal();
    } else {
      document.getElementById('clanInviteMsg').textContent = r ? r.error : 'Katılma başarısız';
      if (btn) { btn.disabled = false; btn.textContent = '✅ Kabul Et'; }
    }
  } catch(e) {
    document.getElementById('clanInviteMsg').textContent = 'Bağlantı hatası';
    if (btn) { btn.disabled = false; btn.textContent = '✅ Kabul Et'; }
  }
}

/* ── Discord OAuth2 — Çalışan Popup Akışı ───────────────── */
async function connectDiscordOAuth() {
  if (!authUser) { showToast('Önce giriş yap', '#ef4444'); return; }
  var btn = document.getElementById('pmDiscordBtn');
  var lbl = document.getElementById('pmDiscordLabel');
  if (authUser.discordId) {
    showToast('✅ Discord zaten bağlı: ' + (authUser.discordUsername || authUser.discordId), '#00ff88');
    return;
  }
  try {
    if (lbl) lbl.textContent = 'Bağlanıyor...';
    if (btn) btn.disabled = true;
    var resp = await fetch(WORKER_URL + '/discord-oauth-url');
    if (!resp.ok) throw new Error('OAuth URL alınamadı (' + resp.status + ')');
    var data = await resp.json();
    if (!data || !data.url) throw new Error('DISCORD_CLIENT_ID yapılandırılmamış');
    localStorage.setItem('discord_oauth_state', data.state || '');
    var popup = window.open(data.url, 'discord_oauth', 'width=500,height=700,menubar=no,toolbar=no');
    if (!popup) { window.location.href = data.url; return; }
    function onMsg(ev) {
      if (!ev.data || !ev.data.type) return;
      if (ev.data.type === 'DISCORD_OAUTH_ERROR') {
        window.removeEventListener('message', onMsg);
        showToast('❌ Discord hata: ' + (ev.data.error || '?'), '#ef4444');
        if (lbl) lbl.textContent = 'Discord ile Bağlan';
        if (btn) btn.disabled = false;
        return;
      }
      if (ev.data.type !== 'DISCORD_OAUTH_SUCCESS') return;
      window.removeEventListener('message', onMsg);
      var discordId       = ev.data.discordId;
      var discordUsername = ev.data.discordUsername;
      var discordAvatar   = ev.data.discordAvatar;
      var accessToken     = ev.data.accessToken;
      workerPost('discord-connect', {
        token: authUser.token, discordId: discordId, discordUsername: discordUsername,
        discordAvatar: discordAvatar, accessToken: accessToken,
      }).then(function(r) {
        if (r && r.ok) {
          authUser.discordId       = discordId;
          authUser.discordUsername = discordUsername;
          authUser.discordAvatar   = discordAvatar;
          if (lbl) lbl.textContent = '✅ ' + discordUsername + ' bağlı';
          if (btn) { btn.style.borderColor = 'rgba(0,255,136,0.4)'; btn.disabled = false; }
          showToast('✅ Discord bağlandı' + (r.clanRoleAssigned ? ' · Klan rolü atandı!' : ''), '#00ff88');
        } else {
          showToast('❌ ' + ((r && r.error) || 'Sunucu hatası'), '#ef4444');
          if (lbl) lbl.textContent = 'Discord ile Bağlan';
          if (btn) btn.disabled = false;
        }
      }).catch(function() {
        showToast('❌ Sunucu bağlantı hatası', '#ef4444');
        if (lbl) lbl.textContent = 'Discord ile Bağlan';
        if (btn) btn.disabled = false;
      });
    }
    window.addEventListener('message', onMsg);
    var timer = setInterval(function() {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener('message', onMsg);
        if (lbl && lbl.textContent === 'Bağlanıyor...') {
          lbl.textContent = 'Discord ile Bağlan';
          if (btn) btn.disabled = false;
        }
      }
    }, 800);
  } catch(err) {
    console.warn('[Discord OAuth2]', err);
    showToast('❌ ' + err.message, '#ef4444');
    var l2 = document.getElementById('pmDiscordLabel');
    var b2 = document.getElementById('pmDiscordBtn');
    if (l2) l2.textContent = 'Discord ile Bağlan';
    if (b2) b2.disabled = false;
  }
}

function updateDiscordBtnState() {
  var lbl = document.getElementById('pmDiscordLabel');
  var btn = document.getElementById('pmDiscordBtn');
  if (!lbl || !btn) return;
  if (authUser && authUser.discordId) {
    lbl.textContent = '✅ ' + (authUser.discordUsername || 'Discord Bağlı');
    btn.style.borderColor = 'rgba(0,255,136,0.4)';
  } else {
    lbl.textContent = 'Discord ile Bağlan';
    btn.style.borderColor = 'rgba(88,101,242,0.38)';
  }
  btn.disabled = false;
}

/* Eski webhook fonksiyonları — stub */
function saveDiscordWebhook() {}
async function testDiscordWebhook() {}
async function sendDiscordWebhook() {}
function notifyDiscordClanEvent() {}

/* ══════════════════════════════════════════════════════════════
   LANDSCAPE MOD — Stat Paneli Güncelleme
   ══════════════════════════════════════════════════════════════ */
(function() {
  var _lsOn = false;
  function isLS() { return window.matchMedia('(orientation:landscape) and (max-height:500px)').matches; }
  function refreshLS() {
    var panel = document.getElementById('landscapeStatsPanel');
    var ga    = document.getElementById('gameArea');
    if (!panel) return;
    var inGame = ga && ga.style.display !== 'none';
    if (!isLS() || !inGame) { panel.style.display = 'none'; _lsOn = false; return; }
    panel.style.display = 'flex'; _lsOn = true;
    var e; 
    e = document.getElementById('lsPlayer');   if (e) e.textContent = (authUser && authUser.name) || '—';
    e = document.getElementById('lsLevel');    if (e) e.textContent = (document.getElementById('levelUI')      || {textContent:'1'}).textContent;
    e = document.getElementById('lsScore');    if (e) e.textContent = (document.getElementById('scoreUI')      || {textContent:'0'}).textContent;
    e = document.getElementById('lsMult');     if (e) e.textContent = (document.getElementById('multiplierUI') || {textContent:'1×10'}).textContent;
    var cDiv  = document.getElementById('lsClanDiv');
    var cWrap = document.getElementById('lsClanWrap');
    var cEl   = document.getElementById('lsClan');
    if (typeof _clanData !== 'undefined' && _clanData && _clanData.name) {
      if (cDiv)  cDiv.style.display = '';
      if (cWrap) cWrap.style.display = '';
      if (cEl)   cEl.textContent = '[' + (_clanData.tag||'?') + '] ' + _clanData.name;
    } else {
      if (cDiv)  cDiv.style.display = 'none';
      if (cWrap) cWrap.style.display = 'none';
    }
    var jRow = document.getElementById('lsJokers');
    if (jRow && typeof state !== 'undefined' && state && state.jokers) {
      var defs = [{key:'skip',icon:'⏭',lbl:'Atla'},{key:'half',icon:'✂️',lbl:'50%'},{key:'double',icon:'2×',lbl:'2x'},{key:'time',icon:'⏱',lbl:'+Süre'}];
      jRow.innerHTML = defs.map(function(d) {
        var c = state.jokers[d.key] || 0;
        return '<button class="ls-jbtn" title="' + d.lbl + '" ' + (c<1?'disabled':'') + ' onclick="useJoker(\'' + d.key + '\')">' + d.icon + (c>0?'<span style="font-size:8px;display:block;color:var(--neon)">'+c+'</span>':'') + '</button>';
      }).join('');
    }
  }
  window.matchMedia('(orientation:landscape)').addEventListener('change', function() { setTimeout(refreshLS,150); });
  window.addEventListener('orientationchange', function() { setTimeout(refreshLS,200); });
  var _origSS = window.showScreen;
  if (typeof _origSS === 'function') { window.showScreen = function(n) { _origSS(n); setTimeout(refreshLS,100); }; }
  setInterval(function() { if (_lsOn) refreshLS(); }, 1500);
  window.addEventListener('load', function() { setTimeout(refreshLS,600); });
})();
/* ── SA — İstediği Klanı Görüntüle ──────────────────────── */
async function saViewAnyClan() {
  var clanId = (document.getElementById('saViewClanId') || {}).value;
  if (!clanId) { clanId = prompt('Klan ID:'); }
  if (!clanId) { return; }
  var resEl = document.getElementById('saViewClanResult');
  if (resEl) { resEl.innerHTML = '<div style="color:var(--muted);font-size:12px">⏳ Yükleniyor...</div>'; }
  try {
    var r = await workerPost('admin/clan-view', { token: authUser.token, clanId: clanId.trim() });
    if (!r || !r.ok || !r.clan) {
      if (resEl) { resEl.innerHTML = '<div style="color:#ef4444;font-size:12px">❌ ' + (r ? r.error : 'Hata') + '</div>'; }
      return;
    }
    var c = r.clan;
    if (resEl) {
      resEl.innerHTML =
        '<div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:12px;font-size:12px">' +
          '<div style="font-weight:800;color:#f59e0b;margin-bottom:8px">[' + escapeHtml(c.tag||'?') + '] ' + escapeHtml(c.name||'?') + '</div>' +
          '<div style="color:var(--muted);margin-bottom:4px">ID: <span style="color:var(--text);font-family:monospace">' + escapeHtml(c.id||'?') + '</span></div>' +
          '<div style="color:var(--muted);margin-bottom:4px">Üye: <strong style="color:var(--text)">' + (c.memberCount||0) + '</strong> / ' + (c.maxMembers||25) + '</div>' +
          '<div style="color:var(--muted);margin-bottom:4px">Puan: <strong style="color:var(--neon)">' + (c.score||0).toLocaleString() + 'p</strong></div>' +
          '<div style="color:var(--muted);margin-bottom:8px">Lider: <strong style="color:var(--text)">' + escapeHtml(c.leaderName||'?') + '</strong></div>' +
          (c.members ? '<div style="font-size:11px;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Üyeler</div>' +
            c.members.slice(0,10).map(function(m) {
              return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04)">' +
                '<span style="font-size:10px;width:50px;color:' + (m.role==='leader'?'#ffd700':m.role==='officer'?'#a855f7':'var(--muted)') + '">' + (m.role==='leader'?'👑 Lider':m.role==='officer'?'⭐ Subay':'👤 Üye') + '</span>' +
                '<span style="flex:1;color:var(--text)">' + escapeHtml(m.name||'?') + '</span>' +
                '<span style="color:var(--neon);font-weight:700">' + (m.score||0).toLocaleString() + 'p</span>' +
              '</div>';
            }).join('') : '') +
        '</div>';
    }
  } catch(e) {
    if (resEl) { resEl.innerHTML = '<div style="color:#ef4444;font-size:12px">❌ ' + e.message + '</div>'; }
  }
}

/* ── Klan davet linki — sayfa yüklenince kontrol et ─────── */
(function checkPendingClanInvite() {
  if (window._pendingClanInvite) {
    /* Auth yüklenince göster */
    var checkAuth = setInterval(function() {
      if (typeof authUser !== 'undefined') {
        clearInterval(checkAuth);
        setTimeout(function() {
          showClanInvitePage(window._pendingClanInvite);
        }, 1500);
      }
    }, 200);
  }
})();

/* ── Desktop logout butonu ─────────────────────────────── */
(function() {
  var dlb = document.getElementById('desktopLogoutBtn');
  if (dlb) {
    dlb.addEventListener('click', function() {
      var logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) { logoutBtn.click(); }
    });
  }
})();

/* ── RAM Optimizasyonu — interval ve listener temizleme ─── */
var _ramOptIntervals = [];
var _originalSetInterval = window.setInterval;
window.setInterval = function(fn, delay) {
  var id = _originalSetInterval.apply(window, arguments);
  _ramOptIntervals.push(id);
  return id;
};

/* Sayfa gizlenince ağır interval'ları durdur */
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    /* Absurd fetch durdur */
    try { absurdFetching = false; } catch(e) {}
  } else {
    /* Sayfa tekrar görününce wallet güncelle */
    try { updateDesktopWallet(); } catch(e) {}
    try { updateAllScoreDisplays(); } catch(e) {}
  }
});

/* DOM birikimi temizleyici — büyük innerHTML listelerini kısalt */
function trimLeaderboardDOM() {
  var lb = document.getElementById('onlineLbEl');
  if (lb && lb.children.length > 50) {
    while (lb.children.length > 50) {
      lb.removeChild(lb.lastChild);
    }
  }
  var desktopLb = document.getElementById('desktopLbList');
  if (desktopLb && desktopLb.children.length > 10) {
    while (desktopLb.children.length > 10) {
      desktopLb.removeChild(desktopLb.lastChild);
    }
  }
}
setInterval(function() {
  try { trimLeaderboardDOM(); } catch(e) {}
}, 60000);

/* Absürt soru kuyruğu — max 20 soru tut */
setInterval(function() {
  try {
    if (typeof absurdQueue !== 'undefined' && absurdQueue.length > 20) {
      absurdQueue.splice(0, absurdQueue.length - 20);
    }
  } catch(e) {}
}, 30000);

/* ── updateAllScoreDisplays'e desktop wallet hook ────────── */
var _origUpdateAllScores = typeof updateAllScoreDisplays === 'function' ? updateAllScoreDisplays : null;
if (_origUpdateAllScores) {
  updateAllScoreDisplays = function() {
    try { _origUpdateAllScores.apply(this, arguments); } catch(e) {}
    try { updateDesktopWallet(); } catch(e) {}
  };
}

/* ── fetchOnlineLeaderboard'a desktop lb hook ────────────── */
var _origFetchLb = typeof fetchOnlineLeaderboard === 'function' ? fetchOnlineLeaderboard : null;
if (_origFetchLb) {
  fetchOnlineLeaderboard = async function() {
    try { await _origFetchLb.apply(this, arguments); } catch(e) {}
    try {
      var board = window._lbBoardCache;
      if (board) { updateDesktopLb(board); }
    } catch(e) {}
  };
}

/* İlk yüklemede cüzdanı ve desktop'u doldur */
setTimeout(function() {
  try { updateDesktopWallet(); } catch(e) {}
  try { fetchOnlineLeaderboard(); } catch(e) {}
}, 2000);

