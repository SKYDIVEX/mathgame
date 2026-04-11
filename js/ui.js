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

/* ── MINI INFO ─────────────────────────────────────── */
function updateMiniInfo(){
  /* Profil butonundaki isim güncel kalsın */
  var nameEl = document.getElementById('pbName');
  if (nameEl && authUser) {
    nameEl.textContent = authUser.name.slice(0, 12);
  }
}

/* ── SCREEN NAVIGATION ─────────────────────────────── */
function showScreen(name){
  entryCard.style.display  = 'none'; /* auth modal kullanılıyor */
  if (name === 'entry') {
    /* Zaten giriş yapılmışsa direkt menüye */
    if (authUser) {
      state.player = authUser.name;
      showScreen('menu');
      return;
    }
    /* Yoksa auth modal aç */
    setTimeout(() => { try { openAuthModal(); } catch(e){} }, 100);
  }
  menuCard.style.display   = name==='menu'  ? 'block' : 'none';
  gameArea.style.display   = name==='game'  ? 'block' : 'none';
  /* Oyun dışında streak badge'i gizle */
  var sb = document.getElementById('streakBadge');
  if (sb && name !== 'game') sb.style.display = 'none';
  if (name === 'menu') {
    menuCard.classList.remove('show');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        menuCard.classList.add('show');
      });
    });
    /* Seri badge'ini gizle */
    try { updateStreakBadge(0); } catch(e) {}
    /* Panelleri her zaman güncelle */
    try { refreshMenuPanels(); } catch(e) {}
  }
}

/* ── CONFIRM MODAL ─────────────────────────────────── */
const confirmModal  = document.getElementById('confirmModal');
const confirmTitle  = document.getElementById('confirmTitle');
const confirmMsg    = document.getElementById('confirmMsg');
const confirmOkBtn  = document.getElementById('confirmOk');
const confirmCancel = document.getElementById('confirmCancel');
let _confirmResolve = null;

function showConfirm(title, msg){
  return new Promise(resolve => {
    _confirmResolve = resolve;
    confirmTitle.innerText = title;
    confirmMsg.innerText = msg;
    confirmModal.classList.add('show');
  });
}
if(confirmOkBtn) confirmOkBtn.addEventListener('click', ()=>{ closeModal(confirmModal, ()=>{ if(_confirmResolve){_confirmResolve(true);_confirmResolve=null;} }); clickSound(); });
confirmCancel.addEventListener('click', ()=>{ closeModal(confirmModal, ()=>{ if(_confirmResolve){_confirmResolve(false);_confirmResolve=null;} }); clickSound(); });

/* ── SETTINGS MODAL ────────────────────────────────── */
const settingsModal    = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsModal');
const opBtns           = document.querySelectorAll('.op-btn');
const levelUpSlider    = document.getElementById('levelUpSpeed');
const levelUpVal       = document.getElementById('levelUpVal');
const settingSoundToggle   = document.getElementById('settingSoundToggle');
const settingBtnColorNew   = document.getElementById('settingBtnColor');
const settingBgColorNew    = document.getElementById('settingBgColor');
const settingBgImageBtn    = document.getElementById('settingBgImageBtn');
const settingBgImageInput  = document.getElementById('settingBgImageInput');
const settingClearBgBtn    = document.getElementById('settingClearBgBtn');
const settingResetScores   = document.getElementById('settingResetScores');

/* ── Ayarlar: Draft State sistemi ────────────────────────────
   Kullanıcı ayarları değiştirdiğinde state'e DOKUNMUYORUZ.
   Sadece draft objesi güncellenir. Kaydet tuşuna basınca
   draft → state'e yazılır. Kaydedilmeden çıkılırsa uyarı çıkar.
   ─────────────────────────────────────────────────────────── */

let settingsDraft    = {};   // aktif modal açıkken geçici değerler
let settingsChanged  = false; // herhangi bir şey değişti mi?

function markSettingsChanged() {
  settingsChanged = true;
}

function openSettingsModal(){
  /* Draft'ı state'in anlık kopyasıyla başlat */
  settingsDraft = {
    ops:         [...(state.ops || ['+','-','*','/'])],
    levelUpEvery: state.levelUpEvery || 4,
    soundOn:      !!state.soundOn,
    btnColor:     state.btnColor || '#00ff66',
    bgColor:      state.bgColor  || '#0b1220',
  };
  settingsChanged = false;

  /* UI'ı draft'a göre sync et */
  opBtns.forEach(b => {
    b.classList.toggle('active', settingsDraft.ops.includes(b.dataset.op));
  });
  levelUpSlider.value  = settingsDraft.levelUpEvery;
  levelUpVal.innerText = settingsDraft.levelUpEvery;
  settingSoundToggle.checked  = settingsDraft.soundOn;
  settingBtnColorNew.value    = settingsDraft.btnColor;
  settingBgColorNew.value     = settingsDraft.bgColor;

  settingsModal.classList.add('show');
}

