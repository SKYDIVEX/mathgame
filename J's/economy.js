/* ══════════════════════════════════════════════════════
   EKONOMİ SİSTEMİ — Coin, Elmas, Joker, Mağaza
   ══════════════════════════════════════════════════════ */

/* Mağaza ürünleri */
var SHOP_ITEMS = {
  jokers: [
    { id:'joker_skip',   icon:'⏭️', name:'Soru Atla',       desc:'Cezasız bir soruyu atla',              cost:30,  currency:'diamonds', type:'joker', jkey:'skip'   },
    { id:'joker_hint',   icon:'💡', name:'İpucu',            desc:'2 yanlış şıkkı elemine',               cost:20,  currency:'diamonds', type:'joker', jkey:'hint'   },
    { id:'joker_freeze', icon:'🧊', name:'Ceza Dondur',      desc:'Bir sonraki yanlışta puan kesilmez',   cost:25,  currency:'diamonds', type:'joker', jkey:'freeze' },
    { id:'joker_double', icon:'⚡', name:'2x Puan',          desc:'Bir sonraki doğruda puan 2 katı',      cost:40,  currency:'diamonds', type:'joker', jkey:'double' },
    { id:'joker_pack3',  icon:'🎁', name:'Joker Paketi',     desc:'Her jokerden 2 adet (8 toplam)',       cost:120, currency:'diamonds', type:'joker_pack'          },
  ],
  avatars: [
    { id:'avatar_fire',    icon:'🔥', name:'Ateş',           desc:'Ateşli oyuncu avatarı',                cost:500,  currency:'coins',  type:'avatar' },
    { id:'avatar_crown',   icon:'👑', name:'Kral',           desc:'Kraliyet avatarı',                     cost:800,  currency:'coins',  type:'avatar' },
    { id:'avatar_robot',   icon:'🤖', name:'Robot',          desc:'Teknoloji meraklısı',                  cost:600,  currency:'coins',  type:'avatar' },
    { id:'avatar_ninja',   icon:'🥷', name:'Ninja',          desc:'Gölgede oynayan',                      cost:700,  currency:'coins',  type:'avatar' },
    { id:'avatar_wizard',  icon:'🧙', name:'Sihirbaz',       desc:'Matematik büyücüsü',                   cost:1000, currency:'coins',  type:'avatar' },
    { id:'avatar_alien',   icon:'👽', name:'Uzaylı',         desc:'Başka bir boyuttan',                   cost:900,  currency:'coins',  type:'avatar' },
    { id:'avatar_dragon',  icon:'🐉', name:'Ejderha',        desc:'Efsanevi güç',                         cost:1500, currency:'coins',  type:'avatar' },
    { id:'avatar_diamond', icon:'💎', name:'Elmas',          desc:'Paha biçilmez',                        cost:200,  currency:'diamonds', type:'avatar' },
  ],
  badges: [
    { id:'badge_math',     icon:'🧮', name:'Matematik Ustası', desc:'Matematik tutkunları için özel rozet', cost:300,  currency:'coins',  type:'badge' },
    { id:'badge_rocket',   icon:'🚀', name:'Roket',           desc:'Hız odaklı oyuncular için',            cost:400,  currency:'coins',  type:'badge' },
    { id:'badge_star',     icon:'⭐', name:'Yıldız',          desc:'Parlayan oyuncu',                     cost:250,  currency:'coins',  type:'badge' },
    { id:'badge_thunder',  icon:'⚡', name:'Şimşek',          desc:'Yıldırım hızında',                    cost:500,  currency:'coins',  type:'badge' },
    { id:'badge_ghost',    icon:'👻', name:'Hayalet',         desc:'Sessiz ama ölümcül',                  cost:600,  currency:'coins',  type:'badge' },
    { id:'badge_vip',      icon:'💎', name:'VIP',             desc:'VIP statüsü rozeti',                  cost:100,  currency:'diamonds', type:'badge' },
  ],
  clans: [
    { id:'clan_create', icon:'🏰', name:'Klan Kur',           desc:'Kendi klanını oluştur (sahip ol)',     cost:1000, currency:'coins',  type:'clan_create' },
  ],
};

