/* ══ MathGame · js/social/feedback-chest-challenge.js ══ (index.html'de sırayla yüklenir) */
/* ═══════════════════════════════════════════════════
   GERİ BİLDİRİM
   ═══════════════════════════════════════════════════ */
var _fbCtx=null;
(function(){
  var fb=document.getElementById('fbkBtn');
  if(!fb)return;
  fb.addEventListener('click',function(){
    if(!authUser){showToast('Geri bildirim için giriş yap','#f59e0b');return;}
    pauseQT();
    var q=_lastQ||{q:(questionText?questionText.innerText:'—'),ans:(typeof correctAnswer!=='undefined'?String(correctAnswer):'—'),ua:(answerInput?answerInput.value:'')};
    _fbCtx={mode:gameMode||'math',question:q.q,userAnswer:q.ua,correctAnswer:q.ans,score:state?(state.score||0):0,level:state?(state.level||1):1};
    var info=document.getElementById('fbInfoBox');
    if(info)info.innerHTML='<strong>Soru:</strong> '+escapeHtml(q.q)+'<br><strong>Cevabın:</strong> '+(q.ua||'—')+' | <strong>Doğru:</strong> '+q.ans;
    var ta=document.getElementById('fbText');if(ta)ta.value='';
    var fm=document.getElementById('fbModal');if(fm)fm.style.display='flex';
  });
})();
function closeFbModal(){var fm=document.getElementById('fbModal');if(fm)fm.style.display='none';resumeQT();}
async function submitFb(){
  var msg=(document.getElementById('fbText')?document.getElementById('fbText').value:'').trim();
  if(!msg||msg.length<3){showToast('Lütfen bir şeyler yaz','#f59e0b');return;}
  if(!authUser){showToast('Giriş gerekli','#ef4444');return;}
  try{
    var r=await workerPost('feedback',{token:authUser.token,message:msg,context:_fbCtx});
    if(r&&r.ok){showToast('✅ Geri bildirim gönderildi!','#00ff88');closeFbModal();}
    else showToast('Gönderilemedi','#ef4444');
  }catch(e){showToast('Bağlantı hatası','#ef4444');}
}

/* ═══════════════════════════════════════════════════
   SANDIK
   ═══════════════════════════════════════════════════ */
function openChestModal(){var m=document.getElementById('chestModal');if(m){m.style.display='flex';renderChest();}}
function closeChestModal(){var m=document.getElementById('chestModal');if(m)m.style.display='none';}
function renderChest(){
  var el=document.getElementById('chestContent');if(!el)return;
  var j=state.jokers||{skip:0,hint:0,freeze:0,double:0};
  var jd=[{k:'skip',i:'⏭️',n:'Pas Geç',c:'#38bdf8'},{k:'hint',i:'💡',n:'İpucu',c:'#fbbf24'},{k:'freeze',i:'❄️',n:'Dondur',c:'#a78bfa'},{k:'double',i:'✌️',n:'Çift Puan',c:'#00ff88'}];
  var h2='';
  h2+='<div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:14px;padding:14px;margin-bottom:14px">';
  h2+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">💰 Cüzdan</div>';
  h2+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h2+='<div style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px">💰</div><div style="font-size:20px;font-weight:800;color:#ffd700;font-family:var(--font-mono)">'+(state.coins||0).toLocaleString()+'</div><div style="font-size:11px;color:var(--muted)">Coin</div></div>';
  h2+='<div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px">💎</div><div style="font-size:20px;font-weight:800;color:#38bdf8;font-family:var(--font-mono)">'+(state.diamonds||0).toLocaleString()+'</div><div style="font-size:11px;color:var(--muted)">Elmas</div></div>';
  h2+='</div></div>';
  h2+='<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px">';
  h2+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">🃏 Jokerler</div>';
  h2+='<div style="display:flex;flex-direction:column;gap:8px">';
  jd.forEach(function(x){var cnt=j[x.k]||0;h2+='<div class="chest-item"><span style="font-size:26px">'+x.i+'</span><div style="flex:1"><div style="font-size:13px;font-weight:800;color:'+x.c+'">'+x.n+'</div></div><div style="min-width:40px;text-align:center;font-size:20px;font-weight:800;font-family:var(--font-mono);color:'+(cnt>0?x.c:'var(--muted2)')+'"> '+(cnt>0?'x'+cnt:'—')+'</div></div>';});
  h2+='</div></div>';
  var inv=state.inventory||[];
  h2+='<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px">';
  h2+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">📦 Envanter ('+inv.length+')</div>';
  if(inv.length>0){inv.forEach(function(it){h2+='<div class="chest-item" style="margin-bottom:8px"><span style="font-size:24px">'+(it.icon||'📦')+'</span><div style="flex:1"><div style="font-size:13px;font-weight:700">'+(it.name||it.id||'?')+'</div></div>'+(it.active?'<span style="font-size:11px;color:var(--neon);font-weight:800">AKTİF</span>':'')+'</div>';});}
  else{h2+='<div style="text-align:center;color:var(--muted);font-size:13px">Henüz bir şey yok.</div>';}
  h2+='</div>';
  var badges=(state.profile&&state.profile.badges)?state.profile.badges:[];
  if(badges.length>0){
    h2+='<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px">';
    h2+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:10px">🏅 Rozetler ('+badges.length+')</div>';
    h2+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    badges.forEach(function(b){h2+='<div style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:20px;background:rgba('+(b.rgbColor||'251,191,36')+',0.15);border:1px solid rgba('+(b.rgbColor||'251,191,36')+',0.3);color:#'+(b.textColor||'fbbf24')+';font-size:12px;font-weight:800">'+(b.icon||'🏅')+' '+(b.label||'Rozet')+'</div>';});
    h2+='</div></div>';
  }
  h2+='<div style="background:rgba(255,165,0,0.06);border:1px solid rgba(255,165,0,0.2);border-radius:14px;padding:14px"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted2);margin-bottom:8px">🔥 Giriş Serisi</div><div style="display:flex;align-items:center;gap:12px"><span style="font-size:36px">🔥</span><div><div style="font-size:22px;font-weight:800;color:#f97316;font-family:var(--font-mono)">'+(state.loginStreak||0)+' gün</div></div></div></div>';
  el.innerHTML=h2;
}
function updateChestQuick(){
  var el=document.getElementById('chestQuickInfo');if(!el)return;
  var j=state.jokers||{};
  var t=(j.skip||0)+(j.hint||0)+(j.freeze||0)+(j.double||0);
  el.textContent=t>0?t+' joker':'Jokerler ve eşyalarım';
}

