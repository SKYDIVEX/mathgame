/* ══════════════════════════════════════════════════════
   KLAN SİSTEMİ — Gelişmiş
   ══════════════════════════════════════════════════════ */

var _clanTab = 'my';
var _clanData = null; /* Cache */

function openClanModal() {
  document.getElementById('clanModal').classList.add('show');
  switchClanTab('my');
  clickSound();
}

function switchClanTab(tab) {
  _clanTab = tab;
  document.querySelectorAll('#clanModal .shop-tab').forEach(function(b) { b.classList.remove('active'); });
  var btn = document.getElementById('clanTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (btn) btn.classList.add('active');
  renderClanTab(tab);
}

async function renderClanTab(tab) {
  var el = document.getElementById('clanContent');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">⏳ Yükleniyor...</div>';

  if (tab === 'my') {
    if (!authUser || !state.clanId) {
      el.innerHTML = '<div style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:48px;margin-bottom:12px">👥</div>' +
        '<div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:8px">Henüz bir klana üye değilsin</div>' +
        '<div style="font-size:13px;color:var(--muted);margin-bottom:20px">Klan kurarak veya katılarak arkadaşlarınla yarış!</div>' +
        '<button onclick="switchClanTab(\'search\')" class="btn" style="margin-right:8px;margin-bottom:8px">🔍 Klan Ara</button>' +
        '<button onclick="switchClanTab(\'create\')" class="btn ghost" style="margin-bottom:8px">➕ Klan Kur</button>' +
        '<div style="margin-top:12px"><input id="inviteCodeInput" class="admin-input" placeholder="Davet kodu gir... (MATH-ABCDEF)" style="margin-bottom:8px">' +
        '<button onclick="joinByInvite()" class="btn ghost" style="width:100%">🔗 Davet Koduyla Katıl</button></div>' +
        '</div>';
      return;
    }
    try {
      var r = await workerPost('clan/info', { token: authUser.token });
      if (!r || !r.ok) { el.innerHTML = '<div style="color:#ef4444;padding:12px">Klan bilgisi alınamadı</div>'; return; }
      _clanData = r.clan;
      renderClanInfo(el, r.clan);
    } catch(e) { el.innerHTML = '<div style="color:#ef4444;padding:12px">Bağlantı hatası</div>'; }
  }

  else if (tab === 'search') {
    el.innerHTML =
      '<div style="margin-bottom:12px">' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:6px">Klan etiketi veya adıyla ara</div>' +
        '<div style="display:flex;gap:8px">' +
          '<input id="clanSearchInput" class="admin-input" placeholder="Klan etiketi... (MATH)" style="flex:1;text-transform:uppercase">' +
          '<button onclick="searchClan()" class="btn" style="padding:0 16px">🔍</button>' +
        '</div>' +
      '</div>' +
      '<div id="clanSearchResults"></div>';
  }

  else if (tab === 'create') {
    var hasCoins = (state.coins || 0) >= 1000;
    el.innerHTML =
      '<div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:14px;padding:12px;margin-bottom:14px;text-align:center">' +
        '<div style="font-size:13px;color:#ffd700;font-weight:700">💰 Klan kurmak 1000 coin gerektirir</div>' +
        '<div style="font-size:11px;color:var(--muted);margin-top:3px">Bakiyen: ' + (state.coins||0) + ' coin</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Klan Adı (2-24 karakter)</label>' +
          '<input id="clanNameInput" class="admin-input" placeholder="Örn: Matematik Ustaları" maxlength="24"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Etiket (2-5 harf, benzersiz)</label>' +
          '<input id="clanTagInput" class="admin-input" placeholder="Örn: MATH" maxlength="5" style="text-transform:uppercase"></div>' +
        '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Açıklama (opsiyonel)</label>' +
          '<input id="clanDescInput" class="admin-input" placeholder="Klanını tanıt..." maxlength="200"></div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:12px;padding:12px">' +
          '<div style="font-size:11px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:1px">Katılma Gereksinimleri</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between">' +
            '<span style="font-size:13px;color:var(--text)">Min. Puan</span>' +
            '<input type="number" id="clanMinScore" class="admin-input" value="0" min="0" style="width:90px;text-align:right">' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between">' +
            '<span style="font-size:13px;color:var(--text)">Max. Üye Sayısı</span>' +
            '<input type="number" id="clanMaxMembers" class="admin-input" value="25" min="5" max="50" style="width:90px;text-align:right">' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<input type="checkbox" id="clanPublicInput" checked style="width:16px;height:16px;accent-color:var(--neon)">' +
            '<label for="clanPublicInput" style="font-size:13px;color:var(--text)">Public klan</label>' +
          '</div>' +
        '</div>' +
        '<button onclick="createClan()" class="btn" style="width:100%;padding:13px;margin-top:4px;' + (!hasCoins ? 'opacity:0.5' : '') + '"' + (!hasCoins ? ' disabled' : '') + '>🏰 Klan Kur (1000 💰)</button>' +
      '</div>';
  }

  else if (tab === 'settings') {
    if (!state.clanId || !_clanData) {
      el.innerHTML = '<div style="color:var(--muted);padding:12px">Önce klana katıl</div>';
      return;
    }
    var clan = _clanData;
    var isLeader = clan.leaderId === (authUser && authUser.uid);
    if (!isLeader) {
      el.innerHTML = '<div style="color:var(--muted);padding:12px;text-align:center">⚠️ Sadece klan lideri ayarları görebilir</div>';
      return;
    }
    var maxC = Math.max(2, Math.min(10, Math.floor(clan.members.length / 2)));
    var inviteUrl = clan.id ? (window.location.origin + window.location.pathname + '?clan-invite=' + clan.id) : null;
    var savedWebhook = localStorage.getItem('clan_discord_webhook_' + clan.id) || '';
    el.innerHTML =
      /* Davet Linki — URL tabanlı */
      '<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px">' +
        '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">🔗 Davet Linki</div>' +
        (inviteUrl
          ? '<div style="background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.2);border-radius:10px;padding:10px;font-family:monospace;font-size:11px;color:var(--neon);margin-bottom:8px;word-break:break-all">' + inviteUrl + '</div>' +
            '<div style="display:flex;gap:8px">' +
              '<button onclick="copyInviteUrl(\'' + escapeHtml(inviteUrl) + '\')" class="btn ghost" style="flex:1;font-size:12px">📋 Kopyala</button>' +
              '<button onclick="shareInviteUrl(\'' + escapeHtml(inviteUrl) + '\')" class="btn ghost" style="flex:1;font-size:12px">↗️ Paylaş</button>' +
            '</div>'
          : '<div style="color:var(--muted);font-size:12px">Klan ID bulunamadı</div>'
        ) +
      '</div>' +
      /* Discord Webhook */
      '<div style="background:rgba(88,101,242,0.06);border:1px solid rgba(88,101,242,0.25);border-radius:14px;padding:14px;margin-bottom:10px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
          '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:rgba(88,101,242,0.8)">🎮 Discord Entegrasyonu</div>' +
          (savedWebhook ? '<span class="discord-badge connected">✓ Bağlı</span>' : '<span class="discord-badge">Bağlı değil</span>') +
        '</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:8px">Discord sunucunda bir Webhook URL\'si oluştur ve yapıştır. Klan etkinlikleri (üye katılımı, puan güncellemeleri) o kanala bildirim gönderir.</div>' +
        '<input id="discordWebhookInput" class="admin-input" placeholder="https://discord.com/api/webhooks/..." value="' + escapeHtml(savedWebhook) + '" style="margin-bottom:8px;font-size:12px">' +
        '<div style="display:flex;gap:8px">' +
          '<button onclick="saveDiscordWebhook()" class="btn" style="flex:1;font-size:12px">💾 Kaydet</button>' +
          '<button onclick="testDiscordWebhook()" class="btn ghost" style="flex:1;font-size:12px">🧪 Test</button>' +
        '</div>' +
      '</div>' +
      /* Katkıcı Seçimi */
      '<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px">' +
        '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:6px">⚽ Katkıcı Oyuncular</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:10px">En fazla <strong style="color:var(--neon)">' + maxC + '</strong> oyuncu seçebilirsin. Sadece seçilen oyuncuların puanları klana katkı sağlar.</div>' +
        '<div id="contributorPicker">' +
          clan.members.filter(function(m) { return m.role !== 'leader'; }).map(function(m) {
            var isContrib = (clan.contributors || []).includes(m.uid);
            return '<label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:10px;background:' + (isContrib ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.02)') + ';border:1px solid ' + (isContrib ? 'rgba(0,255,136,0.2)' : 'var(--border)') + ';margin-bottom:6px;cursor:pointer">' +
              '<input type="checkbox" value="' + m.uid + '" ' + (isContrib ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:var(--neon)">' +
              '<span style="font-size:13px;font-weight:700;color:var(--text)">' + escapeHtml(m.name) + '</span>' +
              '<span style="font-size:10px;color:var(--muted);margin-left:auto">Katkı: ' + ((clan.memberScores && clan.memberScores[m.uid]) || 0) + 'p</span>' +
            '</label>';
          }).join('') +
        '</div>' +
        '<button onclick="saveContributors()" class="btn" style="width:100%;margin-top:8px">💾 Katkıcıları Kaydet</button>' +
      '</div>' +
      /* Klan Ayarları */
      '<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px">' +
        '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">⚙️ Klan Ayarları</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Açıklama</label>' +
            '<input id="settingClanDesc" class="admin-input" value="' + escapeHtml(clan.description||'') + '" maxlength="200"></div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span style="font-size:13px;color:var(--text)">Min. Katılım Puanı</span>' +
            '<input type="number" id="settingMinScore" class="admin-input" value="' + (clan.minScore||0) + '" min="0" style="width:90px;text-align:right">' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span style="font-size:13px;color:var(--text)">Max. Üye Sayısı</span>' +
            '<input type="number" id="settingMaxMembers" class="admin-input" value="' + (clan.maxMembers||25) + '" min="5" max="50" style="width:90px;text-align:right">' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<input type="checkbox" id="settingIsPublic" ' + (clan.isPublic ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:var(--neon)">' +
            '<label for="settingIsPublic" style="font-size:13px;color:var(--text)">Public klan (herkes katılabilir)</label>' +
          '</div>' +
          '<button onclick="saveClanSettings()" class="btn" style="width:100%">💾 Ayarları Kaydet</button>' +
        '</div>' +
      '</div>';
  }

  else if (tab === 'ranking') {
    try {
      var r2 = await workerPost('clan/leaderboard', {});
      if (!r2 || !r2.ok || !r2.clans || !r2.clans.length) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Henüz klan sıralaması yok</div>';
        return;
      }
      el.innerHTML =
        '<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Klan puanı sadece katkıcı oyunculardan gelir</div>' +
        r2.clans.map(function(c, i) {
          var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1) + '.';
          var isMy = state.clanId && c.id === state.clanId;
          return '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:' + (isMy ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)') + ';border:1px solid ' + (isMy ? 'rgba(0,255,136,0.2)' : 'var(--border)') + ';margin-bottom:8px">' +
            '<div style="font-size:20px;width:32px;text-align:center">' + medal + '</div>' +
            '<div style="flex:1">' +
              '<div style="font-size:14px;font-weight:800;color:' + (isMy ? 'var(--neon)' : 'var(--text)') + '">[' + c.tag + '] ' + escapeHtml(c.name) + (isMy ? ' ⭐' : '') + '</div>' +
              '<div style="font-size:11px;color:var(--muted)">' + c.memberCount + ' üye · ' + (c.contributorCount||0) + ' katkıcı</div>' +
            '</div>' +
            '<div style="font-size:14px;font-weight:800;color:var(--neon)">' + (c.score||0).toLocaleString() + 'p</div>' +
          '</div>';
        }).join('');
    } catch(e) { el.innerHTML = '<div style="color:#ef4444;padding:12px">Bağlantı hatası</div>'; }
  }

  else if (tab === 'tournament') {
    try {
      var tr = await workerPost('clan/tournament/info', {});
      renderTournamentTab(el, tr && tr.tournament);
    } catch(e) { el.innerHTML = '<div style="color:#ef4444;padding:12px">Bağlantı hatası</div>'; }
  }
}

