/* ══ MathGame · js/patches/v32-patches.js ══ (index.html'de sırayla yüklenir) */
/* ── v3.2 Cache & localStorage temizliği ────────────── */
(function v32Init() {
  var CURRENT_VERSION = 'v3.2';
  var storedVersion   = localStorage.getItem('mathgame_version');
  if (storedVersion !== CURRENT_VERSION) {
    /* Eski cache anahtarlarını temizle */
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && (
        k.startsWith('mathgame_groq_daily_') ||
        k.startsWith('mathgame_groq_weekly_') ||
        k.startsWith('ann_closed_')
      )) { keysToRemove.push(k); }
    }
    keysToRemove.forEach(function(k) { try { localStorage.removeItem(k); } catch(e) {} });
    localStorage.setItem('mathgame_version', CURRENT_VERSION);
    console.log('[v3.2] Cache temizlendi, yeni sürüm aktif');
  }
})();

/* ── Sağ tık engeli ─────────────────────────────────── */
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

/* ── Overscroll / pull-to-refresh engeli ────────────── */
/* Sadece scroll edilebilir eleman yoksa engelle — normal kaydırmayı KORU */
document.addEventListener('touchmove', function(e) {
  /* Dokunulan veya üst elementlerden biri scroll edilebiliyorsa izin ver */
  var el = e.target;
  while (el && el !== document.body) {
    var style = window.getComputedStyle(el);
    var overflow = style.overflowY;
    var isScrollable = (overflow === 'auto' || overflow === 'scroll');
    if (isScrollable && el.scrollHeight > el.clientHeight) { return; }
    el = el.parentElement;
  }
  /* Body'nin kendisi scroll edilebiliyorsa izin ver */
  if (document.scrollingElement && document.scrollingElement.scrollHeight > window.innerHeight) { return; }
  /* Gerçekten scroll edilecek yer yoksa engelle (pull-to-refresh) */
  if (e.touches.length === 1) { e.preventDefault(); }
}, { passive: false });

/* ── Geri tuşu (Android PWA) ────────────────────────── */
var _backPressCount = 0;
var _backPressTimer = null;
document.addEventListener('backbutton', handleBackButton);
window.addEventListener('popstate', function(e) {
  e.preventDefault();
  handleBackButton();
});
/* History entry ekle — popstate tetiklensin */
history.pushState({ mathgame: true }, '');

function handleBackButton() {
  /* 1. Açık modal varsa kapat */
  var modals = ['loginRewardModal','monthCalendarModal','calEditorModal','iosGuideModal','clanInvitePage','profileFullPage','playerSearchPage'];
  for (var i = 0; i < modals.length; i++) {
    var el = document.getElementById(modals[i]);
    if (el && (el.classList.contains('show') || el.style.display !== 'none')) {
      if (el.classList.contains('show')) el.classList.remove('show');
      else el.style.display = 'none';
      history.pushState({ mathgame: true }, '');
      return;
    }
  }
  /* Modal class'lı açık olanlar */
  var openModal = document.querySelector('#clanModal.show, #questModal.show, #shopModal.show, #settingsModal.show, #aboutModal.show, #publicProfileModal.show, #profileModal.show, #superAdminModal.show, #adminModal.show');
  if (openModal) {
    openModal.classList.remove('show');
    try { closeModal(openModal); } catch(e) {}
    history.pushState({ mathgame: true }, '');
    return;
  }
  /* 2. Oyun ekranındaysa menüye dön */
  var gameArea = document.getElementById('gameArea');
  if (gameArea && gameArea.style.display !== 'none') {
    try { pauseGame(); } catch(e) {}
    return;
  }
  /* 3. Ana menüdeyse çıkış uyarısı */
  _backPressCount++;
  if (_backPressCount >= 2) {
    /* İkinci kez basıldı — çıkış */
    if (typeof AndroidInterface !== 'undefined') {
      AndroidInterface.exitApp();
    }
    return;
  }
  showToast('Çıkmak için tekrar basın', '#f59e0b');
  clearTimeout(_backPressTimer);
  _backPressTimer = setTimeout(function() { _backPressCount = 0; }, 2000);
  history.pushState({ mathgame: true }, '');
}

/* ── PWA Install — Tam düzeltme ─────────────────────── */
var _deferredInstallPrompt = null;
var _pwaInstalled = false;

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _deferredInstallPrompt = e;
  /* Tüm install butonlarını göster */
  document.querySelectorAll('.pwa-install-btn').forEach(function(b) {
    b.style.opacity = '1';
    b.style.pointerEvents = 'auto';
  });
  console.log('[PWA] beforeinstallprompt yakalandı ✅');
});

window.addEventListener('appinstalled', function() {
  _pwaInstalled = true;
  _deferredInstallPrompt = null;
  showToast('✅ MathGame ana ekrana eklendi!', '#00ff88');
});

window.installPWA = function() {
  /* Zaten standalone */
  if (window.matchMedia('(display-mode: standalone)').matches || _pwaInstalled) {
    showToast('✅ Uygulama zaten yüklü!', '#00ff88');
    return;
  }
  /* Native prompt — Android Chrome */
  if (_deferredInstallPrompt) {
    _deferredInstallPrompt.prompt();
    _deferredInstallPrompt.userChoice.then(function(r) {
      if (r.outcome === 'accepted') showToast('✅ Ana ekrana ekleniyor...', '#00ff88');
      _deferredInstallPrompt = null;
    }).catch(function(){});
    return;
  }
  /* iOS */
  var ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) { showIOSGuide(); return; }
  /* Diğer — menü rehberi */
  var msg = /samsung/.test(ua) ? 'Samsung Browser: Menü → Ana ekrana ekle'
    : /firefox/.test(ua) ? 'Firefox: Menü → Sayfayı yükle'
    : 'Tarayıcı menüsünden (⋮ veya ...) "Ana Ekrana Ekle" seç';
  showToast('📱 ' + msg, '#a855f7');
};

