/* ══ MathGame · js/admin/super-admin.js ══ (index.html'de sırayla yüklenir) */
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
