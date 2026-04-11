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

/* ── Süper Admin fonksiyonları ── */
function isSuperAdminUser() {
  if (!authUser) return false;
  return ADMIN_UIDS_CLIENT.includes(authUser.uid) || authUser.role === 'superadmin' || authUser._superadmin === true;
}

async function adminGiveSuperAdmin() {
  var name = (document.getElementById('adminSuperAdminName')?.value || '').trim();
  if (!name) { adminLog('❌ Kullanıcı adı gerekli'); return; }
  var ok = await showConfirm('Süper Admin Ver', '"' + name + '" kullanıcısına SÜPER ADMİN yetkisi verilecek. Tüm bilgilere erişebilir. Emin misin?');
  if (!ok) return;
  var r = await adminCall('admin/give-superadmin', { targetName: name });
  if (r && r.ok) adminLog('✅ ' + r.message);
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminRemoveSuperAdmin() {
  var name = (document.getElementById('adminSuperAdminName')?.value || '').trim();
  if (!name) { adminLog('❌ Kullanıcı adı gerekli'); return; }
  var ok = await showConfirm('Süper Admin Al', '"' + name + '" kullanıcısının süper admin yetkisi alınacak.');
  if (!ok) return;
  var r = await adminCall('admin/remove-superadmin', { targetName: name });
  if (r && r.ok) adminLog('✅ ' + r.message);
  else adminLog('❌ ' + (r?.error || 'Hata'));
}

async function adminLoadSuperAdmins() {
  var r = await adminCall('admin/list-superadmins', {});
  var box = document.getElementById('adminSuperAdminList');
  if (!box) return;
  if (r && r.ok) {
    box.innerHTML = r.superadmins.length === 0 ? '<div style="color:var(--muted);font-size:12px">Henüz süper admin yok</div>' :
      r.superadmins.map(function(u) {
        return '<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:8px 10px;font-size:12px;display:flex;align-items:center;gap:6px">' +
          '<span>' + (u.isFounder ? '👑' : '⭐') + '</span>' +
          '<span style="font-weight:700;color:var(--text)">' + escapeHtml(u.name) + '</span>' +
          (u.isFounder ? '<span style="font-size:10px;color:#f59e0b;margin-left:auto">Kurucu</span>' : '') +
          '</div>';
      }).join('');
    adminLog('✅ Süper admin listesi yüklendi');
  } else adminLog('❌ ' + (r?.error || 'Hata'));
}

function openSuperAdminModal() {
  if (!isSuperAdminUser()) { showToast('⛔ Sadece süper adminler', '#ef4444'); return; }
  document.getElementById('superAdminModal').classList.add('show');
  clickSound();
}

async function loadGA4Stats() {
  var dash    = document.getElementById('ga4Dashboard');
  var errEl   = document.getElementById('ga4Error');
  var btn     = document.querySelector('[onclick="loadGA4Stats()"]');
  if (btn) { btn.textContent = '⏳ Yükleniyor...'; btn.disabled = true; }
  if (errEl) errEl.style.display = 'none';

  try {
    var r = await adminCall('ga4-stats', {});
    if (!r || !r.ok) {
      if (errEl) { errEl.textContent = '❌ ' + (r?.error || 'Hata'); errEl.style.display = 'block'; }
      return;
    }

    dash.style.display = 'block';

    /* Özet kartlar — 30 günlük summary'den al */
    var sumRows = r.summary?.totals || r.summary?.rows || [];
    var totals = { users: 0, sessions: 0, events: 0, newUsers: 0 };
    if (r.summary?.totals && r.summary.totals.length > 0) {
      var t = r.summary.totals[0];
      totals.users    = parseInt(t.metricValues[0].value || 0);
      totals.sessions = parseInt(t.metricValues[1].value || 0);
      totals.events   = parseInt(t.metricValues[2].value || 0);
      totals.newUsers = parseInt(t.metricValues[3].value || 0);
    } else if (r.summary?.rows) {
      r.summary.rows.forEach(function(row) {
        totals.users    += parseInt(row.metricValues[0].value || 0);
        totals.sessions += parseInt(row.metricValues[1].value || 0);
        totals.events   += parseInt(row.metricValues[2].value || 0);
        totals.newUsers += parseInt(row.metricValues[3].value || 0);
      });
    }

    var cards = document.getElementById('ga4Cards');
    if (cards) {
      var cardStyle = 'background:#060a10;border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:10px;text-align:center';
      cards.innerHTML = [
        { val: totals.users,    lbl: 'Aktif Kullanıcı',  icon: '👥' },
        { val: totals.newUsers, lbl: 'Yeni Kullanıcı',   icon: '✨' },
        { val: totals.sessions, lbl: 'Oturum',           icon: '🎮' },
        { val: totals.events,   lbl: 'Event',            icon: '⚡' },
      ].map(function(c) {
        return '<div style="' + cardStyle + '">' +
          '<div style="font-size:18px">' + c.icon + '</div>' +
          '<div style="font-family:var(--font-head);font-size:20px;font-weight:900;color:#f59e0b">' + c.val.toLocaleString() + '</div>' +
          '<div style="font-size:10px;color:rgba(245,158,11,0.5);text-transform:uppercase;letter-spacing:0.5px">' + c.lbl + '</div>' +
          '</div>';
      }).join('');
    }

    /* Günlük bar chart — 7 günlük report'tan */
    var chart     = document.getElementById('ga4Chart');
    var labels    = document.getElementById('ga4ChartLabels');
    var last7rows = (r.report?.rows || []).slice(-7);
    if (chart && last7rows.length > 0) {
      var maxVal = Math.max.apply(null, last7rows.map(function(r) { return parseInt(r.metricValues[0].value || 0); }));
      chart.innerHTML = last7rows.map(function(row) {
        var val = parseInt(row.metricValues[0].value || 0);
        var pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
        var date = row.dimensionValues[0].value; /* YYYYMMDD */
        var day  = date.slice(6, 8) + '.' + date.slice(4, 6);
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">' +
          '<div style="font-size:9px;color:#f59e0b;font-weight:700">' + (val || '') + '</div>' +
          '<div style="width:100%;background:rgba(245,158,11,0.8);border-radius:3px 3px 0 0;height:' + pct + '%;min-height:' + (val > 0 ? '3' : '0') + 'px"></div>' +
          '</div>';
      }).join('');
      labels.innerHTML = last7rows.map(function(row) {
        var date = row.dimensionValues[0].value;
        var day  = date.slice(6, 8) + '.' + date.slice(4, 6);
        return '<div style="flex:1;font-size:8px;color:rgba(245,158,11,0.4);text-align:center">' + day + '</div>';
      }).join('');
    }

    /* Top events */
    var evEl = document.getElementById('ga4Events');
    var evRows = r.events?.rows || [];
    if (evEl) {
      evEl.innerHTML = evRows.map(function(row) {
        var name  = row.dimensionValues[0].value;
        var count = parseInt(row.metricValues[0].value || 0);
        return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px">' +
          '<span style="color:#c8dcd8">' + escapeHtml(name) + '</span>' +
          '<span style="color:#f59e0b;font-weight:700">' + count.toLocaleString() + '</span>' +
          '</div>';
      }).join('') || '<div style="color:var(--muted);font-size:12px">Veri yok</div>';
    }

    /* Ülkeler */
    var ctEl  = document.getElementById('ga4Countries');
    var ctRows = r.countries?.rows || [];
    var ctMax  = ctRows.length > 0 ? parseInt(ctRows[0].metricValues[0].value || 1) : 1;
    if (ctEl) {
      ctEl.innerHTML = ctRows.map(function(row) {
        var country = row.dimensionValues[0].value;
        var users   = parseInt(row.metricValues[0].value || 0);
        var pct     = Math.round((users / ctMax) * 100);
        return '<div style="margin-bottom:6px">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">' +
            '<span style="color:#c8dcd8">' + escapeHtml(country) + '</span>' +
            '<span style="color:#f59e0b;font-weight:700">' + users + '</span>' +
          '</div>' +
          '<div style="height:3px;background:rgba(255,255,255,0.05);border-radius:2px">' +
            '<div style="height:100%;width:' + pct + '%;background:rgba(245,158,11,0.6);border-radius:2px"></div>' +
          '</div></div>';
      }).join('') || '<div style="color:var(--muted);font-size:12px">Veri yok</div>';
    }

  } catch(e) {
    if (errEl) { errEl.textContent = '❌ ' + e.message; errEl.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = '📈 Analytics Verilerini Getir'; btn.disabled = false; }
  }
}

async function saLoadSuspiciousLogs() {
  var r = await adminCall('admin/logs', { limit: 100 });
  var box = document.getElementById('saSuspiciousLogs');
  if (!box) return;
  if (!r || !r.ok) { box.innerHTML = '<div style="color:var(--muted);font-size:12px">Log alınamadı</div>'; return; }
  var suspicious = (r.logs || []).filter(function(l) {
    return l.action === 'suspicious-score';
  });
  if (suspicious.length === 0) {
    box.innerHTML = '<div style="color:var(--neon);font-size:12px;padding:8px;text-align:center">✅ Şüpheli aktivite yok</div>';
    return;
  }
  box.innerHTML = suspicious.map(function(l) {
    return '<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:8px 10px;font-size:11px;margin-bottom:4px">' +
      '<span style="color:#ef4444;font-weight:700">⚠️ ' + escapeHtml(l.adminName || l.adminUid || '?') + '</span> · ' +
      '<span style="color:var(--muted)">' + new Date(l.ts).toLocaleString('tr-TR') + '</span><br>' +
      '<span style="color:#c8dcd8">' + escapeHtml(l.detail || '') + '</span>' +
      '</div>';
  }).join('');
}

async function adminDeepInfo() {
  /* SA modalındaki input'u dene, yoksa admin panelindekini kullan */
  var name = (document.getElementById('saTargetName')?.value || document.getElementById('adminTargetName')?.value || '').trim();
  if (!name) { adminLog('❌ Kullanıcı adı gerekli'); return; }
  if (!isSuperAdminUser()) { adminLog('❌ Bu özellik sadece süper adminler için'); return; }
  adminLog('⏳ ' + name + ' derin bilgileri çekiliyor...');
  var r = await adminCall('admin/deep-info', { targetName: name });
  if (!r || !r.ok) { adminLog('❌ ' + (r?.error || 'Hata')); return; }
  var box = document.getElementById('adminPlayerInfoBox');
  if (box) {
    box.style.display = 'block';
    var onlineStr = r.isOnline
      ? '<span style="color:#00ff88">🟢 Online</span>'
      : (r.lastSeen ? '<span style="color:var(--muted)">⚫ Son görülme: ' + new Date(r.lastSeen).toLocaleString('tr-TR') + '</span>' : '<span style="color:var(--muted)">⚫ Hiç görülmemiş</span>');
    var scoresStr = '';
    if (r.scores) {
      Object.keys(r.scores).forEach(function(ops) {
        scoresStr += '<br>📊 ' + ops + ': ' + r.scores[ops].score + 'p (Sıra #' + r.scores[ops].rank + ')';
      });
    }
    box.innerHTML =
      '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;margin-bottom:8px">👑 SÜPER ADMİN — DERİN BİLGİ</div>' +
      '👤 <b>' + escapeHtml(r.name) + '</b> &nbsp; <span style="font-size:10px;color:var(--muted)">' + (r.uid || '') + '</span><br>' +
      '📧 E-posta: <b style="color:#e6f7ea">' + escapeHtml(r.email || '—') + '</b><br>' +
      '🌐 Provider: ' + escapeHtml(r.provider || '?') + (r.provider === 'google' && r.email && !r.email.endsWith('@gmail.com') ? ' ⚠️ (email hesabı olabilir — tekrar giriş yapınca düzelir)' : '') + '<br>' +
      '🔑 PIN: ' + (r.hasPin ? '✅ Ayarlı' : '❌ PIN ayarlanmadı') + '<br>' +
      '🔐 Şifre: ' + (r.hasPw
        ? ('✅ Var <span style="font-size:9px;color:var(--muted);font-family:monospace">[' + (r.pwHash ? r.pwHash.slice(0,16) + '...' : '?') + ']</span>')
        : (r.provider === 'email' ? '❌ Şifre hash yok (Firebase email auth)' : '— Google OAuth (e-posta şifresi yok)')) + '<br>' +
      '🎭 Rol: <b style="color:#f59e0b">' + escapeHtml(r.role || '?') + '</b><br>' +
      '🚫 Ban: ' + (r.banned ? '<b style="color:#ef4444">' + escapeHtml(r.banned.reason || 'Banlı') + '</b>' : '✅ Temiz') + '<br>' +
      '📡 Durum: ' + onlineStr + '<br>' +
      '📅 Kayıt: ' + (r.createdAt ? new Date(r.createdAt).toLocaleString('tr-TR') : '?') + '<br>' +
      scoresStr + '<br>' +
      '✅ Doğru: ' + (r.stats?.totalCorrect || 0) + ' / ❌ Yanlış: ' + (r.stats?.totalWrong || 0) + '<br>' +
      '🔥 En iyi seri: ' + (r.stats?.bestStreak || 0) + '<br>' +
      '🏆 Başarımlar: ' + Object.keys(r.achievements || {}).length + ' adet<br>' +
      '🎖 Rozetler: ' + (r.badges?.length || 0) + ' adet';
    adminLog('✅ Derin bilgi yüklendi');

    /* SA modal kutusuna da yaz */
    var saBox = document.getElementById('saResultBox');
    if (saBox) { saBox.innerHTML = box.innerHTML; saBox.classList.add('show'); }
  }
}

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


/* Auth init — auth.js'de yönetiliyor */

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
    trackEvent('login', { method: 'google' });
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

/* ══════════════════════════════════════════════════════
   ANLIK MESAJLAŞMA — Firebase Realtime Database
   ══════════════════════════════════════════════════════ */

var _chatListener   = null;  /* Firebase listener referansı */
var _chatUid        = null;  /* Şu an açık olan konuşmanın UID'i */
var _chatIsAdmin    = false; /* Admin modunda mı açık */

/* Kullanıcı kendi chat'ini açar */
function openChatModal() {
  if (!authUser) { showToast('Önce giriş yap', '#ef4444'); return; }
  if (!fbDB) { showToast('Anlık mesajlaşma şu an kullanılamıyor', '#ef4444'); return; }
  _chatIsAdmin = false;
  _chatUid     = authUser.uid;
  var title    = document.getElementById('chatTitle');
  var subtitle = document.getElementById('chatSubtitle');
  if (title)    { title.textContent    = '💬 Mesajlar'; }
  if (subtitle) { subtitle.textContent = 'Admin ile iletişim'; }
  document.getElementById('chatModal').classList.add('show');
  loadChatMessages(_chatUid);
  markChatRead(_chatUid);
}

/* Admin başka birinin chat'ini açar */
function openAdminChatFor(uid, name) {
  if (!fbDB) { showToast('Database bağlantısı yok', '#ef4444'); return; }
  _chatIsAdmin = true;
  _chatUid     = uid;
  var title    = document.getElementById('chatTitle');
  var subtitle = document.getElementById('chatSubtitle');
  if (title)    { title.textContent    = '💬 ' + name; }
  if (subtitle) { subtitle.textContent = 'Admin olarak yazıyorsun'; }
  document.getElementById('chatModal').classList.add('show');
  loadChatMessages(uid);
}

function closeChatModal() {
  document.getElementById('chatModal').classList.remove('show');
  if (_chatListener) {
    try { _chatListener(); } catch(e) {}
    _chatListener = null;
  }
  _chatUid = null;
}

function loadChatMessages(uid) {
  var messagesEl = document.getElementById('chatMessages');
  if (!messagesEl) { return; }
  messagesEl.innerHTML = '<div class="chat-msg from-system">Yükleniyor...</div>';

  /* Eski listener'ı kaldır */
  if (_chatListener) {
    try { _chatListener(); } catch(e) {}
  }

  var ref = fbDB.ref('chats/' + uid + '/messages');

  /* Son 100 mesajı dinle */
  var query = ref.limitToLast(100);

  _chatListener = query.on('value', function(snapshot) {
    var msgs = [];
    snapshot.forEach(function(child) {
      msgs.push(child.val());
    });

    if (msgs.length === 0) {
      messagesEl.innerHTML = '<div class="chat-msg from-system">Henüz mesaj yok. Bir şeyler yaz!</div>';
      return;
    }

    messagesEl.innerHTML = msgs.map(function(msg) {
      var isMe    = _chatIsAdmin ? (msg.sender === 'admin') : (msg.sender === 'user');
      var cls     = isMe ? 'from-me' : (_chatIsAdmin ? 'from-user' : 'from-admin');
      var timeStr = new Date(msg.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      var rolePrefix = msg.role === 'moderator' ? '🛡 ' : '⚡ ';
          var senderName = msg.sender === 'admin' ? (rolePrefix + maskAdminName(msg.name || 'Admin')) : (msg.senderName || 'Sen');
      return '<div class="chat-msg ' + cls + '">' +
        '<div>' + escapeHtml(msg.text) + '</div>' +
        '<div class="chat-msg-time">' + (isMe ? '' : senderName + ' · ') + timeStr + '</div>' +
      '</div>';
    }).join('');

    /* En alta kaydır */
    messagesEl.scrollTop = messagesEl.scrollHeight;

    /* Okundu işaretle */
    if (!_chatIsAdmin) {
      markChatRead(uid);
    }
  });
}

async function sendChatMsg() {
  if (!fbDB || !_chatUid) { return; }
  var input = document.getElementById('chatInput');
  var text  = (input.value || '').trim();
  if (!text) { return; }

  input.value = '';
  input.style.height = 'auto';

  var sender     = _chatIsAdmin ? 'admin' : 'user';
  var senderName = authUser ? authUser.name : 'Admin';

  try {
    var ref = fbDB.ref('chats/' + _chatUid + '/messages');
    await ref.push({
      text:       text,
      sender:     sender,
      senderName: senderName,
      ts:         Date.now(),
      read:       _chatIsAdmin ? false : true,
    });

    /* Okunmamış sayacını güncelle (admin mesaj attıysa user için unread++) */
    if (_chatIsAdmin) {
      var unreadRef = fbDB.ref('chats/' + _chatUid + '/unread');
      unreadRef.transaction(function(current) {
        return (current || 0) + 1;
      });
    }
  } catch(e) {
    showToast('Mesaj gönderilemedi: ' + e.message, '#ef4444');
  }
}

function markChatRead(uid) {
  if (!fbDB) { return; }
  fbDB.ref('chats/' + uid + '/unread').set(0);
  /* Badge gizle */
  var badge = document.getElementById('chatUnreadBadge');
  if (badge) { badge.style.display = 'none'; }
}

/* Okunmamış mesaj sayısını dinle (kullanıcı için) */
function startUnreadListener() {
  if (!fbDB || !authUser) { return; }
  fbDB.ref('chats/' + authUser.uid + '/unread').on('value', function(snap) {
    var count = snap.val() || 0;
    var badge = document.getElementById('chatUnreadBadge');
    if (!badge) { return; }
    if (count > 0) {
      badge.style.display = 'flex';
      badge.textContent   = count > 9 ? '9+' : count;
    } else {
      badge.style.display = 'none';
    }
  });
}

/* Chat input — Enter gönder, Shift+Enter yeni satır */
document.addEventListener('DOMContentLoaded', function() {
  var chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMsg();
      }
    });
    /* Auto resize */
    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });
  }
});