function showIOSGuide() {
  var ex = document.getElementById('iosGuideModal');
  if (ex) { ex.remove(); return; }
  var m = document.createElement('div');
  m.id = 'iosGuideModal';
  m.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.9);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(20px)';
  var steps = [
    ['⬆️',"Safari'de alttaki <strong style=\"color:#38bdf8\">Paylaş</strong> butonuna bas"],
    ['📌','<strong style="color:#38bdf8">Ana Ekrana Ekle</strong> seçeneğini seç'],
    ['✅','<strong style="color:var(--neon)">Ekle</strong> butonuna bas — tamamdır!'],
  ];
  m.innerHTML = "<div style=\"width:100%;max-width:460px;background:#0d1117;border-radius:24px 24px 0 0;padding:28px 20px 40px;animation:slideUp 0.3s ease\">" +
    "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:20px\">" +
      "<div style=\"font-family:var(--font-head);font-size:18px;font-weight:900\">🍎 iOS\'a Ekle</div>" +
      "<button onclick=\"document.getElementById(\'iosGuideModal\').remove()\" style=\"width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.08);border:none;color:var(--muted);cursor:pointer;font-size:14px\">✕</button>" +
    "</div>" +
    steps.map(function(s,i) {
      return '<div style="display:flex;gap:12px;align-items:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:12px;margin-bottom:10px">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:rgba(56,189,248,0.15);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">' + (i+1) + '</div>' +
        '<div><div style="font-size:14px;font-weight:700;margin-bottom:2px">' + s[0] + '</div><div style="font-size:12px;color:var(--muted)">' + s[1] + '</div></div>' +
      '</div>';
    }).join('') +
    '<div style="font-size:11px;color:var(--muted2);text-align:center">⚠️ Sadece Safari\'de çalışır</div>' +
  '</div>';
  m.addEventListener('click', function(e){ if(e.target===m) m.remove(); });
  document.body.appendChild(m);
}

/* ── Performans / Animasyon Ayarları ────────────────── */
function setAnimScale(scale) {
  state.animScale = scale;
  saveState();
  var ids = { 0:'animBtn0', 0.5:'animBtn05', 1:'animBtn1' };
  Object.keys(ids).forEach(function(k) {
    var btn = document.getElementById(ids[k]);
    if (!btn) return;
    var active = parseFloat(k) === scale;
    btn.style.border = active ? '2px solid var(--neon)' : '1px solid var(--border)';
    btn.style.background = active ? 'rgba(0,255,136,0.08)' : 'var(--glass)';
    btn.style.color = active ? 'var(--neon)' : 'var(--muted)';
    btn.style.fontWeight = active ? '800' : '700';
  });
  var label = document.getElementById('animScaleLabel');
  if (label) label.textContent = scale === 0 ? 'Kapalı' : scale + 'x';
  /* CSS değişkeni */
  document.documentElement.style.setProperty('--anim-scale', String(scale));
  document.documentElement.style.setProperty('--transition-dur', scale === 0 ? '0.001ms' : (0.3 / scale) + 's');
  if (scale === 0) {
    document.documentElement.style.setProperty('--anim-scale', '0.001');
  }
  showToast('✅ Animasyon: ' + (scale===0?'Kapalı':scale+'x'), '#00ff88');
}

function setLowPerf(on) {
  state.lowPerf = on;
  saveState();
  if (on) document.body.classList.add('low-perf');
  else    document.body.classList.remove('low-perf');
  var toggle = document.getElementById('lowPerfToggle');
  if (toggle) toggle.checked = on;
}

/* Ayarlar açılınca senkronize et */
(function() {
  var _origOpen = typeof openSettingsModal === 'function' ? openSettingsModal : null;
  if (_origOpen) {
    openSettingsModal = function() {
      _origOpen.apply(this, arguments);
      setTimeout(function() {
        /* Animasyon ölçeği */
        var sc = state.animScale !== undefined ? state.animScale : 1;
        setAnimScale(sc);
        /* Low perf */
        var lpt = document.getElementById('lowPerfToggle');
        if (lpt) lpt.checked = !!state.lowPerf;
        /* Konfeti */
        var ct = document.getElementById('confettiToggle');
        if (ct) ct.checked = !state.confettiOff;
      }, 80);
    };
  }
  /* Başlangıçta uygula */
  setTimeout(function() {
    if (state.lowPerf) setLowPerf(true);
    if (state.animScale !== undefined) setAnimScale(state.animScale);
  }, 600);
})();

/* spawnConfetti override — konfetti kapalıysa engelle */
(function() {
  var _orig = typeof spawnConfetti === 'function' ? spawnConfetti : null;
  if (_orig) {
    spawnConfetti = function(n) {
      if (state.confettiOff || state.lowPerf) return;
      var sc = state.animScale !== undefined ? state.animScale : 1;
      if (sc === 0) return;
      _orig(Math.round((n||20) * Math.min(sc, 1)));
    };
  }
})();

/* ── Admin Takvim Editörü — Görsel + Popup ────────────── */
function adminOpenCalendarEditor() {
  var ex = document.getElementById('calEditorModal');
  if (ex) { ex.remove(); return; }

  var now = new Date(Date.now() + 3*3600000);
  var year = now.getFullYear();
  var month = now.getMonth();
  var todayDay = now.getDate();
  var monthKey = now.toISOString().slice(0,7);
  var monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  var monthLabel = monthNames[month] + ' ' + year;

  var daysInMonth = new Date(year, month+1, 0).getDate();
  var firstDay = (new Date(year, month, 1).getDay() + 6) % 7; /* Pazartesi=0 */

  var rewards = window._cachedMonthlyRewards || window.DEFAULT_MONTHLY_REWARDS || [];
  for (var fi = rewards.length; fi < 31; fi++) {
    rewards.push({ day: fi+1, icon:'💰', reward:'coins', amount:(fi+1)*50, label:((fi+1)*50)+' Coin' });
  }

  /* Grid HTML */
  var cells = '';
  for (var bl = 0; bl < firstDay; bl++) cells += '<div></div>';
  for (var d = 1; d <= daysInMonth; d++) {
    var r = rewards[d-1] || { icon:'💰', label:'-' };
    var isPast = d < todayDay, isToday = d === todayDay;
    var cls = isPast ? 'past' : isToday ? 'today' : 'future';
    var dCopy = d;
    cells += '<div class="fc-cal-card ' + cls + ' admin-editable" onclick="adminCalDayPopup(' + dCopy + ')">' +
      '<div class="fc-cal-day-num" style="color:' + (isToday?'var(--neon)':'var(--muted)') + '">' + d + '</div>' +
      '<div class="fc-cal-icon">' + (r.icon||'💰') + '</div>' +
      '<div class="fc-cal-label">' + (r.label||'').split('+')[0].trim().slice(0,8) + '</div>' +
    '</div>';
  }

  var m = document.createElement('div');
  m.id = 'calEditorModal';
  m.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(4,6,12,0.97);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(20px)';
  m.innerHTML =
    '<div style="width:100%;max-width:480px;background:#0d1117;border:1px solid rgba(255,215,0,0.2);border-radius:20px;padding:18px 14px;max-height:90vh;overflow-y:auto">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
        '<div style="font-family:var(--font-head);font-size:16px;font-weight:900;color:#ffd700">📅 ' + monthLabel + ' Takvimi</div>' +
        '<button onclick="document.getElementById(\'calEditorModal\').remove()" style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.06);border:none;color:var(--muted);cursor:pointer;font-size:14px">✕</button>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.15);border-radius:8px;padding:6px 10px;margin-bottom:10px">💡 Herhangi bir güne dokun → ödülü düzenle</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:8px">' +
        ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(function(d){ return '<div style="font-size:8px;font-weight:800;color:var(--muted2);text-align:center;padding:3px 0">' + d + '</div>'; }).join('') +
      '</div>' +
      '<div class="fc-cal-grid" style="gap:3px">' + cells + '</div>' +
    '</div>';

  m.addEventListener('click', function(e){ if(e.target===m) m.remove(); });
  document.body.appendChild(m);
  window._calEditorMonth = monthKey;
  window._calEditorRewards = rewards.slice();
}