function renderClanInfo(el, clan) {
  var isLeader  = clan.leaderId === (authUser && authUser.uid);
  var myMember  = clan.members.find(function(m) { return m.uid === (authUser && authUser.uid); });
  var myRole    = myMember ? (myMember.role || 'member') : 'member';
  var isOfficer = myRole === 'leader' || myRole === 'coleader' || myRole === 'officer';
  var myScore   = clan.memberScores && authUser ? (clan.memberScores[authUser.uid] || 0) : 0;
  var isContrib = clan.leaderId === (authUser && authUser.uid) || (clan.contributors||[]).includes(authUser && authUser.uid);

  var ROLE_LABELS = { leader: '👑 Kurucu', coleader: '⭐ Lider Yardımcısı', officer: '⚡ Yetkili', member: '👤 Üye' };
  var ROLE_ORDER  = { leader: 0, coleader: 1, officer: 2, member: 3 };

  el.innerHTML =
    '<div style="text-align:center;padding:16px 0 10px">' +
      '<div style="font-size:40px;margin-bottom:8px">🏰</div>' +
      '<div style="font-family:var(--font-head);font-size:20px;font-weight:900">' + escapeHtml(clan.name) + '</div>' +
      '<div style="font-size:12px;color:var(--neon);font-weight:700;margin-top:4px">[' + clan.tag + ']' + (clan.isPublic ? ' 🔓' : ' 🔒') + '</div>' +
      (clan.description ? '<div style="font-size:12px;color:var(--muted);margin-top:6px">' + escapeHtml(clan.description) + '</div>' : '') +
      '<div style="font-size:10px;color:var(--muted2);margin-top:6px;font-family:monospace">ID: ' + clan.id + ' <button onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + clan.id + '\').then(function(){showToast(\'📋 Klan ID kopyalandı\',\'#38bdf8\')})" style="background:none;border:1px solid var(--border);border-radius:5px;color:var(--muted);font-size:9px;cursor:pointer;padding:1px 5px;font-family:inherit">Kopyala</button></div>' +
      '<div style="margin-top:8px;display:inline-block;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.25);border-radius:20px;padding:4px 12px;font-size:12px;color:#ffd700;font-weight:700">' + (ROLE_LABELS[myRole] || '👤 Üye') + '</div>' +
      '<div style="margin-top:10px"><button id="clanChatBtn" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:20px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">💬 Klan Sohbeti</button></div>' +
    '</div>' +
    /* Klan stats */
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">' +
      '<div style="text-align:center;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;padding:10px">' +
        '<div style="font-size:18px;font-weight:900;color:var(--neon)">' + clan.members.length + '</div>' +
        '<div style="font-size:10px;color:var(--muted)">Üye</div>' +
      '</div>' +
      '<div style="text-align:center;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;padding:10px">' +
        '<div style="font-size:16px;font-weight:900;color:#ffd700">' + (clan.totalScore||0).toLocaleString() + '</div>' +
        '<div style="font-size:10px;color:var(--muted)">Klan Puanı</div>' +
      '</div>' +
      '<div style="text-align:center;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;padding:10px">' +
        '<div style="font-size:16px;font-weight:900;color:#a855f7">' + (clan.contributors||[]).length + '/' + Math.max(2,Math.min(10,Math.floor(clan.members.length/2))) + '</div>' +
        '<div style="font-size:10px;color:var(--muted)">Katkıcı</div>' +
      '</div>' +
    '</div>' +
    /* Benim katkım */
    '<div style="background:' + (isContrib ? 'rgba(0,255,136,0.05)' : 'rgba(255,165,0,0.05)') + ';border:1px solid ' + (isContrib ? 'rgba(0,255,136,0.2)' : 'rgba(255,165,0,0.2)') + ';border-radius:12px;padding:10px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">' +
      '<div>' +
        '<div style="font-size:12px;font-weight:700;color:' + (isContrib ? 'var(--neon)' : '#f59e0b') + '">' + (isContrib ? '✅ Katkıcısın' : '⏳ Katkıcı Değilsin') + '</div>' +
        '<div style="font-size:11px;color:var(--muted)">' + (isContrib ? 'Oyunun klan puanına yansıyor' : 'Liderden katkıcı olmayı iste') + '</div>' +
      '</div>' +
      '<div style="text-align:right"><div style="font-size:14px;font-weight:800;color:#ffd700">' + myScore.toLocaleString() + 'p</div><div style="font-size:10px;color:var(--muted)">Katkın</div></div>' +
    '</div>' +
    /* Üye listesi */
    '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:8px">Üyeler</div>' +
    clan.members.slice().sort(function(a,b) {
      return (ROLE_ORDER[a.role]||3) - (ROLE_ORDER[b.role]||3) ||
             ((clan.memberScores&&clan.memberScores[b.uid])||0) - ((clan.memberScores&&clan.memberScores[a.uid])||0);
    }).map(function(m) {
      var roleIcon  = { leader:'👑', coleader:'⭐', officer:'⚡', member:'👤' }[m.role] || '👤';
      var roleLabel = ROLE_LABELS[m.role] || '👤 Üye';
      var isC   = (clan.contributors||[]).includes(m.uid) || m.role === 'leader';
      var mScore = (clan.memberScores && clan.memberScores[m.uid]) || 0;
      var isMe  = authUser && m.uid === authUser.uid;
      /* Rütbe değiştirme — sadece lider veya yardımcı */
      var manageBtns = '';
      if (isLeader && m.role !== 'leader') {
        manageBtns = '<div style="display:flex;gap:4px;margin-top:6px">' +
          '<select onchange="setClanRole(\'' + m.uid + '\',this.value)" style="flex:1;background:var(--glass2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:11px;padding:4px;font-family:inherit">' +
            '<option value="coleader"' + (m.role==='coleader'?' selected':'') + '>⭐ Lider Yard.</option>' +
            '<option value="officer"' + (m.role==='officer'?' selected':'') + '>⚡ Yetkili</option>' +
            '<option value="member"' + (m.role==='member'||!m.role?' selected':'') + '>👤 Üye</option>' +
          '</select>' +
          '<button onclick="kickMember(\'' + m.uid + '\',\'' + escapeHtml(m.name) + '\')" style="padding:4px 8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;color:#ef4444;font-size:11px;cursor:pointer">✕ Çıkar</button>' +
        '</div>';
      }
      return '<div style="padding:10px;border-radius:12px;background:' + (isMe ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)') + ';border:1px solid ' + (isMe ? 'rgba(0,255,136,0.15)' : 'var(--border)') + ';margin-bottom:6px">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<div style="font-size:18px">' + roleIcon + (isC && m.role !== 'leader' ? '⚽' : '') + '</div>' +
          '<div style="flex:1">' +
            '<div style="font-size:13px;font-weight:700;color:var(--text)">' + escapeHtml(m.name) + (isMe ? ' <span style="font-size:10px;color:var(--neon)">(sen)</span>' : '') + '</div>' +
            '<div style="font-size:10px;color:var(--muted)">' + roleLabel.replace(/^[^\s]+ /,'') + (isC ? ' · ⚽ Katkıcı' : '') + '</div>' +
          '</div>' +
          '<div style="font-size:12px;font-weight:800;color:#ffd700">' + (mScore > 0 ? mScore.toLocaleString() + 'p' : '—') + '</div>' +
        '</div>' +
        manageBtns +
      '</div>';
    }).join('') +
    /* Butonlar */
    '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">' +
      (isLeader
        ? '<button onclick="switchClanTab(\'settings\')" class="btn" style="flex:1">⚙️ Klan Ayarları</button>'
        : '') +
      '<button onclick="leaveClan()" class="btn ghost" style="flex:1;color:#ef4444;border-color:rgba(239,68,68,0.3)">🚪 Terk Et</button>' +
    '</div>';
}

