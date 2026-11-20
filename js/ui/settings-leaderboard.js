/* ══ MathGame · js/ui/settings-leaderboard.js ══ (index.html'de sırayla yüklenir) */
/* ── SETTINGS SAVE ─────────────────────────────────── */
document.getElementById('saveSettingsBtn').addEventListener('click', ()=>{
  /* Draft → State'e yaz — ops artık sabit, her zaman 4 işlem */
  state.ops          = ['+', '-', '*', '/'];
  state.levelUpEvery = settingsDraft.levelUpEvery;
  state.soundOn      = settingsDraft.soundOn;
  state.btnColor     = settingsDraft.btnColor;
  state.bgColor      = settingsDraft.bgColor;

  /* Renkleri kesin olarak uygula */
  document.documentElement.style.setProperty('--neon',   state.btnColor);
  document.documentElement.style.setProperty('--bg-mid', state.bgColor);

  /* Ses durumunu uygula */
  if (masterGain) {
    masterGain.gain.value = state.soundOn ? 1 : 0;
  }
  const quickSoundEl = document.getElementById('soundToggle');
  if (quickSoundEl) quickSoundEl.checked = state.soundOn;

  /* Kaydet */
  saveState();

  /* Liderlik & UI güncelle */
  state.score = getCurrentBoard()[state.player] || 0;
  renderLeaderboard();
  updateMiniInfo();
  if (scoreDisplay) scoreDisplay.innerText = state.score;
  if (levelDisplay) levelDisplay.innerText = state.level;

  /* Değişiklik bayrağını sıfırla */
  settingsChanged = false;

  clickSound();
  showToast('✅ Ayarlar kaydedildi!');

  /* Modalı kapat */
  setTimeout(() => {
    try { closeModal(settingsModal); } catch(e) {}
  }, 400);
});

/* ── LEADERBOARD ───────────────────────────────────── */
var _localLbOpsFilter = 'all'; /* all, +, -, *, / veya karma */

function renderLeaderboard(){
  const board = getCurrentBoard(); /* hep 'all' key'i */
  var entries = Object.entries(board); /* [name, {score, ops}] veya [name, score] */

  /* ops filtresi uygula */
  if (_localLbOpsFilter !== 'all') {
    entries = entries.filter(function(e) {
      var ops = (typeof e[1] === 'object' && e[1].ops) ? e[1].ops : 'all';
      return ops === _localLbOpsFilter || ops === 'all';
    });
  }

  /* skora göre sırala */
  entries.sort(function(a, b) {
    var sa = typeof a[1] === 'object' ? (a[1].score || 0) : a[1];
    var sb = typeof b[1] === 'object' ? (b[1].score || 0) : b[1];
    return sb - sa;
  });

  var filterLabel = _localLbOpsFilter === 'all' ? 'Tüm Modlar' : opsLabel([..._localLbOpsFilter]);
  var header = '<div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:#a855f7;margin-bottom:6px">📊 ' + filterLabel + '</div>';

  if (entries.length === 0) {
    leaderboardEl.innerHTML = header + '<i style="color:var(--muted)">Henüz kimse yok</i>';
    if (boardDiv) boardDiv.innerHTML = '';
    return;
  }

  var medals = ['🥇','🥈','🥉'];
  var html = header + entries.slice(0, 20).map(function(e, i) {
    var score = typeof e[1] === 'object' ? (e[1].score || 0) : e[1];
    var rank = i < 3 ? medals[i] : (i + 1) + '.';
    var isMe = e[0] === (authUser ? authUser.name : state.player);
    return '<div class="lbItem' + (isMe ? '" style="background:var(--neon-dim);border-color:rgba(0,255,136,0.25)' : '') + '">' +
      '<div>' + rank + ' ' + escapeHtml(e[0]) + (isMe ? ' ✦' : '') + '</div>' +
      '<div style="color:var(--neon);font-family:var(--font-mono)">' + score + 'p</div>' +
      '</div>';
  }).join('');

  leaderboardEl.innerHTML = html;
  if (boardDiv) boardDiv.innerHTML = entries.slice(0, 10).map(function(e, i) {
    var score = typeof e[1] === 'object' ? (e[1].score || 0) : e[1];
    return '<div style="display:flex;justify-content:space-between;padding:6px;border-radius:6px;background:rgba(255,255,255,0.02);margin-bottom:6px">' +
      (i + 1) + '. ' + escapeHtml(e[0]) + '<strong>' + score + 'p</strong></div>';
  }).join('');
}
