const wheelCanvas = document.getElementById('wheelCanvas');
const wheelLog = document.getElementById('wheelLog');
const wheelCtx = wheelCanvas.getContext('2d');
const wheelSegments = 12;
const wheelMultipliers = [0,0.5,1,1,1,2,2,3,3,5,1,0];
document.getElementById('wheelSegments').textContent = wheelSegments;

function drawWheel(angle=0){
  const ctx = wheelCtx; const w=wheelCanvas.width; const h=wheelCanvas.height; const cx=w/2; const cy=h/2; const r = Math.min(w,h)/2 - 10;
  ctx.clearRect(0,0,w,h); ctx.save(); ctx.translate(cx,cy);
  for(let i=0;i<wheelSegments;i++){
    const start = (i/wheelSegments) * Math.PI*2 + angle; const end = ((i+1)/wheelSegments) * Math.PI*2 + angle;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r,start,end); ctx.closePath();
    ctx.fillStyle = i%2===0? '#ffefc7' : '#ffd9a3'; ctx.fill(); ctx.strokeStyle='#a86a1a'; ctx.lineWidth=2; ctx.stroke();
    ctx.save(); const mid=(start+end)/2; ctx.rotate(mid); ctx.fillStyle='#2b2b2b'; ctx.font='bold 18px Arial'; ctx.textAlign='right'; ctx.fillText('x'+wheelMultipliers[i], r-12, 6); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0,0,42,0,Math.PI*2); ctx.fillStyle='#051022'; ctx.fill(); ctx.fillStyle='#ffd166'; ctx.font='bold 16px Arial'; ctx.textAlign='center'; ctx.fillText('SPIN',0,6);
  ctx.restore();
  // pointer
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(cx + r + 6, cy); ctx.lineTo(cx + r + 46, cy - 16); ctx.lineTo(cx + r + 46, cy + 16); ctx.closePath(); ctx.fill();
}

drawWheel(0);
function appendWheelLog(txt,cls=''){ wheelLog.insertAdjacentHTML('afterbegin', `<div class="${cls}">${txt}</div>`); }

function spinWheelOnce(){
  if(!canBet()){ appendWheelLog('Недостаточно средств для ставки','log-lose'); return; }
  takeBet();
  const idx = rng.n(wheelSegments);
  const spins = 4 + rng.n(3);
  const finalAngle = - (idx / wheelSegments) * Math.PI*2 + Math.PI/2;
  const start = performance.now();
  const duration = 3000 + rng.n(1000);
  const startAngle = Math.PI*2 * rng.n(1000) / 1000;
  function animate(t){
    const p = Math.min(1,(t-start)/duration);
    const ease = 1 - Math.pow(1-p,3);
    const current = startAngle + (spins * Math.PI*2 + finalAngle - startAngle) * ease;
    drawWheel(current);
    if(p<1) requestAnimationFrame(animate);
    else {
      const mul = wheelMultipliers[idx]; const win = Math.round((state.bet * mul) *100)/100;
      if(win>0) { pay(win); appendWheelLog(`Выпало x${mul}. Вы выиграли ${win}$.`,'log-win'); }
      else appendWheelLog(`Выпало x${mul}. Вы проиграли ставку.`,'log-lose');
    }
  }
  requestAnimationFrame(animate);
}

document.getElementById('spinWheel').addEventListener('click', spinWheelOnce);
document.getElementById('autoSpin').addEventListener('click', ()=>{ let i=0; function next(){ if(i>=5) return; spinWheelOnce(); i++; setTimeout(next, 1200);} next(); });