function adminCalDayPopup(day) {
  var ex = document.getElementById('calDayPopup');
  if (ex) ex.remove();
  var rewards = window._calEditorRewards || [];
  var r = rewards[day-1] || { reward:'coins', amount:day*50, icon:'💰', label:(day*50)+' Coin' };

  var popup = document.createElement('div');
  popup.id = 'calDayPopup';
  popup.className = 'cal-day-popup';
  popup.innerHTML =
    '<div class="cal-day-popup-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
        '<div style="font-family:var(--font-head);font-size:16px;font-weight:900;color:#ffd700">✏️ ' + day + '. Gün</div>' +
        '<button onclick="document.getElementById(\'calDayPopup\').remove()" style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.06);border:none;color:var(--muted);cursor:pointer;font-size:14px">✕</button>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div style="display:flex;gap:8px">' +
          '<input id="calPopIcon" class="admin-input" value="' + (r.icon||'💰') + '" placeholder="İkon" style="width:50px;flex:none;text-align:center;font-size:18px">' +
          '<select id="calPopType" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;padding:8px;font-family:inherit" onchange="calPopUpdateLabel()">' +
            '<option value="coins"' + (r.reward==='coins'?' selected':'') + '>💰 Coin</option>' +
            '<option value="diamonds"' + (r.reward==='diamonds'?' selected':'') + '>💎 Elmas</option>' +
            '<option value="joker_skip"' + (r.jkey==='skip'?' selected':'') + '>⏭️ Atlama Jokeri</option>' +
            '<option value="joker_hint"' + (r.jkey==='hint'?' selected':'') + '>💡 İpucu Jokeri</option>' +
            '<option value="joker_double"' + (r.jkey==='double'?' selected':'') + '>⚡ 2x Jokeri</option>' +
            '<option value="joker_freeze"' + (r.jkey==='freeze'?' selected':'') + '>🧊 Dondurma</option>' +
          '</select>' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<input id="calPopAmount" type="number" class="admin-input" value="' + (r.amount||day*50) + '" placeholder="Miktar" style="width:90px;flex:none">' +
          '<input id="calPopLabel" class="admin-input" value="' + (r.label||'').replace(/"/g,"&quot;") + '" placeholder="Etiket" style="flex:1">' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button onclick="calPopSave(' + day + ')" class="btn" style="flex:1;padding:11px">💾 Kaydet</button>' +
          '<button onclick="document.getElementById(\'calDayPopup\').remove()" class="btn ghost" style="flex:1;padding:11px">İptal</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  popup.addEventListener('click', function(e){ if(e.target===popup) popup.remove(); });
  document.body.appendChild(popup);
}

function calPopUpdateLabel() {
  var type = document.getElementById('calPopType').value;
  var amt  = document.getElementById('calPopAmount').value || '?';
  var map  = { coins:amt+' Coin', diamonds:amt+' Elmas', joker_skip:amt+' Atlama Jokeri', joker_hint:amt+' İpucu Jokeri', joker_double:amt+' 2x Jokeri', joker_freeze:amt+' Dondurma' };
  var el   = document.getElementById('calPopLabel');
  if (el) el.value = map[type] || amt + ' ödül';
}

async function calPopSave(day) {
  var icon   = (document.getElementById('calPopIcon').value || '').trim() || '💰';
  var type   = document.getElementById('calPopType').value;
  var amount = parseInt(document.getElementById('calPopAmount').value || '0');
  var label  = (document.getElementById('calPopLabel').value || '').trim();
  if (!amount || amount < 1) { showToast('Miktar gerekli', '#f59e0b'); return; }

  var reward = { day:day, icon:icon, label:label||(amount+' ödül') };
  if (type==='coins')         { reward.reward='coins';    reward.amount=amount; }
  else if (type==='diamonds') { reward.reward='diamonds'; reward.amount=amount; }
  else                        { reward.reward='joker'; reward.jkey=type.replace('joker_',''); reward.amount=amount; }

  var monthKey = window._calEditorMonth || (new Date(Date.now()+3*3600000)).toISOString().slice(0,7);
  var r = await adminCall('admin/calendar-update-day', { day:day, reward:reward, month:monthKey });
  if (r && r.ok) {
    showToast('✅ ' + day + '. gün güncellendi!', '#00ff88');
    if (window._calEditorRewards) window._calEditorRewards[day-1] = reward;
    if (window._cachedMonthlyRewards) window._cachedMonthlyRewards[day-1] = reward;
    window._cachedMonthlyKey = null;
    document.getElementById('calDayPopup').remove();
    /* Takvimi yenile */
    adminOpenCalendarEditor();
  } else {
    showToast('❌ ' + (r?r.error:'Hata'), '#ef4444');
  }
}

/* Admin paneli "Takvim Düzenle" butonunu bağla */
window.adminViewCalendar = adminOpenCalendarEditor;

/* ══════════════════════════════════════════════════════════════
   MathGame V3.5 — Frontend Patch
   1. iOS "Ana Ekrana Ekle" popup
   2. Android geri tuşu → modal kapat
   3. Düşük Güç Modu
   ══════════════════════════════════════════════════════════════ */

/* ── 1. iOS Safari "Ana Ekrana Ekle" rehber popup'ı ─────────── */
(function() {
  var isIOS        = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isSafari     = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  var isStandalone = (window.navigator.standalone === true)
                   || window.matchMedia('(display-mode: standalone)').matches;

  if (!isIOS || !isSafari || isStandalone) { return; }
  if (localStorage.getItem('mg_ios_install_dismissed')) { return; }

  var popup = document.createElement('div');
  popup.id = 'iosInstallPopup';
  popup.style.cssText = [
    'position:fixed', 'bottom:20px', 'left:50%', 'transform:translateX(-50%)',
    'z-index:99999', 'width:calc(100% - 40px)', 'max-width:400px',
    'background:#0d1420', 'border:1px solid rgba(0,255,136,0.25)',
    'border-radius:20px', 'padding:18px 20px',
    'box-shadow:0 8px 40px rgba(0,0,0,0.6)',
    'animation:slideUp .4s ease',
    'display:flex', 'flex-direction:column', 'gap:12px',
  ].join(';');
  popup.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px">' +
      '<img src="icon-192.png" style="width:48px;height:48px;border-radius:14px;flex-shrink:0" alt="MathGame">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:15px;font-weight:800;color:#e8f4f0">Ana Ekrana Ekle</div>' +
        '<div style="font-size:12px;color:rgba(232,244,240,0.55);margin-top:2px">MathGame\'i uygulama gibi kullan</div>' +
      '</div>' +
      '<button id="iosInstallClose" style="background:none;border:none;color:rgba(232,244,240,0.4);font-size:20px;cursor:pointer;flex-shrink:0;line-height:1;padding:0">✕</button>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:12px;padding:10px 12px">' +
        '<span style="font-size:20px">①</span>' +
        '<div style="font-size:13px;color:#e8f4f0">Alttaki <span style="background:rgba(0,122,255,0.15);border-radius:6px;padding:1px 6px;color:#4da3ff;font-size:12px">⬆️ Paylaş</span> butonuna dokun</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:12px;padding:10px 12px">' +
        '<span style="font-size:20px">②</span>' +
        '<div style="font-size:13px;color:#e8f4f0"><span style="font-weight:700;color:#00ff88">Ana Ekrana Ekle</span>\'yi seç</div>' +
      '</div>' +
    '</div>' +
    '<div style="text-align:center;margin-top:-4px">' +
      '<div style="display:inline-block;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid rgba(0,255,136,0.25)"></div>' +
    '</div>';

  setTimeout(function() {
    try {
      document.body.appendChild(popup);
      document.getElementById('iosInstallClose').addEventListener('click', function() {
        popup.remove();
        localStorage.setItem('mg_ios_install_dismissed', '1');
      });
    } catch(e) {}
  }, 3000);
})();

/* ── 2. Android geri tuşu → açık modalı kapat ───────────────── */
(function() {
  var MODAL_IDS = [
    'bgLibModal', 'achModal', 'superAdminModal', 'adminModal',
    'clanChatModal', 'shopModal', 'clanModal', 'questModal',
    'settingsModal', 'authModal', 'profileModal', 'publicProfileModal',
    'playerSearchPage', 'profileFullPage',
  ];

  /* Sayfa yüklenince base state koy */
  history.replaceState({ mg_base: true }, '');

  /* Modal açılışını izle — her "show" class eklenince pushState */
  var mgModalObserver = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var target = mutations[i].target;
      if (MODAL_IDS.indexOf(target.id) < 0) { continue; }
      if (target.classList.contains('show')) {
        history.pushState({ mg_modal: target.id }, '');
      }
    }
  });
  mgModalObserver.observe(document.body, {
    attributes: true, subtree: true, attributeFilter: ['class'],
  });

  /* Geri tuşu — üstteki açık modalı kapat */
  window.addEventListener('popstate', function() {
    for (var i = 0; i < MODAL_IDS.length; i++) {
      var el = document.getElementById(MODAL_IDS[i]);
      if (!el) { continue; }

      /* Tam sayfa modaller */
      if (el.id === 'playerSearchPage' || el.id === 'profileFullPage') {
        if (el.classList.contains('show')) { el.classList.remove('show'); return; }
        continue;
      }
      /* Klan chat — display:flex */
      if (el.id === 'clanChatModal') {
        if (el.style.display === 'flex') {
          try { closeClanChat(); } catch(e) { el.style.display = 'none'; }
          return;
        }
        continue;
      }
      /* Standart modallar */
      if (el.classList.contains('show')) {
        try { closeModal(el); } catch(e) { el.classList.remove('show'); }
        return;
      }
    }
  });
})();

