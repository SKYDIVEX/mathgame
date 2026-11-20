/* ══ MathGame · js/core/state.js ══ (index.html'de sırayla yüklenir) */
var LS_KEY = 'mathgame_v2_0';
var CURRENT_UID_KEY = 'mathgame_current_uid';

function getLsKey(uid) {
  if (uid) {
    return 'mathgame_v2_0_' + uid;
  }
  if (authUser && authUser.uid) {
    return 'mathgame_v2_0_' + authUser.uid;
  }
  /* authUser henüz yüklenmemişse localStorage'dan uid oku */
  var storedUid = localStorage.getItem(CURRENT_UID_KEY);
  if (storedUid) {
    return 'mathgame_v2_0_' + storedUid;
  }
  return LS_KEY;
}
function defaultState() {
  return {
    player: null, score: 0, level: 1,
    leaderboard: {}, ops: ['+','-','*','/'],
    soundOn: true, levelUpEvery: 6,
    btnColor: '#00ff66', bgColor: '#0b1220', bgImage: null,
    theme: 'green', bgLibId: null, bgLibGradient: null,
    bgLibPhotoUrl: null, bgLibFallback: null,
    stats: {
      totalAnswered: 0, totalCorrect: 0, totalWrong: 0,
      bestStreak: 0, totalScore: 0, sessionStart: null,
      totalTimeSec: 0, highestLevel: 1, absurdPlayed: 0,
      dailyLevelUps: 0, currentNoWrong: 0,
    },
    achievements: {},
    /* ── Ekonomi Sistemi ── */
    coins: 0,       /* oyun içi para */
    diamonds: 0,    /* premium para */
    jokers: {
      skip: 0,        /* soruyu atla */
      hint: 0,        /* ipucu - yanlış şıkları azalt */
      freeze: 0,      /* skor cezasını dondur (1 yanlışta ceza yok) */
      double: 0,      /* 2x puan (1 soru için) */
    },
    inventory: [],    /* satın alınan item'lar: [{id, type, equipped}] */
    loginStreak: 0,   /* günlük giriş serisi */
    lastLoginDate: null,
    clanId: null,     /* üye olduğu klan */
    _economyV26: true,
  };
}
let state = defaultState();

/* authUser: auth modülü (js/auth/auth-online.js) daha sonra yüklenir; ama getLsKey()
   gibi fonksiyonlar bunu okuyor. Erken tanımlanmazsa o anda ReferenceError olur. */
var authUser = null;

/* DOM refs */
