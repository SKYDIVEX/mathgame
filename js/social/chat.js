/* ══ MathGame · js/social/chat.js ══ (index.html'de sırayla yüklenir) */
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
