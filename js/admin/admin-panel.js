/* ══ MathGame · js/admin/admin-panel.js ══ (index.html'de sırayla yüklenir) */
/* ══════════════════════════════════════════════════════
   ADMIN PANELİ
   ══════════════════════════════════════════════════════ */

const ADMIN_EMAIL = 'enesseker2113@gmail.com'; /* ← senin Google mailin */

/* Admin mi? */
function isAdminUser() {
  if (!authUser) return false;
  return authUser.isAdmin === true || _adminVerified;
}

async function checkAdminFromServer() {
  return await checkAdminStatus();
}

let _adminChecked  = false;
let _adminVerified = false;

async function checkAdminStatus() {
  if (_adminChecked) return _adminVerified;
  _adminChecked = true;
  try {
    /* 1. E-posta kontrolü — anında sonuç */
    if (authUser && authUser.email === ADMIN_EMAIL) {
      _adminVerified = true;
      return true;
    }
    /* 2. Worker kontrolü */
    const result = await workerPost('admin/info', { token: authUser?.token });
    _adminVerified = result.ok === true;
  } catch(e) { _adminVerified = false; }
  return _adminVerified;
}

/* Admin paneli aç — gizli: profil butonuna 3 kez hızlı bas */
let _profileTapCount = 0, _profileTapTimer = null;
document.addEventListener('DOMContentLoaded', () => {
  const pb = document.getElementById('profileBtn');
  if (pb) pb.addEventListener('click', () => {
    _profileTapCount++;
    clearTimeout(_profileTapTimer);
    _profileTapTimer = setTimeout(() => { _profileTapCount = 0; }, 800);
    if (_profileTapCount >= 3) {
      _profileTapCount = 0;
      openAdminPanel();
    }
  });

  /* Admin modal kapat */
  document.getElementById('closeAdminModal').addEventListener('click', () => {
    closeModal(document.getElementById('adminModal'));
    clickSound();
  });
});

async function openAdminPanel() {
  if (!authUser) { showToast('Önce giriş yap', '#ef4444'); return; }
  const ok = await checkAdminStatus();
  if (!ok) { showToast('⛔ Yetkisiz erişim', '#ef4444'); return; }
  document.getElementById('adminModal').classList.add('show');
  clickSound();
  adminLog('Admin paneli açıldı. Hoş geldin ' + authUser.name + '!');
  adminLoadStats();
  try { updateAdminRoleBadge(); } catch(e) {}
  var isSA = isSuperAdminUser();
  var saSection = document.getElementById('superAdminSection');
  var saEntry = document.getElementById('superAdminEntrySection');
  if (saSection) saSection.style.display = isSA ? 'block' : 'none';
  if (saEntry) saEntry.style.display = isSA ? 'block' : 'none';
  try { await workerPost('admin/write-log', { token: authUser.token, action: 'panel-open', detail: authUser.name + ' paneli açtı' }); } catch(e) {}
}

function adminLog(msg) {
  var el = document.getElementById('adminLog');
  if (!el) { return; }
  var time = new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  var isError   = msg.indexOf('❌') !== -1;
  var isSuccess = msg.indexOf('✅') !== -1;
  var isWait    = msg.indexOf('⏳') !== -1;
  var color = isError ? '#ef4444' : isSuccess ? '#00ff66' : isWait ? '#f59e0b' : '#86efac';
  var line = '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:4px"><span style="color:' + color + '">[' + time + '] ' + msg + '</span></div>';
  el.innerHTML = line + el.innerHTML;
}

function adminSwitchTab(tab) {
  document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('adminTab-' + tab);
  if (panel) panel.classList.add('active');
  // Aktif butonu işaretle
  const btns = document.querySelectorAll('.admin-tab-btn');
  const tabNames = ['stats','players','bans','requests','system'];
  const idx = tabNames.indexOf(tab);
  if (btns[idx]) btns[idx].classList.add('active');
  // Otomatik yükle
  if (tab === 'bans') adminLoadBans();
  if (tab === 'requests') adminLoadRequests('open');
  if (tab === 'stats')  adminLoadStats();
  if (tab === 'logs')   adminLoadLogs();
  if (tab === 'system') { try { adminLoadBadgeLibraryFull(); } catch(e) {} }
}

