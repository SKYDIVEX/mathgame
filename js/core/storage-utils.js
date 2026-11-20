/* ══ MathGame · js/core/storage-utils.js ══ (index.html'de sırayla yüklenir) */
function loadState(uid) {
  try {
    var key = getLsKey(uid);
    var stored = localStorage.getItem(key);
    if (stored) {
      var raw = JSON.parse(stored);
      state = Object.assign(defaultState(), raw);
      /* v2.6 ekonomi sistemi yeni — eski kayıtta yoksa sıfırdan başlat */
      if (!raw._economyV26) {
        state.coins    = 0;
        state.diamonds = 0;
        state.jokers   = { skip:0, hint:0, freeze:0, double:0 };
        state.inventory = [];
        state._shopBuys = 0;
        state._jokersUsed = 0;
        state._economyV26 = true;
        /* Kalıcı/başarım görevlerini de sıfırla */
        state.permTasks    = null;
        state.achieveTasks = null;
      }
    } else {
      state = defaultState();
      state._economyV26 = true;
    }
  } catch(e) {
    console.warn('[loadState] HATA:', e);
    state = defaultState();
    state._economyV26 = true;
  }
}
function saveState() {
  try {
    var key = getLsKey();
    var data = JSON.stringify(state);
    localStorage.setItem(key, data);
  } catch(e) {
    console.warn('[saveState] hata:', e);
  }
}

/* Helpers */
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m]); }
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function safeCalc(a,op,b){
  switch(op){ case '+':return a+b; case '-':return a-b; case '*':return a*b; case '/':return b!==0?a/b:0; default:return 0; }
}

const OP_LABELS = { '+':'Toplama','-':'Çıkarma','*':'Çarpma','/':'Bölme' };
const OP_SORT   = ['+','-','*','/'];
function opsKey(ops){ return [...ops].sort((a,b)=>OP_SORT.indexOf(a)-OP_SORT.indexOf(b)).join(''); }
function opsLabel(ops){
  const sorted=[...ops].sort((a,b)=>OP_SORT.indexOf(a)-OP_SORT.indexOf(b));
  const names={'+':'Toplama','-':'Çıkarma','*':'Çarpma','/':'Bölme'};
  return sorted.map(o=>names[o]||o).join(' + ');
}
function currentOpsKey(){ return opsKey(state.ops); }
/* Tek tablo — hepsi 'all' key'inde, ops bilgisi entry içinde */
function getCurrentBoard(){ return state.leaderboard['all'] || {}; }
function setCurrentBoard(board){ state.leaderboard['all'] = board; }
