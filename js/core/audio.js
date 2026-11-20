/* ══ MathGame · js/core/audio.js ══ (index.html'de sırayla yüklenir) */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null, masterGain = null;
function initAudio(){
  if(audioCtx) return;
  try{
    audioCtx = new AudioCtx();
    masterGain = audioCtx.createGain(); masterGain.gain.value = 1; masterGain.connect(audioCtx.destination);
  }catch(e){ audioCtx=null; }
}
function playTone(type='sine', freq=880, dur=0.12, gain=0.5){
  if(!state.soundOn) return;
  initAudio(); if(!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type=type; o.frequency.value=freq; o.connect(g); g.connect(masterGain);
  const now=audioCtx.currentTime;
  g.gain.setValueAtTime(0.0001,now);
  g.gain.linearRampToValueAtTime(gain,now+0.003);
  g.gain.exponentialRampToValueAtTime(0.0001,now+dur);
  o.start(now); o.stop(now+dur+0.02);
}
function clickSound(){ playTone('sine',1100,0.08,0.35); }
function successSound(){ playTone('triangle',660,0.22,0.9); }
function failSound(){ playTone('sawtooth',160,0.36,0.6); }

/* Persist */