/* ── 3. Düşük Güç Modu ───────────────────────────────────────── */
var _lowPowerMode = false;

(function() {
  try {
    _lowPowerMode = localStorage.getItem('mg_low_power') === '1';
    if (_lowPowerMode) { applyLowPowerMode(true); }
  } catch(e) {}
})();

function applyLowPowerMode(active) {
  var styleId  = 'mg-low-power-style';
  var existing = document.getElementById(styleId);
  if (active) {
    if (existing) { return; }
    var style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      '*, *::before, *::after {' +
      '  animation-duration: 0.001ms !important;' +
      '  animation-iteration-count: 1 !important;' +
      '  transition-duration: 0.001ms !important;' +
      '}' +
      '[style*="blur"], .desktop-topbar, .search-page-header {' +
      '  backdrop-filter: none !important;' +
      '  -webkit-backdrop-filter: none !important;' +
      '}' +
      '.desktop-widget, .admin-stat-card, .btn { box-shadow: none !important; }' +
      'body { background-attachment: scroll !important; }';
    document.head.appendChild(style);
  } else {
    if (existing) { existing.remove(); }
  }
}

function toggleLowPowerMode() {
  _lowPowerMode = !_lowPowerMode;
  try { localStorage.setItem('mg_low_power', _lowPowerMode ? '1' : '0'); } catch(e) {}
  applyLowPowerMode(_lowPowerMode);
  var btn = document.getElementById('lowPowerToggleBtn');
  if (btn) {
    btn.textContent   = _lowPowerMode ? 'Kapat' : 'Aç';
    btn.style.color   = _lowPowerMode ? '#00ff88' : 'var(--muted)';
    btn.style.borderColor = _lowPowerMode ? 'rgba(0,255,136,0.3)' : 'var(--border)';
  }
  showToast(_lowPowerMode ? '⚡ Düşük Güç Modu Açık' : '✨ Normal Mod',
            _lowPowerMode ? '#00ff88' : '#7c6fff');
}

