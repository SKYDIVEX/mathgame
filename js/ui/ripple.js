/* ══ MathGame · js/ui/ripple.js ══ (index.html'de sırayla yüklenir) */
/* ── LIQUID RIPPLE ─────────────────────────────────── */
function addRipple(e, el){
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.4;
  const x = (e.clientX ?? rect.left + rect.width/2)  - rect.left - size/2;
  const y = (e.clientY ?? rect.top  + rect.height/2) - rect.top  - size/2;
  const ripple = document.createElement('span');
  ripple.className = 'liquid-ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', ()=> ripple.remove());
}

document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn, .choice-btn');
  if(btn && !btn.disabled) addRipple(e, btn);
});