/* Kaydedilmeden kapatma kontrolü */
let settingsCloseWarned = false; // uyarı gösterildi mi?

function tryCloseSettings() {
  if (settingsChanged && !settingsCloseWarned) {
    /* İlk kapama denemesi — uyarı ver, KAPATMA */
    showToast('💾 Kaydedilmemiş değişiklikler var! Çıkmak için tekrar bas.', '#ef4444');
    settingsCloseWarned = true;

    /* Kaydet butonunu titret */
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
      saveBtn.style.animation = 'none';
      saveBtn.offsetHeight;
      saveBtn.style.animation = 'savePulse .5s ease 2';
      setTimeout(() => { try { saveBtn.style.animation = ''; } catch(e){} }, 1100);
    }
    return; /* AÇIK KAL */
  }
  /* İkinci basış veya değişiklik yok — kapat */
  _closeSettingsForReal();
}

function _closeSettingsForReal() {
  /* Önizleme renklerini state'e geri al */
  document.documentElement.style.setProperty('--neon',   state.btnColor || '#00ff66');
  document.documentElement.style.setProperty('--bg-mid', state.bgColor  || '#0b1220');
  settingsChanged      = false;
  settingsCloseWarned  = false;
  closeModal(settingsModal);
  clickSound();
}

if(closeSettingsBtn) closeSettingsBtn.addEventListener('click', tryCloseSettings);

/* Op toggle butonları — SADECE draft'ı değiştirir */
opBtns.forEach(b => {
  b.addEventListener('click', ()=>{
    const op     = b.dataset.op;
    const active = settingsDraft.ops.includes(op);
    if (active && settingsDraft.ops.length === 1) {
      showToast('⚠️ En az bir işlem türü seçili olmalı!', '#f59e0b');
      return;
    }
    if (active) {
      settingsDraft.ops = settingsDraft.ops.filter(x => x !== op);
      b.classList.remove('active');
    } else {
      settingsDraft.ops = [...settingsDraft.ops, op];
      b.classList.add('active');
    }
    markSettingsChanged();
    clickSound();
  });
});

/* Seviye hızı — sadece draft */
if(levelUpSlider) levelUpSlider.addEventListener('input', ()=>{
  settingsDraft.levelUpEvery = parseInt(levelUpSlider.value);
  levelUpVal.innerText = levelUpSlider.value;
  markSettingsChanged();
});

/* Ses toggle — sadece draft */
if(settingSoundToggle) settingSoundToggle.addEventListener('change', ()=>{
  settingsDraft.soundOn = settingSoundToggle.checked;
  markSettingsChanged();
  clickSound();
});

/* Buton rengi — canlı önizleme ama SADECE draft'a kayıt */
if(settingBtnColorNew) settingBtnColorNew.addEventListener('input', ()=>{
  settingsDraft.btnColor = settingBtnColorNew.value;
  document.documentElement.style.setProperty('--neon', settingBtnColorNew.value);
  markSettingsChanged();
});

/* Arka plan rengi — canlı önizleme ama SADECE draft'a kayıt */
if(settingBgColorNew) settingBgColorNew.addEventListener('input', ()=>{
  settingsDraft.bgColor = settingBgColorNew.value;
  document.documentElement.style.setProperty('--bg-mid', settingBgColorNew.value);
  markSettingsChanged();
});

// Bg image
if(settingBgImageBtn) settingBgImageBtn.addEventListener('click', ()=> settingBgImageInput && settingBgImageInput.click());
if(settingBgImageInput) settingBgImageInput.addEventListener('change', (ev)=>{
  const f = ev.target.files[0];
  if(!f) return;
  if(f.size > 15 * 1024 * 1024){ showToast('⚠️ Fotoğraf çok büyük (max 15MB)', '#f59e0b'); return; }
  showToast('⏳ Fotoğraf yükleniyor...', '#38bdf8');
  compressAndSetBgImage(f, (dataUrl) => {
    if(!dataUrl){ showToast('❌ Fotoğraf yüklenemedi', '#ff6b6b'); return; }
    state.bgImage = dataUrl;
    applyBgImage();
    try { saveState(); } catch(e){
      showToast('⚠️ Kaydedilemedi, oturum süresince çalışır', '#f59e0b');
    }
    showToast('✅ Arka plan ayarlandı!');
  });
  ev.target.value = '';
});
if(settingClearBgBtn) settingClearBgBtn.addEventListener('click', function() {
  state.bgImage = null;
  applyBgImage();
  try { saveState(); } catch(e) {}
  clickSound();
  showToast('🗑 Arka plan temizlendi');
});