/* Günlük giriş ödülleri (15 günlük döngü) */
var LOGIN_REWARDS = [
  { day:1,  icon:'💰', reward:'coins',    amount:100,  label:'100 Coin' },
  { day:2,  icon:'💎', reward:'diamonds', amount:5,    label:'5 Elmas' },
  { day:3,  icon:'💰', reward:'coins',    amount:200,  label:'200 Coin' },
  { day:4,  icon:'🃏', reward:'joker',    jkey:'skip', amount:1, label:'1 Atlama Jokeri' },
  { day:5,  icon:'💰', reward:'coins',    amount:300,  label:'300 Coin' },
  { day:6,  icon:'💎', reward:'diamonds', amount:10,   label:'10 Elmas' },
  { day:7,  icon:'🎁', reward:'coins',    amount:500,  label:'500 Coin + 5 Elmas', bonus:{diamonds:5} },
  { day:8,  icon:'💰', reward:'coins',    amount:200,  label:'200 Coin' },
  { day:9,  icon:'💎', reward:'diamonds', amount:8,    label:'8 Elmas' },
  { day:10, icon:'🃏', reward:'joker',    jkey:'double', amount:2, label:'2 2x Jokeri' },
  { day:11, icon:'💰', reward:'coins',    amount:400,  label:'400 Coin' },
  { day:12, icon:'💎', reward:'diamonds', amount:15,   label:'15 Elmas' },
  { day:13, icon:'🃏', reward:'joker',    jkey:'hint', amount:3, label:'3 İpucu Jokeri' },
  { day:14, icon:'💰', reward:'coins',    amount:600,  label:'600 Coin' },
  { day:15, icon:'🏆', reward:'coins',    amount:1000, label:'1000 Coin + 20 Elmas', bonus:{diamonds:20} },
];

/* Para güncelle ve göstergeni yenile */
function updateWallet() {
  if (!state) return;
  var coins    = state.coins    || 0;
  var diamonds = state.diamonds || 0;

  var cd = document.getElementById('coinDisplay');
  var dd = document.getElementById('diamondDisplay');
  var wd = document.getElementById('walletDisplay');
  var sc = document.getElementById('shopCoinBal');
  var sd = document.getElementById('shopDiaBal');

  if (cd) cd.textContent = coins.toLocaleString();
  if (dd) dd.textContent = diamonds.toLocaleString();
  if (wd) wd.style.display = authUser ? 'flex' : 'none';
  if (sc) sc.textContent = coins.toLocaleString();
  if (sd) sd.textContent = diamonds.toLocaleString();
}

/* Coin ekle */
function addCoins(amount, reason) {
  state.coins = (state.coins || 0) + amount;
  saveState();
  updateWallet();
  if (reason) showFloatingReward('+' + amount + ' 💰', '#ffd700');
  /* Her para değişiminde buluta kaydet */
  if (authUser && authUser.token) {
    clearTimeout(addCoins._saveTimer);
    addCoins._saveTimer = setTimeout(function() {
      try { saveProfileToCloud(); } catch(e) {}
    }, 2000); /* 2sn debounce — çok sık çağrıyı önle */
  }
}
addCoins._saveTimer = null;

/* Elmas ekle */
function addDiamonds(amount, reason) {
  state.diamonds = (state.diamonds || 0) + amount;
  saveState();
  updateWallet();
  if (reason) showFloatingReward('+' + amount + ' 💎', '#63b3ed');
  if (authUser && authUser.token) {
    clearTimeout(addDiamonds._saveTimer);
    addDiamonds._saveTimer = setTimeout(function() {
      try { saveProfileToCloud(); } catch(e) {}
    }, 2000);
  }
}
addDiamonds._saveTimer = null;

/* Yüzen ödül animasyonu */
function showFloatingReward(text, color) {
  var el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);' +
    'background:rgba(0,0,0,0.7);color:' + color + ';font-weight:800;font-size:14px;' +
    'padding:6px 16px;border-radius:20px;z-index:99999;pointer-events:none;' +
    'animation:floatUp 1.5s ease-out forwards';
  document.body.appendChild(el);
  setTimeout(function() { try { el.remove(); } catch(e) {} }, 1600);
}

/* Oyun sırasında coin kazanma */
function earnCoinForCorrect(level, isStreak) {
  var base = Math.max(1, Math.floor(level / 2));
  if (isStreak) base = Math.floor(base * 1.5);
  addCoins(base);
}

/* Mağaza Aç */
function openQuestModal() {
  document.getElementById('questModal').classList.add('show');
  switchQuestTab(_currentQuestTab || 'daily');
  clickSound();
}