function switchReqTab(tab) {
  var panelNew = document.getElementById('reqPanelNew');
  var panelMy  = document.getElementById('reqPanelMy');
  var btnNew   = document.getElementById('reqTabNew');
  var btnMy    = document.getElementById('reqTabMy');
  if (tab === 'new') {
    if (panelNew) { panelNew.style.display = ''; }
    if (panelMy)  { panelMy.style.display  = 'none'; }
    if (btnNew) { btnNew.style.background = 'rgba(0,255,102,0.1)'; btnNew.style.color = '#00ff66'; btnNew.style.borderColor = '#00ff6644'; }
    if (btnMy)  { btnMy.style.background  = 'transparent';         btnMy.style.color  = 'var(--muted)'; btnMy.style.borderColor = '#1a2f28'; }
  } else {
    if (panelNew) { panelNew.style.display = 'none'; }
    if (panelMy)  { panelMy.style.display  = ''; }
    if (btnNew) { btnNew.style.background = 'transparent';          btnNew.style.color = 'var(--muted)'; btnNew.style.borderColor = '#1a2f28'; }
    if (btnMy)  { btnMy.style.background  = 'rgba(0,255,102,0.1)'; btnMy.style.color  = '#00ff66'; btnMy.style.borderColor = '#00ff6644'; }
    loadMyRequests();
  }
}

