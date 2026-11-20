/* ══ MathGame · js/social/clan-chat-notif.js ══ (index.html'de sırayla yüklenir) */
/* ═══════════════════════════════════════════════════
   KLAN SOHBET
   ═══════════════════════════════════════════════════ */
var _ccRef=null,_ccLis=null,_ccClan=null;
function openClanChat(clanId){
  _ccClan=clanId;
  var m=document.getElementById('clanChatModal');
  if(m){m.style.display='flex';loadClanChat(clanId);}
}
function closeClanChat(){
  if(_ccRef&&_ccLis){try{_ccRef.off('child_added',_ccLis);}catch(e){}_ccLis=null;}_ccRef=null;
  var m=document.getElementById('clanChatModal');if(m)m.style.display='none';
}
function loadClanChat(clanId){
  var msgs=document.getElementById('ccMsgs');
  if(!fbDB){if(msgs)msgs.innerHTML='<div style="text-align:center;padding:20px;color:#ef4444">⚠️ Veritabanı bağlantısı yok</div>';return;}
  if(msgs)msgs.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted)">💬 Yükleniyor...</div>';
  if(_ccRef&&_ccLis){try{_ccRef.off('child_added',_ccLis);}catch(e){}_ccLis=null;}
  var ref=fbDB.ref('clan_chat/'+clanId).limitToLast(50);
  ref.once('value',function(snap){
    if(msgs)msgs.innerHTML='';
    var lastKey=null;
    if(snap.exists()){snap.forEach(function(c){if(!c.val().deleted)appendCC(c.val(),c.key);lastKey=c.key;});}
    var lRef=lastKey?fbDB.ref('clan_chat/'+clanId).orderByKey().startAfter(lastKey):fbDB.ref('clan_chat/'+clanId).limitToLast(1);
    _ccLis=lRef.on('child_added',function(c){if(!c.val().deleted)appendCC(c.val(),c.key);});
    _ccRef=lRef;
    var msgs2=document.getElementById('ccMsgs');if(msgs2)msgs2.scrollTop=msgs2.scrollHeight;
  });
}
function appendCC(msg,key){
  try{
    var msgs=document.getElementById('ccMsgs');if(!msgs||!msg)return;
    var isMe=!!(authUser&&msg.uid===authUser.uid);
    var d2=new Date(msg.ts||Date.now());
    var time=d2.getHours().toString().padStart(2,'0')+':'+d2.getMinutes().toString().padStart(2,'0');
    var txt=escapeHtml((msg.text||'').slice(0,500));if(!txt)return;
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+';margin-bottom:10px;padding:0 2px';
    var delBtn=isMe?'<button data-k="'+key+'" style="background:none;border:none;color:var(--muted2);font-size:11px;cursor:pointer;padding:2px 4px">🗑</button>':'<button data-k="'+key+'" data-n="'+escapeHtml(msg.name||'?')+'" style="background:none;border:none;color:var(--muted2);font-size:11px;cursor:pointer;padding:2px 4px">⚠️</button>';
    wrap.innerHTML=
      '<div style="font-size:10px;color:var(--muted);margin-bottom:3px;'+(isMe?'text-align:right':'text-align:left')+'">'+(isMe?'Sen':escapeHtml(msg.name||'?'))+' · '+time+'</div>'+
      '<div style="display:flex;align-items:flex-end;gap:4px;flex-direction:'+(isMe?'row-reverse':'row')+'">'+
        '<div style="max-width:72%;padding:9px 13px;border-radius:'+(isMe?'18px 18px 4px 18px':'18px 18px 18px 4px')+';background:'+(isMe?'linear-gradient(135deg,rgba(0,255,136,0.18),rgba(0,204,102,0.12))':'var(--glass2)')+';border:1px solid '+(isMe?'rgba(0,255,136,0.25)':'var(--border2)')+';font-size:13px;color:var(--text);word-break:break-word;line-height:1.5">'+txt+'</div>'+
        '<div>'+delBtn+'</div>'+
      '</div>';
    if(isMe){
      wrap.querySelector('button').addEventListener('click',function(){delCC(key);});
    }else{
      var rb=wrap.querySelector('button');
      rb.addEventListener('click',function(){repCC(key,msg.name||'?');});
    }
    msgs.appendChild(wrap);msgs.scrollTop=msgs.scrollHeight;
  }catch(e){console.warn('appendCC:',e);}
}
function delCC(key){
  if(!key||!_ccClan||!fbDB)return;
  if(!confirm('Mesajı sil?'))return;
  fbDB.ref('clan_chat/'+_ccClan+'/'+key).update({deleted:true,text:'[silindi]'});
}
function repCC(key,name){
  showToast('Şikayet klan liderine iletildi','#f59e0b');
  if(authUser)workerPost('feedback',{token:authUser.token,message:'Chat şikayet: '+name+' key:'+key,context:{mode:'clan_chat',question:key,userAnswer:name,correctAnswer:'',score:0,level:0}}).catch(function(){});
}
function sendCC(){
  var inp=document.getElementById('ccInp');
  var txt=inp?inp.value.trim():'';
  if(!txt||!authUser||!_ccClan||!fbDB)return;
  if(txt.length>300){showToast('Mesaj çok uzun','#f59e0b');return;}
  inp.value='';
  fbDB.ref('clan_chat/'+_ccClan).push({uid:authUser.uid,name:authUser.name,text:txt,ts:Date.now()});
}