/* Ayarlar modalı açılınca Düşük Güç Modu satırını enjekte et */
(function() {
  function injectLowPowerRow() {
    if (document.getElementById('lowPowerRow')) { return; }
    var saveBtn = document.getElementById('saveSettingsBtn');
    if (!saveBtn) { return; }
    var section = document.createElement('div');
    section.id = 'lowPowerRow';
    section.style.cssText = 'padding:16px 20px;border-bottom:1px solid var(--border)';
    section.innerHTML =
      '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:rgba(232,244,240,0.25);margin-bottom:12px">⚡ Performans</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
          '<div style="font-size:14px;color:#e8f4f0">Düşük Güç Modu</div>' +
          '<div style="font-size:11px;color:rgba(232,244,240,0.5);margin-top:2px">Animasyonları ve blur efektlerini kapat</div>' +
        '</div>' +
        '<button id="lowPowerToggleBtn" onclick="toggleLowPowerMode()" ' +
          'style="padding:7px 14px;border-radius:10px;border:1px solid var(--border);' +
          'background:var(--glass2);font-size:12px;font-weight:700;cursor:pointer;' +
          'font-family:inherit;color:' + (_lowPowerMode ? '#00ff88' : 'var(--muted)') + ';' +
          'border-color:' + (_lowPowerMode ? 'rgba(0,255,136,0.3)' : 'var(--border)') + '">' +
          (_lowPowerMode ? 'Kapat' : 'Aç') +
        '</button>' +
      '</div>';
    var saveRow = saveBtn.closest('div');
    if (saveRow && saveRow.parentNode) {
      saveRow.parentNode.insertBefore(section, saveRow);
    }
  }

  var settingsModalEl = document.getElementById('settingsModal');
  if (settingsModalEl) {
    new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (settingsModalEl.classList.contains('show')) {
          setTimeout(injectLowPowerRow, 50);
          break;
        }
      }
    }).observe(settingsModalEl, { attributes: true, attributeFilter: ['class'] });
  }
})();

/* ══════════════════════════════════════════════════════════════════════
   MathGame v4.0 — Yeni Özellikler JS Bloğu
   ══════════════════════════════════════════════════════════════════════
   İçerik:
   1. iOS Kontrol Merkezi (CC)
   2. Tema Market (Style Market)
   3. Hızlı Hesap Geçişi
   4. Discord OAuth giriş
   5. /me endpoint ile oturum kalıcılığı
   ══════════════════════════════════════════════════════════════════════ */

/* ── Yardımcı — lsGetJSON / lsSetJSON ───────────────────────────────── */
function v4lsGet(key, fb) {
  try { var v = localStorage.getItem(key); return v === null ? fb : v; } catch(e) { return fb; }
}
function v4lsSet(key, val) {
  try { localStorage.setItem(key, String(val)); } catch(e) {}
}
function v4lsGetJSON(key, fb) {
  try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch(e) { return fb; }
}
function v4lsSetJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

/* Kayıtlı hesaplar listesi — { token, uid, name, avatar, level } */
var _v4Accounts = v4lsGetJSON('mg_accounts_v4', []);

/* ── 2. HESAP GEÇİŞİ ────────────────────────────────────────────────── */

function v4GetCurrentToken() {
  /* Önce firebase authUser'dan, yoksa localStorage'dan */
  if (typeof authUser !== 'undefined' && authUser && authUser.sessionToken) return authUser.sessionToken;
  if (typeof authUser !== 'undefined' && authUser && authUser.workerToken)   return authUser.workerToken;
  return v4lsGet('mg_current_token', '') || '';
}

function v4SaveAccount(token, uid, name, avatar, level) {
  var idx = _v4Accounts.findIndex(function(a) { return a.uid === uid; });
  var entry = { token: token, uid: uid, name: name, avatar: avatar || '', level: level || 1, ts: Date.now() };
  if (idx >= 0) {
    _v4Accounts[idx] = entry;
  } else {
    _v4Accounts.push(entry);
    /* Max 5 hesap */
    if (_v4Accounts.length > 5) _v4Accounts = _v4Accounts.slice(-5);
  }
  v4lsSetJSON('mg_accounts_v4', _v4Accounts);
}

function ccRenderAccounts() {
  var container = document.getElementById('ccAccountsList');
  if (!container) return;
  if (_v4Accounts.length === 0) {
    container.innerHTML = '<div style="font-size:11px;color:var(--muted2);text-align:center;padding:8px 0">Kayıtlı hesap yok.</div>';
    return;
  }
  var currentUid = '';
  if (typeof authUser !== 'undefined' && authUser) currentUid = authUser.uid || '';

  var html = '';
  _v4Accounts.forEach(function(acc) {
    var isActive = acc.uid === currentUid;
    var avatarHtml = acc.avatar
      ? '<img src="' + acc.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.parentNode.textContent=acc.name?acc.name[0].toUpperCase():\'?\'">'
      : (acc.name ? acc.name[0].toUpperCase() : '?');
    html += '<div class="acct-item ' + (isActive ? 'acct-active' : '') + '" onclick="v4SwitchAccount(\'' + acc.token + '\')">' +
      '<div class="acct-av">' + avatarHtml + '</div>' +
      '<div class="acct-info">' +
        '<div class="acct-name">' + (acc.name || '—') + '</div>' +
        '<div class="acct-level">Seviye ' + (acc.level || 1) + '</div>' +
      '</div>' +
      (isActive ? '<span class="acct-check">✓</span>' : '') +
      '</div>';
  });
  container.innerHTML = html;
}

