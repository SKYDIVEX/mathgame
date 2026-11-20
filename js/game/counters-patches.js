/* ══ MathGame · js/game/counters-patches.js ══ (index.html'de sırayla yüklenir) */
/* ═══════════════════════════════════════════════════
   SORU SAYACI
   ═══════════════════════════════════════════════════ */
var _qTIv=null,_qTLeft=0,_qTTotal=0,_qTPaused=false;
function startQT(sec){
  stopQT();
  if(!sec||sec<=0)return;
  _qTTotal=sec;_qTLeft=sec;_qTPaused=false;
  var w=document.getElementById('qTimerWrap'),
      b=document.getElementById('qTimerBar'),
      t=document.getElementById('qTimerTxt'),
      c=document.getElementById('qTimerCnt'),
      f=document.getElementById('fbkBtn');
  if(w)w.style.display='block';
  if(t)t.style.display='block';
  if(f)f.style.display='inline-flex';
  if(b)b.style.width='100%';
  if(c)c.textContent=Math.ceil(sec);
  _qTIv=setInterval(function(){
    if(_qTPaused)return;
    _qTLeft-=0.1;
    var pct=Math.max(0,(_qTLeft/_qTTotal)*100);
    if(b){b.style.width=pct+'%';b.style.background=pct<33?'linear-gradient(90deg,#ef4444,#f97316)':pct<66?'linear-gradient(90deg,#f59e0b,#eab308)':'linear-gradient(90deg,var(--neon),#00cc66)';}
    if(c)c.textContent=Math.max(0,Math.ceil(_qTLeft));
    if(_qTLeft<=0){
      stopQT();
      try{failSound();}catch(e){}
      if(typeof resultMsg!=='undefined'){resultMsg.style.color='#ff6b6b';resultMsg.innerText='⏰ Süre doldu!';resultMsg.style.opacity=1;}
      if(typeof state!=='undefined'){if(!state.stats)state.stats={};state.stats.totalAnswered=(state.stats.totalAnswered||0)+1;state.stats.totalWrong=(state.stats.totalWrong||0)+1;saveState();}
      if(gameMode==='math')setTimeout(function(){try{nextQuestion(false);}catch(e){}},1200);
      else if(gameMode==='absurd')setTimeout(function(){try{nextAbsurdQuestion();}catch(e){}},1200);
    }
  },100);
}
function stopQT(){
  if(_qTIv){clearInterval(_qTIv);_qTIv=null;}
  var w=document.getElementById('qTimerWrap'),t=document.getElementById('qTimerTxt');
  if(w)w.style.display='none';if(t)t.style.display='none';
}
function pauseQT(){_qTPaused=true;}
function resumeQT(){_qTPaused=false;}
/* Pause butonları */
(function(){
  var pb=document.getElementById('pauseBtn'),rb=document.getElementById('resumeBtn'),mb=document.getElementById('pauseMenuBtn');
  if(pb)pb.addEventListener('click',pauseQT);
  if(rb)rb.addEventListener('click',resumeQT);
  if(mb)mb.addEventListener('click',stopQT,true);
})();

/* ═══════════════════════════════════════════════════
   DURAKLATMA FİX + SAYAÇ — nextQuestion/nextAbsurd wrap
   ═══════════════════════════════════════════════════ */
var _pMQ=null,_pAQ=null,_lastQ=null;
(function(){
  var mb=document.getElementById('pauseMenuBtn');
  if(mb)mb.addEventListener('click',function(){
    if(gameMode==='math'&&typeof correctAnswer!=='undefined'&&questionText){
      _pMQ={q:questionText.innerText,ans:correctAnswer};
    }else if(gameMode==='absurd'&&currentAbsurd){_pAQ=currentAbsurd;}
  },true);
})();
var _origNQ=nextQuestion;
nextQuestion=function(reset){
  if(!reset&&_pMQ){
    var s=_pMQ;_pMQ=null;
    questionText.innerText=s.q;correctAnswer=s.ans;
    resultMsg.innerText='';resultMsg.style.opacity=0;
    answerInput.value='';try{answerInput.focus();}catch(e){}
    startQT(Math.min(40,15+Math.floor((state.level||1)*0.5)));
    return;
  }
  if(!reset&&questionText&&questionText.innerText&&questionText.innerText!=='—'&&typeof correctAnswer!=='undefined'){
    _lastQ={q:questionText.innerText,ans:String(correctAnswer),ua:answerInput?answerInput.value:''};
  }
  _pMQ=null;
  _origNQ.call(this,reset);
  if(gameMode==='math')startQT(Math.min(40,15+Math.floor((state.level||1)*0.5)));
};
var _origNA=window.nextAbsurdQuestion;
window.nextAbsurdQuestion=async function(){
  if(_pAQ){
    var sa=_pAQ;_pAQ=null;currentAbsurd=sa;
    questionText.innerText=sa.q;resultMsg.innerText='';resultMsg.style.opacity=0;
    var idx=[0,1,2,3];for(var ii=3;ii>0;ii--){var jj=randInt(0,ii);var tt=idx[ii];idx[ii]=idx[jj];idx[jj]=tt;}
    var cont=document.getElementById('absurdChoices');cont.innerHTML='';
    var gr=document.createElement('div');gr.className='absurd-grid';
    idx.forEach(function(oi){
      var bt=document.createElement('button');bt.className='choice-btn';bt.dataset.orig=oi;
      bt.textContent=String(sa.choices[oi]).replace(/^[A-Da-d][\)\.\s]+/,'').trim();
      bt.addEventListener('click',function(){handleAbsurdAnswer(bt,oi,gr);});
      gr.appendChild(bt);
    });
    cont.appendChild(gr);startQT(20);return;
  }
  _pAQ=null;
  await _origNA.apply(this,arguments);
  startQT(20);
};
/* checkAnswer'da son soruyu kaydet */
var _origCA=checkAnswer;
checkAnswer=function(){
  if(questionText&&questionText.innerText&&questionText.innerText!=='—'&&typeof correctAnswer!=='undefined'){
    _lastQ={q:questionText.innerText,ans:String(correctAnswer),ua:answerInput?answerInput.value:''};
  }
  return _origCA.apply(this,arguments);
};