function renderTournamentTab(el, tournament) {
  if (!tournament) {
    el.innerHTML =
      '<div style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:56px;margin-bottom:12px">⭐</div>' +
        '<div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:8px">Aktif Turnuva Yok</div>' +
        '<div style="font-size:12px;color:var(--muted)">Süper adminler turnuva başlatabilir</div>' +
      '</div>';
    return;
  }

  var t = tournament;
  var myClanId = state.clanId;
  var isRegistered = (t.registeredClans||[]).some(function(c) { return c.clanId === myClanId; });

  var PHASE_LABELS = {
    registration: { icon:'📝', label:'Kayıt Dönemi',    color:'#63b3ed' },
    group:        { icon:'🏟️', label:'Lig Aşaması',     color:'#a855f7' },
    r16:          { icon:'⚔️', label:'Son 16',          color:'#f59e0b' },
    qf:           { icon:'⚔️', label:'Çeyrek Final',    color:'#f59e0b' },
    sf:           { icon:'⚔️', label:'Yarı Final',      color:'#ef4444' },
    final:        { icon:'🏆', label:'Final',           color:'#ffd700' },
    finished:     { icon:'✅', label:'Tamamlandı',      color:'#00ff88' },
  };
  var phase = PHASE_LABELS[t.status] || { icon:'❓', label: t.status, color:'#fff' };

  /* ── Header ── */
  var html =
    '<div style="background:linear-gradient(135deg,rgba(255,215,0,0.08),rgba(168,85,247,0.08));border:1px solid rgba(255,215,0,0.3);border-radius:18px;padding:18px;margin-bottom:14px;text-align:center">' +
      '<div style="font-size:32px;margin-bottom:6px">⭐</div>' +
      '<div style="font-size:18px;font-weight:900;color:#ffd700;letter-spacing:0.5px">' + escapeHtml(t.name) + '</div>' +
      '<div style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:rgba(0,0,0,0.3);border-radius:20px;padding:5px 14px">' +
        '<span style="font-size:14px">' + phase.icon + '</span>' +
        '<span style="font-size:13px;font-weight:700;color:' + phase.color + '">' + phase.label + '</span>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:8px">' + (t.registeredClans||[]).length + ' klan kayıtlı</div>' +
    '</div>';

  /* ── Ödüller ── */
  html +=
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">' +
    [
      { icon:'🥇', label:'Şampiyon',  bg:'rgba(255,215,0,0.12)',   border:'rgba(255,215,0,0.35)',   prz: t.prizes&&t.prizes.first },
      { icon:'🥈', label:'İkinci',    bg:'rgba(192,192,192,0.08)', border:'rgba(192,192,192,0.25)', prz: t.prizes&&t.prizes.second },
      { icon:'🥉', label:'Üçüncü',   bg:'rgba(205,127,50,0.08)',  border:'rgba(205,127,50,0.25)',  prz: t.prizes&&t.prizes.third },
    ].map(function(p) {
      return '<div style="text-align:center;background:' + p.bg + ';border:1px solid ' + p.border + ';border-radius:12px;padding:10px 6px">' +
        '<div style="font-size:20px">' + p.icon + '</div>' +
        '<div style="font-size:9px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:3px">' + p.label + '</div>' +
        (p.prz ? '<div style="font-size:11px;color:#ffd700;font-weight:800;margin-top:4px">' + (p.prz.coins||0).toLocaleString() + '💰</div>' +
                 '<div style="font-size:10px;color:#63b3ed;font-weight:700">' + (p.prz.diamonds||0) + '💎</div>' : '<div style="font-size:10px;color:var(--muted)">—</div>') +
      '</div>';
    }).join('') + '</div>';

  /* ── Kayıt ── */
  if (t.status === 'registration') {
    html += myClanId
      ? (isRegistered
          ? '<div style="background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.25);border-radius:14px;padding:14px;text-align:center;margin-bottom:12px">' +
              '<div style="font-size:20px">✅</div><div style="font-size:13px;font-weight:800;color:var(--neon);margin-top:6px">Klann Kayıtlı!</div>' +
            '</div>'
          : '<button onclick="registerTournament()" class="btn" style="width:100%;margin-bottom:12px;padding:14px">📝 Turnuvaya Kayıt Ol</button>'
        )
      : '<div style="color:var(--muted);text-align:center;font-size:13px;margin-bottom:12px">Katılmak için bir klana üye ol</div>';
  }

  /* ── Lig Aşaması ── */
  if (t.status === 'group' && t.groups && t.groups.length > 0) {
    html += '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">🏟️ LİG TABLOLARI</div>';
    html += t.groups.map(function(group, gi) {
      var isMine = myClanId && group.clans && group.clans.some(function(c) { return c.clanId === myClanId; });
      return '<div style="background:rgba(255,255,255,0.02);border:1px solid ' + (isMine ? 'rgba(168,85,247,0.4)' : 'var(--border)') + ';border-radius:14px;padding:12px;margin-bottom:10px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
          '<div style="font-size:12px;font-weight:800;color:' + (isMine ? '#a855f7' : 'var(--muted2)') + ';text-transform:uppercase;letter-spacing:1px">Grup ' + String.fromCharCode(65+gi) + '</div>' +
          (isMine ? '<span style="font-size:9px;background:rgba(168,85,247,0.2);color:#a855f7;border-radius:8px;padding:2px 6px;font-weight:800">SEN</span>' : '') +
        '</div>' +
        /* Grup tablosu başlığı */
        '<div style="display:grid;grid-template-columns:24px 1fr 28px 28px 28px 40px;gap:4px;font-size:9px;color:var(--muted2);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:0 4px;margin-bottom:6px">' +
          '<div></div><div>Klan</div><div style="text-align:center">O</div><div style="text-align:center">G</div><div style="text-align:center">M</div><div style="text-align:right">Puan</div>' +
        '</div>' +
        (group.clans || []).slice().sort(function(a,b){ return (b.points||0)-(a.points||0); }).map(function(c, ci) {
          var isMe = myClanId && c.clanId === myClanId;
          var qualify = ci < 2; /* ilk 2 geçer */
          return '<div style="display:grid;grid-template-columns:24px 1fr 28px 28px 28px 40px;gap:4px;align-items:center;padding:6px 4px;border-radius:8px;background:' + (isMe ? 'rgba(168,85,247,0.1)' : (qualify ? 'rgba(0,255,136,0.04)' : 'transparent')) + ';margin-bottom:3px">' +
            '<div style="font-size:12px;font-weight:800;color:' + (qualify ? 'var(--neon)' : 'var(--muted)') + '">' + (ci+1) + '</div>' +
            '<div style="font-size:12px;font-weight:' + (isMe?'800':'600') + ';color:' + (isMe?'#a855f7':'var(--text)') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">[' + (c.tag||'?') + '] ' + escapeHtml(c.name||'?') + '</div>' +
            '<div style="text-align:center;font-size:11px;color:var(--muted)">' + ((c.wins||0)+(c.losses||0)) + '</div>' +
            '<div style="text-align:center;font-size:11px;color:#00ff88">' + (c.wins||0) + '</div>' +
            '<div style="text-align:center;font-size:11px;color:#ef4444">' + (c.losses||0) + '</div>' +
            '<div style="text-align:right;font-size:12px;font-weight:800;color:#ffd700">' + (c.points||0) + '</div>' +
          '</div>';
        }).join('') +
        '<div style="font-size:9px;color:var(--muted);margin-top:6px;text-align:right">✦ İlk 2 sonraki tura geçer</div>' +
      '</div>';
    }).join('');

  /* ── Eleme / Son 16, Çeyrek, Yarı, Final ── */
  } else if (['r16','qf','sf','final'].includes(t.status) && t.matches && t.matches.length > 0) {
    var roundNames = { r16:'Son 16', qf:'Çeyrek Final', sf:'Yarı Final', final:'Final' };
    var currentMatches = t.matches.filter(function(m) { return m.round === t.status; });
    if (currentMatches.length === 0) currentMatches = t.matches;

    html += '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">⚔️ ' + (roundNames[t.status]||'').toUpperCase() + ' EŞLEŞMELERİ</div>';
    html += currentMatches.map(function(m) {
      var isMineMatch = myClanId && (m.clan1Id === myClanId || m.clan2Id === myClanId);
      var winner = m.winner || null;
      return '<div style="background:rgba(255,255,255,0.02);border:1px solid ' + (isMineMatch ? 'rgba(255,215,0,0.4)' : 'var(--border)') + ';border-radius:14px;padding:14px;margin-bottom:10px">' +
        /* Eşleşme */
        '<div style="display:grid;grid-template-columns:1fr 36px 1fr;align-items:center;gap:8px">' +
          /* Sol klan */
          '<div style="text-align:center">' +
            '<div style="font-size:13px;font-weight:800;color:' + (winner === m.clan1Id ? '#ffd700' : (winner && winner !== m.clan1Id ? 'var(--muted)' : 'var(--text)')) + '">' + escapeHtml(m.clan1Name||'?') + '</div>' +
            '<div style="font-size:10px;color:var(--muted)">[' + (m.clan1Tag||'?') + ']</div>' +
            (m.score1 !== undefined ? '<div style="font-size:22px;font-weight:900;color:' + (winner === m.clan1Id ? '#ffd700' : 'var(--text)') + ';margin-top:4px">' + m.score1 + '</div>' : '') +
          '</div>' +
          /* VS */
          '<div style="text-align:center;font-size:11px;font-weight:800;color:var(--muted2)">' + (m.played ? (winner ? '✓' : '-') : 'VS') + '</div>' +
          /* Sağ klan */
          '<div style="text-align:center">' +
            '<div style="font-size:13px;font-weight:800;color:' + (winner === m.clan2Id ? '#ffd700' : (winner && winner !== m.clan2Id ? 'var(--muted)' : 'var(--text)')) + '">' + escapeHtml(m.clan2Name||'?') + '</div>' +
            '<div style="font-size:10px;color:var(--muted)">[' + (m.clan2Tag||'?') + ']</div>' +
            (m.score2 !== undefined ? '<div style="font-size:22px;font-weight:900;color:' + (winner === m.clan2Id ? '#ffd700' : 'var(--text)') + ';margin-top:4px">' + m.score2 + '</div>' : '') +
          '</div>' +
        '</div>' +
        (isMineMatch ? '<div style="text-align:center;font-size:10px;color:#ffd700;font-weight:700;margin-top:8px">⭐ Klanın bu maçta</div>' : '') +
      '</div>';
    }).join('');

  /* ── Kayıt dönemi — klanlar listesi ── */
  } else if (t.registeredClans && t.registeredClans.length > 0) {
    html += '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:8px">KAYITLI KLANLAR (' + t.registeredClans.length + ')</div>';
    html += t.registeredClans.slice(0,20).map(function(c, i) {
      var isMe = myClanId && c.clanId === myClanId;
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:' + (isMe ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.02)') + ';border:1px solid ' + (isMe ? 'rgba(0,255,136,0.2)' : 'var(--border)') + ';margin-bottom:6px">' +
        '<div style="font-size:13px;font-weight:800;color:var(--muted);width:22px">' + (i+1) + '</div>' +
        '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:' + (isMe ? 'var(--neon)' : 'var(--text)') + '">[' + (c.tag||'?') + '] ' + escapeHtml(c.name||'?') + '</div></div>' +
        '<div style="font-size:12px;color:#ffd700;font-weight:800">' + (c.score||0).toLocaleString() + 'p</div>' +
      '</div>';
    }).join('');
  }

  /* ── Tamamlandı ── */
  if (t.status === 'finished' && t.winner) {
    html += '<div style="background:linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,165,0,0.08));border:2px solid rgba(255,215,0,0.5);border-radius:18px;padding:20px;text-align:center;margin-top:10px">' +
      '<div style="font-size:40px">🏆</div>' +
      '<div style="font-size:11px;color:#ffd700;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:8px">Şampiyon</div>' +
      '<div style="font-size:20px;font-weight:900;color:#ffd700;margin-top:4px">[' + (t.winner.tag||'?') + '] ' + escapeHtml(t.winner.name||'?') + '</div>' +
    '</div>';
  }

  el.innerHTML = html;
}

