/* ══ MathGame · js/social/announcements.js ══ (index.html'de sırayla yüklenir) */
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