async function v4SwitchAccount(token) {
  if (!token) return;
  ccClose();
  showToast('⏳ Hesap yükleniyor...', '#7c6fff');
  try {
    var resp = await fetch(WORKER_URL + '/me', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    var data = await resp.json();
    if (!data.ok) { showToast('❌ Token geçersiz', '#ef4444'); return; }

    /* Mevcut oturumu kapat ve yenisini aç */
    v4lsSet('mg_current_token', token);
    /* sessionToken olarak authUser'a yaz */
    if (typeof authUser !== 'undefined' && authUser) {
      authUser.uid            = data.uid;
      authUser.name           = data.name;
      authUser.avatar         = data.avatar;
      authUser.sessionToken   = token;
      authUser.workerToken    = token;
      authUser.discordId      = data.discordId;
      authUser.score          = data.score || 0;
      authUser.level          = data.level || 1;
    }

    /* Hesabı güncelle */
    v4SaveAccount(token, data.uid, data.name, data.avatar, data.level);

    /* UI güncelle */
    if (typeof updateMiniInfo === 'function') updateMiniInfo();
    if (typeof refreshMenuPanels === 'function') refreshMenuPanels();

    showToast('✅ Hesap değiştirildi: ' + data.name, '#00ff88');
  } catch(e) {
    showToast('❌ Bağlantı hatası', '#ef4444');
  }
}

/* ── 3. DISCORD OAUTH (v4.0) ────────────────────────────────────────── */

function v4DiscordLogin() {
  /* Discord client ID'yi worker'dan çek veya doğrudan kullan */
  fetch(WORKER_URL + '/discord-oauth-url')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok || !data.url) {
        showToast('❌ Discord bağlantısı hazırlanamadı', '#ef4444');
        return;
      }
      var popup = window.open(data.url, 'discord_v4_auth', 'width=480,height=700,scrollbars=yes');
      if (!popup) { showToast('⚠️ Popup engellendi, izin verin', '#f59e0b'); return; }

      var handler = function(e) {
        if (!e.data || e.data.type !== 'DISCORD_OAUTH_SUCCESS') return;
        window.removeEventListener('message', handler);
        v4HandleDiscordSuccess(e.data);
      };
      window.addEventListener('message', handler);
    })
    .catch(function() {
      showToast('❌ Sunucu bağlantısı başarısız', '#ef4444');
    });
}

async function v4HandleDiscordSuccess(data) {
  var token    = data.sessionToken;
  var uid      = data.uid || ('discord_' + data.discordId);
  var name     = data.discordUsername;
  var avatar   = data.discordAvatar;

  if (!token) { showToast('❌ Token alınamadı', '#ef4444'); return; }

  v4lsSet('mg_current_token', token);
  v4SaveAccount(token, uid, name, avatar, 1);

  /* /me'den taze veri çek */
  try {
    var resp = await fetch(WORKER_URL + '/me', { headers: { 'Authorization': 'Bearer ' + token } });
    var me   = await resp.json();
    if (me.ok) {
      name   = me.name   || name;
      avatar = me.avatar || avatar;
      v4SaveAccount(token, uid, name, avatar, me.level || 1);
    }
  } catch(e) {}

  /* Mevcut authUser'ı güncelle — eğer zaten giriş yapılmışsa */
  if (typeof authUser !== 'undefined' && authUser) {
    authUser.discordId    = data.discordId;
    authUser.sessionToken = token;
    authUser.workerToken  = token;
    authUser.avatar       = avatar;
  } else {
    /* İlk giriş — auth modalı kapat ve oyunu aç */
    var am = document.getElementById('authModal');
    if (am) { am.classList.remove('show'); am.style.display = 'none'; }
    /* firebase-login tarzında devam et */
    showToast('🎮 Discord girişi başarılı: ' + name, '#5865F2');
  }

  if (typeof updateMiniInfo === 'function') updateMiniInfo();
  if (typeof refreshMenuPanels === 'function') refreshMenuPanels();
}

/* ── 4. /me SESSION KALICILIĞI ──────────────────────────────────────── */

/* Sayfa açılışında localStorage token varsa /me'den doğrula */
(function() {
  var savedToken = v4lsGet('mg_current_token', '');
  if (!savedToken) return;

  /* authUser zaten varsa güncelle, yoksa bekle */
  setTimeout(function() {
    fetch(WORKER_URL + '/me', { headers: { 'Authorization': 'Bearer ' + savedToken } })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.ok) return;
        /* CC ayarlarını buluttan yükle */
        if (data.settings) {
          if (data.settings.neonColor) {
            _ccSettings.neonColor = data.settings.neonColor;
            document.documentElement.style.setProperty('--neon', data.settings.neonColor);
          }
          if (data.settings.bgUrl) {
            _ccSettings.bgUrl = data.settings.bgUrl;
            document.body.style.backgroundImage  = 'url(' + data.settings.bgUrl + ')';
            document.body.style.backgroundSize   = 'cover';
            document.body.style.backgroundAttachment = 'fixed';
            var bgIn = document.getElementById('ccBgInput');
            if (bgIn) bgIn.value = data.settings.bgUrl;
          }
          ccSaveSettings();
        }
        if (data.backgroundUrl && !_ccSettings.bgUrl) {
          _ccSettings.bgUrl = data.backgroundUrl;
          document.body.style.backgroundImage  = 'url(' + data.backgroundUrl + ')';
          document.body.style.backgroundSize   = 'cover';
          document.body.style.backgroundAttachment = 'fixed';
          var bgIn2 = document.getElementById('ccBgInput');
          if (bgIn2) bgIn2.value = data.backgroundUrl;
          ccSaveSettings();
        }
        /* authUser varsa güncelle */
        if (typeof authUser !== 'undefined' && authUser && authUser.uid === data.uid) {
          if (data.avatar)  authUser.avatar  = data.avatar;
          if (data.level)   authUser.level   = data.level;
          if (data.score)   authUser.score   = data.score;
          if (data.name)    authUser.name    = data.name;
          authUser.sessionToken = savedToken;
          authUser.workerToken  = savedToken;
          authUser.discordId    = data.discordId;
          v4SaveAccount(savedToken, data.uid, data.name, data.avatar, data.level);
          if (typeof updateMiniInfo === 'function') updateMiniInfo();
        }
      })
      .catch(function() {});
  }, 1500);
})();

/* ── 5. TEMA MARKET ─────────────────────────────────────────────────── */

var _smStyles = [];
var _smActiveTab = 'browse';

function openStyleMarket() {
  var modal = document.getElementById('styleMarketModal');
  if (!modal) return;
  modal.classList.add('show');
  if (_smStyles.length === 0) smLoadStyles();
}

function closeStyleMarket() {
  var modal = document.getElementById('styleMarketModal');
  if (modal) modal.classList.remove('show');
}

function smShowTab(tab) {
  _smActiveTab = tab;
  document.getElementById('smTabBrowse').classList.toggle('active', tab === 'browse');
  document.getElementById('smTabPublish').classList.toggle('active', tab === 'publish');
  document.getElementById('smPanelBrowse').style.display  = tab === 'browse'  ? 'block' : 'none';
  document.getElementById('smPanelPublish').style.display = tab === 'publish' ? 'block' : 'none';
}

