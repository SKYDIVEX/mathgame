/* ══ MathGame · js/ui/entry.js ══ (index.html'de sırayla yüklenir) */
/* ── ENTRY ─────────────────────────────────────────── */
/* enterBtn/guestBtn artık gizli — auth modal kullanılıyor */
try { enterBtn.addEventListener('click', () => openAuthModal()); } catch(e) {}
try { guestBtn.addEventListener('click',  () => openAuthModal()); } catch(e) {}

function startSession(name){
  try { stopSessionTimer(); } catch(e) {}
  const prev=state.player;
  state.player=name;
  if(prev!==name) state.level=1;
  state.level=state.level||1;
  state.score=getCurrentBoard()[name]||0;
  if(!state.stats) state.stats = {};
  if(!state.achievements) state.achievements = {};
  saveState();
  try { startSessionTimer(); } catch(e) {}
  playerLabel.innerText=name;
  playerDisplay.innerText=name;
  scoreDisplay.innerText=state.score;
  levelDisplay.innerText=state.level;
  showScreen('menu');
  clickSound();
  renderLeaderboard();
  updateMiniInfo();
}
