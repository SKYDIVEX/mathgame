/* ══ MathGame · js/admin/badges-scroll.js ══ (index.html'de sırayla yüklenir) */
/* ══════════════════════════════════════════════════════
   BADGE KÜTÜPHANESİ
   ══════════════════════════════════════════════════════ */

var _badgeLibrary = []; /* Cache */


async function adminShowUserList(filter) {
  var box = document.getElementById('adminUserListBox');
  if (!box) { return; }
  box.style.display = 'flex';
  box.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">&#x23F3; Yükleniyor...</div>';
  var r = await adminCall('admin/user-list', { filter: filter });
  if (!r || !r.ok) { box.innerHTML = '<div style="color:#ef4444;font-size:12px;padding:8px">Hata</div>'; return; }
  var users = r.users || [];
  if (users.length === 0) {
    box.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">Kimse yok</div>';
    return;
  }
  var roleColors = { superadmin: '#f59e0b', admin: '#f59e0b', moderator: '#38bdf8', banned: '#ef4444', user: 'var(--muted)' };
  var roleLabels = { superadmin: '👑', admin: '⚡', moderator: '🛡', banned: '🚫', user: '👤' };
  box.innerHTML = users.map(function(u) {
    if (u.note) return '<div style="color:var(--muted);font-size:11px;padding:4px">' + u.note + '</div>';
    var col = roleColors[u.role] || 'var(--muted)';
    var icon = roleLabels[u.role] || '👤';
    var extra = u.score ? ' — ' + u.score + 'p' : '';
    var banInfo = u.banReason ? '<div style="font-size:10px;color:#ef4444;opacity:0.7">' + u.banReason + '</div>' : '';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.05)">' +
      '<div>' +
        '<span style="color:' + col + ';font-size:11px;font-weight:700">' + icon + ' ' + u.name + extra + '</span>' +
        banInfo +
      '</div>' +
    '</div>';
  }).join('');
  adminLog('✅ ' + r.total + ' kullanici listelendi');
}


/* ── Scroll yardımcıları + Header quick actions ───── */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToLeaderboard() {
  var el = document.getElementById('lbSection') || document.querySelector('.lb');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function scrollToAchievements() {
  var el = document.getElementById('achievementsSection') || document.querySelector('.ach-grid-new');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    /* Başarımlar modalını aç */
    try { openAchModal(); } catch(e) {}
  }
}

/* Sayfa scroll edilince quick actions göster/gizle */
window.addEventListener('scroll', function() {
  var qa = document.getElementById('quickActions');
  if (!qa) { return; }
  /* 150px aşağı inince göster */
  if (window.scrollY > 150) {
    qa.style.display = 'flex';
  } else {
    qa.style.display = 'none';
  }
}, { passive: true });

async function adminLoadBadgeLibrary() {
  var r = await adminCall('admin/badge-library', {});
  if (!r || !r.ok) { adminLog('❌ Kütüphane yüklenemedi'); return; }
  _badgeLibrary = r.badges || [];
  var el = document.getElementById('adminBadgePickerList');
  if (!el) { return; }
  if (_badgeLibrary.length === 0) {
    el.innerHTML = '<div style="font-size:11px;color:var(--muted)">Kütüphane boş — Sistem sekmesinden badge ekle</div>';
    return;
  }
  el.innerHTML = _badgeLibrary.map(function(b) {
    var bg  = 'rgba(' + (b.color || '99,179,237') + ',0.15)';
    var col = '#' + (b.textColor || '63b3ed');
    var icon = b.icon || '🏅';
    var iconHtml;
    if (icon.startsWith('data:') || icon.startsWith('http')) {
      /* base64 veya URL — escapeHtml KULLANMA, src bozulur */
      iconHtml = '<img src="' + icon + '" style="width:20px;height:20px;border-radius:4px;object-fit:cover;vertical-align:middle;flex-shrink:0">';
    } else {
      iconHtml = '<span style="font-size:16px">' + icon + '</span>';
    }
    return '<div onclick="adminGiveBadgeFromLib(\`' + b.id + '\`)" ' +
      'style="padding:6px 10px;border-radius:10px;background:' + bg + ';border:1px solid rgba(' + (b.color || '99,179,237') + ',0.3);color:' + col + ';font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px" ' +
      'title="' + escapeHtml(b.label) + ' — tıkla ve ver">' +
      iconHtml + '<span>' + escapeHtml(b.label) + '</span>' +
    '</div>';
  }).join('');
  adminLog('✅ ' + _badgeLibrary.length + ' badge yüklendi');
}