async function smLoadStyles() {
  var container = document.getElementById('smStyleList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted)">⏳ Yükleniyor...</div>';
  try {
    var resp = await fetch(WORKER_URL + '/styles');
    var data = await resp.json();
    _smStyles = (data && data.styles) ? data.styles : [];
    smRenderStyles();
  } catch(e) {
    if (container) container.innerHTML = '<div style="color:var(--warn);text-align:center;padding:20px;font-size:13px">❌ Temalar yüklenemedi</div>';
  }
}

function smRenderStyles() {
  var container = document.getElementById('smStyleList');
  if (!container) return;
  if (_smStyles.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px">' +
      '<div style="font-size:32px;margin-bottom:10px">🎨</div>' +
      'Henüz tema yok.<br><span style="font-size:11px">İlk temanı sen ekle!</span></div>';
    return;
  }
  var html = '';
  _smStyles.forEach(function(s, idx) {
    var sj    = s.styleJson || {};
    var neon  = sj.neonColor || '#00ff88';
    var bg    = sj.bgUrl ? 'url(' + sj.bgUrl + ')' : 'linear-gradient(135deg,' + neon + '22,#0d111788)';
    html += '<div class="style-card-item">' +
      '<div class="style-card-preview" style="background:' + bg + ';background-size:cover;background-position:center;border-color:' + neon + '44">' +
        (sj.bgUrl ? '' : '<span style="color:' + neon + ';font-size:18px">●</span>') +
      '</div>' +
      '<div class="style-card-info">' +
        '<div class="style-card-name">' + escapeHtml(s.styleName || 'Adsız Tema') + '</div>' +
        '<div class="style-card-author">@' + escapeHtml(s.creatorName || 'anonim') + '</div>' +
        '<div class="style-card-dl">⬇️ ' + (s.downloadCount || 0) + ' indirme</div>' +
      '</div>' +
      '<button class="style-apply-btn" onclick="smApplyStyle(' + idx + ')">Uygula</button>' +
      '</div>';
  });
  container.innerHTML = html;
}

async function smApplyStyle(idx) {
  var s = _smStyles[idx];
  if (!s || !s.styleJson) return;
  var sj = s.styleJson;
  if (sj.neonColor) {
    _ccSettings.neonColor = sj.neonColor;
    document.documentElement.style.setProperty('--neon', sj.neonColor);
    if (typeof state !== 'undefined') state.btnColor = sj.neonColor;
  }
  if (sj.bgUrl) {
    _ccSettings.bgUrl = sj.bgUrl;
    document.body.style.backgroundImage  = 'url(' + sj.bgUrl + ')';
    document.body.style.backgroundSize   = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
    var bgIn = document.getElementById('ccBgInput');
    if (bgIn) bgIn.value = sj.bgUrl;
  }
  ccSaveSettings();
  ccSyncToCloud();
  /* İndirme sayacını artır */
  try {
    await fetch(WORKER_URL + '/styles/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
    });
    s.downloadCount = (s.downloadCount || 0) + 1;
    smRenderStyles();
  } catch(e) {}
  showToast('🎨 Tema uygulandı: ' + (s.styleName || ''), '#00ff88');
}

async function smPublishCurrentTheme() {
  var nameInput = document.getElementById('smStyleNameInput');
  var themeName = nameInput ? nameInput.value.trim() : '';
  if (!themeName) { showToast('⚠️ Tema adı gir', '#f59e0b'); return; }

  var token = v4GetCurrentToken();
  if (!token) { showToast('⚠️ Önce giriş yapmalısın', '#f59e0b'); return; }

  var styleJson = { neonColor: _ccSettings.neonColor, bgUrl: _ccSettings.bgUrl || null };

  try {
    var resp = await fetch(WORKER_URL + '/styles/publish', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token: token, style_name: themeName, style_json: styleJson }),
    });
    var data = await resp.json();
    if (data.ok) {
      showToast('✅ Tema yayınlandı!', '#00ff88');
      if (nameInput) nameInput.value = '';
      smShowTab('browse');
      _smStyles = [];
      smLoadStyles();
    } else {
      showToast('❌ ' + (data.error || 'Hata'), '#ef4444');
    }
  } catch(e) {
    showToast('❌ Bağlantı hatası', '#ef4444');
  }
}

/* ── Discord Davet Linki ─────────────────────────────────────────────── */
var _discordInviteUrl = null;

async function v4OpenDiscordInvite(e) {
  if (e) e.preventDefault();
  /* Zaten biliyorsak direkt aç */
  if (_discordInviteUrl) { window.open(_discordInviteUrl, '_blank'); return; }

  /* Worker'dan çek */
  try {
    var resp = await fetch(WORKER_URL + '/discord-invite');
    var data = await resp.json();
    _discordInviteUrl = (data && data.inviteUrl) ? data.inviteUrl : null;
  } catch(err) {
    _discordInviteUrl = null;
  }

  if (_discordInviteUrl) {
    var btn = document.getElementById('discordInviteBtn');
    if (btn) btn.href = _discordInviteUrl;
    window.open(_discordInviteUrl, '_blank');
  } else {
    showToast('⚠️ Davet linki alınamadı', '#f59e0b');
  }
}

/* Sayfa yüklenince davet linkini önceden çek ve butona yaz */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    fetch(WORKER_URL + '/discord-invite')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.inviteUrl) {
          _discordInviteUrl = data.inviteUrl;
          var btn = document.getElementById('discordInviteBtn');
          if (btn) btn.href = data.inviteUrl;
        }
      })
      .catch(function() {});
  });
})();

/* authGoogleBtn mevcut fonksiyonla çalışıyor — dokunmuyoruz */
/* authDiscordBtn v4DiscordLogin'e bağlı */

/* ══════════════════════════════════════════════════════════════════════
   v4.0 — ANA MENÜ KAYDET BUTONU (full-save)
   Tüm profil + başarım + market + klan verilerini tek istekte Turso'ya yazar
   ══════════════════════════════════════════════════════════════════════ */