/* ═══════════════════════════════════════════════════
   MEYDAN OKUMA
   ═══════════════════════════════════════════════════ */
var CD={cadet:{l:'Çırak 🌱',c:'#22c55e',mN:50,tpq:25,ops:['+','-'],mx:1},warrior:{l:'Savaşçı ⚔️',c:'#3b82f6',mN:500,tpq:18,ops:['+','-','*'],mx:2},legend:{l:'Efsane 🔥',c:'#f59e0b',mN:2000,tpq:12,ops:['+','-','*','/'],mx:3},god:{l:'Tanrı ⚡',c:'#ef4444',mN:9999,tpq:8,ops:['+','-','*','/'],mx:5}};
var _ch={d:null,n:0,ok:0,st:0,act:false,tIv:null,qIv:null,cur:null};
function openChallengeModal(){var m=document.getElementById('challengeModal');if(m){m.style.display='flex';chlTab('play');}}
function closeChallengeModal(){var m=document.getElementById('challengeModal');if(m)m.style.display='none';}
function chlTab(tab){
  var tp=document.getElementById('chlTP'),tl=document.getElementById('chlTL');
  if(!tp||!tl)return;
  if(tab==='play'){tp.className='btn';tp.style.cssText='flex:1;font-size:12px;padding:8px';tl.className='btn ghost';tl.style.cssText='flex:1;font-size:12px;padding:8px';chlRenderPlay();}
  else{tl.className='btn';tl.style.cssText='flex:1;font-size:12px;padding:8px';tp.className='btn ghost';tp.style.cssText='flex:1;font-size:12px;padding:8px';chlRenderLb();}
}
function chlRenderPlay(){
  var el=document.getElementById('chlContent');if(!el)return;
  var h2='<div style="display:flex;flex-direction:column;gap:8px">';
  Object.keys(CD).forEach(function(k){var d=CD[k];h2+='<button data-dk="'+k+'" class="chlDB" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;border:1px solid '+d.c+'30;background:var(--glass);cursor:pointer;width:100%;text-align:left;font-family:var(--font-body);color:var(--text)"><div style="flex:1"><div style="font-size:15px;font-weight:800;color:'+d.c+'">'+d.l+'</div><div style="font-size:11px;color:var(--muted);margin-top:2px">20 soru · '+d.tpq+'s/soru · '+d.mx+'x puan</div></div><span style="color:var(--muted);font-size:18px">›</span></button>';});
  h2+='</div>';
  el.innerHTML=h2;
  el.querySelectorAll('.chlDB').forEach(function(b){b.addEventListener('click',function(){startChl(b.dataset.dk);});});
}
function chlRenderLb(){
  var el=document.getElementById('chlContent');if(!el)return;
  var sel='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="chlSel">';
  Object.keys(CD).forEach(function(k){var d=CD[k];sel+='<button data-dk="'+k+'" style="font-size:11px;padding:5px 10px;border-radius:20px;border:1px solid '+d.c+'40;background:transparent;color:'+d.c+';cursor:pointer;font-family:var(--font-body)">'+d.l+'</button>';});
  sel+='</div><div id="chlLbIn"></div>';
  el.innerHTML=sel;
  el.querySelectorAll('#chlSel button').forEach(function(b){b.addEventListener('click',function(){loadChlLb(b.dataset.dk);});});
  loadChlLb('cadet');
}
async function loadChlLb(dk){
  var el=document.getElementById('chlLbIn');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:16px;color:var(--muted)">⏳</div>';
  try{
    var r=await workerPost('challenge/leaderboard',{diff:dk});
    if(!r||!r.board||!r.board.length){el.innerHTML='<div style="text-align:center;padding:16px;color:var(--muted)">Henüz kayıt yok</div>';return;}
    var d=CD[dk]||{};
    var h3='<div style="display:flex;flex-direction:column;gap:6px">';
    r.board.forEach(function(e,i){
      var mm=Math.floor(e.time/60000),ss=Math.floor((e.time%60000)/1000);
      var medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.';
      h3+='<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--glass);border:1px solid var(--border);border-radius:12px"><span style="font-size:14px;min-width:24px">'+medal+'</span><span style="flex:1;font-weight:700;font-size:13px">'+escapeHtml(e.name)+'</span><span style="font-size:12px;font-weight:800;color:'+(d.c||'var(--neon)')+'">'+e.score+'p</span><span style="font-size:11px;color:var(--muted);font-family:var(--font-mono)">'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')+'</span></div>';
    });
    el.innerHTML=h3+'</div>';
  }catch(e2){el.innerHTML='<div style="color:#ef4444;padding:12px">Hata: '+e2.message+'</div>';}
}
function cR(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function startChl(dk){
  if(!authUser){showToast('Giriş yap!','#ef4444');return;}
  var d=CD[dk];if(!d)return;
  closeChallengeModal();
  _ch.d=dk;_ch.n=0;_ch.ok=0;_ch.st=Date.now();_ch.act=true;
  var dl=document.getElementById('chlDL');if(dl){dl.textContent=d.l.toUpperCase();dl.style.color=d.c;}
  var cc=document.getElementById('chlCC');if(cc)cc.textContent='0';
  var rm=document.getElementById('chlRM');if(rm){rm.textContent='';rm.style.opacity='0';}
  var ga=document.getElementById('chlGA');if(ga)ga.style.display='block';
  document.body.style.overflow='hidden';
  if(_ch.tIv)clearInterval(_ch.tIv);
  _ch.tIv=setInterval(function(){
    if(!_ch.act){clearInterval(_ch.tIv);return;}
    var el=Date.now()-_ch.st,mm=Math.floor(el/60000),ss=Math.floor((el%60000)/1000);
    var te=document.getElementById('chlTT');if(te)te.textContent=String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
  },500);
  chlNextQ();
}
function chlNextQ(){
  var d=CD[_ch.d];if(!d)return;
  _ch.n++;if(_ch.n>20){chlFinish();return;}
  var qn=document.getElementById('chlQN');if(qn)qn.textContent=_ch.n;
  var rm=document.getElementById('chlRM');if(rm){rm.textContent='';rm.style.opacity='0';}
  var op=d.ops[Math.floor(Math.random()*d.ops.length)],a,b,ans;
  if(op==='+'){a=cR(1,d.mN);b=cR(1,d.mN);ans=a+b;}
  else if(op==='-'){a=cR(1,d.mN);b=cR(1,Math.max(1,a));ans=a-b;}
  else if(op==='*'){var sq=Math.max(2,Math.floor(Math.sqrt(d.mN)));a=cR(2,sq);b=cR(2,sq);ans=a*b;}
  else{b=cR(2,Math.max(2,Math.floor(d.mN/4)));a=b*cR(2,Math.max(2,Math.floor(d.mN/b)));ans=a/b;}
  _ch.cur=ans;
  var od={'+':'+','-':'−','*':'×','/':'÷'}[op]||op;
  var qt=document.getElementById('chlQT');if(qt)qt.textContent=a+' '+od+' '+b+' = ?';
  var choices=[ans];var tries=0;
  while(choices.length<4&&tries++<50){var fk=ans+cR(-Math.max(5,Math.floor(Math.abs(ans)*0.3)),Math.max(5,Math.floor(Math.abs(ans)*0.3)));if(fk!==ans&&!choices.includes(fk))choices.push(fk);}
  choices=choices.sort(function(){return Math.random()-0.5;});
  var ct=document.getElementById('chlChoices');if(!ct)return;
  ct.innerHTML='';
  choices.forEach(function(c){
    var bt=document.createElement('button');
    bt.style.cssText='padding:14px;border-radius:12px;border:1px solid var(--border2);background:var(--glass);color:var(--text);font-size:18px;font-weight:800;cursor:pointer;font-family:var(--font-body);width:100%;text-align:center;margin-bottom:4px';
    bt.textContent=c;bt.addEventListener('click',function(){chlAns(c,bt,ct);});
    ct.appendChild(bt);
  });
  if(_ch.qIv)clearInterval(_ch.qIv);
  var left=d.tpq;
  var br=document.getElementById('chlTB'),cn=document.getElementById('chlTC');
  if(br)br.style.width='100%';if(cn)cn.textContent=Math.ceil(left);
  _ch.qIv=setInterval(function(){
    left-=0.1;var pct=Math.max(0,(left/d.tpq)*100);
    if(br)br.style.width=pct+'%';if(cn)cn.textContent=Math.max(0,Math.ceil(left));
    if(left<=0){clearInterval(_ch.qIv);try{failSound();}catch(e){}var rm2=document.getElementById('chlRM');if(rm2){rm2.style.color='#ff6b6b';rm2.textContent='⏰ Süre doldu!';rm2.style.opacity='1';}setTimeout(chlNextQ,900);}
  },100);
}
function chlAns(chosen,btnEl,ct2){
  if(_ch.qIv)clearInterval(_ch.qIv);
  ct2.querySelectorAll('button').forEach(function(b){b.disabled=true;});
  var rm=document.getElementById('chlRM');
  if(chosen===_ch.cur){
    btnEl.style.background='rgba(0,255,136,0.12)';btnEl.style.borderColor='rgba(0,255,136,0.4)';btnEl.style.color='var(--neon)';
    _ch.ok++;var cc=document.getElementById('chlCC');if(cc)cc.textContent=_ch.ok;
    if(rm){rm.style.color='#00ff88';rm.textContent='✅ Doğru!';rm.style.opacity='1';}
    try{successSound();}catch(e){}setTimeout(chlNextQ,700);
  }else{
    btnEl.style.background='rgba(239,68,68,0.12)';btnEl.style.borderColor='rgba(239,68,68,0.3)';btnEl.style.color='#ef4444';
    ct2.querySelectorAll('button').forEach(function(b2){if(Number(b2.textContent)===_ch.cur){b2.style.background='rgba(0,255,136,0.12)';b2.style.borderColor='rgba(0,255,136,0.4)';b2.style.color='var(--neon)';}});
    if(rm){rm.style.color='#ff6b6b';rm.textContent='❌ Yanlış!';rm.style.opacity='1';}
    try{failSound();}catch(e){}setTimeout(chlNextQ,900);
  }
}
async function chlFinish(){
  _ch.act=false;if(_ch.tIv)clearInterval(_ch.tIv);if(_ch.qIv)clearInterval(_ch.qIv);
  var el=Date.now()-_ch.st,d=CD[_ch.d]||{mx:1};var score=_ch.ok*100*d.mx;
  var mm=Math.floor(el/60000),ss=Math.floor((el%60000)/1000);
  var ga=document.getElementById('chlGA');if(ga)ga.style.display='none';
  document.body.style.overflow='';
  showToast('⚔️ '+_ch.ok+'/20 · '+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')+' · '+score+'p','#00ff88');
  try{spawnConfetti(20);}catch(e){}
  if(authUser&&authUser.token){try{await workerPost('challenge/submit',{token:authUser.token,diff:_ch.d,score:score,correct:_ch.ok,time:el});}catch(e){}}
  openChallengeModal();chlTab('lb');setTimeout(function(){loadChlLb(_ch.d);},300);
}
function exitChallenge(){
  _ch.act=false;if(_ch.tIv)clearInterval(_ch.tIv);if(_ch.qIv)clearInterval(_ch.qIv);
  var ga=document.getElementById('chlGA');if(ga)ga.style.display='none';
  document.body.style.overflow='';
}