async function loadMyRequests() {
  var el = document.getElementById('myRequestList');
  if (!el) { return; }
  if (!authUser || !authUser.token) {
    el.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">Giriş yapman gerekiyor</div>';
    return;
  }
  el.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">&#x23F3; Yükleniyor...</div>';
  try {
    var result = await fetch(WORKER_URL + '/my-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: authUser.token })
    }).then(function(r) { return r.json(); });

    if (!result || !result.ok) {
      el.innerHTML = '<div style="color:#ef4444;font-size:12px;text-align:center;padding:8px">&#x274C; Yüklenemedi</div>';
      return;
    }
    if (!result.requests || result.requests.length === 0) {
      el.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">Henüz istek göndermedin</div>';
      return;
    }
    var typeLabels   = { bug:'&#x1F41B; Bug', unban:'&#x1F513; Unban', suggestion:'&#x1F4A1; Öneri', report:'&#x26A0;&#xFE0F; Şikayet', other:'&#x1F4DD; Diğer' };
    var statusColors = { open:'#f59e0b', resolved:'#00ff66', rejected:'#ef4444' };
    var statusLabels = { open:'&#x23F3; Açık', resolved:'&#x2705; Yanıtlandı', rejected:'&#x274C; Reddedildi' };
    el.innerHTML = result.requests.map(function(req) {
      var typeLabel   = typeLabels[req.type] || req.type;
      var statusColor = statusColors[req.status] || '#9fb3b0';
      var statusLabel = statusLabels[req.status] || req.status;
      var date = req.createdAt ? new Date(req.createdAt).toLocaleDateString('tr-TR') : '';

      /* Thread mesajları */
      var threadHtml = '';
      if (req.thread && req.thread.length > 0) {
        threadHtml = '<div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">';
        req.thread.forEach(function(msg) {
          var isAdmin = msg.role === 'admin';
          var bg    = isAdmin ? 'rgba(56,189,248,0.08)' : 'rgba(0,255,102,0.06)';
          var color = isAdmin ? '#38bdf8' : '#00ff66';
          var align = isAdmin ? 'flex-start' : 'flex-end';
          var time  = new Date(msg.ts).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'});
          threadHtml += '<div style="display:flex;justify-content:' + align + '">' +
            '<div style="max-width:85%;padding:6px 10px;background:' + bg + ';border-radius:10px;font-size:12px;color:' + color + '">' +
              '<span style="font-weight:700;font-size:10px;opacity:0.8">' + (isAdmin ? ((msg.role === 'moderator' ? '🛡 ' : '⚡ ') + maskAdminName(msg.name || 'Admin')) : '👤 Sen') + ' · ' + time + '</span><br>' +
              escapeHtml(msg.text) +
            '</div>' +
          '</div>';
        });
        threadHtml += '</div>';
      }

      /* Yanıt kutusu */
      var replyHtml = '<div style="display:flex;gap:6px;margin-top:8px">' +
        '<input id="reply_' + req.id + '" placeholder="Yanıt yaz..." style="flex:1;background:#060c18;border:1px solid #1a2f28;border-radius:8px;color:#e6f7ea;font-size:12px;padding:7px 10px;font-family:inherit;outline:none">' +
        '<button onclick="sendReqReply(\`' + req.id + '\`)" style="background:#00ff66;color:#030608;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">&#x27A4;</button>' +
      '</div>';

      return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<span style="font-size:11px;font-weight:700;color:#e6f7ea">' + typeLabel + '</span>' +
          '<span style="font-size:11px;font-weight:700;color:' + statusColor + '">' + statusLabel + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--muted)">' + req.message + '</div>' +
        '<div style="font-size:10px;color:#3a4a48;margin-top:2px">' + date + '</div>' +
        threadHtml + replyHtml +
      '</div>';
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="color:#ef4444;font-size:12px;text-align:center;padding:8px">&#x274C; Bağlantı hatası</div>';
  }
}


async function sendReqReply(requestId) {
  var input = document.getElementById('reply_' + requestId);
  if (!input) { return; }
  var text = (input.value || '').trim();
  if (!text) { return; }
  if (!authUser || !authUser.token) { showToast('Giriş yapman gerekiyor', '#ef4444'); return; }
  input.value = '';
  input.disabled = true;
  try {
    var result = await fetch(WORKER_URL + '/request-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: authUser.token, requestId: requestId, message: text })
    }).then(function(r) { return r.json(); });
    if (result && result.ok) {
      loadMyRequests(); /* Yenile */
    } else {
      showToast('&#x274C; ' + (result ? result.error : 'Hata'), '#ef4444');
      input.disabled = false;
    }
  } catch(e) {
    showToast('Bağlantı hatası', '#ef4444');
    input.disabled = false;
  }
}


/* ══════════════════════════════════════════════════════
   GENEL PROFİL (PUBLIC)
   ══════════════════════════════════════════════════════ */

var _pubProfileData = null;

function openPublicProfileByIndex(i) {
  var board = window._lbBoardCache;
  if (!board || !board[i]) { return; }
  openPublicProfile(board[i]);
}

var ADMIN_UIDS_CLIENT = ['BvXY0zGZtle3fFoHHUnbW1UkaMu1'];

async function openPublicProfile(data) {
  _pubProfileData = data;
  document.getElementById('publicProfileModal').classList.add('show');

  /* Temel bilgiler */
  document.getElementById('pubAvatar').textContent = (data.name || '?')[0].toUpperCase();
  document.getElementById('pubName').textContent   = data.name || '—';
  document.getElementById('pubScore').textContent  = (data.score || 0) + 'p';
  document.getElementById('pubLevel').textContent  = data.level || 1;
  document.getElementById('pubRank').textContent   = '...';
  document.getElementById('pubJoined').textContent = '...';
  document.getElementById('pubUid').textContent    = '...';
  document.getElementById('pubBadges').innerHTML   = '';
  document.getElementById('pubProvider').textContent = '';
  var pubOnlineEl = document.getElementById('pubOnlineStatus');
  if (pubOnlineEl) { pubOnlineEl.innerHTML = '<span style="font-size:11px;color:var(--muted)">⏳ Durum yükleniyor...</span>'; }
  var banInfo = document.getElementById('pubBanInfo');
  if (banInfo) { banInfo.style.display = 'none'; }
  var adminActions = document.getElementById('pubAdminActions');
  if (adminActions) { adminActions.style.display = 'none'; }

  var isViewerAdmin = await checkAdminStatus();

  try {
    var token = authUser ? authUser.token : '';
    var r = await workerPost('public-profile', { targetName: data.name, targetUid: data.uid || '' });
    if (r && r.ok) {
      _pubProfileData.uid = r.uid;
      document.getElementById('pubRank').textContent   = r.rank ? '#' + r.rank : '—';
      document.getElementById('pubJoined').textContent = r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR') : '?';
      document.getElementById('pubUid').textContent    = '';  /* UID sadece adminlere */
      document.getElementById('pubProvider').textContent = r.provider === 'google' ? '🔵 Google ile giriş' : '📧 E-posta ile giriş';

      /* Online durum yükle */
      if (r.uid) { try { loadOnlineStatusForProfile(r.uid); } catch(e) {} }

      /* Avatar */
      if (r.avatar) {
        document.getElementById('pubAvatar').textContent = r.avatar;
      }

      /* Bio */
      var bioSection = document.getElementById('pubBioSection');
      if (bioSection) {
        if (r.bio) {
          bioSection.style.display = '';
          bioSection.textContent = '"' + r.bio + '"';
        } else {
          bioSection.style.display = 'none';
        }
      }

      /* Admin verdiği badge'leri _pubProfileData'ya kaydet */
      _pubProfileData.badges = r.badges || [];

      /* Profil verisini çek — başarımlar için (sadece admin veya kendi profili) */
      try {
        if (r.uid) {
          var pubProfileRes = null;
          if (isViewerAdmin) {
            pubProfileRes = await workerPost('admin/player-profile', { token: authUser ? authUser.token : '', uid: r.uid });
          } else if (authUser && data.name === authUser.name) {
            /* Kendi profili — state'den oku */
            pubProfileRes = { ok: true, achievements: state.achievements || {} };
          }
          var achSection = document.getElementById('pubAchSection');
          var achGrid    = document.getElementById('pubAchGrid');
          var achEmpty   = document.getElementById('pubAchEmpty');
          if (pubProfileRes && pubProfileRes.ok && pubProfileRes.achievements) {
            var unlockedIds = Object.keys(pubProfileRes.achievements);
            if (unlockedIds.length > 0) {
              if (achSection) achSection.style.display = '';
              if (achEmpty)   achEmpty.style.display   = 'none';
              var achHtml = '';
              ACHIEVEMENTS.forEach(function(ach) {
                if (pubProfileRes.achievements[ach.id]) {
                  achHtml += '<div title="' + ach.name + ': ' + ach.desc + '" style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:default">' + ach.icon + '</div>';
                }
              });
              if (achGrid) achGrid.innerHTML = achHtml;
            } else {
              if (achSection) achSection.style.display = '';
              if (achEmpty)   achEmpty.style.display   = '';
              if (achGrid)    achGrid.innerHTML         = '';
            }
          } else {
            if (achSection) achSection.style.display = 'none';
          }
        }
      } catch(e) {
        var achSec = document.getElementById('pubAchSection');
        if (achSec) achSec.style.display = 'none';
        console.warn('Başarım yükleme hatası:', e);
      }

      /* Badge'ler — herkes görür */
      var badges = [];
      if (r.rank === 1)      { badges.push('<span class="pub-badge-tag pub-badge-top">🥇 #1</span>'); }
      else if (r.rank === 2) { badges.push('<span class="pub-badge-tag pub-badge-top">🥈 #2</span>'); }
      else if (r.rank === 3) { badges.push('<span class="pub-badge-tag pub-badge-top">🥉 #3</span>'); }

      /* Rol rozeti — worker'dan gelen role alanını kullan */
      if (r.role === 'superadmin') {
        badges.push('<span class="pub-badge-tag pub-badge-admin" style="background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.4);color:#f59e0b">👑 Süper Admin</span>');
      } else if (r.role === 'admin' || r.isAdmin) {
        badges.push('<span class="pub-badge-tag pub-badge-admin">⚡ Admin</span>');
      } else if (r.role === 'moderator') {
        badges.push('<span class="pub-badge-tag" style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);color:#38bdf8">🛡 Yetkili</span>');
      }

      /* Ban — sadece adminler görür */
      if (isViewerAdmin && r.banned) {
        badges.push('<span class="pub-badge-tag" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444">🚫 Banlı</span>');
        if (banInfo) {
          banInfo.style.display = '';
          banInfo.textContent = 'Ban sebebi: ' + (r.banned.reason || 'belirtilmedi');
        }
      }


      /* Admin için ek bilgiler */
      if (isViewerAdmin) {
        /* r.uid zaten public-profile'dan geldi, direkt göster */
        document.getElementById('pubUid').textContent = r.uid || '—';
        try {
          var ra = await workerPost('admin/player-info', { token: token, targetName: data.name });
          if (ra && ra.ok) {
            if (ra.banned) {
              badges.push('<span class="pub-badge-tag" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444">🚫 Banlı</span>');
              var bi = document.getElementById('pubBanInfo');
              if (bi) { bi.style.display = ''; bi.textContent = 'Ban sebebi: ' + (ra.banned.reason || 'belirtilmedi'); }
            }
          }
        } catch(e) {}
      }

      /* Custom badge'leri ekle — sadece bir kez */
      if (r.badges && r.badges.length > 0) {
        r.badges.forEach(function(b) {
          var icon = b.icon || '🏅';
          var iconHtml = (icon.startsWith('data:') || icon.startsWith('http'))
            ? '<img src="' + icon + '" style="width:16px;height:16px;border-radius:4px;object-fit:cover;vertical-align:middle;margin-right:3px">'
            : icon + ' ';
          badges.push('<span class="pub-badge-tag" style="background:rgba(' + (b.color||'99,179,237') + ',0.15);border:1px solid rgba(' + (b.color||'99,179,237') + ',0.3);color:#' + (b.textColor||'63b3ed') + '">' + iconHtml + escapeHtml(b.label || '') + '</span>');
        });
      }
      document.getElementById('pubBadges').innerHTML = badges.join('');
    }
  } catch(e) {
    document.getElementById('pubRank').textContent   = '?';
    document.getElementById('pubJoined').textContent = '?';
    var osEl = document.getElementById('pubOnlineStatus');
    if (osEl) osEl.innerHTML = '<span style="font-size:11px;color:var(--muted)">⚫ Bilgi alınamadı</span>';
    console.warn('openPublicProfile hata:', e);
    showToast('❌ Profil yüklenemedi: ' + (e.message || 'Bağlantı hatası'), '#ef4444');
  }

  if (adminActions && isViewerAdmin) { 
    adminActions.style.display = 'block';
    /* Mevcut badge'leri göster */
    var pubBadgeList = document.getElementById('pubCurrentBadges');
    if (pubBadgeList && _pubProfileData.badges && _pubProfileData.badges.length > 0) {
      pubBadgeList.style.display = '';
      pubBadgeList.innerHTML = '<div style="font-size:10px;color:var(--muted);margin-bottom:6px;font-weight:700">Verilen Badge\u2019ler:</div>' +
        _pubProfileData.badges.map(function(b) {
          var iconHtml = (b.icon && b.icon.startsWith('data:'))
            ? '<img src="' + b.icon + '" style="width:14px;height:14px;border-radius:3px;vertical-align:middle">'
            : b.icon;
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04)">' +
            '<span style="font-size:12px;color:var(--text)">' + iconHtml + ' ' + b.label + '</span>' +
            '<button onclick="adminRemoveBadgeById(\`' + _pubProfileData.name + '\`, \`' + b.id + '\`)" style="background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer;padding:2px 6px">✕</button>' +
          '</div>';
        }).join('');
    }
  }

  /* Kendi profiliyse başarımları göster */
  var pubAch = document.getElementById('pubAchievements');
  var pubAchGrid = document.getElementById('pubAchievementsGrid');
  if (pubAch && pubAchGrid && authUser && data.name === authUser.name) {
    var unlockedAchs = ACHIEVEMENTS.filter(function(a) { return state.achievements && state.achievements[a.id]; });
    if (unlockedAchs.length > 0) {
      pubAch.style.display = '';
      pubAchGrid.innerHTML = unlockedAchs.map(function(a) {
        return '<span title="' + a.name + ': ' + a.desc + '" style="font-size:22px;cursor:help">' + a.icon + '</span>';
      }).join('');
    }
  }
}

