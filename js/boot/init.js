/* ══ MathGame · js/boot/init.js ══ (index.html'de sırayla yüklenir) — INIT bloğu — tüm modüllerden SONRA çalışır */
/* ── INIT ──────────────────────────────────────────── */
/* Önce auth durumunu yükle, sonra uid'e göre state yükle */
/* NOT (dosyalara bölerken tespit edildi): Orijinal tek dosyada bu noktada loadAuth()
   çağrıldığında AUTH_KEY henüz tanımlı olmadığı için hata fırlatıp authUser=null bırakıyordu
   (oturumu aslında onAuthStateChanged geri getiriyor). Davranış aynen korunsun diye
   burada çağrılmıyor; authUser bu noktada null. İstersen loadAuth() geri açılabilir. */
if (authUser && authUser.uid) {
  loadState(authUser.uid);
} else {
  loadState();
}
document.documentElement.style.setProperty('--accent', state.btnColor||'#00ff66');
document.documentElement.style.setProperty('--neon',   state.btnColor||'#00ff66');
document.documentElement.style.setProperty('--bg-mid', state.bgColor||'#0b1220');
applyBgImage();

/* i18n — dil algıla ve uygula (async, arka planda) */
setTimeout(function() { try { initI18n(); } catch(e) {} }, 100);

/* Eski confetti kalıntılarını temizle */
try { document.querySelectorAll('.confetti-piece,.particle').forEach(function(el){ el.remove(); }); } catch(e) {}

/* Cüzdan güncelle */
try { updateWallet(); } catch(e) {}

if (quickSoundToggle) quickSoundToggle.checked = !!state.soundOn;
if (btnColorInput) btnColorInput.value = state.btnColor||'#00ff66';
if (bgColorInput) bgColorInput.value  = state.bgColor||'#0b1220';
if (settingBtnColor) settingBtnColor.value = state.btnColor||'#00ff66';
if (settingBgColor) settingBgColor.value  = state.bgColor||'#0b1220';
if (settingSound) settingSound.checked  = !!state.soundOn;

// Show correct initial screen
if (authUser && authUser.uid) {
  /* Auth var — loginBtnHeader gizle, profil göster */
  var _lbh = document.getElementById('loginBtnHeader');
  if (_lbh) _lbh.style.display = 'none';
  state.player = authUser.name;
  updateAllScoreDisplays();
  updateProfileBtn();
  updateWallet();
  showScreen('menu');
  refreshMenuPanels();
  updateMiniInfo();
  /* onAuthStateChanged'ı beklemeden hızlı cloud sync yap */
  setTimeout(async function() {
    if (!authUser || !authUser.token) return;
    try { await syncOnlineScore(); } catch(e) {}
    try { await loadProfileFromCloud(); } catch(e) {}
    updateAllScoreDisplays();
    updateWallet();
  }, 100);
} else if (state.player) {
  showScreen('menu');
  updateAllScoreDisplays();
  updateMiniInfo();
}
/* Auth yoksa window.load halleder */
renderLeaderboard();