// Reset scores (with confirm)
if (settingResetScores) settingResetScores.addEventListener('click', async ()=>{
  const ok = await showConfirm('Skorları Sıfırla', 'Tüm modlardaki tüm skorlar silinecek.');
  if(!ok) return;
  state.leaderboard={}; saveState(); renderLeaderboard();
try { loadActiveEvents(); } catch(e) {} clickSound();
  showToast('🗑 Tüm skorlar silindi','#ff6b6b');
});

function applyBgImage(){
  try {
    if(state.bgImage){
      /* Fotoğraf yüklendi — kütüphane seçimini iptal et */
      state.bgLibId = null;
      state.bgLibGradient = null;

      document.body.style.backgroundImage    = 'url(' + state.bgImage + ')';
      document.body.style.backgroundSize     = 'cover';
      document.body.style.backgroundPosition = 'center center';
      document.body.style.backgroundRepeat   = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';

      /* card-bg CSS class üzerinden yönetiliyor */
      document.body.classList.add('has-bg-image');

      /* bgLayer overlay */
      if(bgLayer) bgLayer.style.background = 'rgba(4,6,14,0.55)';

      try { analyzeImageAndAdapt(state.bgImage); } catch(e){}

    } else if(state.bgLibPhotoUrl){
      /* Gerçek fotoğraf URL'si */
      try { applyBgLibPhoto(state.bgLibPhotoUrl, state.bgLibFallback); } catch(e){}
    } else if(state.bgLibGradient){
      /* Kütüphane gradient seçimi */
      try { applyBgLibGradient(state.bgLibGradient); } catch(e){}

    } else {
      /* İkisi de yok — temiz arka plan */
      document.body.style.backgroundImage    = '';
      document.body.style.backgroundSize     = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat   = '';
      document.body.style.backgroundAttachment = '';
      /* card-bg CSS class üzerinden yönetiliyor */
      document.body.classList.remove('has-bg-image');
      if(bgLayer) bgLayer.style.background = '';
    }
  } catch(e){ console.warn('applyBgImage hata:', e); }
}

/**
 * Canvas ile fotoğrafı analiz eder, baskın renk açık mı koyu mu diye bakar.
 * Açıksa card arka planını biraz daha koyu yapar, yazıları korur.
 */
function analyzeImageAndAdapt(dataUrl){
  try {
    const img = new Image();
    img.onload = () => {
      try {
        const SIZE = 32; // küçük örnekleme
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

        let totalLum = 0, count = 0;
        for(let i = 0; i < data.length; i += 4){
          const r = data[i], g = data[i+1], b = data[i+2];
          // Relative luminance
          totalLum += 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255);
          count++;
        }
        const avgLum = totalLum / count;

        // Açık fotoğraf (lum > 0.5) → card daha koyu
        if(avgLum > 0.5){
          /* CSS class yönetiyor */
        } else {
          /* CSS class yönetiyor */
        }
      } catch(e){}
    };
    img.src = dataUrl;
  } catch(e){}
}

/* ── TOAST ─────────────────────────────────────────── */
const toastEl = document.getElementById('toast');
let toastTimer = null;
/* ── Dil Menüsü ── */
function toggleLangMenu() {
  var menu = document.getElementById('langMenu');
  if (!menu) return;
  if (menu.style.display !== 'none') { menu.style.display = 'none'; return; }
  /* Menüyü doldur */
  menu.innerHTML = Object.entries(LANG_NAMES).map(function(entry) {
    var code = entry[0];
    var name = entry[1];
    var isActive = code === _i18nLang;
    return '<div onclick="switchLang(\'' + code + '\');document.getElementById(\'langMenu\').style.display=\'none\'" ' +
      'style="padding:8px 12px;border-radius:8px;cursor:pointer;font-size:13px;' +
      (isActive ? 'background:var(--neon-dim);color:var(--neon);font-weight:700' : 'color:var(--text)') +
      ';white-space:nowrap">' + name + '</div>';
  }).join('');
  menu.style.display = 'block';
  /* Dışarı tıklanınca kapat */
  setTimeout(function() {
    document.addEventListener('click', function closeLang(e) {
      if (!document.getElementById('langMenu')?.contains(e.target) &&
          e.target.id !== 'langBtn') {
        document.getElementById('langMenu').style.display = 'none';
        document.removeEventListener('click', closeLang);
      }
    });
  }, 10);
}