function copyPubUid() {
  var uid = document.getElementById('pubUid').textContent;
  if (!uid || uid === '—' || uid === '...') { return; }
  try {
    navigator.clipboard.writeText(uid).then(function() { showToast('📋 UID kopyalandı', '#38bdf8'); });
  } catch(e) { showToast(uid, '#38bdf8'); }
}

function closePublicProfile() {
  document.getElementById('publicProfileModal').classList.remove('show');
  _pubProfileData = null;
}

async function pubAdminBan() {
  if (!_pubProfileData) { return; }
  var reason = prompt('Ban sebebi:');
  if (!reason) { return; }
  var r = await workerPost('admin/ban', { token: authUser.token, targetName: _pubProfileData.name, reason: reason });
  if (r && r.ok) {
    showToast('🚫 ' + _pubProfileData.name + ' banlandı', '#ef4444');
    openPublicProfile(_pubProfileData);
  } else {
    showToast('❌ ' + (r ? r.error : 'Hata'), '#ef4444');
  }
}

async function pubAdminUnban() {
  if (!_pubProfileData) { return; }
  var r = await workerPost('admin/unban', { token: authUser.token, targetName: _pubProfileData.name });
  if (r && r.ok) {
    showToast('✅ ' + _pubProfileData.name + ' banı kaldırıldı', '#00ff66');
    openPublicProfile(_pubProfileData);
  } else {
    showToast('❌ ' + (r ? r.error : 'Hata'), '#ef4444');
  }
}

async function pubAdminSetScore() {
  if (!_pubProfileData) { return; }
  var score = prompt(_pubProfileData.name + ' için yeni puan:');
  if (score === null || score === '' || isNaN(Number(score))) { return; }
  var r = await workerPost('admin/set-score', { token: authUser.token, targetName: _pubProfileData.name, score: Number(score) });
  if (r && r.ok) {
    showToast('✅ Skor güncellendi: ' + r.newScore + 'p', '#00ff66');
    fetchOnlineLeaderboard();
    openPublicProfile(_pubProfileData);
  } else {
    showToast('❌ ' + (r ? r.error : 'Hata'), '#ef4444');
  }
}

async function pubAdminRemove() {
  if (!_pubProfileData) { return; }
  var ok = await showConfirm('Tablodan Çıkar', '"' + _pubProfileData.name + '" tüm liderlik tablolarından çıkarılacak.');
  if (!ok) { return; }
  var r = await workerPost('admin/remove-player', { token: authUser.token, targetName: _pubProfileData.name });
  if (r && r.ok) {
    showToast('🗑 ' + _pubProfileData.name + ' tablodan çıkarıldı', '#f59e0b');
    fetchOnlineLeaderboard();
    closePublicProfile();
  } else {
    showToast('❌ ' + (r ? r.error : 'Hata'), '#ef4444');
  }
}

async function pubAdminGiveAdmin() {
  if (!_pubProfileData) { return; }
  var ok = await showConfirm('Admin Ver', '"' + _pubProfileData.name + '" admin yapılacak.');
  if (!ok) { return; }
  var r = await workerPost('admin/give-admin', { token: authUser.token, targetName: _pubProfileData.name });
  if (r && r.ok) {
    showToast('👑 ' + _pubProfileData.name + ' artık admin', '#f59e0b');
    openPublicProfile(_pubProfileData);
  } else {
    showToast('❌ ' + (r ? r.error : 'Hata'), '#ef4444');
  }
}

async function pubAdminRemoveAdmin() {
  if (!_pubProfileData) { return; }
  var ok = await showConfirm('Admin Al', '"' + _pubProfileData.name + '" adminlikten çıkarılacak.');
  if (!ok) { return; }
  var r = await workerPost('admin/remove-admin', { token: authUser.token, targetName: _pubProfileData.name });
  if (r && r.ok) {
    showToast('❌ ' + _pubProfileData.name + ' adminlikten çıkarıldı', '#9fb3b0');
    openPublicProfile(_pubProfileData);
  } else {
    showToast('❌ ' + (r ? r.error : 'Hata'), '#ef4444');
  }
}


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


/* ══════════════════════════════════════════════════════
   DUYURU / ANKET SİSTEMİ
   ══════════════════════════════════════════════════════ */

var _currentAnnouncement = null;

async function loadAnnouncement() {
  try {
    var ann = await workerGet('announcement', {});
    if (!ann || !ann.active) return;
    if (!ann.title && !ann.text) return; /* boş duyuru gösterme */
    if (ann.id && localStorage.getItem('ann_closed_' + ann.id)) return; /* kapatılmış */
    _currentAnnouncement = ann;
    showAnnouncement(ann);
  } catch(e) {}
}

function showAnnouncement(ann) {
  var banner = document.getElementById('announcementBanner');
  if (!banner) return;

  /* Boş duyuruyu gösterme */
  if (!ann.title && !ann.text) { banner.style.display = 'none'; return; }

  /* Kapatılmış mı? */
  if (ann.id && localStorage.getItem('ann_closed_' + ann.id)) { return; }

  document.getElementById('annBannerIcon').textContent  = ann.icon || '📢';
  document.getElementById('annBannerTitle').textContent = ann.title || '';
  document.getElementById('annBannerText').textContent  = ann.text || '';

  /* Otomatik çeviri — tarayıcı diline göre */
  translateAnnouncement(ann);

  var pollEl = document.getElementById('annBannerPoll');
  pollEl.innerHTML = '';

  /* Çoktan seçmeli anket */
  if (ann.type === 'poll' && ann.pollOptions && ann.pollOptions.length > 0) {
    var totalVotes = Object.keys(ann.pollVotes || {}).length;
    ann.pollOptions.forEach(function(opt, i) {
      var votes = Object.values(ann.pollVotes || {}).filter(function(v) { return v === i; }).length;
      var pct   = totalVotes > 0 ? Math.round(votes / totalVotes * 100) : 0;
      var myVote = authUser && ann.pollVotes && ann.pollVotes[authUser.uid] === i;
      var btn = document.createElement('div');
      btn.style.cssText = 'padding:6px 12px;border-radius:20px;border:1px solid rgba(56,189,248,0.3);background:rgba(56,189,248,' + (myVote ? '0.2' : '0.07') + ');color:#38bdf8;font-size:12px;font-weight:700;cursor:pointer;min-width:80px;text-align:center';
      btn.innerHTML = escapeHtml(opt) + (totalVotes > 0 ? ' <span style="opacity:0.6;font-size:10px">%' + pct + '</span>' : '');
      btn.onclick = function() { voteAnnouncement(i); };
      pollEl.appendChild(btn);
    });
  }

  /* Serbest metin anketi */
  if (ann.type === 'text-poll') {
    var myAnswer = authUser && ann.textAnswers && ann.textAnswers[authUser.uid];
    var totalAnswers = Object.keys(ann.textAnswers || {}).length;
    var maxLen = ann.textPollMaxLen || 60;
    if (myAnswer) {
      /* Zaten cevap vermiş — cevabını göster */
      var doneDiv = document.createElement('div');
      doneDiv.style.cssText = 'margin-top:6px;font-size:12px;color:var(--neon);background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);border-radius:12px;padding:8px 12px';
      doneDiv.innerHTML = '✅ Cevabın: <strong>' + escapeHtml(myAnswer) + '</strong> · ' + totalAnswers + ' katılımcı';
      pollEl.appendChild(doneDiv);
    } else {
      /* Cevap formu */
      var wrap = document.createElement('div');
      wrap.style.cssText = 'margin-top:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap';
      var inp = document.createElement('input');
      inp.id = 'textPollInput';
      inp.maxLength = maxLen;
      inp.placeholder = 'Cevabını yaz... (maks ' + maxLen + ' karakter)';
      inp.style.cssText = 'flex:1;min-width:160px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:var(--text);font-size:13px;padding:8px 12px;font-family:inherit;outline:none';
      var sendBtn = document.createElement('button');
      sendBtn.textContent = 'Gönder';
      sendBtn.style.cssText = 'padding:8px 16px;border-radius:10px;border:none;background:var(--neon);color:#030608;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap';
      sendBtn.onclick = function() { submitTextPoll(inp.value); };
      inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { submitTextPoll(inp.value); } });
      var countDiv = document.createElement('div');
      countDiv.style.cssText = 'width:100%;font-size:10px;color:var(--muted);margin-top:2px';
      countDiv.textContent = totalAnswers + ' kişi katıldı';
      wrap.appendChild(inp);
      wrap.appendChild(sendBtn);
      wrap.appendChild(countDiv);
      pollEl.appendChild(wrap);
    }
  }

  banner.style.display = '';
}

