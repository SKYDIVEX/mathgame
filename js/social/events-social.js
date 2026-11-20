/* ══ MathGame · js/social/events-social.js ══ (index.html'de sırayla yüklenir) */
/* ══════════════════════════════════════════════════════
   EVENT SİSTEMİ
   ══════════════════════════════════════════════════════ */

async function adminCreateEvent() {
  var title = (document.getElementById('eventTitle').value || '').trim();
  var desc  = (document.getElementById('eventDesc').value || '').trim();
  var start = document.getElementById('eventStart').value;
  var end   = document.getElementById('eventEnd').value;
  var startTime = document.getElementById('eventStartTime').value || '00:00';
  var endTime   = document.getElementById('eventEndTime').value   || '23:59';
  var mult  = Number(document.getElementById('eventMult').value) || 2;
  if (!title) { adminLog('❌ Event adı gerekli'); return; }
  if (!start || !end) { adminLog('❌ Başlangıç ve bitiş tarihi gerekli'); return; }
  var startTs = new Date(start + 'T' + startTime + ':00').getTime();
  var endTs   = new Date(end   + 'T' + endTime   + ':59').getTime();
  if (endTs <= startTs) { adminLog('❌ Bitiş tarihi başlangıçtan sonra olmalı'); return; }
  var r = await adminCall('admin/create-event', { title, desc, startAt: startTs, endAt: endTs, multiplier: mult });
  if (r && r.ok) {
    adminLog('✅ Event oluşturuldu: ' + title + ' (' + start + ' ' + startTime + ' → ' + end + ' ' + endTime + ')');
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDesc').value  = '';
    adminLoadEvents();
    loadActiveEvents();
  } else {
    adminLog('❌ ' + (r ? r.error : 'Hata'));
  }
}

