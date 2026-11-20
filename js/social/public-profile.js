/* ══ MathGame · js/social/public-profile.js ══ (index.html'de sırayla yüklenir) */
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