/* Duyuruyu tarayıcı diline göre çevir */
async function translateAnnouncement(ann) {
  try {
    /* Tarayıcı dili TR ise çevirme */
    var lang = (navigator.language || navigator.userLanguage || 'tr').toLowerCase().slice(0, 2);
    if (lang === 'tr') return;

    var textToTranslate = (ann.title ? ann.title + '\n' : '') + (ann.text || '');
    if (!textToTranslate.trim()) return;

    /* Google Translate API'siz — MyMemory ücretsiz API */
    var url = 'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(textToTranslate) + '&langpair=tr|' + lang;
    var resp = await fetch(url);
    var data = await resp.json();
    var translated = data?.responseData?.translatedText;
    if (!translated || translated === textToTranslate) return;

    /* Başlık ve metin ayrı satırlarda geldiyse böl */
    if (ann.title && ann.text) {
      var parts = translated.split('\n');
      if (parts.length >= 2) {
        document.getElementById('annBannerTitle').textContent = parts[0];
        document.getElementById('annBannerText').textContent  = parts.slice(1).join(' ');
      } else {
        document.getElementById('annBannerText').textContent = translated;
      }
    } else {
      document.getElementById('annBannerText').textContent = translated;
    }
  } catch(e) { /* sessizce geç — çeviri olmasa da duyuru gösterilir */ }
}

function closeAnnouncement() {
  var banner = document.getElementById('announcementBanner');
  if (banner) { banner.style.display = 'none'; }
  if (_currentAnnouncement) {
    localStorage.setItem('ann_closed_' + _currentAnnouncement.id, '1');
  }
}

async function voteAnnouncement(optionIndex) {
  if (!authUser) { showToast('Oy vermek için giriş yap'); return; }
  try {
    var r = await workerPost('admin/announcement-vote', { token: authUser.token, optionIndex });
    if (r && r.ok) {
      if (_currentAnnouncement) {
        _currentAnnouncement.pollVotes = r.votes;
        showAnnouncement(_currentAnnouncement);
      }
    }
  } catch(e) {}
}

async function submitTextPoll(rawText, annId) {
  if (!authUser) { showToast('Cevap vermek için giriş yap', '#f59e0b'); return; }
  var text = (rawText || '').trim();
  if (!text || text.length < 1) { showToast('Bir şeyler yaz!', '#f59e0b'); return; }

  /* annId'yi bul — parametre > _currentAnnouncement > ilk text-poll */
  var id = annId
    || (_currentAnnouncement && _currentAnnouncement.id)
    || (window._allAnnouncements && window._allAnnouncements.length &&
        (window._allAnnouncements.find(function(a){ return a.type==='text-poll' && a.active; }) || {}).id);
  var ann = (_currentAnnouncement && _currentAnnouncement.id === id)
    ? _currentAnnouncement
    : (window._allAnnouncements || []).find(function(a){ return a.id===id; }) || _currentAnnouncement;

  var maxLen = (ann && ann.textPollMaxLen) || 60;
  if (text.length > maxLen) { showToast('Çok uzun! Maks ' + maxLen + ' karakter', '#f59e0b'); return; }

  /* Gönder butonunu devre dışı bırak */
  var sendBtns = document.querySelectorAll('[onclick*="submitTextPoll"]');
  sendBtns.forEach(function(b){ b.disabled=true; b.textContent='⏳'; });

  try {
    var payload = { token: authUser.token, text: text };
    if (id) payload.annId = id;
    var r = await workerPost('admin/text-poll-submit', payload);
    if (r && r.ok) {
      showToast('✅ Cevabın alındı! ' + (r.totalAnswers ? r.totalAnswers + ' katılımcı' : ''), '#00ff88');
      /* Lokal güncelle */
      if (ann) {
        if (!ann.textAnswers) ann.textAnswers = {};
        ann.textAnswers[authUser.uid] = text;
        try { showAnnouncement(ann, (window._allAnnouncements || []).length); } catch(e) {}
      }
      /* Butonları kaldır */
      sendBtns.forEach(function(b){ try { b.closest('[style*="flex-wrap"]').innerHTML = '<div style="font-size:12px;color:var(--neon);padding:8px">✅ Cevabın kaydedildi: <strong>' + escapeHtml(text) + '</strong></div>'; } catch(e) { b.disabled=true; b.textContent='✅ Gönderildi'; } });
    } else {
      var errMsg = (r && r.error) ? r.error : 'Gönderilemedi';
      showToast('❌ ' + errMsg, '#ef4444');
      sendBtns.forEach(function(b){ b.disabled=false; b.textContent='Gönder'; });
    }
  } catch(e) {
    showToast('Bağlantı hatası: ' + e.message, '#ef4444');
    sendBtns.forEach(function(b){ b.disabled=false; b.textContent='Gönder'; });
  }
}

/* Admin fonksiyonları */
async function adminPublishAnnouncement() {
  var icon    = (document.getElementById('annIcon')?.value || '').trim() || '📢';
  var title   = (document.getElementById('annTitle')?.value || '').trim();
  var text    = (document.getElementById('annText')?.value || '').trim();
  var type    = document.getElementById('annType')?.value || 'info';
  var expires = document.getElementById('annExpires')?.value;
  if (!title || !text) { adminLog('Başlık ve metin gerekli'); return; }
  var pollOptions = [];
  var textPollMaxLen = 60;
  if (type === 'poll') {
    var o1 = (document.getElementById('annOpt1')?.value || '').trim();
    var o2 = (document.getElementById('annOpt2')?.value || '').trim();
    var o3 = (document.getElementById('annOpt3')?.value || '').trim();
    if (!o1 || !o2) { adminLog('Anket için en az 2 seçenek gerekli'); return; }
    pollOptions = [o1, o2];
    if (o3) { pollOptions.push(o3); }
  }
  if (type === 'text-poll') {
    textPollMaxLen = parseInt(document.getElementById('annTextMaxLen')?.value || '60') || 60;
  }
  var r = await adminCall('admin/announcement-set', {
    icon, title, text, type, pollOptions,
    textPollMaxLen: type === 'text-poll' ? textPollMaxLen : undefined,
    expiresHours: expires || null
  });
  if (r && r.ok) {
    adminLog('✅ Duyuru/Anket yayınlandı');
    loadAnnouncement();
  } else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

/* Serbest metin anket sonuçlarını admin olarak gör */
async function adminViewTextPollResults() {
  var r = await adminCall('admin/text-poll-results', {});
  if (!r || !r.ok) { adminLog('❌ Sonuçlar alınamadı'); return; }
  var answers = r.answers || [];
  if (answers.length === 0) { adminLog('Henüz cevap yok'); return; }
  /* Frekans sayımı */
  var freq = {};
  answers.forEach(function(a) {
    var key = a.text.toLowerCase().trim();
    freq[key] = (freq[key] || 0) + 1;
  });
  var sorted = Object.entries(freq).sort(function(a, b) { return b[1] - a[1]; });
  var box = document.getElementById('adminLog');
  var html = '<div style="background:rgba(99,179,237,0.08);border:1px solid rgba(99,179,237,0.2);border-radius:10px;padding:10px;margin-top:8px">' +
    '<div style="font-size:11px;font-weight:800;color:#63b3ed;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📊 Anket Sonuçları (' + answers.length + ' cevap)</div>';
  sorted.slice(0, 30).forEach(function(entry) {
    var pct = Math.round(entry[1] / answers.length * 100);
    html += '<div style="margin-bottom:6px">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">' +
        '<span style="color:var(--text);font-weight:600">' + escapeHtml(entry[0]) + '</span>' +
        '<span style="color:#63b3ed;font-weight:700">' + entry[1] + ' (' + pct + '%)</span>' +
      '</div>' +
      '<div style="height:4px;background:rgba(255,255,255,0.06);border-radius:4px">' +
        '<div style="height:100%;width:' + pct + '%;background:#63b3ed;border-radius:4px"></div>' +
      '</div></div>';
  });
  html += '</div>';
  if (box) { box.innerHTML += html; box.scrollTop = box.scrollHeight; }
}

async function adminClearAnnouncement() {
  var r = await adminCall('admin/announcement-clear', {});
  if (r && r.ok) {
    adminLog('✅ Duyuru kaldırıldı');
    var banner = document.getElementById('announcementBanner');
    if (banner) { banner.style.display = 'none'; }
  } else adminLog('❌ ' + (r ? r.error : 'Hata'));
}

/* Anket tip değişince seçenek alanı göster/gizle */
document.addEventListener('DOMContentLoaded', function() {
  var annTypeEl = document.getElementById('annType');
  var annPollEl = document.getElementById('annPollOptions');
  var annTextPollEl = document.getElementById('annTextPollOptions');
  if (annTypeEl && annPollEl) {
    annTypeEl.addEventListener('change', function() {
      annPollEl.style.display = annTypeEl.value === 'poll' ? 'flex' : 'none';
      if (annTextPollEl) {
        annTextPollEl.style.display = annTypeEl.value === 'text-poll' ? 'flex' : 'none';
      }
    });
  }
});


/* ═══════════════════════════════════════════════════
   SORU SAYACI
   ═══════════════════════════════════════════════════ */
var _qTIv=null,_qTLeft=0,_qTTotal=0,_qTPaused=false;
function startQT(sec){
  stopQT();
  if(!sec||sec<=0)return;
  _qTTotal=sec;_qTLeft=sec;_qTPaused=false;
  var w=document.getElementById('qTimerWrap'),
      b=document.getElementById('qTimerBar'),
      t=document.getElementById('qTimerTxt'),
      c=document.getElementById('qTimerCnt'),
      f=document.getElementById('fbkBtn');
  if(w)w.style.display='block';
  if(t)t.style.display='block';
  if(f)f.style.display='inline-flex';
  if(b)b.style.width='100%';
  if(c)c.textContent=Math.ceil(sec);
  _qTIv=setInterval(function(){
    if(_qTPaused)return;
    _qTLeft-=0.1;
    var pct=Math.max(0,(_qTLeft/_qTTotal)*100);
    if(b){b.style.width=pct+'%';b.style.background=pct<33?'linear-gradient(90deg,#ef4444,#f97316)':pct<66?'linear-gradient(90deg,#f59e0b,#eab308)':'linear-gradient(90deg,var(--neon),#00cc66)';}
    if(c)c.textContent=Math.max(0,Math.ceil(_qTLeft));
    if(_qTLeft<=0){
      stopQT();
      try{failSound();}catch(e){}
      if(typeof resultMsg!=='undefined'){resultMsg.style.color='#ff6b6b';resultMsg.innerText='⏰ Süre doldu!';resultMsg.style.opacity=1;}
      if(typeof state!=='undefined'){if(!state.stats)state.stats={};state.stats.totalAnswered=(state.stats.totalAnswered||0)+1;state.stats.totalWrong=(state.stats.totalWrong||0)+1;saveState();}
      if(gameMode==='math')setTimeout(function(){try{nextQuestion(false);}catch(e){}},1200);
      else if(gameMode==='absurd')setTimeout(function(){try{nextAbsurdQuestion();}catch(e){}},1200);
    }
  },100);
}
function stopQT(){
  if(_qTIv){clearInterval(_qTIv);_qTIv=null;}
  var w=document.getElementById('qTimerWrap'),t=document.getElementById('qTimerTxt');
  if(w)w.style.display='none';if(t)t.style.display='none';
}
function pauseQT(){_qTPaused=true;}
function resumeQT(){_qTPaused=false;}
/* Pause butonları */
(function(){
  var pb=document.getElementById('pauseBtn'),rb=document.getElementById('resumeBtn'),mb=document.getElementById('pauseMenuBtn');
  if(pb)pb.addEventListener('click',pauseQT);
  if(rb)rb.addEventListener('click',resumeQT);
  if(mb)mb.addEventListener('click',stopQT,true);
})();

/* ═══════════════════════════════════════════════════
   DURAKLATMA FİX + SAYAÇ — nextQuestion/nextAbsurd wrap
   ═══════════════════════════════════════════════════ */
var _pMQ=null,_pAQ=null,_lastQ=null;
(function(){
  var mb=document.getElementById('pauseMenuBtn');
  if(mb)mb.addEventListener('click',function(){
    if(gameMode==='math'&&typeof correctAnswer!=='undefined'&&questionText){
      _pMQ={q:questionText.innerText,ans:correctAnswer};
    }else if(gameMode==='absurd'&&currentAbsurd){_pAQ=currentAbsurd;}
  },true);
})();
/* nextQuestion/checkAnswer wrap — game.js yüklendikten sonra çalışmalı */
window.addEventListener('load', function() {
  try {
    var _origNQ=nextQuestion;
    nextQuestion=function(reset){
      if(!reset&&_pMQ){
        var s=_pMQ;_pMQ=null;
        questionText.innerText=s.q;correctAnswer=s.ans;
        resultMsg.innerText='';resultMsg.style.opacity=0;
        answerInput.value='';try{answerInput.focus();}catch(e){}
        startQT(Math.min(40,15+Math.floor((state.level||1)*0.5)));
        return;
      }
      if(!reset&&questionText&&questionText.innerText&&questionText.innerText!=='—'&&typeof correctAnswer!=='undefined'){
        _lastQ={q:questionText.innerText,ans:String(correctAnswer),ua:answerInput?answerInput.value:''};
      }
      _pMQ=null;
      _origNQ.call(this,reset);
      if(gameMode==='math')startQT(Math.min(40,15+Math.floor((state.level||1)*0.5)));
    };
    var _origNA=window.nextAbsurdQuestion;
    window.nextAbsurdQuestion=async function(){
      if(_pAQ){
        var sa=_pAQ;_pAQ=null;currentAbsurd=sa;
        questionText.innerText=sa.q;resultMsg.innerText='';resultMsg.style.opacity=0;
        var idx=[0,1,2,3];for(var ii=3;ii>0;ii--){var jj=randInt(0,ii);var tt=idx[ii];idx[ii]=idx[jj];idx[jj]=tt;}
        var cont=document.getElementById('absurdChoices');cont.innerHTML='';
        var gr=document.createElement('div');gr.className='absurd-grid';
        idx.forEach(function(oi){
          var bt=document.createElement('button');bt.className='choice-btn';bt.dataset.orig=oi;
          bt.textContent=String(sa.choices[oi]).replace(/^[A-Da-d][\)\.\s]+/,'').trim();
          bt.addEventListener('click',function(){handleAbsurdAnswer(bt,oi,gr);});
          gr.appendChild(bt);
        });
        cont.appendChild(gr);startQT(20);return;
      }
      _pAQ=null;
      await _origNA.apply(this,arguments);
      startQT(20);
    };
    var _origCA=checkAnswer;
    checkAnswer=function(){
      if(questionText&&questionText.innerText&&questionText.innerText!=='—'&&typeof correctAnswer!=='undefined'){
        _lastQ={q:questionText.innerText,ans:String(correctAnswer),ua:answerInput?answerInput.value:''};
      }
      return _origCA.apply(this,arguments);
    };
  } catch(e) { console.warn('nextQuestion wrap hata:', e); }
});