/* ═══════════════════════════════════════════════════
   BİLDİRİM
   ═══════════════════════════════════════════════════ */
var _nQ=[],_nS=false;
function showNotif(icon,title,body,color){
  _nQ.push({icon:icon,title:title,body:body,color:color||'var(--neon)'});
  if(!_nS)procNotif();
}
function procNotif(){
  if(!_nQ.length){_nS=false;return;}_nS=true;
  var n=_nQ.shift(),el=document.getElementById('notifEl');
  if(!el){_nS=false;return;}
  el.innerHTML='<span style="font-size:22px">'+n.icon+'</span><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800;color:'+n.color+'">'+n.title+'</div><div style="font-size:11px;color:var(--muted);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+n.body+'</div></div><button onclick="dismissNotif()" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;flex-shrink:0">✕</button>';
  el.style.transform='translateX(-50%) translateY(0)';el.style.opacity='1';
  el._t=setTimeout(function(){dismissNotif();},5000);
}
function dismissNotif(){
  var el=document.getElementById('notifEl');
  if(!el)return;if(el._t)clearTimeout(el._t);
  el.style.transform='translateX(-50%) translateY(-80px)';el.style.opacity='0';
  setTimeout(function(){_nS=false;procNotif();},350);
}
function triggerLoginNotif(){
  if(typeof state==='undefined')return;
  var dk=getDailyKey?getDailyKey():'x';
  var k='mg_nf_'+dk;
  if(localStorage.getItem(k))return;
  localStorage.setItem(k,'1');
  setTimeout(function(){
    if(state.loginStreak>0)showNotif('🔥','Günlük giriş bonusu!',(state.loginStreak||1)+' gün serisi — devam et!','#f97316');
  },2000);
}

/* ═══════════════════════════════════════════════════
   ADMIN: Klan sıfırlama
   ═══════════════════════════════════════════════════ */
async function adminForceResetMyClan(){
  if(!authUser){adminLog('Giriş yapılmamış');return;}
  if(!confirm('Kendi klan verini tamamen sıfırlamak istediğine emin misin?'))return;
  try{
    var r=await workerPost('clan/force-reset',{token:authUser.token});
    if(!r||!r.ok){adminLog('❌ '+((r&&r.error)||'Hata'));return;}
    state.clanId=null;saveState();
    adminLog('✅ Sıfırlandı: '+(r.log||[]).join(' | '));
    showToast('✅ Klan verisi temizlendi','#00ff88');
  }catch(e){adminLog('❌ '+e.message);}
}
