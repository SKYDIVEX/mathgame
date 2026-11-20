/* ══ MathGame · js/ui/event-bindings.js ══ (index.html'de sırayla yüklenir) */
(function(){
  /* Event listeners */
  var scb=document.getElementById('startChallengeBtn');
  if(scb)scb.addEventListener('click',function(){openChallengeModal();});
  var cmb=document.getElementById('chestMenuBtn');
  if(cmb)cmb.addEventListener('click',function(){openChestModal();});
  /* Enter ile sohbet gönder */
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&document.activeElement&&document.activeElement.id==='ccInp')sendCC();
  });
  /* Admin panel klan sıfırlama butonu */
  var acp=document.getElementById('adminTab-clans');
  if(acp){
    var rb=document.createElement('button');
    rb.className='admin-btn admin-btn-red';
    rb.style.cssText='width:100%;margin-bottom:12px';
    rb.textContent='🔄 Kendi Klan Verimi Sıfırla';
    rb.onclick=adminForceResetMyClan;
    var fb2=acp.querySelector('button');
    if(fb2)acp.insertBefore(rb,fb2.nextSibling);
  }
  /* loadActiveEvents'e event bildirimi */
  var origLAE=typeof loadActiveEvents==='function'?loadActiveEvents:null;
  if(origLAE){
    loadActiveEvents=async function(){
      var prevMult=window._activeEventMultiplier||1;
      await origLAE.apply(this,arguments);
      var newMult=window._activeEventMultiplier||1;
      if(newMult>1&&prevMult<=1){
        try{showNotif('🎉','Event aktif!','×'+newMult+' puan çarpanı!','#ffd700');}catch(e){}
      }
    };
  }
})();