/* ═══════════════════════════════════════════════════
   GERİ BİLDİRİM
   ═══════════════════════════════════════════════════ */
var _fbCtx=null;
(function(){
  var fb=document.getElementById('fbkBtn');
  if(!fb)return;
  fb.addEventListener('click',function(){
    if(!authUser){showToast('Geri bildirim için giriş yap','#f59e0b');return;}
    pauseQT();
    var q=_lastQ||{q:(questionText?questionText.innerText:'—'),ans:(typeof correctAnswer!=='undefined'?String(correctAnswer):'—'),ua:(answerInput?answerInput.value:'')};
    _fbCtx={mode:gameMode||'math',question:q.q,userAnswer:q.ua,correctAnswer:q.ans,score:state?(state.score||0):0,level:state?(state.level||1):1};
    var info=document.getElementById('fbInfoBox');
    if(info)info.innerHTML='<strong>Soru:</strong> '+escapeHtml(q.q)+'<br><strong>Cevabın:</strong> '+(q.ua||'—')+' | <strong>Doğru:</strong> '+q.ans;
    var ta=document.getElementById('fbText');if(ta)ta.value='';
    var fm=document.getElementById('fbModal');if(fm)fm.style.display='flex';
  });
})();
function closeFbModal(){var fm=document.getElementById('fbModal');if(fm)fm.style.display='none';resumeQT();}
async function submitFb(){
  var msg=(document.getElementById('fbText')?document.getElementById('fbText').value:'').trim();
  if(!msg||msg.length<3){showToast('Lütfen bir şeyler yaz','#f59e0b');return;}
  if(!authUser){showToast('Giriş gerekli','#ef4444');return;}
  try{
    var r=await workerPost('feedback',{token:authUser.token,message:msg,context:_fbCtx});
    if(r&&r.ok){showToast('✅ Geri bildirim gönderildi!','#00ff88');closeFbModal();}
    else showToast('Gönderilemedi','#ef4444');
  }catch(e){showToast('Bağlantı hatası','#ef4444');}
}

/* ═══════════════════════════════════════════════════
   SANDIK
   ═══════════════════════════════════════════════════ */
function openChestModal(){var m=document.getElementById('chestModal');if(m){m.style.display='flex';renderChest();}}
function closeChestModal(){var m=document.getElementById('chestModal');if(m)m.style.display='none';}
function renderChest(){
  var el=document.getElementById('chestContent');if(!el)return;
  var j=state.jokers||{skip:0,hint:0,freeze:0,double:0};
  var jd=[{k:'skip',i:'⏭️',n:'Pas Geç',c:'#38bdf8'},{k:'hint',i:'💡',n:'İpucu',c:'#fbbf24'},{k:'freeze',i:'❄️',n:'Dondur',c:'#a78bfa'},{k:'double',i:'✌️',n:'Çift Puan',c:'#00ff88'}];
  var h2='';
  h2+='<div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:14px;padding:14px;margin-bottom:14px">';
  h2+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">💰 Cüzdan</div>';
  h2+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h2+='<div style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px">💰</div><div style="font-size:20px;font-weight:800;color:#ffd700;font-family:var(--font-mono)">'+(state.coins||0).toLocaleString()+'</div><div style="font-size:11px;color:var(--muted)">Coin</div></div>';
  h2+='<div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px">💎</div><div style="font-size:20px;font-weight:800;color:#38bdf8;font-family:var(--font-mono)">'+(state.diamonds||0).toLocaleString()+'</div><div style="font-size:11px;color:var(--muted)">Elmas</div></div>';
  h2+='</div></div>';
  h2+='<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px">';
  h2+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">🃏 Jokerler</div>';
  h2+='<div style="display:flex;flex-direction:column;gap:8px">';
  jd.forEach(function(x){var cnt=j[x.k]||0;h2+='<div class="chest-item"><span style="font-size:26px">'+x.i+'</span><div style="flex:1"><div style="font-size:13px;font-weight:800;color:'+x.c+'">'+x.n+'</div></div><div style="min-width:40px;text-align:center;font-size:20px;font-weight:800;font-family:var(--font-mono);color:'+(cnt>0?x.c:'var(--muted2)')+'"> '+(cnt>0?'x'+cnt:'—')+'</div></div>';});
  h2+='</div></div>';
  var inv=state.inventory||[];
  h2+='<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px">';
  h2+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">📦 Envanter ('+inv.length+')</div>';
  if(inv.length>0){inv.forEach(function(it){h2+='<div class="chest-item" style="margin-bottom:8px"><span style="font-size:24px">'+(it.icon||'📦')+'</span><div style="flex:1"><div style="font-size:13px;font-weight:700">'+(it.name||it.id||'?')+'</div></div>'+(it.active?'<span style="font-size:11px;color:var(--neon);font-weight:800">AKTİF</span>':'')+'</div>';});}
  else{h2+='<div style="text-align:center;color:var(--muted);font-size:13px">Henüz bir şey yok.</div>';}
  h2+='</div>';
  var badges=(state.profile&&state.profile.badges)?state.profile.badges:[];
  if(badges.length>0){
    h2+='<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px">';
    h2+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">🏅 Rozetler ('+badges.length+')</div>';
    h2+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    badges.forEach(function(b){h2+='<div style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:20px;background:rgba('+(b.rgbColor||'251,191,36')+',0.15);border:1px solid rgba('+(b.rgbColor||'251,191,36')+',0.3);color:#'+(b.textColor||'fbbf24')+';font-size:12px;font-weight:800">'+(b.icon||'🏅')+' '+(b.label||'Rozet')+'</div>';});
    h2+='</div></div>';
  }
  h2+='<div style="background:rgba(255,165,0,0.06);border:1px solid rgba(255,165,0,0.2);border-radius:14px;padding:14px"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:8px">🔥 Giriş Serisi</div><div style="display:flex;align-items:center;gap:12px"><span style="font-size:36px">🔥</span><div><div style="font-size:22px;font-weight:800;color:#f97316;font-family:var(--font-mono)">'+(state.loginStreak||0)+' gün</div></div></div></div>';
  el.innerHTML=h2;
}
function updateChestQuick(){
  var el=document.getElementById('chestQuickInfo');if(!el)return;
  var j=state.jokers||{};
  var t=(j.skip||0)+(j.hint||0)+(j.freeze||0)+(j.double||0);
  el.textContent=t>0?t+' joker':'Jokerler ve eşyalarım';
}

/* ═══════════════════════════════════════════════════
   MEYDAN OKUMA
   ═══════════════════════════════════════════════════ */