async function searchClan() {
  var query = (document.getElementById('clanSearchInput')?.value || '').trim().toUpperCase();
  var res = document.getElementById('clanSearchResults');
  if (!res || !query) return;
  res.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px">⏳ Aranıyor...</div>';
  try {
    var r = await workerPost('clan/search', { query });
    if (!r || !r.clans || !r.clans.length) { res.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px">Klan bulunamadı</div>'; return; }
    res.innerHTML = r.clans.map(function(c) {
      var alreadyIn = state.clanId === c.id;
      return '<div style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid var(--border);margin-bottom:8px">' +
        '<div style="flex:1">' +
          '<div style="font-size:14px;font-weight:800">[' + c.tag + '] ' + escapeHtml(c.name) + '</div>' +
          '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + c.members + ' üye' + (c.description ? ' · ' + escapeHtml(c.description).slice(0,40) : '') + '</div>' +
          (c.minScore ? '<div style="font-size:10px;color:#f59e0b;margin-top:2px">Min. ' + c.minScore + ' puan gerekli</div>' : '') +
        '</div>' +
        (alreadyIn
          ? '<div style="font-size:12px;color:var(--neon)">✓ Üyesin</div>'
          : '<button onclick="joinClan(\'' + c.id + '\')" class="btn" style="padding:8px 14px;font-size:12px">Katıl</button>'
        ) +
      '</div>';
    }).join('');
  } catch(e) { res.innerHTML = '<div style="color:#ef4444;font-size:12px;padding:8px">Bağlantı hatası</div>'; }
}

async function createClan() {
  if (!authUser) { showToast('Önce giriş yap', '#ef4444'); return; }
  if ((state.coins||0) < 1000) { showToast('Yeterli coin yok! 1000 💰 gerekli', '#ef4444'); return; }
  var name = (document.getElementById('clanNameInput')?.value || '').trim();
  var tag  = (document.getElementById('clanTagInput')?.value  || '').trim().toUpperCase();
  var desc = (document.getElementById('clanDescInput')?.value || '').trim();
  var pub  = document.getElementById('clanPublicInput')?.checked !== false;
  var minScore = parseInt(document.getElementById('clanMinScore')?.value || '0') || 0;
  var maxMembers = parseInt(document.getElementById('clanMaxMembers')?.value || '25') || 25;
  if (!name || name.length < 2) { showToast('Klan adı en az 2 karakter', '#ef4444'); return; }
  if (!tag  || tag.length  < 2) { showToast('Etiket en az 2 karakter', '#ef4444'); return; }
  try {
    var r = await workerPost('clan/create', { token: authUser.token, name, tag, description: desc, isPublic: pub, minScore, maxMembers });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    state.coins = (state.coins||0) - 1000;
    state.clanId = r.clanId;
    if (!state._shopBuys) state._shopBuys = 0;
    state._shopBuys++;
    saveState();
    updateWallet();
    showToast('🏰 Klan kuruldu: [' + tag + '] ' + name, '#00ff88');
    spawnConfetti(30);
    _clanData = r.clan;
    switchClanTab('my');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

async function joinClan(clanId) {
  if (!authUser) { showToast('Önce giriş yap', '#ef4444'); return; }
  try {
    var r = await workerPost('clan/join', { token: authUser.token, clanId });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    state.clanId = clanId;
    saveState();
    showToast('🎉 Klana katıldın!', '#00ff88');
    switchClanTab('my');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

async function joinByInvite() {
  var code = (document.getElementById('inviteCodeInput')?.value || '').trim().toUpperCase();
  if (!code) { showToast('Davet kodu gir', '#ef4444'); return; }
  if (!authUser) { showToast('Önce giriş yap', '#ef4444'); return; }
  try {
    var r = await workerPost('clan/join-invite', { token: authUser.token, inviteToken: code });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    state.clanId = r.clan.id;
    saveState();
    showToast('🎉 [' + r.clan.tag + '] ' + r.clan.name + ' klanına katıldın!', '#00ff88');
    spawnConfetti(20);
    switchClanTab('my');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

async function setClanRole(targetUid, role) {
  if (!authUser) return;
  try {
    var r = await workerPost('clan/set-role', { token: authUser.token, targetUid, role });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    showToast('✅ Rütbe güncellendi', '#00ff88');
    switchClanTab('my');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

async function kickMember(targetUid, name) {
  if (!authUser) return;
  var ok = await showConfirm('Üyeyi Çıkar', '"' + name + '" klandan çıkarılacak. Emin misin?');
  if (!ok) return;
  try {
    var r = await workerPost('clan/kick', { token: authUser.token, targetUid });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    showToast('✅ ' + name + ' klandan çıkarıldı', '#f59e0b');
    switchClanTab('my');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

async function leaveClan() {
  if (!authUser) return;
  var ok = await showConfirm('Klanı Terk Et', 'Klanı terk etmek istediğine emin misin?');
  if (!ok) return;
  try {
    var r = await workerPost('clan/leave', { token: authUser.token });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    state.clanId = null;
    _clanData = null;
    saveState();
    showToast('👋 Klandan ayrıldın', '#f59e0b');
    switchClanTab('my');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

async function generateInviteLink() {
  if (!authUser) return;
  try {
    var r = await workerPost('clan/invite-link', { token: authUser.token });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    showToast('🔗 Davet linki oluşturuldu! 7 gün geçerli.', '#00ff88');
    if (_clanData) { _clanData.inviteToken = r.inviteToken; }
    switchClanTab('settings');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

function copyInviteLink(token) {
  try {
    navigator.clipboard.writeText(token).then(function() { showToast('📋 Davet kodu kopyalandı: ' + token, '#38bdf8'); });
  } catch(e) { showToast(token, '#38bdf8'); }
}

async function saveContributors() {
  if (!authUser || !_clanData) return;
  var checkboxes = document.querySelectorAll('#contributorPicker input[type=checkbox]:checked');
  var selected = Array.from(checkboxes).map(function(cb) { return cb.value; });
  var maxC = Math.max(2, Math.min(10, Math.floor(_clanData.members.length / 2)));
  if (selected.length > maxC) { showToast('En fazla ' + maxC + ' katkıcı seçebilirsin', '#ef4444'); return; }
  try {
    var r = await workerPost('clan/set-contributors', { token: authUser.token, contributors: selected });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    if (_clanData) _clanData.contributors = r.contributors;
    showToast('✅ Katkıcılar güncellendi! (' + selected.length + '/' + r.maxContributors + ')', '#00ff88');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

async function saveClanSettings() {
  if (!authUser || !_clanData) return;
  var desc = document.getElementById('settingClanDesc')?.value || '';
  var minScore = parseInt(document.getElementById('settingMinScore')?.value || '0') || 0;
  var maxMembers = parseInt(document.getElementById('settingMaxMembers')?.value || '25') || 25;
  var isPublic = document.getElementById('settingIsPublic')?.checked !== false;
  try {
    var r = await workerPost('clan/update-settings', { token: authUser.token, description: desc, minScore, maxMembers, isPublic });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    if (_clanData) { _clanData.description = desc; _clanData.minScore = minScore; _clanData.maxMembers = maxMembers; _clanData.isPublic = isPublic; }
    showToast('✅ Klan ayarları kaydedildi!', '#00ff88');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

async function registerTournament() {
  if (!authUser || !state.clanId) return;
  try {
    var r = await workerPost('clan/tournament/register', { token: authUser.token });
    if (!r || !r.ok) { showToast('❌ ' + (r?.error || 'Hata'), '#ef4444'); return; }
    showToast('✅ Turnuvaya kaydolundun!', '#ffd700');
    switchClanTab('tournament');
  } catch(e) { showToast('❌ Bağlantı hatası', '#ef4444'); }
}

/* Turnuva ödüllerini kontrol et ve claim et */
async function checkTournamentPrizes() {
  if (!authUser) return;
  try {
    var r = await workerPost('clan/prizes', { token: authUser.token });
    if (!r || !r.ok || !r.prizes || !r.prizes.length) return;
    /* Ödül var — claim et */
    var cr = await workerPost('clan/prizes/claim', { token: authUser.token });
    if (cr && cr.ok && (cr.coins || cr.diamonds)) {
      if (cr.coins)    addCoins(cr.coins, true);
      if (cr.diamonds) addDiamonds(cr.diamonds, true);
      showToast('🏆 Turnuva ödülü: +' + (cr.coins||0) + '💰 +' + (cr.diamonds||0) + '💎', '#ffd700');
      spawnConfetti(40);
    }
  } catch(e) {}
}

function renderClanShop(el) {
  el.innerHTML =
    '<button onclick="closeModal(document.getElementById(\'shopModal\'));openClanModal()" class="btn" style="width:100%;margin-bottom:12px">👥 Klanlar Sayfasına Git</button>' +
    SHOP_ITEMS.clans.map(function(item) {
      var balance = state.coins || 0;
      var canAfford = balance >= item.cost;
      return '<div class="shop-item">' +
        '<div class="shop-item-icon">' + item.icon + '</div>' +
        '<div class="shop-item-info">' +
          '<div class="shop-item-name">' + item.name + '</div>' +
          '<div class="shop-item-desc">' + item.desc + '</div>' +
        '</div>' +
        '<button class="shop-buy-btn shop-buy-coin" ' + (!canAfford || state.clanId ? 'disabled style="opacity:0.4"' : 'onclick="buyShopItem(\'' + item.id + '\')"') + '>' +
          '💰 ' + item.cost +
        '</button>' +
      '</div>';
    }).join('');
}