function updateQuestQuickInfo() {
  try {
    var tasks    = getTodaysTasks();
    var claimable = tasks.filter(function(t) { return t.completed && !t.rewardGiven; }).length;
    var qi = document.getElementById('questQuickInfo');
    if (qi) {
      qi.textContent = claimable > 0
        ? claimable + ' alınabilir 🎁'
        : tasks.filter(function(t){ return t.rewardGiven; }).length + '/' + tasks.length + ' tamamlandı';
      qi.style.color = claimable > 0 ? '#ffd700' : 'var(--muted)';
    }
  } catch(e) {}
}

function openShop() {
  updateWallet();
  document.getElementById('shopModal').classList.add('show');
  switchShopTab('jokers');
  clickSound();
}

/* Sekme değiştir */
function switchShopTab(tab) {
  document.querySelectorAll('.shop-tab').forEach(function(b) { b.classList.remove('active'); });
  var btn = document.getElementById('shopTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (btn) btn.classList.add('active');
  renderShopTab(tab);
}

/* Sekme içeriğini render et */
function renderShopTab(tab) {
  var el = document.getElementById('shopContent');
  if (!el) return;
  var items = SHOP_ITEMS[tab] || [];
  var inventory = state.inventory || [];

  if (tab === 'clans') {
    renderClanShop(el); return;
  }

  el.innerHTML = items.map(function(item) {
    var owned    = inventory.some(function(i) { return i.id === item.id; });
    var equipped = inventory.some(function(i) { return i.id === item.id && i.equipped; });
    var count    = 0;
    if (item.type === 'joker') { count = (state.jokers || {})[item.jkey] || 0; }

    var priceLabel = item.currency === 'diamonds'
      ? '💎 ' + item.cost
      : '💰 ' + item.cost;

    var btnLabel, btnClass, btnAction;
    if (item.type === 'joker' || item.type === 'joker_pack') {
      btnLabel  = priceLabel + (count > 0 ? ' (' + count + ')' : '');
      btnClass  = 'shop-buy-' + (item.currency === 'diamonds' ? 'dia' : 'coin');
      btnAction = 'buyShopItem(\'' + item.id + '\')';
    } else if (owned) {
      btnLabel  = equipped ? '✓ Takılı' : '👕 Takt';
      btnClass  = 'shop-buy-owned';
      btnAction = equipped ? '' : 'equipItem(\'' + item.id + '\',\'' + item.type + '\')';
    } else {
      btnLabel  = priceLabel;
      btnClass  = 'shop-buy-' + (item.currency === 'diamonds' ? 'dia' : 'coin');
      btnAction = 'buyShopItem(\'' + item.id + '\')';
    }

    return '<div class="shop-item">' +
      '<div class="shop-item-icon">' + item.icon + '</div>' +
      '<div class="shop-item-info">' +
        '<div class="shop-item-name">' + item.name + '</div>' +
        '<div class="shop-item-desc">' + item.desc + '</div>' +
      '</div>' +
      '<button class="shop-buy-btn ' + btnClass + '" ' +
        (btnAction ? 'onclick="' + btnAction + '"' : 'disabled') + '>' +
        btnLabel +
      '</button>' +
    '</div>';
  }).join('');
}

/* Satın al */
function buyShopItem(itemId) {
  var allItems = Object.values(SHOP_ITEMS).flat();
  var item = allItems.find(function(i) { return i.id === itemId; });
  if (!item) return;

  var balance = item.currency === 'diamonds' ? (state.diamonds || 0) : (state.coins || 0);
  if (balance < item.cost) {
    showToast('❌ Yeterli ' + (item.currency === 'diamonds' ? '💎 elmas' : '💰 coin') + ' yok!', '#ef4444');
    return;
  }

  /* Ödemeyi yap */
  if (item.currency === 'diamonds') { state.diamonds = (state.diamonds || 0) - item.cost; }
  else { state.coins = (state.coins || 0) - item.cost; }

  /* Ürünü ver */
  if (!state.jokers) state.jokers = { skip:0, hint:0, freeze:0, double:0 };
  if (!state.inventory) state.inventory = [];

  if (item.type === 'joker') {
    state.jokers[item.jkey] = (state.jokers[item.jkey] || 0) + 1;
    showToast('🎉 ' + item.name + ' jokeri alındı! (' + state.jokers[item.jkey] + ' adet)', '#ffd700');
  } else if (item.type === 'joker_pack') {
    ['skip','hint','freeze','double'].forEach(function(k) {
      state.jokers[k] = (state.jokers[k] || 0) + 2;
    });
    showToast('🎁 Joker Paketi alındı! Her jokerden 2 adet.', '#ffd700');
  } else if (item.type === 'avatar' || item.type === 'badge') {
    state.inventory.push({ id: item.id, type: item.type, equipped: false, icon: item.icon });
    showToast('✅ ' + item.name + ' envanterine eklendi!', '#00ff88');
  }

  /* Bonus varsa */
  if (item.bonus) {
    if (item.bonus.diamonds) { state.diamonds = (state.diamonds || 0) + item.bonus.diamonds; }
    if (item.bonus.coins)    { state.coins    = (state.coins    || 0) + item.bonus.coins; }
  }

  saveState();
  updateWallet();
  renderShopTab(document.querySelector('.shop-tab.active')?.id?.replace('shopTab','').toLowerCase() || 'jokers');
  updateJokerUI();
}

/* Ekipman takt */
function equipItem(itemId, type) {
  if (!state.inventory) return;
  state.inventory.forEach(function(i) { if (i.type === type) i.equipped = false; });
  var item = state.inventory.find(function(i) { return i.id === itemId; });
  if (item) {
    item.equipped = true;
    if (type === 'avatar') {
      /* Avatarı profil fotoğrafı olarak ayarla */
      var shopItem = Object.values(SHOP_ITEMS).flat().find(function(i) { return i.id === itemId; });
      if (shopItem) {
        state.profile = state.profile || {};
        state.profile.avatar = shopItem.icon;
        applyAvatar(shopItem.icon);
      }
    }
    showToast('✅ ' + item.id + ' takıldı!', '#00ff88');
  }
  saveState();
  renderShopTab(type + 's');
}

/* Joker UI'ını güncelle (oyun içi) */
function updateJokerUI() {
  var jokers = state.jokers || {};
  var jEl = document.getElementById('jokerBar');
  if (!jEl) return;
  var inGame = document.getElementById('gameArea') && document.getElementById('gameArea').style.display !== 'none';
  jEl.style.display = inGame ? 'flex' : 'none';
  jEl.innerHTML = [
    { key:'skip',   icon:'⏭️', label:'Atla'   },
    { key:'hint',   icon:'💡', label:'İpucu'  },
    { key:'freeze', icon:'🧊', label:'Dondur' },
    { key:'double', icon:'⚡', label:'2x'     },
  ].map(function(j) {
    var cnt = jokers[j.key] || 0;
    return '<button onclick="useJoker(\'' + j.key + '\')" ' +
      'style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 10px;' +
      'border-radius:10px;border:1px solid ' + (cnt > 0 ? 'rgba(255,215,0,0.3)' : 'var(--border)') + ';' +
      'background:' + (cnt > 0 ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)') + ';' +
      'cursor:' + (cnt > 0 ? 'pointer' : 'default') + ';opacity:' + (cnt > 0 ? '1' : '0.4') + '">' +
      '<span style="font-size:16px">' + j.icon + '</span>' +
      '<span style="font-size:9px;font-weight:800;color:' + (cnt > 0 ? '#ffd700' : 'var(--muted)') + '">' + cnt + '</span>' +
    '</button>';
  }).join('');
}

/* Joker kullan */
function useJoker(key) {
  if (!state.jokers || !state.jokers[key] || state.jokers[key] <= 0) return;
  /* Oyun aktif mi? */
  var gameScreen = document.getElementById('gameArea');
  if (!gameScreen || gameScreen.style.display === 'none') return;

  state.jokers[key]--;
  state._jokersUsed = (state._jokersUsed || 0) + 1;
  saveState();
  updateJokerUI();

  if (key === 'skip') {
    showToast('⏭️ Soru atlandı!', '#ffd700');
    nextQuestion();
  } else if (key === 'hint') {
    useHintJoker();
  } else if (key === 'freeze') {
    window._jokerFreezeActive = true;
    showToast('🧊 Bir sonraki yanlışta ceza yok!', '#63b3ed');
  } else if (key === 'double') {
    window._jokerDoubleActive = true;
    showToast('⚡ Bir sonraki doğruda 2x puan!', '#ffd700');
  }
}

/* İpucu jokeri — absurd modda 2 yanlış şıkkı karart, matematik modda ipucu ver */
function useHintJoker() {
  /* Absürt mod: 2 yanlış şıkkı gizle */
  var choices = document.querySelectorAll('.choice-btn');
  if (choices.length === 4) {
    var wrongBtns = Array.from(choices).filter(function(b) { return !b.classList.contains('correct-hint'); });
    var toHide = wrongBtns.sort(function() { return Math.random()-0.5; }).slice(0,2);
    toHide.forEach(function(b) { b.style.opacity = '0.2'; b.style.pointerEvents = 'none'; });
    showToast('💡 2 yanlış şık elendi!', '#ffd700');
  } else {
    /* Matematik modu: doğru cevabın ilk rakamını göster */
    var ca = correctAnswer;
    if (ca !== null && ca !== undefined) {
      showToast('💡 İpucu: Cevap ' + String(Math.abs(ca)).charAt(0) + ' ile başlıyor', '#ffd700');
    }
  }
}

/* ── Günlük Giriş Sistemi ── */
function getDailyLoginKey() {
  /* UTC+3 Türkiye saatiyle gün — gece 00:00'da yenilenir */
  var d = new Date(Date.now() + 3 * 3600000);
  return d.toISOString().slice(0, 10);
}

function checkDailyLogin() {
  if (!authUser) return;
  var today = getDailyLoginKey();
  var lastLogin = state.lastLoginDate;
  /* Bugün zaten ödül alındıysa gösterme */
  if (lastLogin === today) return;
  /* claimedRewards kontrolü — cloud tabanlı */
  var claimedKey = 'dailyReward_' + today;
  if (localStorage.getItem(claimedKey) === authUser.uid) return;

  /* Seriyi hesapla */
  var d = new Date(Date.now() + 3*3600000);
  var yd = new Date(d - 86400000);
  var yesterday = yd.toISOString().slice(0, 10);
  if (lastLogin === yesterday) {
    state.loginStreak = (state.loginStreak || 0) + 1;
  } else {
    state.loginStreak = 1;
  }

  state.lastLoginDate = today;
  saveState();
  if (authUser && authUser.token) {
    setTimeout(function() { try { saveProfileToCloud(); } catch(e) {} }, 500);
  }
  setTimeout(function() { showDailyLoginModal(); }, 1200);
}

async function showDailyLoginModal() {
  var streak = state.loginStreak || 1;
  /* Aylık takvimden ödülleri yükle — yoksa varsayılan */
  var rewards = LOGIN_REWARDS;
  try {
    var now = new Date(Date.now() + 3*3600000);
    var mKey = now.toISOString().slice(0,7);
    var calR = await workerGet('monthly-rewards', { month: mKey });
    if (calR && calR.rewards && calR.rewards.length >= 28) rewards = calR.rewards;
  } catch(e) {}

  var todayDay = new Date(Date.now() + 3*3600000).getDate(); /* 1-31 */
  var todayIdx = Math.min(todayDay - 1, rewards.length - 1);
  var todayR = rewards[todayIdx];

  /* 15 günlük pencere — önceki hafta + bu hafta + sonraki hafta */
  var windowStart = Math.max(0, todayIdx - 3);
  var windowEnd   = Math.min(rewards.length - 1, windowStart + 13);
  var windowRewards = rewards.slice(windowStart, windowEnd + 1);

  var modal = document.createElement('div');
  modal.id = 'loginRewardModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(8,11,18,0.97);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(20px)';

  /* FC Mobile tarzı grid */
  var gridHtml = '<div class="fc-cal-grid" style="grid-template-columns:repeat(7,1fr)">' +
    windowRewards.map(function(r, i) {
      var realIdx = windowStart + i;
      var realDay = realIdx + 1;
      var isPast  = realDay < todayDay;
      var isToday = realDay === todayDay;
      var cls = isPast ? 'past' : isToday ? 'today' : 'future';
      return '<div class="fc-cal-card ' + cls + '">' +
        '<div class="fc-cal-day-num" style="color:' + (isToday ? 'var(--neon)' : 'var(--muted)') + '">' + realDay + '</div>' +
        '<div class="fc-cal-icon">' + (r.icon || '💰') + '</div>' +
        '<div class="fc-cal-label">' + (r.label || '').split('+')[0].trim().slice(0,9) + '</div>' +
        (isPast ? '' : isToday ? '<button class="fc-cal-claim-btn" onclick="claimDailyLogin()">🎁 AL</button>' : '<div class="fc-cal-lock">🔒</div>') +
      '</div>';
    }).join('') +
  '</div>';

  modal.innerHTML =
    '<div style="width:100%;max-width:500px;background:#0d1117;border-top:1px solid rgba(255,215,0,0.2);border-radius:24px 24px 0 0;padding:20px 16px 36px;animation:slideUp 0.3s ease">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<div>' +
          '<div style="font-family:var(--font-head);font-size:18px;font-weight:900;color:#ffd700">🎁 Günlük Giriş</div>' +
          '<div style="font-size:11px;color:var(--muted);margin-top:2px">Üst üste ' + streak + ' gün — ' + todayDay + '. gün ödülü</div>' +
        '</div>' +
        '<button onclick="var m=document.getElementById(\'loginRewardModal\');if(m)m.remove()" style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.06);border:none;color:var(--muted);font-size:16px;cursor:pointer">✕</button>' +
      '</div>' +
      gridHtml +
      '<div style="margin-top:14px;background:rgba(255,215,0,0.07);border:1px solid rgba(255,215,0,0.2);border-radius:14px;padding:14px;text-align:center">' +
        '<div style="font-size:32px;margin-bottom:6px">' + todayR.icon + '</div>' +
        '<div style="font-size:16px;font-weight:900;color:#ffd700">' + todayR.label + '</div>' +
        '<div style="font-size:11px;color:var(--muted);margin-top:3px">Bugünkü ödülün</div>' +
      '</div>' +
    '</div>';

  modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
  document.body.appendChild(modal);
  window._dailyLoginRewards = rewards;
}

function claimDailyLogin() {
  var today = getDailyLoginKey();
  var claimedKey = 'dailyReward_' + today;
  /* Çift alma engeli */
  if (localStorage.getItem(claimedKey) === (authUser && authUser.uid)) {
    showToast('✅ Bugünkü ödülünü zaten aldın!', '#ffd700');
    var modal = document.getElementById('loginRewardModal');
    if (modal) modal.remove();
    return;
  }

  var rewards = window._dailyLoginRewards || LOGIN_REWARDS;
  var todayDay = new Date(Date.now() + 3*3600000).getDate();
  var todayIdx = Math.min(todayDay - 1, rewards.length - 1);
  var reward = rewards[todayIdx];

  /* Ödülü ver */
  if (reward.reward === 'coins')    addCoins(reward.amount);
  if (reward.reward === 'diamonds') addDiamonds(reward.amount);
  if (reward.reward === 'joker') {
    if (!state.jokers) state.jokers = { skip:0, hint:0, freeze:0, double:0 };
    state.jokers[reward.jkey] = (state.jokers[reward.jkey] || 0) + (reward.amount || 1);
    saveState();
  }
  if (reward.bonus) {
    if (reward.bonus.diamonds) addDiamonds(reward.bonus.diamonds);
    if (reward.bonus.coins)    addCoins(reward.bonus.coins);
  }

  /* Alındı olarak işaretle — UID ile */
  try { localStorage.setItem(claimedKey, authUser ? authUser.uid : 'guest'); } catch(e) {}

  updateJokerUI();
  spawnConfetti(30);
  showToast('🎁 Günlük ödül alındı: ' + reward.label, '#ffd700');

  var modal = document.getElementById('loginRewardModal');
  if (modal) modal.remove();

  /* Worker'a claim kaydını gönder */
  if (authUser && authUser.token) {
    try {
      workerPost('daily-reward-claim', { token: authUser.token, day: todayDay, rewardKey: today }).catch(function(){});
    } catch(e) {}
    setTimeout(function() { try { saveProfileToCloud(); } catch(e) {} }, 500);
  }
}

/* claimDailyReward — görev listesinden ödül al */
function claimDailyReward(taskId) {
  var tasks = getTodaysTasks();
  var task  = tasks.find(function(t) { return t.id === taskId; });
  if (!task || !task.completed || task.rewardGiven) return;

  task.rewardGiven = true;
  saveTodaysTasks(tasks);

  if (task.reward) {
    if (task.reward.coins)    addCoins(task.reward.coins, true);
    if (task.reward.diamonds) addDiamonds(task.reward.diamonds, true);
  } else if (task.bonus) {
    state.score = (state.score || 0) + task.bonus;
    var board = getCurrentBoard();
    board[state.player] = state.score;
    setCurrentBoard(board);
    saveState();
    try { pushScoreToWorker(); } catch(e) {}
    try { updateAllScoreDisplays(); } catch(e) {}
  }

  spawnConfetti(20);
  showToast('🎁 ' + (task.reward ? '+' + (task.reward.coins||0) + '💰' : '+' + task.bonus + 'p') + ' kazandın!', '#ffd700');

  var list = document.getElementById('dailyTasksList');
  if (list) renderTaskList(tasks, list, 'daily');
  renderLeaderboard();
}

/* Klan mağaza sekmesi */