async function adminGiveBadgeFromLib(badgeId) {
  var name = getAdminTarget();
  if (!name) { adminLog('Oyuncu adini gir'); return; }
  var badge = _badgeLibrary.find(function(b) { return b.id === badgeId; });
  if (!badge) { adminLog('Badge bulunamadi'); return; }
  /* showConfirm yerine direkt ver — z-index sorunu var */
  var logIcon = (badge.icon && (badge.icon.startsWith('data:') || badge.icon.startsWith('http'))) ? '🖼️' : (badge.icon || '🏅');
  adminLog('Veriliyor: ' + logIcon + ' ' + badge.label + ' → ' + name);
  var r = await adminCall('admin/badge-library-give', { targetName: name, badgeId: badgeId });
  if (r && r.ok) { adminLog('✅ ' + logIcon + ' ' + badge.label + ' → ' + name); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}


function selectLibIcon(el) {
  /* Önceki seçimi kaldır */
  document.querySelectorAll('#libIconPicker span').forEach(function(s) {
    s.style.border = '2px solid transparent';
    s.style.background = '';
  });
  el.style.border = '2px solid var(--neon)';
  el.style.background = 'rgba(0,255,102,0.1)';
  var input = document.getElementById('libBadgeIcon');
  if (input) { input.value = el.textContent; }
  updateLibPreview();
}

function selectLibColor(el, rgb, hex) {
  document.querySelectorAll('#libColorPicker div').forEach(function(d) {
    d.style.border = '2px solid transparent';
  });
  el.style.border = '2px solid white';
  var colorInput = document.getElementById('libBadgeColor');
  var textInput  = document.getElementById('libBadgeTextColor');
  if (colorInput) { colorInput.value = rgb; }
  if (textInput)  { textInput.value  = hex; }
  updateLibPreview();
}

function updateLibPreview() {
  var preview   = document.getElementById('libBadgePreview');
  var icon      = (document.getElementById('libBadgeIcon')?.value  || '🏅');
  var label     = (document.getElementById('libBadgeLabel')?.value || 'Önizleme');
  var color     = (document.getElementById('libBadgeColor')?.value || '251,191,36');
  var textColor = (document.getElementById('libBadgeTextColor')?.value || 'fbbf24');
  if (!preview) { return; }
  preview.style.background  = 'rgba(' + color + ',0.15)';
  preview.style.borderColor = 'rgba(' + color + ',0.3)';
  preview.style.color       = '#' + textColor;
  var iconHtml = (icon.startsWith('data:') || icon.startsWith('http'))
    ? '<img src="' + icon + '" style="width:20px;height:20px;border-radius:4px;object-fit:cover;vertical-align:middle">'
    : icon;
  preview.innerHTML = iconHtml + ' ' + (label || 'Önizleme');
}

async function adminAddBadgeToLibrary() {
  var icon      = (document.getElementById('libBadgeIcon')?.value || '').trim() || '🏅';
  var label     = (document.getElementById('libBadgeLabel')?.value || '').trim();
  var color     = (document.getElementById('libBadgeColor')?.value || '').trim() || '99,179,237';
  var textColor = (document.getElementById('libBadgeTextColor')?.value || '').trim() || '63b3ed';
  if (!label) { adminLog('❌ Badge adı gerekli'); return; }
  var badge = { icon, label, color, textColor };
  var r = await adminCall('admin/badge-library-add', { badge });
  if (r && r.ok) {
    adminLog('✅ ' + icon + ' ' + label + ' kütüphaneye eklendi');
    document.getElementById('libBadgeIcon').value = '';
    document.getElementById('libBadgeLabel').value = '';
    document.getElementById('libBadgeColor').value = '';
    document.getElementById('libBadgeTextColor').value = '';
    adminLoadBadgeLibraryFull();
    adminLoadBadgeLibrary();
  } else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

async function adminLoadBadgeLibraryFull() {
  var r = await adminCall('admin/badge-library', {});
  if (!r || !r.ok) { return; }
  _badgeLibrary = r.badges || [];
  var el = document.getElementById('adminLibraryList');
  if (!el) { return; }
  if (_badgeLibrary.length === 0) {
    el.innerHTML = '<div style="font-size:11px;color:var(--muted);text-align:center;padding:8px">Kütüphane boş</div>';
    return;
  }
  el.innerHTML = _badgeLibrary.map(function(b) {
    var bg = 'rgba(' + (b.color || '99,179,237') + ',0.1)';
    var col = '#' + (b.textColor || '63b3ed');
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px">' +
      '<span style="color:' + col + ';font-size:12px;font-weight:700">' + (b.icon || '🏅') + ' ' + b.label + '</span>' +
      '<button onclick="adminRemoveBadgeFromLib(\`' + b.id + '\`)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px" title="Sil">🗑</button>' +
    '</div>';
  }).join('');
}

async function adminRemoveBadgeFromLib(badgeId) {
  var ok = await showConfirm('Badge Sil', 'Bu badge kutuphaneden silinecek. Oyunculardaki badge etkilenmez.');
  if (!ok) { return; }
  var r = await adminCall('admin/badge-library-remove', { badgeId });
  if (r && r.ok) { adminLog('✅ Badge kütüphaneden silindi'); adminLoadBadgeLibraryFull(); adminLoadBadgeLibrary(); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}



function loadLibIconFromMedia(input) {
  var file = input.files[0];
  if (!file) { return; }
  if (file.size > 2 * 1024 * 1024) { adminLog('Resim max 2MB olmalı'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var hidden = document.getElementById('libBadgeIcon');
    if (hidden) { hidden.value = e.target.result; }
    var preview = document.getElementById('libBadgePreview');
    if (preview) {
      preview.style.backgroundImage = 'url(' + e.target.result + ')';
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
      preview.textContent = '';
    }
    adminLog('✅ Resim seçildi');
  };
  reader.readAsDataURL(file);
}
function loadBadgeIconImage(input) {
  var file = input.files[0];
  if (!file) { return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var preview = document.getElementById('badgeIconPreview');
    var hidden  = document.getElementById('badgeIcon');
    if (preview) {
      preview.textContent = '';
      preview.style.backgroundImage = 'url(' + e.target.result + ')';
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
    }
    if (hidden) { hidden.value = e.target.result; }
  };
  reader.readAsDataURL(file);
}

async function adminRemoveBadgeById(targetName, badgeId) {
  var r = await adminCall('admin/remove-badge', { targetName: targetName, badgeId: badgeId });
  if (r && r.ok) {
    adminLog('Badge kaldirildi');
    /* Profili yenile */
    if (_pubProfileData && _pubProfileData.name) {
      _pubProfileData.badges = (_pubProfileData.badges || []).filter(function(b) { return b.id !== badgeId; });
      /* pubCurrentBadges'ı güncelle */
      if (typeof openPublicProfile === 'function') { openPublicProfile(_pubProfileData); }
    }
    showToast('Badge kaldırıldı');
  } else adminLog('Hata: ' + (r ? r.error : 'bilinmiyor'));
}
async function adminRemoveBadgePrompt() {
  var name = getAdminTarget();
  if (!name) { adminLog('❌ Oyuncu adı gerekli'); return; }
  var badgeId = prompt('Kaldırılacak badge ID (oyuncu profilinde görünür):');
  if (!badgeId) { return; }
  var r = await adminCall('admin/remove-badge', { targetName: name, badgeId: badgeId.trim() });
  if (r && r.ok) { adminLog('✅ Badge kaldırıldı'); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

async function adminGiveBadge() {
  var name = getAdminTarget();
  var icon = (document.getElementById('badgeIcon').value || '').trim() || '🏅';
  var label = (document.getElementById('badgeLabel').value || '').trim();
  var color = (document.getElementById('badgeColor').value || '').trim() || '99,179,237';
  var textColor = (document.getElementById('badgeTextColor').value || '').trim() || '63b3ed';
  if (!name) { adminLog('❌ Oyuncu adı gerekli'); return; }
  if (!label) { adminLog('❌ Badge adı gerekli'); return; }
  var badge = { id: Date.now().toString(), icon, label, color, textColor };
  var r = await adminCall('admin/give-badge', { targetName: name, badge });
  if (r && r.ok) { adminLog('✅ Badge verildi: ' + label); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

async function adminRemoveBadge() {
  var name = getAdminTarget();
  if (!name) { adminLog('❌ Oyuncu adı gerekli'); return; }
  var badgeId = prompt('Kaldırılacak badge ID (oyuncu profilinden görünür):');
  if (!badgeId) { return; }
  var r = await adminCall('admin/remove-badge', { targetName: name, badgeId });
  if (r && r.ok) { adminLog('✅ Badge kaldırıldı'); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}


async function adminGiveMod() {
  var name = (document.getElementById('adminModName')?.value || '').trim();
  if (!name) { adminLog('❌ Kullanıcı adı gerekli'); return; }
  var r = await adminCall('admin/give-mod', { targetName: name });
  if (r && r.ok) { adminLog('✅ ' + name + ' moderatör yapıldı'); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

async function adminRemoveMod() {
  var name = (document.getElementById('adminModName')?.value || '').trim();
  if (!name) { adminLog('❌ Kullanıcı adı gerekli'); return; }
  var r = await adminCall('admin/remove-mod', { targetName: name });
  if (r && r.ok) { adminLog('✅ ' + name + ' yetkililikten çıkarıldı'); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

/* Admin paneli açılınca rolü göster */
async function updateAdminRoleBadge() {
  try {
    var r = await adminCall('admin/my-role', {});
    var badge = document.getElementById('adminRoleBadge');
    if (!badge || !r) { return; }
    if (r.role === 'superadmin') { badge.innerHTML = '<span class="role-badge-admin">👑 Süper Admin</span>'; }
    else if (r.role === 'admin')  { badge.innerHTML = '<span class="role-badge-admin">⚡ Admin</span>'; }
    else if (r.role === 'moderator') { badge.innerHTML = '<span class="role-badge-mod">🛡 Yetkili</span>'; }
  } catch(e) {}
}

async function adminGiveAdmin() {
  const name = (document.getElementById('adminNewAdminName')?.value || '').trim();
  if (!name) { adminLog('❌ Kullanıcı adı gerekli'); return; }
  const r = await adminCall('admin/give-admin', { targetName: name });
  if (r?.ok) adminLog('✅ ' + r.message);
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminRemoveAdmin() {
  const name = (document.getElementById('adminNewAdminName')?.value || '').trim();
  if (!name) { adminLog('❌ Kullanıcı adı gerekli'); return; }
  const r = await adminCall('admin/remove-admin', { targetName: name });
  if (r?.ok) adminLog('✅ ' + r.message);
  else adminLog('❌ ' + (r?.error || 'Hata'));
}