async function adminLoadEvents() {
  var r = await adminCall('admin/info', {});
  var el = document.getElementById('adminEventList');
  if (!el) { return; }
  try {
    var resp = await fetch(WORKER_URL + '/events');
    var events = await resp.json();
    if (!events || events.length === 0) {
      el.innerHTML = '<div style="color:var(--muted);font-size:11px;text-align:center;padding:4px">Aktif event yok</div>';
      return;
    }
    el.innerHTML = events.map(function(ev) {
      var end = new Date(ev.endAt).toLocaleDateString('tr-TR');
      return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:8px;display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<div style="font-size:12px;font-weight:700;color:#e6f7ea">' + ev.title + ' (×' + ev.multiplier + ')</div>' +
          '<div style="font-size:10px;color:var(--muted)">Bitiş: ' + end + '</div>' +
        '</div>' +
        '<button onclick="adminDeleteEvent(\`' + ev.id + '\`)" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:6px;color:#ef4444;padding:4px 8px;font-size:11px;cursor:pointer;font-family:inherit">🗑</button>' +
      '</div>';
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="color:#ef4444;font-size:11px">Hata</div>';
  }
}

async function adminDeleteEvent(eventId) {
  var r = await adminCall('admin/delete-event', { eventId });
  if (r && r.ok) { adminLog('✅ Event silindi'); adminLoadEvents(); loadActiveEvents(); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

/* Aktif event varsa oyun ekranında göster */
async function loadActiveEvents() {
  try {
    var resp = await fetch(WORKER_URL + '/events');
    if (!resp.ok) { throw new Error('HTTP ' + resp.status); }
    var events = await resp.json();
    var now = Date.now();
    var active = (events || []).filter(function(ev) {
      return ev.active && Number(ev.endAt) > now && Number(ev.startAt) <= now;
    });
    var banner = document.getElementById('eventBanner');
    if (active.length === 0) {
      window._activeEventMultiplier = 1;
      if (banner) { banner.style.display = 'none'; }
      return;
    }
    var ev = active[0];
    /* Multiplier'ı kesinlikle sayıya çevir */
    window._activeEventMultiplier = Math.max(1, Number(ev.multiplier) || 1);
    if (banner) {
      banner.style.display = 'flex';
      var iconEl  = document.getElementById('eventBannerIcon');
      var titleEl = document.getElementById('eventBannerTitle');
      var subEl   = document.getElementById('eventBannerSub');
      if (iconEl)  { iconEl.textContent  = ev.icon || '🎉'; }
      if (titleEl) { titleEl.textContent = ev.title || 'Event'; }
      if (subEl)   { subEl.textContent   = '×' + window._activeEventMultiplier + ' puan çarpanı aktif!'; }
    }
  } catch(e) {
    window._activeEventMultiplier = 1;
  }
}


function maskAdminName(name) {
  if (!name) { return '?***'; }
  var parts = name.trim().split(' ');
  return parts.map(function(part) {
    if (part.length <= 1) { return part; }
    return part[0] + '*'.repeat(part.length - 1);
  }).join(' ');
}


/* ══════════════════════════════════════════════════════
   SOSYAL — Avatar, Bio
   ══════════════════════════════════════════════════════ */

var ACH_RARITY = {"streak_100": "Efsane", "level_100": "Efsane", "score_50k": "Efsane", "streak_50": "Nadir", "level_50": "Nadir", "score_10k": "Nadir", "ans_500": "Nadir", "streak_20": "Değerli", "level_20": "Değerli", "score_5000": "Değerli"};
var AVATAR_LIST = ['😀','😎','🤩','🥳','😏','🤔','🥸','🧠','👾','🤖','🦊','🐺','🦁','🐯','🐻','🐼','🦄','🐲','🔥','⚡','💎','👑','🚀','🌟','🎮','🎯','🎲','⚔️','🛡️','💻'];

function toggleAvatarPicker() {
  var row = document.getElementById('avatarPickerRow');
  if (!row) { return; }
  var isOpen = row.style.display === 'flex';
  if (!isOpen) {
    /* Emojileri doldur */
    row.innerHTML = AVATAR_LIST.map(function(em) {
      return '<div onclick="selectAvatar(\`' + em + '\`)" style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer">' + em + '</div>';
    }).join('') +
    '<label style="width:40px;height:40px;border-radius:10px;background:rgba(0,255,102,0.08);border:1px solid rgba(0,255,102,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer" title="Galeriden seç">📷<input type="file" accept="image/*" style="display:none" onchange="uploadAvatarPhoto(this)"></label>';
    row.style.display = 'flex';
    /* profileCard'ı picker'a kaydır */
    setTimeout(function() { row.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);
  } else {
    row.style.display = 'none';
  }
}


function uploadAvatarPhoto(input) {
  var file = input.files[0];
  if (!file) { return; }
  /* Max 500KB */
  if (file.size > 5 * 1024 * 1024) {
    showToast('Fotoğraf çok büyük (max 5MB)', '#ef4444');
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    /* Avatar preview'ı fotoğraf olarak göster */
    var preview = document.getElementById('pmAvatar');
    if (preview) {
      preview.style.backgroundImage = 'url(' + dataUrl + ')';
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
      preview.textContent = '';
    }
    var bigAvatar = document.getElementById('pmAvatar');
    if (bigAvatar) {
      bigAvatar.style.backgroundImage = 'url(' + dataUrl + ')';
      bigAvatar.style.backgroundSize = 'cover';
      bigAvatar.style.backgroundPosition = 'center';
      bigAvatar.textContent = '';
    }
    if (!state.profile) { state.profile = {}; }
    state.profile.avatar = dataUrl;
    state._selectedAvatar = dataUrl;
    /* Picker'ı kapat */
    var row = document.getElementById('avatarPickerRow');
    if (row) { row.style.display = 'none'; }
    showToast('✅ Fotoğraf seçildi — kaydetmeyi unutma', '#00ff66');
  };
  reader.readAsDataURL(file);
}

function selectAvatar(emoji) {
  var preview = document.getElementById('pmAvatar');
  if (preview) {
    preview.style.backgroundImage = '';
    preview.textContent = emoji;
  }
  if (!state.profile) state.profile = {};
  state.profile.avatar = emoji;
  state._selectedAvatar = emoji;
  var row = document.getElementById('avatarPickerRow');
  if (row) { row.style.display = 'none'; }
  showToast('✅ Avatar seçildi — kaydetmeyi unutma', '#00ff66');
}

function applyAvatar(val) {
  if (!val) { return; }
  var isPhoto = val.startsWith('data:') || val.startsWith('http');
  function setEl(el, v) {
    if (!el) { return; }
    if (isPhoto) {
      el.style.backgroundImage = 'url(' + v + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.textContent = v;
    }
  }
  setEl(document.getElementById('pmAvatar'), val);
  setEl(document.getElementById('pmAvatar'), val);
  setEl(document.getElementById('pbAvatar'), val);
  if (!state.profile) { state.profile = {}; }
  state.profile.avatar = val;
  state._selectedAvatar = val;
}

/* Profil yüklenince bio ve avatar doldur */
function populateProfileSocial() {
  if (!state.profile) { return; }
  var bioEl = document.getElementById('pmBio');
  var bioCount = document.getElementById('pmBioCount');
  if (bioEl && state.profile.bio) {
    bioEl.value = state.profile.bio;
    if (bioCount) { bioCount.textContent = '(' + (120 - state.profile.bio.length) + ')'; }
  }
  if (state.profile.avatar) {
    applyAvatar(state.profile.avatar);
  }
}


/* ── FAB (Floating Action Button) ─────────────────── */
var _fabOpen = false;

function toggleFab() {
  if (_fabOpen) { closeFab(); } else { openFab(); }
}

function openFab() {
  _fabOpen = true;
  var menu = document.getElementById('fabMenu');
  var overlay = document.getElementById('fabOverlay');
  var btn = document.getElementById('fabBtn');
  if (menu) { menu.style.display = 'flex'; }
  if (overlay) { overlay.style.display = 'block'; }
  if (btn) { btn.style.transform = 'rotate(45deg)'; }
}

function closeFab() {
  _fabOpen = false;
  var menu = document.getElementById('fabMenu');
  var overlay = document.getElementById('fabOverlay');
  var btn = document.getElementById('fabBtn');
  if (menu) { menu.style.display = 'none'; }
  if (overlay) { overlay.style.display = 'none'; }
  if (btn) { btn.style.transform = 'rotate(0deg)'; }
}

function fabGo(target) {
  closeFab();
  if (target === 'home') {
    showScreen('menu');
  } else if (target === 'play') {
    if (!authUser && !state.player) { try { openAuthModal(); } catch(e) {} return; }
    showScreen('game');
    try { startGame(); } catch(e) {}
  } else if (target === 'lb') {
    showScreen('menu');
    setTimeout(function() {
      var el = document.getElementById('lbTabOnline');
      if (el) { el.click(); }
      var lbEl = document.querySelector('.lb');
      if (lbEl) { lbEl.scrollIntoView({ behavior: 'smooth' }); }
    }, 200);
  } else if (target === 'profile') {
    if (!authUser) { try { openAuthModal(); } catch(e) {} return; }
    try { openProfileModal(); } catch(e) {}
  } else if (target === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