var CD={cadet:{l:'Çırak 🌱',c:'#22c55e',mN:50,tpq:25,ops:['+','-'],mx:1},warrior:{l:'Savaşçı ⚔️',c:'#3b82f6',mN:500,tpq:18,ops:['+','-','*'],mx:2},legend:{l:'Efsane 🔥',c:'#f59e0b',mN:2000,tpq:12,ops:['+','-','*','/'],mx:3},god:{l:'Tanrı ⚡',c:'#ef4444',mN:9999,tpq:8,ops:['+','-','*','/'],mx:5}};
var _ch={d:null,n:0,ok:0,st:0,act:false,tIv:null,qIv:null,cur:null};
function openChallengeModal(){var m=document.getElementById('challengeModal');if(m){m.style.display='flex';chlTab('play');}}
function closeChallengeModal(){var m=document.getElementById('challengeModal');if(m)m.style.display='none';}
function chlTab(tab){
  var tp=document.getElementById('chlTP'),tl=document.getElementById('chlTL');
  if(!tp||!tl)return;
  if(tab==='play'){tp.className='btn';tp.style.cssText='flex:1;font-size:12px;padding:8px';tl.className='btn ghost';tl.style.cssText='flex:1;font-size:12px;padding:8px';chlRenderPlay();}
  else{tl.className='btn';tl.style.cssText='flex:1;font-size:12px;padding:8px';tp.className='btn ghost';tp.style.cssText='flex:1;font-size:12px;padding:8px';chlRenderLb();}
}
function chlRenderPlay(){
  var el=document.getElementById('chlContent');if(!el)return;
  var h2='<div style="display:flex;flex-direction:column;gap:8px">';
  Object.keys(CD).forEach(function(k){var d=CD[k];h2+='<button data-dk="'+k+'" class="chlDB" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;border:1px solid '+d.c+'30;background:var(--glass);cursor:pointer;width:100%;text-align:left;font-family:var(--font-body);color:var(--text)"><div style="flex:1"><div style="font-size:15px;font-weight:800;color:'+d.c+'">'+d.l+'</div><div style="font-size:11px;color:var(--muted);margin-top:2px">20 soru · '+d.tpq+'s/soru · '+d.mx+'x puan</div></div><span style="color:var(--muted);font-size:18px">›</span></button>';});
  h2+='</div>';
  el.innerHTML=h2;
  el.querySelectorAll('.chlDB').forEach(function(b){b.addEventListener('click',function(){startChl(b.dataset.dk);});});
}
function chlRenderLb(){
  var el=document.getElementById('chlContent');if(!el)return;
  var sel='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="chlSel">';
  Object.keys(CD).forEach(function(k){var d=CD[k];sel+='<button data-dk="'+k+'" style="font-size:11px;padding:5px 10px;border-radius:20px;border:1px solid '+d.c+'40;background:transparent;color:'+d.c+';cursor:pointer;font-family:var(--font-body)">'+d.l+'</button>';});
  sel+='</div><div id="chlLbIn"></div>';
  el.innerHTML=sel;
  el.querySelectorAll('#chlSel button').forEach(function(b){b.addEventListener('click',function(){loadChlLb(b.dataset.dk);});});
  loadChlLb('cadet');
}
async function loadChlLb(dk){
  var el=document.getElementById('chlLbIn');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:16px;color:var(--muted)">⏳</div>';
  try{
    var r=await workerPost('challenge/leaderboard',{diff:dk});
    if(!r||!r.board||!r.board.length){el.innerHTML='<div style="text-align:center;padding:16px;color:var(--muted)">Henüz kayıt yok</div>';return;}
    var d=CD[dk]||{};
    var h3='<div style="display:flex;flex-direction:column;gap:6px">';
    r.board.forEach(function(e,i){
      var mm=Math.floor(e.time/60000),ss=Math.floor((e.time%60000)/1000);
      var medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.';
      h3+='<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--glass);border:1px solid var(--border);border-radius:12px"><span style="font-size:14px;min-width:24px">'+medal+'</span><span style="flex:1;font-weight:700;font-size:13px">'+escapeHtml(e.name)+'</span><span style="font-size:12px;font-weight:800;color:'+(d.c||'var(--neon)')+'">'+e.score+'p</span><span style="font-size:11px;color:var(--muted);font-family:var(--font-mono)">'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')+'</span></div>';
    });
    el.innerHTML=h3+'</div>';
  }catch(e2){el.innerHTML='<div style="color:#ef4444;padding:12px">Hata: '+e2.message+'</div>';}
}
function cR(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function startChl(dk){
  if(!authUser){showToast('Giriş yap!','#ef4444');return;}
  var d=CD[dk];if(!d)return;
  closeChallengeModal();
  _ch.d=dk;_ch.n=0;_ch.ok=0;_ch.st=Date.now();_ch.act=true;
  var dl=document.getElementById('chlDL');if(dl){dl.textContent=d.l.toUpperCase();dl.style.color=d.c;}
  var cc=document.getElementById('chlCC');if(cc)cc.textContent='0';
  var rm=document.getElementById('chlRM');if(rm){rm.textContent='';rm.style.opacity='0';}
  var ga=document.getElementById('chlGA');if(ga)ga.style.display='block';
  document.body.style.overflow='hidden';
  if(_ch.tIv)clearInterval(_ch.tIv);
  _ch.tIv=setInterval(function(){
    if(!_ch.act){clearInterval(_ch.tIv);return;}
    var el=Date.now()-_ch.st,mm=Math.floor(el/60000),ss=Math.floor((el%60000)/1000);
    var te=document.getElementById('chlTT');if(te)te.textContent=String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
  },500);
  chlNextQ();
}
function chlNextQ(){
  var d=CD[_ch.d];if(!d)return;
  _ch.n++;if(_ch.n>20){chlFinish();return;}
  var qn=document.getElementById('chlQN');if(qn)qn.textContent=_ch.n;
  var rm=document.getElementById('chlRM');if(rm){rm.textContent='';rm.style.opacity='0';}
  var op=d.ops[Math.floor(Math.random()*d.ops.length)],a,b,ans;
  if(op==='+'){a=cR(1,d.mN);b=cR(1,d.mN);ans=a+b;}
  else if(op==='-'){a=cR(1,d.mN);b=cR(1,Math.max(1,a));ans=a-b;}
  else if(op==='*'){var sq=Math.max(2,Math.floor(Math.sqrt(d.mN)));a=cR(2,sq);b=cR(2,sq);ans=a*b;}
  else{b=cR(2,Math.max(2,Math.floor(d.mN/4)));a=b*cR(2,Math.max(2,Math.floor(d.mN/b)));ans=a/b;}
  _ch.cur=ans;
  var od={'+':'+','-':'−','*':'×','/':'÷'}[op]||op;
  var qt=document.getElementById('chlQT');if(qt)qt.textContent=a+' '+od+' '+b+' = ?';
  var choices=[ans];var tries=0;
  while(choices.length<4&&tries++<50){var fk=ans+cR(-Math.max(5,Math.floor(Math.abs(ans)*0.3)),Math.max(5,Math.floor(Math.abs(ans)*0.3)));if(fk!==ans&&!choices.includes(fk))choices.push(fk);}
  choices=choices.sort(function(){return Math.random()-0.5;});
  var ct=document.getElementById('chlChoices');if(!ct)return;
  ct.innerHTML='';
  choices.forEach(function(c){
    var bt=document.createElement('button');
    bt.style.cssText='padding:14px;border-radius:12px;border:1px solid var(--border2);background:var(--glass);color:var(--text);font-size:18px;font-weight:800;cursor:pointer;font-family:var(--font-body);width:100%;text-align:center;margin-bottom:4px';
    bt.textContent=c;bt.addEventListener('click',function(){chlAns(c,bt,ct);});
    ct.appendChild(bt);
  });
  if(_ch.qIv)clearInterval(_ch.qIv);
  var left=d.tpq;
  var br=document.getElementById('chlTB'),cn=document.getElementById('chlTC');
  if(br)br.style.width='100%';if(cn)cn.textContent=Math.ceil(left);
  _ch.qIv=setInterval(function(){
    left-=0.1;var pct=Math.max(0,(left/d.tpq)*100);
    if(br)br.style.width=pct+'%';if(cn)cn.textContent=Math.max(0,Math.ceil(left));
    if(left<=0){clearInterval(_ch.qIv);try{failSound();}catch(e){}var rm2=document.getElementById('chlRM');if(rm2){rm2.style.color='#ff6b6b';rm2.textContent='⏰ Süre doldu!';rm2.style.opacity='1';}setTimeout(chlNextQ,900);}
  },100);
}
function chlAns(chosen,btnEl,ct2){
  if(_ch.qIv)clearInterval(_ch.qIv);
  ct2.querySelectorAll('button').forEach(function(b){b.disabled=true;});
  var rm=document.getElementById('chlRM');
  if(Number(chosen)===_ch.cur){
    btnEl.style.background='rgba(0,255,136,0.12)';btnEl.style.borderColor='rgba(0,255,136,0.4)';btnEl.style.color='var(--neon)';
    _ch.ok++;var cc=document.getElementById('chlCC');if(cc)cc.textContent=_ch.ok;
    if(rm){rm.style.color='#00ff88';rm.textContent='✅ Doğru!';rm.style.opacity='1';}
    try{successSound();}catch(e){}setTimeout(chlNextQ,700);
  }else{
    btnEl.style.background='rgba(239,68,68,0.12)';btnEl.style.borderColor='rgba(239,68,68,0.3)';btnEl.style.color='#ef4444';
    ct2.querySelectorAll('button').forEach(function(b2){if(Number(b2.textContent)===_ch.cur){b2.style.background='rgba(0,255,136,0.12)';b2.style.borderColor='rgba(0,255,136,0.4)';b2.style.color='var(--neon)';}});
    if(rm){rm.style.color='#ff6b6b';rm.textContent='❌ Yanlış!';rm.style.opacity='1';}
    try{failSound();}catch(e){}setTimeout(chlNextQ,900);
  }
}
async function chlFinish(){
  _ch.act=false;if(_ch.tIv)clearInterval(_ch.tIv);if(_ch.qIv)clearInterval(_ch.qIv);
  var el=Date.now()-_ch.st,d=CD[_ch.d]||{mx:1};var score=_ch.ok*100*d.mx;
  var mm=Math.floor(el/60000),ss=Math.floor((el%60000)/1000);
  var ga=document.getElementById('chlGA');if(ga)ga.style.display='none';
  document.body.style.overflow='';
  showToast('⚔️ '+_ch.ok+'/20 · '+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')+' · '+score+'p','#00ff88');
  try{spawnConfetti(20);}catch(e){}
  if(authUser&&authUser.token){try{await workerPost('challenge/submit',{token:authUser.token,diff:_ch.d,score:score,correct:_ch.ok,time:el});}catch(e){}}
  openChallengeModal();chlTab('lb');setTimeout(function(){loadChlLb(_ch.d);},300);
}
function exitChallenge(){
  _ch.act=false;if(_ch.tIv)clearInterval(_ch.tIv);if(_ch.qIv)clearInterval(_ch.qIv);
  var ga=document.getElementById('chlGA');if(ga)ga.style.display='none';
  document.body.style.overflow='';
}

/* ═══════════════════════════════════════════════════
   KLAN SOHBET
   ═══════════════════════════════════════════════════ */
var _ccRef=null,_ccLis=null,_ccClan=null;
function openClanChat(clanId){
  _ccClan=clanId;
  var m=document.getElementById('clanChatModal');
  if(m){m.style.display='flex';loadClanChat(clanId);}
}
function closeClanChat(){
  if(_ccRef&&_ccLis){try{_ccRef.off('child_added',_ccLis);}catch(e){}_ccLis=null;}_ccRef=null;
  var m=document.getElementById('clanChatModal');if(m)m.style.display='none';
}
function loadClanChat(clanId){
  var msgs=document.getElementById('ccMsgs');
  if(!fbDB){if(msgs)msgs.innerHTML='<div style="text-align:center;padding:20px;color:#ef4444">⚠️ Veritabanı bağlantısı yok</div>';return;}
  if(msgs)msgs.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted)">💬 Yükleniyor...</div>';
  if(_ccRef&&_ccLis){try{_ccRef.off('child_added',_ccLis);}catch(e){}_ccLis=null;}
  var ref=fbDB.ref('clan_chat/'+clanId).limitToLast(50);
  ref.once('value',function(snap){
    if(msgs)msgs.innerHTML='';
    var lastKey=null;
    if(snap.exists()){snap.forEach(function(c){if(!c.val().deleted)appendCC(c.val(),c.key);lastKey=c.key;});}
    var lRef=lastKey?fbDB.ref('clan_chat/'+clanId).orderByKey().startAfter(lastKey):fbDB.ref('clan_chat/'+clanId).limitToLast(1);
    _ccLis=lRef.on('child_added',function(c){if(!c.val().deleted)appendCC(c.val(),c.key);});
    _ccRef=lRef;
    var msgs2=document.getElementById('ccMsgs');if(msgs2)msgs2.scrollTop=msgs2.scrollHeight;
  });
}
function appendCC(msg,key){
  try{
    var msgs=document.getElementById('ccMsgs');if(!msgs||!msg)return;
    var isMe=!!(authUser&&msg.uid===authUser.uid);
    var d2=new Date(msg.ts||Date.now());
    var time=d2.getHours().toString().padStart(2,'0')+':'+d2.getMinutes().toString().padStart(2,'0');
    var txt=escapeHtml((msg.text||'').slice(0,500));if(!txt)return;
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+';margin-bottom:10px;padding:0 2px';
    var delBtn=isMe?'<button data-k="'+key+'" style="background:none;border:none;color:var(--muted2);font-size:11px;cursor:pointer;padding:2px 4px">🗑</button>':'<button data-k="'+key+'" data-n="'+escapeHtml(msg.name||'?')+'" style="background:none;border:none;color:var(--muted2);font-size:11px;cursor:pointer;padding:2px 4px">⚠️</button>';
    wrap.innerHTML=
      '<div style="font-size:10px;color:var(--muted);margin-bottom:3px;'+(isMe?'text-align:right':'text-align:left')+'">'+(isMe?'Sen':escapeHtml(msg.name||'?'))+' · '+time+'</div>'+
      '<div style="display:flex;align-items:flex-end;gap:4px;flex-direction:'+(isMe?'row-reverse':'row')+'">'+
        '<div style="max-width:72%;padding:9px 13px;border-radius:'+(isMe?'18px 18px 4px 18px':'18px 18px 18px 4px')+';background:'+(isMe?'linear-gradient(135deg,rgba(0,255,136,0.18),rgba(0,204,102,0.12))':'var(--glass2)')+';border:1px solid '+(isMe?'rgba(0,255,136,0.25)':'var(--border2)')+';font-size:13px;color:var(--text);word-break:break-word;line-height:1.5">'+txt+'</div>'+
        '<div>'+delBtn+'</div>'+
      '</div>';
    if(isMe){
      wrap.querySelector('button').addEventListener('click',function(){delCC(key);});
    }else{
      var rb=wrap.querySelector('button');
      rb.addEventListener('click',function(){repCC(key,msg.name||'?');});
    }
    msgs.appendChild(wrap);msgs.scrollTop=msgs.scrollHeight;
  }catch(e){console.warn('appendCC:',e);}
}
function delCC(key){
  if(!key||!_ccClan||!fbDB)return;
  if(!confirm('Mesajı sil?'))return;
  fbDB.ref('clan_chat/'+_ccClan+'/'+key).update({deleted:true,text:'[silindi]'});
}
function repCC(key,name){
  showToast('Şikayet klan liderine iletildi','#f59e0b');
  if(authUser)workerPost('feedback',{token:authUser.token,message:'Chat şikayet: '+name+' key:'+key,context:{mode:'clan_chat',question:key,userAnswer:name,correctAnswer:'',score:0,level:0}}).catch(function(){});
}
function sendCC(){
  var inp=document.getElementById('ccInp');
  var txt=inp?inp.value.trim():'';
  if(!txt||!authUser||!_ccClan||!fbDB)return;
  if(txt.length>300){showToast('Mesaj çok uzun','#f59e0b');return;}
  inp.value='';
  fbDB.ref('clan_chat/'+_ccClan).push({uid:authUser.uid,name:authUser.name,text:txt,ts:Date.now()});
}

/* ═══════════════════════════════════════════════════
   BİLDİRİM
   ═══════════════════════════════════════════════════ */
var _nQ=[],_nS=false;
function showNotif(icon,title,body,color){
  _nQ.push({icon:icon,title:title,body:body,color:color||'var(--neon)'});
  if(!_nS)procNotif();
}
function procNotif(){
  if(!_nQ.length){_nS=false;return;}_nS=true;
  var n=_nQ.shift(),el=document.getElementById('notifEl');
  if(!el){_nS=false;return;}
  el.innerHTML='<span style="font-size:22px">'+n.icon+'</span><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800;color:'+n.color+'">'+n.title+'</div><div style="font-size:11px;color:var(--muted);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+n.body+'</div></div><button onclick="dismissNotif()" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;flex-shrink:0">✕</button>';
  el.style.transform='translateX(-50%) translateY(0)';el.style.opacity='1';
  el._t=setTimeout(function(){dismissNotif();},5000);
}
function dismissNotif(){
  var el=document.getElementById('notifEl');
  if(!el)return;if(el._t)clearTimeout(el._t);
  el.style.transform='translateX(-50%) translateY(-80px)';el.style.opacity='0';
  setTimeout(function(){_nS=false;procNotif();},350);
}
function triggerLoginNotif(){
  if(typeof state==='undefined')return;
  var dk=getDailyKey?getDailyKey():'x';
  var k='mg_nf_'+dk;
  if(localStorage.getItem(k))return;
  localStorage.setItem(k,'1');
  setTimeout(function(){
    if(state.loginStreak>0)showNotif('🔥','Günlük giriş bonusu!',(state.loginStreak||1)+' gün serisi — devam et!','#f97316');
  },2000);
}

/* ═══════════════════════════════════════════════════
   ADMIN: Klan sıfırlama
   ═══════════════════════════════════════════════════ */
async function adminForceResetMyClan(){
  if(!authUser){adminLog('Giriş yapılmamış');return;}
  if(!confirm('Kendi klan verini tamamen sıfırlamak istediğine emin misin?'))return;
  try{
    var r=await workerPost('clan/force-reset',{token:authUser.token});
    if(!r||!r.ok){adminLog('❌ '+((r&&r.error)||'Hata'));return;}
    state.clanId=null;saveState();
    adminLog('✅ Sıfırlandı: '+(r.log||[]).join(' | '));
    showToast('✅ Klan verisi temizlendi','#00ff88');
  }catch(e){adminLog('❌ '+e.message);}
}

/* ═══════════════════════════════════════════════════
   GÖREV SAYACI FİX: score tipi görevlerde delta kullan
   ═══════════════════════════════════════════════════ */
(function(){
  var origGDK=getDailyProgress;
  getDailyProgress=function(task){
    try{
      if(!state||!state.stats)return 0;
      if(task.type==='score'||task.key==='score'){
        var cur=state.score||0;
        var base=typeof task.baseScore==='number'?task.baseScore:0;
        return Math.max(0,cur-base);
      }
      return origGDK(task);
    }catch(e){return 0;}
  };
  /* getTodaysTasks'ı patch et: score görevlerine baseScore ekle */
  var origGTT=getTodaysTasks;
  getTodaysTasks=function(){
    var tasks=origGTT();
    if(!tasks||!tasks.length)return tasks;
    /* Yeni oluşturulan görevlerde (progress=0, baseScore undefined) baseScore ata */
    var curScore=(typeof state!=='undefined'?state.score:0)||0;
    var changed=false;
    tasks.forEach(function(t){
      if((t.type==='score'||t.key==='score')&&typeof t.baseScore==='undefined'&&!t.completed){
        t.baseScore=curScore;changed=true;
      }
    });
    if(changed){try{saveTodaysTasks(tasks);}catch(e){}}
    return tasks;
  };
})();

/* refreshMenuPanels patch */
var _origRM=typeof refreshMenuPanels==='function'?refreshMenuPanels:null;
if(_origRM){refreshMenuPanels=function(){_origRM.apply(this,arguments);try{updateChestQuick();}catch(e){};};}

/* showScreen patch — bildirim tetikle */
var _origSS=showScreen;
showScreen=function(name){
  _origSS.apply(this,arguments);
  if(name==='menu'){try{triggerLoginNotif();}catch(e){}}
};

/* Clan chat butonunu klan render'ına bağla */
var _origRCI=typeof renderClanInfo==='function'?renderClanInfo:null;
if(_origRCI){
  renderClanInfo=function(el,clan){
    _origRCI.call(this,el,clan);
    var btn=document.getElementById('clanChatBtn');
    if(btn&&clan&&clan.id){btn.onclick=function(){openClanChat(clan.id);};}
  };
}

/* EN_STRINGS: eksik çeviriler */
if(typeof EN_STRINGS!=='undefined'){
  var _ex={
    'challenge_mode':'Challenge','challenge_sub':'Race against the clock',
    'my_inventory':'My Inventory','claim':'Claim','completed':'Completed',
    'daily_reset':'Resets at midnight','quest_title':'Quests',
    'leave_clan':'Leave Clan','clan_score':'Clan Score','members':'Members',
    'clan_chat':'Clan Chat','send_msg':'Send','type_msg':'Type a message...',
    'my_score':'My Score','game_paused':'Game Paused',
    'level_label':'Level','score_label':'Score','multiplier':'Multiplier',
    'daily_login_notif':'Daily login bonus!','event_active':'Event Active',
    'time_up':'Time is up!','correct_answer':'Correct!','wrong_answer':'Wrong!',
  };
  Object.keys(_ex).forEach(function(k){if(!EN_STRINGS[k])EN_STRINGS[k]=_ex[k];});
}


window._mathgame={ state, nextQuestion, checkAnswer };

/* ── LIQUID RIPPLE ─────────────────────────────────── */
function addRipple(e, el){
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.4;
  const x = (e.clientX ?? rect.left + rect.width/2)  - rect.left - size/2;
  const y = (e.clientY ?? rect.top  + rect.height/2) - rect.top  - size/2;
  const ripple = document.createElement('span');
  ripple.className = 'liquid-ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', ()=> ripple.remove());
}

document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn, .choice-btn');
  if(btn && !btn.disabled) addRipple(e, btn);
});