async function v4FullSave() {
  var btn   = document.getElementById('fullSaveBtn');
  var icon  = document.getElementById('fullSaveIcon');
  var label = document.getElementById('fullSaveLabel');
  var sub   = document.getElementById('fullSaveSub');
  var status= document.getElementById('fullSaveStatus');

  /* Token al */
  var token = v4GetCurrentToken();
  if (!token) {
    showToast('⚠️ Kaydetmek için giriş yapmalısın', '#f59e0b');
    return;
  }

  /* Buton yükleniyor durumu */
  if (btn) btn.disabled = true;
  if (icon) icon.textContent = '⏳';
  if (label) label.textContent = 'Kaydediliyor...';
  if (sub) sub.textContent = '';
  if (status) { status.style.display = 'none'; }

  try {
    /* Mevcut state'ten veri topla */
    var profileData = {};
    if (typeof state !== 'undefined') {
      profileData = {
        score:         state.score        || 0,
        level:         state.level        || 1,
        ops:           state.ops          || ['+','-','*','/'],
        coins:         state.coins        || 0,
        diamonds:      state.diamonds     || 0,
        jokers:        state.jokers       || {},
        inventory:     state.inventory    || [],
        loginStreak:   state.loginStreak  || 0,
        lastLoginDate: state.lastLoginDate|| null,
        clanId:        state.clanId       || null,
        stats:         state.stats        || {},
        achievements:  state.achievements || {},
        bio:           state.bio          || '',
        avatar:        state.avatar       || '',
        theme:         state.theme        || '',
        bg:            state.bgImage      || state.bg || null,
        backgroundUrl: state.bgImage      || state.bg || null,
        settings: {
          neonColor: state.btnColor || '#00ff66',
          bgUrl:     state.bgImage  || null,
          soundOn:   state.soundOn  !== false,
        },
        permTasks:     state.permTasks     || null,
        achieveTasks:  state.achieveTasks  || null,
        dailyTasksKey: state.dailyTasksKey || null,
        dailyTasksData:state.dailyTasksData|| null,
        _shopBuys:     state._shopBuys     || 0,
        _jokersUsed:   state._jokersUsed   || 0,
        _economyV26:   true,
      };
    }

    /* Klan verisi */
    var clanData = null;
    if (typeof state !== 'undefined' && state.clanId && typeof authUser !== 'undefined' && authUser) {
      clanData = {
        id: state.clanId,
        memberData: { name: authUser.name || '', lastSeen: Date.now() },
      };
    }

    /* Shop items — mağaza alımları */
    var shopItemsData = null;
    if (typeof state !== 'undefined' && state._shopBuys) {
      shopItemsData = { _shopBuys: state._shopBuys, jokers: state.jokers || {}, inventory: state.inventory || [] };
    }

    var payload = {
      token:      token,
      profile:    profileData,
      score:      profileData.score,
      level:      profileData.level,
      ops:        'all',
    };
    if (clanData)      payload.clan      = clanData;
    if (shopItemsData) payload.shopItems = shopItemsData;
    if (profileData.achievements && Object.keys(profileData.achievements).length > 0) {
      payload.achievements = profileData.achievements;
    }

    var resp = await fetch(WORKER_URL + '/full-save', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    var data = await resp.json();

    if (data.ok) {
      if (icon)  icon.textContent  = '✅';
      if (label) label.textContent = 'Kaydedildi!';
      if (sub)   sub.textContent   = '';
      if (status) {
        status.style.display = 'block';
        status.style.color   = 'var(--neon)';
        status.textContent   = '✓ Tüm veriler Turso\'ya yazıldı — ' + new Date().toLocaleTimeString('tr-TR');
      }
      showToast('✅ Hesap kaydedildi', '#00ff88');
      /* 3 saniye sonra butonu normale döndür */
      setTimeout(function() {
        if (btn)   btn.disabled      = false;
        if (icon)  icon.textContent  = '☁️';
        if (label) label.textContent = 'Hesabı Kaydet';
        if (sub)   sub.textContent   = '— tüm veri Turso\'ya yazılır';
      }, 3000);
    } else {
      throw new Error(data.error || 'Sunucu hatası');
    }
  } catch(e) {
    if (btn)   btn.disabled      = false;
    if (icon)  icon.textContent  = '❌';
    if (label) label.textContent = 'Kayıt Başarısız';
    if (sub)   sub.textContent   = '';
    if (status) {
      status.style.display = 'block';
      status.style.color   = 'var(--warn)';
      status.textContent   = e.message;
    }
    showToast('❌ Kayıt hatası: ' + e.message, '#ef4444');
    setTimeout(function() {
      if (btn)   btn.disabled      = false;
      if (icon)  icon.textContent  = '☁️';
      if (label) label.textContent = 'Hesabı Kaydet';
      if (sub)   sub.textContent   = '— tüm veri Turso\'ya yazılır';
    }, 4000);
  }
}

/* ══════════════════════════════════════════════════════════════════════
   v4.0 — BAŞARIM UNLOCK TURSO ENTEGRASYONU
   Orijinal unlockAchievement fonksiyonu çağrısını yakala,
   Turso'ya da yaz.
   ══════════════════════════════════════════════════════════════════════ */
(function() {
  /* Orijinal fonksiyonu yoksa bekle */
  var _patchInterval = setInterval(function() {
    if (typeof unlockAchievement !== 'function') return;
    clearInterval(_patchInterval);

    var _origUnlock = unlockAchievement;
    window.unlockAchievement = function(achKey) {
      /* Önce orijinali çalıştır */
      _origUnlock.apply(this, arguments);

      /* Sonra Turso'ya yaz */
      var token = v4GetCurrentToken();
      if (!token || !achKey) return;
      fetch(WORKER_URL + '/achievement/unlock', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: token, achievement_name: String(achKey) }),
      }).catch(function() {});
    };
  }, 500);
})();

/* ══════════════════════════════════════════════════════════════════════
   v4.0 — MAĞAZA ALIMI TURSO ENTEGRASYONU
   buyShopItem / completePurchase gibi fonksiyonları yakala
   ══════════════════════════════════════════════════════════════════════ */
(function() {
  var _shopPatchInterval = setInterval(function() {
    /* completePurchase veya buyItem fonksiyonu bekle */
    var fnName = typeof completePurchase === 'function' ? 'completePurchase'
               : typeof buyShopItem     === 'function' ? 'buyShopItem'
               : null;
    if (!fnName) return;
    clearInterval(_shopPatchInterval);

    var _origFn = window[fnName];
    window[fnName] = function() {
      _origFn.apply(this, arguments);
      /* Alım sonrası Turso'ya shop verisi yaz */
      setTimeout(function() {
        var token = v4GetCurrentToken();
        if (!token) return;
        var shopPayload = {
          token: token,
          shopItems: {
            _shopBuys:  (typeof state !== 'undefined' ? (state._shopBuys  || 0) : 0),
            jokers:     (typeof state !== 'undefined' ? (state.jokers     || {}) : {}),
            inventory:  (typeof state !== 'undefined' ? (state.inventory  || []) : []),
          },
        };
        fetch(WORKER_URL + '/full-save', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(shopPayload),
        }).catch(function() {});
      }, 300);
    };
  }, 800);
})();