function getAdminTarget() {
  return (document.getElementById('adminTargetName')?.value || '').trim();
}
function getAdminOps() {
  const v = (document.getElementById('adminOps')?.value || '').trim();
  return v || 'all';
}

async function adminCall(endpoint, extra = {}) {
  if (!authUser) {
    adminLog('❌ Giriş yapılmamış');
    return null;
  }
  /* Token yoksa Firebase UID'den fb_ prefix token üret */
  var token = authUser.token;
  if (!token && authUser.uid) {
    token = 'fb_' + authUser.uid;
    authUser.token = token;
    saveAuth(authUser);
    adminLog('⚡ Token yenilendi');
  }
  if (!token) {
    adminLog('❌ Token alınamadı — çıkış yapıp tekrar giriş yap');
    return null;
  }
  try {
    const result = await workerPost(endpoint, { token: token, ...extra });
    if (result && result.kvLimit) {
      adminLog('\u23F0 KV limit doldu \u2014 gece 03:00da sifirlanir');
      return null;
    }
    return result;
  } catch(e) {
    adminLog('❌ Hata: ' + e.message);
    return null;
  }
}

async function adminLoadStats() {
  adminLog('⏳ İstatistikler yükleniyor...');
  const r = await adminCall('admin/stats');
  if (r?.ok) {
    document.getElementById('statPlayers').textContent   = r.totalPlayers;
    document.getElementById('statBans').textContent      = r.totalBans;
    document.getElementById('statRequests').textContent  = r.totalRequests;
    document.getElementById('statOpenReqs').textContent  = r.openRequests;
    adminLog('✅ İstatistikler yüklendi');
  } else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminPlayerInfo() {
  const name = getAdminTarget();
  if (!name) { adminLog('❌ Oyuncu adı gerekli'); return; }
  adminLog('⏳ ' + name + ' bilgisi çekiliyor...');
  const r = await adminCall('admin/player-info', { targetName: name });
  const box = document.getElementById('adminPlayerInfoBox');
  if (r?.ok) {
    const created = r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR') : '?';
    const banInfo = r.banned ? '🚫 ' + r.banned.reason : '✅ Temiz';
    box.style.display = 'block';
    var isSuperAdmin = authUser && authUser.uid === 'BvXY0zGZtle3fFoHHUnbW1UkaMu1';
    var emailLine = isSuperAdmin ? ('<br>📧 E-posta: <b style="color:#e6f7ea">' + (r.email || '?') + '</b>') : '';
    var pinLine   = isSuperAdmin ? ('<br>🔑 PIN: ' + (r.hasPin ? '✅ Ayarlı' : '❌ Yok')) : '';
    box.innerHTML = '<b style="color:#e6f7ea;font-size:14px">' + r.name + '</b>' +
      '<span style="margin-left:6px;font-size:10px;padding:2px 6px;background:rgba(255,255,255,0.07);border-radius:4px">' + (r.role || 'user') + '</span><br>' +
      '<span style="font-size:10px;word-break:break-all;opacity:0.5">' + r.uid + '</span><br>' +
      'Giriş: ' + (r.provider === 'google' ? '🔵 Google' : '📧 E-posta') +
      emailLine + pinLine + '<br>' +
      'Kayıt: ' + created + '<br>' +
      'Skor: <b style="color:var(--neon)">' + r.score + 'p</b> | Sıra: #' + (r.rank || '?') + '<br>' +
      'Durum: ' + banInfo +
      (r.badges && r.badges.length > 0 ? '<br>Badge: ' + r.badges.map(function(b){return b.icon + ' ' + b.label;}).join(', ') : '');
    adminLog('✅ Bilgi yüklendi');
  } else {
    box.style.display = 'none';
    adminLog('❌ ' + (r?.error || 'Bulunamadı'));
  }
}

async function adminSetScore() {
  const name  = getAdminTarget();
  const score = parseInt(document.getElementById('adminScore')?.value);
  const ops   = getAdminOps();
  if (!name || isNaN(score)) { adminLog('❌ Oyuncu adı ve skor gerekli'); return; }
  adminLog('⏳ ' + name + ' → ' + score + 'p...');
  const r = await adminCall('admin/set-score', { targetName: name, score, ops });
  if (r && r.ok) { adminLog('✅ ' + r.name + ' skoru: ' + r.newScore + 'p'); fetchOnlineLeaderboard(); }
  else adminLog('❌ ' + (r ? (r.error || JSON.stringify(r)) : 'Sunucu yanıt vermedi — Worker deploy edildi mi?'));
}

async function adminRemovePlayer() {
  const name = getAdminTarget();
  const ops  = getAdminOps();
  if (!name) { adminLog('❌ Oyuncu adı gerekli'); return; }
  const ok = await showConfirm('Tablodan Çıkar', '"' + name + '" liderlik tablosundan çıkarılacak. Emin misin?');
  if (!ok) return;
  adminLog('⏳ ' + name + ' çıkarılıyor...');
  const r = await adminCall('admin/remove-player', { targetName: name, ops });
  if (r?.ok) { adminLog('✅ ' + r.removed + ' tablodan çıkarıldı'); fetchOnlineLeaderboard(); }
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

function adminOpenChat() {
  var btn = document.getElementById('adminChatBtn');
  if (!btn || !btn.dataset.uid) { adminLog('❌ Önce oyuncu bilgisini çek'); return; }
  closeModal(document.getElementById('adminModal'));
  setTimeout(function() {
    openAdminChatFor(btn.dataset.uid, btn.dataset.name);
  }, 200);
}

async function adminBan() {
  const name   = getAdminTarget();
  const reason = (document.getElementById('adminBanReason')?.value || '').trim() || 'kural ihlali';
  if (!name) { adminLog('❌ Oyuncu adı gerekli'); return; }
  const ok = await showConfirm('Banla', '"' + name + '" yasaklanacak: ' + reason);
  if (!ok) return;
  adminLog('⏳ ' + name + ' banlanıyor...');
  const r = await adminCall('admin/ban', { targetName: name, reason });
  if (r?.ok) adminLog('✅ ' + r.message);
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminUnban() {
  const name = getAdminTarget();
  if (!name) { adminLog('❌ Oyuncu adı gerekli'); return; }
  adminLog('⏳ ' + name + ' banı kaldırılıyor...');
  const r = await adminCall('admin/unban', { targetName: name });
  if (r?.ok) adminLog('✅ ' + r.message);
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminLoadBans() {
  adminLog('⏳ Ban listesi yükleniyor...');
  const r = await adminCall('admin/ban-list');
  const el = document.getElementById('adminBanList');
  if (!el) return;
  if (r?.ok) {
    if (r.bans.length === 0) { el.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">Ban yok</div>'; return; }
    el.innerHTML = r.bans.map(b =>
      '<div class="admin-ban-card">' +
        '<div><div class="admin-ban-name">🚫 ' + b.name + '</div>' +
        '<div class="admin-ban-reason">' + (b.reason||'?') + ' · ' + new Date(b.bannedAt).toLocaleDateString('tr-TR') + '</div></div>' +
        '<button class="admin-btn admin-btn-green" style="font-size:11px;padding:6px 10px" onclick="adminUnbanById(`' + b.name + '`)">Kaldır</button>' +
      '</div>'
    ).join('');
    adminLog('✅ ' + r.bans.length + ' banlı kullanıcı');
  } else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminUnbanById(name) {
  const r = await adminCall('admin/unban', { targetName: name });
  if (r?.ok) { adminLog('✅ ' + r.message); adminLoadBans(); }
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminLoadRequests(status) {
  if (!status) { status = 'open'; }
  adminLog('⏳ İstekler yükleniyor...');
  var r = await adminCall('admin/requests', { status: status });
  var el = document.getElementById('adminRequestList');
  if (!el) { return; }
  if (!r || !r.ok) { adminLog('❌ ' + (r ? r.error : 'Hata')); return; }
  if (!r.requests || r.requests.length === 0) {
    el.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">İstek yok</div>';
    adminLog('✅ İstek yok');
    return;
  }
  el.innerHTML = r.requests.map(function(req) {
    var typeLabels   = { bug:'🐛 Bug', unban:'🔓 Unban', suggestion:'💡 Öneri', report:'⚠️ Şikayet', reset:'🔑 Şifre', other:'📝 Diğer' };
    var statusLabels = { open:'⏳ Açık', resolved:'✅ Çözüldü', rejected:'❌ Reddedildi' };
    var typeClass    = 'req-type-' + (req.type || 'other');
    var statusClass  = 'status-' + (req.status || 'open');
    var typeLabel    = typeLabels[req.type]   || req.type;
    var statusLabel  = statusLabels[req.status] || req.status;
    var codeHtml     = req.code ? '<div class="admin-req-code">Kod: ' + req.code + '</div>' : '';
    var adminNoteHtml = req.adminNote ?
      '<div style="font-size:11px;color:#38bdf8;margin-top:4px;padding:4px 8px;background:rgba(56,189,248,0.08);border-radius:6px">💬 Admin yanıtı: ' + req.adminNote + '</div>' : '';
    /* Thread — admin tam isimleri görür */
    var threadHtml = '';
    if (req.thread && req.thread.length > 0) {
      threadHtml = '<div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;padding:8px;background:rgba(255,255,255,0.02);border-radius:8px">';
      req.thread.forEach(function(msg) {
        var isAdm = msg.role === 'admin';
        var col  = isAdm ? '#38bdf8' : '#a3e6bb';
        var time = new Date(msg.ts).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
        threadHtml += '<div style="font-size:11px;color:' + col + '">' +
          '<b>' + (isAdm ? '⚡' : '👤') + ' ' + (msg.name || '?') + '</b> ' +
          '<span style="opacity:0.5">' + time + '</span>: ' + escapeHtml(msg.text) +
        '</div>';
      });
      threadHtml += '</div>';
    }

    var actionsHtml = '<div style="display:flex;flex-direction:column;gap:4px;margin-top:6px">' +
      threadHtml +
      '<div style="display:flex;gap:4px;margin-top:2px">' +
        '<input id="note_' + req.id + '" class="admin-input" placeholder="Yanıt yaz..." style="font-size:11px;padding:6px 10px;flex:1">' +
        '<button class="admin-btn admin-btn-gray" style="font-size:12px;padding:5px 10px" onclick="adminSendReqMsg(`' + req.id + '`)">➤</button>' +
      '</div>' +
      (req.status === 'open' ?
        '<div style="display:flex;gap:4px">' +
          '<button class="admin-btn admin-btn-green" style="font-size:11px;padding:5px 10px;flex:1" onclick="adminResolveReqWithNote(`' + req.id + '`,`resolved`)">✅ Çöz</button>' +
          '<button class="admin-btn admin-btn-red" style="font-size:11px;padding:5px 10px;flex:1" onclick="adminResolveReqWithNote(`' + req.id + '`,`rejected`)">❌ Reddet</button>' +
        '</div>' : adminNoteHtml) +
    '</div>';
    return '<div class="admin-req-card">' +
      '<div class="admin-req-header">' +
        '<span class="admin-req-type ' + typeClass + '">' + typeLabel + '</span>' +
        '<span class="admin-req-status ' + statusClass + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="admin-req-name">' + req.name + '</div>' +
      '<div class="admin-req-msg">' + req.message + '</div>' +
      codeHtml + actionsHtml +
    '</div>';
  }).join('');
  adminLog('✅ ' + r.requests.length + ' istek yüklendi');
}


async function adminSendReqMsg(requestId) {
  var input = document.getElementById('note_' + requestId);
  if (!input) { return; }
  var text = (input.value || '').trim();
  if (!text) { adminLog('❌ Mesaj boş'); return; }
  input.value = '';
  var r = await adminCall('request-message', { requestId: requestId, message: text });
  if (r && r.ok) {
    adminLog('✅ Mesaj gönderildi');
    adminLoadRequests('open');
  } else {
    adminLog('❌ ' + (r ? r.error : 'Hata'));
  }
}

async function adminResolveReq(id, status) {
  const r = await adminCall('admin/resolve-request', { id, status });
  if (r && r.ok) { adminLog('✅ İstek güncellendi'); adminLoadRequests('open'); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

async function adminResolveReqWithNote(id, status) {
  var noteEl = document.getElementById('note_' + id);
  var adminNote = noteEl ? noteEl.value.trim() : '';
  const r = await adminCall('admin/resolve-request', { id, status, adminNote });
  if (r && r.ok) { adminLog('✅ İstek güncellendi' + (adminNote ? ' (yanıt eklendi)' : '')); adminLoadRequests('open'); }
  else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

async function adminResetPass() {
  const name = getAdminTarget();
  const pass = (document.getElementById('adminNewPass')?.value || '').trim();
  if (!name || !pass) { adminLog('❌ Oyuncu adı ve yeni şifre gerekli'); return; }
  if (pass.length < 6) { adminLog('❌ Şifre en az 6 karakter'); return; }
  const ok = await showConfirm('Şifre Sıfırla', '"' + name + '" kullanıcısının şifresi sıfırlanacak.');
  if (!ok) return;
  adminLog('⏳ ' + name + ' şifresi sıfırlanıyor...');
  const r = await adminCall('admin/reset-password', { targetName: name, newPassword: pass });
  if (r?.ok) { adminLog('✅ ' + r.message); document.getElementById('adminNewPass').value = ''; }
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminGiftCurrency() {
  var name     = (document.getElementById('adminGiftTarget')?.value || '').trim();
  var coins    = parseInt(document.getElementById('adminGiftCoins')?.value    || '0') || 0;
  var diamonds = parseInt(document.getElementById('adminGiftDiamonds')?.value || '0') || 0;
  if (!name) { adminLog('Oyuncu adı gir'); return; }
  if (coins === 0 && diamonds === 0) { adminLog('Miktar gir'); return; }
  adminLog('⏳ Gönderiliyor: ' + name + ' → ' + coins + '💰 ' + diamonds + '💎');
  var r = await adminCall('admin/gift-currency', { targetName: name, coins, diamonds });
  if (r?.ok) adminLog('✅ Gönderildi! ' + name + ' yeni bakiye: ' + r.coins + '💰 ' + r.diamonds + '💎');
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminSearchClan() {
  var q = (document.getElementById('adminClanSearch')?.value || '').trim();
  if (!q) { adminLog('Klan adı veya etiket gir'); return; }
  adminLog('⏳ Aranıyor: ' + q);
  var r = await adminCall('clan/search', { query: q });
  var el = document.getElementById('adminClanResults');
  if (!r || !r.clans || r.clans.length === 0) {
    adminLog('❌ Klan bulunamadı');
    if (el) el.innerHTML = '';
    return;
  }
  adminLog('✅ ' + r.clans.length + ' klan bulundu');
  if (el) {
    el.innerHTML = r.clans.map(function(c) {
      return '<div onclick="document.getElementById(\'adminClanId\').value=\'' + c.id + '\'" style="padding:8px;border:1px solid var(--border);border-radius:8px;cursor:pointer;margin-bottom:4px;background:rgba(255,255,255,0.02)">' +
        '<strong>[' + c.tag + '] ' + escapeHtml(c.name) + '</strong> · ' + c.members + ' üye' +
        '<div style="font-size:10px;color:var(--muted);font-family:monospace">' + c.id + '</div>' +
      '</div>';
    }).join('');
  }
}

async function adminViewClan() {
  var id = (document.getElementById('adminClanId')?.value || '').trim();
  if (!id) { adminLog('Klan ID gir'); return; }
  var r = await adminCall('clan/info', { clanId: id });
  if (!r || !r.ok) { adminLog('❌ ' + (r?.error || 'Hata')); return; }
  var c = r.clan;
  adminLog('🏰 [' + c.tag + '] ' + c.name + '\n' +
    'ID: ' + c.id + '\n' +
    'Üye: ' + c.members.length + ' · Puan: ' + (c.totalScore||0) + '\n' +
    'Lider: ' + (c.leaderName||c.leaderId) + '\n' +
    'Public: ' + (c.isPublic ? 'Evet' : 'Hayır'));
}

async function adminViewClanMembers() {
  var id = (document.getElementById('adminClanId')?.value || '').trim();
  if (!id) { adminLog('Klan ID gir'); return; }
  var r = await adminCall('clan/info', { clanId: id });
  if (!r || !r.ok) { adminLog('❌ ' + (r?.error || 'Hata')); return; }
  var c = r.clan;
  var ROLES = { leader:'👑', coleader:'⭐', officer:'⚡', member:'👤' };
  adminLog('👥 ' + c.name + ' üyeleri:\n' +
    c.members.map(function(m, i) {
      var score = (c.memberScores && c.memberScores[m.uid]) || 0;
      return (i+1) + '. ' + (ROLES[m.role]||'👤') + ' ' + m.name + ' — ' + score + 'p';
    }).join('\n'));
}

async function adminDeleteClan() {
  var id = (document.getElementById('adminClanId')?.value || '').trim();
  if (!id) { adminLog('Klan ID gir'); return; }
  var ok = await showConfirm('Klanı Sil', 'Klan kalıcı olarak silinecek!');
  if (!ok) return;
  var r = await adminCall('admin/clan-delete', { clanId: id });
  if (r?.ok) adminLog('✅ Klan silindi');
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminAddClanMember() {
  var clanId = (document.getElementById('adminClanMemberClanId')?.value || '').trim();
  var name   = (document.getElementById('adminClanMemberName')?.value || '').trim();
  if (!clanId || !name) { adminLog('Klan ID ve oyuncu adı gir'); return; }
  var r = await adminCall('admin/clan-add-member', { clanId, targetName: name });
  if (r?.ok) adminLog('✅ ' + name + ' klana eklendi');
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminRemoveClanMember() {
  var clanId = (document.getElementById('adminClanMemberClanId')?.value || '').trim();
  var name   = (document.getElementById('adminClanMemberName')?.value || '').trim();
  if (!clanId || !name) { adminLog('Klan ID ve oyuncu adı gir'); return; }
  var ok = await showConfirm('Üyeyi Çıkar', '"' + name + '" klandan çıkarılacak');
  if (!ok) return;
  var r = await adminCall('admin/clan-remove-member', { clanId, targetName: name });
  if (r?.ok) adminLog('✅ ' + name + ' klandan çıkarıldı');
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminResetClanScore() {
  var id = (document.getElementById('adminClanId')?.value || '').trim();
  if (!id) { adminLog('Klan ID gir'); return; }
  var ok = await showConfirm('Klan Puanını Sıfırla', 'Klan puanı ve üye katkıları sıfırlanacak!');
  if (!ok) return;
  var r = await adminCall('admin/clan-reset-score', { clanId: id });
  if (r?.ok) adminLog('✅ Klan puanı sıfırlandı');
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminGiveClanReward() {
  var clanId = (document.getElementById('adminClanBadgeId')?.value || '').trim();
  var label  = (document.getElementById('adminClanBadgeLabel')?.value || '').trim();
  var icon   = (document.getElementById('adminClanBadgeIcon')?.value || '🏆').trim();
  var coins  = parseInt(document.getElementById('adminClanBadgeCoins')?.value || '0') || 0;
  var diamonds = parseInt(document.getElementById('adminClanBadgeDiamonds')?.value || '0') || 0;
  if (!clanId || !label) { adminLog('Klan ID ve rozet adı zorunlu'); return; }
  var ok = await showConfirm('Klan Ödülü', '[' + icon + ' ' + label + '] rozeti ve ' + coins + '💰 ' + diamonds + '💎 tüm üyelere verilecek');
  if (!ok) return;
  adminLog('⏳ Ödüller veriliyor...');
  var r = await adminCall('admin/clan-reward', { clanId, badge: { icon, label }, coins, diamonds });
  if (r?.ok) adminLog('✅ ' + r.count + ' üyeye ödül verildi');
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminCreateTournament() {
  var name = (document.getElementById('adminTournName')?.value || '').trim() || 'Klan Turnuvası';
  var ok = await showConfirm('Turnuva Oluştur', '"' + name + '" adlı turnuva oluşturulacak');
  if (!ok) return;
  adminLog('⏳ Turnuva oluşturuluyor...');
  var r = await adminCall('clan/tournament/create', { name });
  if (r?.ok) adminLog('✅ Turnuva oluşturuldu: ' + r.tournament.id);
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminStartTournament() {
  var ok = await showConfirm('Turnuvayı Başlat', 'Kayıt kapanır, gruplar oluşturulur');
  if (!ok) return;
  adminLog('⏳ Turnuva başlatılıyor...');
  var r = await adminCall('clan/tournament/start', {});
  if (r?.ok) adminLog('✅ Turnuva başladı · ' + (r.tournament?.registeredClans?.length||0) + ' klan');
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminFinishTournament() {
  var ok = await showConfirm('Turnuvayı Bitir', 'Turnuva sonuçlandırılır ve ödüller verilir');
  if (!ok) return;
  adminLog('⏳ Turnuva sonuçlandırılıyor...');
  var r = await adminCall('clan/tournament/finish', {});
  if (r?.ok) adminLog('✅ Turnuva bitti! Kazanan: ' + (r.winner?.name || '?'));
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminCancelTournament() {
  var ok = await showConfirm('Turnuvayı İptal Et', 'Aktif turnuva silinecek!');
  if (!ok) return;
  var r = await adminCall('admin/tournament-cancel', {});
  if (r?.ok) adminLog('✅ Turnuva iptal edildi');
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminTournamentInfo() {
  var r = await adminCall('clan/tournament/info', {});
  if (!r || !r.ok || !r.tournament) { adminLog('Aktif turnuva yok'); return; }
  var t = r.tournament;
  adminLog('⚔️ ' + t.name + '\n' +
    'Durum: ' + t.status + '\n' +
    'Kayıtlı: ' + (t.registeredClans||[]).length + ' klan\n' +
    'ID: ' + t.id);
}

async function adminClearLb() {
  const ops = (document.getElementById('adminClearOps')?.value || '').trim() || 'all';
  const ok  = await showConfirm('Tabloyu Sıfırla', '"' + ops + '" tablosu tamamen silinecek!');
  if (!ok) return;
  adminLog('⏳ Tablo sıfırlanıyor...');
  const r = await adminCall('admin/clear-lb', { ops });
  if (r?.ok) { adminLog('✅ ' + r.cleared + ' sıfırlandı'); fetchOnlineLeaderboard(); }
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminMakeFirst() {
  if (!authUser) return;
  adminLog('⏳ Test skoru yükleniyor...');
  const r = await adminCall('admin/set-score', { targetName: authUser.name, score: 999999, ops: 'all' });
  if (r?.ok) { adminLog('✅ ' + r.name + ' → ' + r.newScore + 'p (birinci)'); fetchOnlineLeaderboard(); }
  else adminLog('❌ ' + (r?.error || 'Önce bir skor gönder'));
}

async function adminListPlayers() {
  const ops = getAdminOps();
  adminLog('⏳ Oyuncular çekiliyor...');
  const r = await adminCall('admin/list-players', { ops });
  if (r?.ok) {
    if (r.players.length === 0) { adminLog('📋 Tablo boş'); return; }
    adminLog('📋 ' + r.players.length + ' oyuncu:\n' +
      r.players.map((p,i) => (i+1) + '. ' + p.name + ' — ' + p.score + 'p' + (p.banned ? ' 🚫' : '')).join('\n'));
  } else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminLoadLogs() {
  adminLog('⏳ Loglar yükleniyor...');
  var r = await adminCall('admin/logs', { limit: 100 });
  var el = document.getElementById('adminLogList');
  if (!el) { return; }
  if (!r || !r.ok) { adminLog('❌ ' + (r ? r.error : 'Hata')); return; }
  if (!r.logs || r.logs.length === 0) {
    el.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">Log yok</div>';
    return;
  }
  var actionLabels = {
    'ban': '🚫 Banlama',
    'unban': '✅ Ban kaldırma',
    'reset-password': '🔑 Şifre sıfırlama',
    'give-admin': '👑 Admin verme',
    'remove-admin': '❌ Admin alma',
  };
  el.innerHTML = r.logs.map(function(log) {
    var time = new Date(log.ts).toLocaleString('tr-TR');
    var label = actionLabels[log.action] || ('⚡ ' + log.action);
    return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px 10px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<span style="font-size:12px;font-weight:700;color:#e6f7ea">' + label + '</span>' +
        '<span style="font-size:10px;color:var(--muted)">' + time + '</span>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + log.detail + '</div>' +
      '<div style="font-size:10px;color:#38bdf8;margin-top:2px">Admin: ' + log.adminName + '</div>' +
    '</div>';
  }).join('');
  adminLog('✅ ' + r.logs.length + ' log yüklendi');
}

async function adminClearLogs() {
  var ok = await showConfirm('Logları Temizle', 'Tüm admin logları silinecek. Emin misin?');
  if (!ok) { return; }
  var r = await adminCall('admin/clear-logs');
  if (r && r.ok) {
    adminLog('✅ Loglar temizlendi');
    var el = document.getElementById('adminLogList');
    if (el) { el.innerHTML = ''; }
  } else {
    adminLog('❌ ' + (r ? r.error : 'Hata'));
  }
}
