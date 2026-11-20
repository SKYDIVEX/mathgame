/* ══ MathGame · js/features/task-counter-patches.js ══ (index.html'de sırayla yüklenir) */
/* ═══════════════════════════════════════════════════
   GÖREV SAYACI FİX: score tipi görevlerde delta kullan
   ═══════════════════════════════════════════════════ */
(function(){
  var origGDK=getDailyProgress;
  getDailyProgress=function(task){
    try{
      if(!state||!state.stats)return 0;
      if(task.type==='score'||task.key==='score'){
        var cur=state.score||0;
        var base=typeof task.baseScore==='number'?task.baseScore:0;
        return Math.max(0,cur-base);
      }
      return origGDK(task);
    }catch(e){return 0;}
  };
  /* getTodaysTasks'ı patch et: score görevlerine baseScore ekle */
  var origGTT=getTodaysTasks;
  getTodaysTasks=function(){
    var tasks=origGTT();
    if(!tasks||!tasks.length)return tasks;
    /* Yeni oluşturulan görevlerde (progress=0, baseScore undefined) baseScore ata */
    var curScore=(typeof state!=='undefined'?state.score:0)||0;
    var changed=false;
    tasks.forEach(function(t){
      if((t.type==='score'||t.key==='score')&&typeof t.baseScore==='undefined'&&!t.completed){
        t.baseScore=curScore;changed=true;
      }
    });
    if(changed){try{saveTodaysTasks(tasks);}catch(e){}}
    return tasks;
  };
})();

/* refreshMenuPanels patch */
var _origRM=typeof refreshMenuPanels==='function'?refreshMenuPanels:null;
if(_origRM){refreshMenuPanels=function(){_origRM.apply(this,arguments);try{updateChestQuick();}catch(e){};};}

/* showScreen patch — bildirim tetikle */
var _origSS=showScreen;
showScreen=function(name){
  _origSS.apply(this,arguments);
  if(name==='menu'){try{triggerLoginNotif();}catch(e){}}
};

/* Clan chat butonunu klan render'ına bağla */
var _origRCI=typeof renderClanInfo==='function'?renderClanInfo:null;
if(_origRCI){
  renderClanInfo=function(el,clan){
    _origRCI.call(this,el,clan);
    var btn=document.getElementById('clanChatBtn');
    if(btn&&clan&&clan.id){btn.onclick=function(){openClanChat(clan.id);};}
  };
}

/* EN_STRINGS: eksik çeviriler */
if(typeof EN_STRINGS!=='undefined'){
  var _ex={
    'challenge_mode':'Challenge','challenge_sub':'Race against the clock',
    'my_inventory':'My Inventory','claim':'Claim','completed':'Completed',
    'daily_reset':'Resets at midnight','quest_title':'Quests',
    'leave_clan':'Leave Clan','clan_score':'Clan Score','members':'Members',
    'clan_chat':'Clan Chat','send_msg':'Send','type_msg':'Type a message...',
    'my_score':'My Score','game_paused':'Game Paused',
    'level_label':'Level','score_label':'Score','multiplier':'Multiplier',
    'daily_login_notif':'Daily login bonus!','event_active':'Event Active',
    'time_up':'Time is up!','correct_answer':'Correct!','wrong_answer':'Wrong!',
  };
  Object.keys(_ex).forEach(function(k){if(!EN_STRINGS[k])EN_STRINGS[k]=_ex[k];});
}


window._mathgame={ state, nextQuestion, checkAnswer };
