/* ---------- Utilities ---------- */
const rng = {
  n(max){
    if(window.crypto && crypto.getRandomValues){
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % max;
    } else {
      return Math.floor(Math.random()*max);
    }
  },
  pick(arr){return arr[this.n(arr.length)]}
};

function saveState(k,v){try{localStorage.setItem(k, JSON.stringify(v))}catch(e){}}
function loadState(k,def){try{return JSON.parse(localStorage.getItem(k)) ?? def}catch(e){return def}}

let state = { balance: loadState('demo_balance', 1000), bet: loadState('demo_bet', 10) };
function formatMoney(v){ return Math.round(v*100)/100; }

/* ---------- UI glue ---------- */
const balanceEl = document.getElementById('balance');
const betInput = document.getElementById('betInput');
const currentBetText = document.getElementById('currentBetText');
const giveBonusBtn = document.getElementById('giveBonus');

function refreshUI(){ balanceEl.textContent = formatMoney(state.balance); betInput.value = state.bet; currentBetText.textContent = state.bet; }
refreshUI();

betInput.addEventListener('change', e=>{
  let v = Number(e.target.value)||1; if(v<1) v=1; state.bet = Math.round(v*100)/100; saveState('demo_bet', state.bet); refreshUI();
});

giveBonusBtn.addEventListener('click', ()=>{ state.balance += 100; saveState('demo_balance', state.balance); refreshUI(); });

/* ---------- Navigation ---------- */
const items = document.querySelectorAll('.game-item');
const panels = {blackjack:document.getElementById('blackjack'), baccarat:document.getElementById('baccarat'), slot:document.getElementById('slot'), wheel:document.getElementById('wheel')}
const titles = {
  blackjack:['Blackjack','Классическая игра 21'],
  baccarat:['Baccarat','Ставки: Player / Banker / Tie'],
  slot:['Slot 3×5','5 барабанов, 3 ряда, 20 линий'],
  wheel:['Колесо фортуны','Множители и удача']
};
let active='blackjack';
items.forEach(it=>{ it.addEventListener('click', ()=>{ setActive(it.dataset.game) }); });
function setActive(name){ active=name; document.getElementById('gameTitle').textContent=titles[name][0]; document.getElementById('gameSubtitle').textContent=titles[name][1]; Object.values(panels).forEach(p=>p.style.display='none'); panels[name].style.display='block'; }
setActive('blackjack');

/* ---------- Helpers for bets ---------- */
function canBet(){ return state.balance >= state.bet && state.bet>0; }
function takeBet(){ state.balance = Math.round((state.balance - state.bet)*100)/100; saveState('demo_balance', state.balance); refreshUI(); }
function pay(amount){ state.balance = Math.round((state.balance + amount)*100)/100; saveState('demo_balance', state.balance); refreshUI(); }

/* ---------------- BLACKJACK ---------------- */
const deckRanks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const suits = ['♠','♥','♦','♣'];
function newDeck(numDecks=6){
  const d = []; for(let s of suits) for(let r of deckRanks) d.push({r,s});
  let big=[]; for(let i=0;i<numDecks;i++) big = big.concat(d.map(x=>({...x})));
  for(let i=big.length-1;i>0;i--){ const j=rng.n(i+1); [big[i],big[j]]=[big[j],big[i]]; }
  return big;
}
function cardValueBJ(card){ if(card.r==='A') return 1; if(['J','Q','K'].includes(card.r)) return 10; return Number(card.r); }
function sumHand(cards){ let sum=0, aces=0; for(let c of cards){ sum += cardValueBJ(c); if(c.r==='A') aces++; } for(let i=0;i<aces;i++){ if(sum+10<=21) sum+=10; } return sum; }

let bjDeck = newDeck(4);
let bjPlayer = [], bjDealer = [], dealerHidden=true;
const bjLog = document.getElementById('bjLog');

function makeCardEl(c, small=false){ const div=document.createElement('div'); div.className='card'+(small?' small':'')+' fade-in'; div.innerHTML=`<div>${c.r}${c.s}</div><div class="suit">${c.s}</div>`; return div; }
function makeBackEl(small=false){ const div=document.createElement('div'); div.className='card back'+(small?' small':'')+' fade-in'; div.textContent='★'; return div; }

function renderBJ(){
  const ph = document.getElementById('playerHand');
  const dh = document.getElementById('dealerHand');
  ph.innerHTML=''; dh.innerHTML='';
  // Dealer: first open, second hidden until stand
  if(bjDealer.length){
    dh.appendChild(makeCardEl(bjDealer[0]));
    if(bjDealer[1]) dh.appendChild(dealerHidden ? makeBackEl() : makeCardEl(bjDealer[1]));
    for(let i=2;i<bjDealer.length;i++) dh.appendChild(makeCardEl(bjDealer[i]));
  }
  for(let c of bjPlayer){ ph.appendChild(makeCardEl(c)); }
  document.getElementById('playerSum').textContent = bjPlayer.length?sumHand(bjPlayer):'—';
  document.getElementById('dealerSum').textContent = bjDealer.length?(dealerHidden? (bjDealer[0]?cardValueBJ(bjDealer[0])===1?11:cardValueBJ(bjDealer[0]):'—') : sumHand(bjDealer)):'—';
}
function appendBJLog(txt,cls=''){ bjLog.insertAdjacentHTML('afterbegin', `<div class="${cls}">${txt}</div>`); }

function reshuffleIfNeeded(){ if(bjDeck.length<15) bjDeck=newDeck(4); }

function bjStart(){
  if(!canBet()){ appendBJLog('Недостаточно средств для ставки','log-lose'); return; }
  takeBet(); reshuffleIfNeeded(); bjPlayer=[]; bjDealer=[]; dealerHidden=true; renderBJ();
  // deal with slight delays
  bjPlayer.push(bjDeck.pop()); renderBJ();
  setTimeout(()=>{ bjDealer.push(bjDeck.pop()); renderBJ();
    setTimeout(()=>{ bjPlayer.push(bjDeck.pop()); renderBJ();
      setTimeout(()=>{ bjDealer.push(bjDeck.pop()); renderBJ(); bjCheckBlackjack(); }, 200);
    }, 200);
  }, 200);
  appendBJLog('Разданы карты. Игрок ходит.');
}

function bjCheckBlackjack(){
  const p=sumHand(bjPlayer), d=sumHand(bjDealer);
  if(p===21 && d!==21){ appendBJLog('Blackjack! Выплата 1.5×','log-win'); pay(state.bet*2.5); }
  else if(p===21 && d===21){ appendBJLog('Ничья (оба Blackjack). Возврат ставки.'); pay(state.bet); }
}

function bjHit(){ if(!bjPlayer.length){ appendBJLog('Нажмите Deal прежде чем брать карты.'); return;} bjPlayer.push(bjDeck.pop()); renderBJ(); const s=sumHand(bjPlayer); appendBJLog('Игрок взял карту. Сумма: '+s); if(s>21){ appendBJLog('Перебор! Вы проиграли.','log-lose'); } }

function bjStand(){ if(!bjPlayer.length){ appendBJLog('Нажмите Deal прежде чем стоять.'); return;} dealerHidden=false; renderBJ();
  // dealer draws to 17
  (function dealerPlay(){ const ds=sumHand(bjDealer); if(ds<17){ setTimeout(()=>{ bjDealer.push(bjDeck.pop()); renderBJ(); dealerPlay(); }, 250); } else { bjFinish(); } })();
}

function bjFinish(){ const p=sumHand(bjPlayer), d=sumHand(bjDealer); renderBJ(); if(d>21 || p>d){ appendBJLog(`Вы выиграли! +${formatMoney(state.bet*2)} (выплата включая ставку).`,'log-win'); pay(state.bet*2); }
  else if(p===d){ appendBJLog('Ничья — ставка возвращена.'); pay(state.bet); }
  else { appendBJLog('Дилер выиграл — ставка потеряна.','log-lose'); }
}

document.getElementById('bjDeal').addEventListener('click', bjStart);
document.getElementById('bjHit').addEventListener('click', bjHit);
document.getElementById('bjStand').addEventListener('click', bjStand);

/* ---------------- BACCARAT ---------------- */
let bDeck = newDeck(6);
function valueB(card){ if(card.r==='A') return 1; if(['J','Q','K','10'].includes(card.r)) return 0; return Number(card.r); }
function sumB(cards){ return cards.reduce((s,c)=>s+valueB(c),0)%10; }

const b_p_cards = document.getElementById('b_p_cards');
const b_b_cards = document.getElementById('b_b_cards');
const b_p_sum = document.getElementById('b_p_sum');
const b_b_sum = document.getElementById('b_b_sum');
const bStatus = document.getElementById('bStatus');

let bBetType = null; // 'player'|'bank'|'tie'
let curB = {player:[], banker:[]};

function renderB(){
  b_p_cards.innerHTML=''; b_b_cards.innerHTML='';
  for(let c of curB.player) { const el=makeCardEl(c,true); b_p_cards.appendChild(el); }
  for(let c of curB.banker) { const el=makeCardEl(c,true); b_b_cards.appendChild(el); }
  b_p_sum.textContent = curB.player.length?sumB(curB.player):'—';
  b_b_sum.textContent = curB.banker.length?sumB(curB.banker):'—';
}
document.getElementById('bBetPlayer').addEventListener('click', ()=>{
  bBetType='player'; bStatus.textContent='Ставка на Player';
});
document.getElementById('bBetBank').addEventListener('click', ()=>{
  bBetType='bank'; bStatus.textContent='Ставка на Banker (-5% комиссии)';
});
document.getElementById('bBetTie').addEventListener('click', ()=>{
  bBetType='tie'; bStatus.textContent='Ставка на Tie (x8)';
});

/* ---------- Deal ---------- */
document.getElementById('bDeal').addEventListener('click', ()=>{
  if(!canBet()){ bStatus.textContent='Недостаточно средств!'; return; }
  if(!bBetType){ bStatus.textContent='Сначала выбери ставку!'; return; }

  takeBet();
  if(bDeck.length<10) bDeck=newDeck(6);

  curB={player:[bDeck.pop(), bDeck.pop()], banker:[bDeck.pop(), bDeck.pop()]};
  renderB();

  setTimeout(bRules, 400);
});

function bRules(){
  let p = sumB(curB.player), d = sumB(curB.banker);

  // Natural 8/9
  if(p>=8 || d>=8){ return bFinish(); }

  // Player rule
  if(p<=5){ curB.player.push(bDeck.pop()); renderB(); }

  // Banker rule
  d = sumB(curB.banker); p = sumB(curB.player);
  if(curB.player.length===3){
    const third = valueB(curB.player[2]);
    if(d<=2) curB.banker.push(bDeck.pop());
    else if(d===3 && third!==8) curB.banker.push(bDeck.pop());
    else if(d===4 && [2,3,4,5,6,7].includes(third)) curB.banker.push(bDeck.pop());
    else if(d===5 && [4,5,6,7].includes(third)) curB.banker.push(bDeck.pop());
    else if(d===6 && [6,7].includes(third)) curB.banker.push(bDeck.pop());
  } else {
    if(d<=5) curB.banker.push(bDeck.pop());
  }

  renderB();
  setTimeout(bFinish, 400);
}

function bFinish(){
  renderB();
  const p = sumB(curB.player), d = sumB(curB.banker);
  bStatus.textContent = `Результат: Player ${p} — Banker ${d}`;

  if(bBetType==='player'){
    if(p>d){ pay(state.bet*2); bStatus.textContent+=' — Выиграл Player!'; }
    else if(p===d){ pay(state.bet); bStatus.textContent+=' — Ничья (возврат).'; }
    else { bStatus.textContent+=' — Проигрыш.'; }
  }
  else if(bBetType==='bank'){
    if(d>p){ pay(state.bet*1.95); bStatus.textContent+=' — Выиграл Banker (комиссия 5%).'; }
    else if(d===p){ pay(state.bet); bStatus.textContent+=' — Ничья (возврат).'; }
    else { bStatus.textContent+=' — Проигрыш.'; }
  }
  else if(bBetType==='tie'){
    if(p===d){ pay(state.bet*8); bStatus.textContent+=' — Победа на Tie (x8)!'; }
    else { bStatus.textContent+=' — Проигрыш.'; }
  }
}

function baccaratDeal(){
  if(!bBetType){ bStatus.textContent='Выберите ставку прежде чем Deal.'; return; }
  if(!canBet()){ bStatus.textContent='Недостаточно средств для ставки'; return; }
  takeBet(); if(bDeck.length<10) bDeck=newDeck(6);
  curB={player:[], banker:[]}; renderB();
  // initial two cards each with small delays
  curB.player.push(bDeck.pop()); renderB();
  setTimeout(()=>{ curB.banker.push(bDeck.pop()); renderB();
    setTimeout(()=>{ curB.player.push(bDeck.pop()); renderB();
      setTimeout(()=>{ curB.banker.push(bDeck.pop()); renderB();
        setTimeout(processBaccarat, 250);
      }, 200);
    }, 200);
  }, 200);
}

function processBaccarat(){
  let p=sumB(curB.player), d=sumB(curB.banker);
  if(p>=8 || d>=8){ bFinish(); return; }
  // Player rule: 0-5 draw, 6-7 stand
  let playerThird=false, playerThirdCard=null;
  if(p<=5){ playerThird=true; playerThirdCard=bDeck.pop(); curB.player.push(playerThirdCard); renderB(); }
  // Banker rules
  d=sumB(curB.banker); p=sumB(curB.player);
  if(!playerThird){ if(d<=5){ curB.banker.push(bDeck.pop()); renderB(); } bFinish(); return; }
  const pt=valueB(playerThirdCard);
  if(d<=2){ curB.banker.push(bDeck.pop()); }
  else if(d===3 && pt!==8){ curB.banker.push(bDeck.pop()); }
  else if(d===4 && pt>=2 && pt<=7){ curB.banker.push(bDeck.pop()); }
  else if(d===5 && pt>=4 && pt<=7){ curB.banker.push(bDeck.pop()); }
  else if(d===6 && (pt===6 || pt===7)){ curB.banker.push(bDeck.pop()); }
  renderB(); bFinish();
}

document.getElementById('bBetPlayer').addEventListener('click', ()=>{ bBetType='player'; bStatus.textContent='Ставка: PLAYER'; });
document.getElementById('bBetBank').addEventListener('click', ()=>{ bBetType='bank'; bStatus.textContent='Ставка: BANKER (комиссия 5%)'; });
document.getElementById('bBetTie').addEventListener('click', ()=>{ bBetType='tie'; bStatus.textContent='Ставка: TIE'; });
document.getElementById('bDeal').addEventListener('click', baccaratDeal);

/* ---------------- SLOT 3x5 ---------------- */
const slotGrid = document.getElementById('slotGrid');
const slotLog = document.getElementById('slotLog');
const slotSymbols = ['🍒','🔔','⭐','💎','🍋','🍊'];
const slotPaytable = {
  '🍒': {3:5, 4:10, 5:25},
  '🔔': {3:8, 4:20, 5:50},
  '⭐': {3:12,4:30,5:80},
  '💎': {3:20,4:60,5:150},
  '🍋': {3:4,4:8,5:20},
  '🍊': {3:3,4:6,5:15}
};
const slotRows=3, slotCols=5;
const slotLines = [
  [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,0,1,0],[2,1,2,1,2],[0,0,1,0,0],[2,2,1,2,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,1,1,0],[2,1,1,1,2],[0,1,2,1,0],[2,1,0,1,2],[1,1,0,1,1],[1,1,2,1,1],[0,2,0,2,0],[2,0,2,0,2],[0,2,2,2,0],[2,0,0,0,2],[1,0,2,0,1]
];

function initSlotGrid(){ slotGrid.innerHTML=''; for(let r=0;r<slotRows;r++) for(let c=0;c<slotCols;c++){ const cell=document.createElement('div'); cell.className='slot-cell'; cell.dataset.r=r; cell.dataset.c=c; cell.textContent = slotSymbols[(r*slotCols+c)%slotSymbols.length]; slotGrid.appendChild(cell);} }
initSlotGrid();

function appendSlotLog(txt,cls=''){ slotLog.insertAdjacentHTML('afterbegin', `<div class="${cls}">${txt}</div>`); }

function setCellWin(r,c,on){ const el = slotGrid.querySelector(`.slot-cell[data-r='${r}'][data-c='${c}']`); if(!el) return; if(on) el.classList.add('win'); else el.classList.remove('win'); }

function spinSlot(){
  if(!canBet()){ appendSlotLog('Недостаточно средств для ставки','log-lose'); return; }
  takeBet();
  // clear highlights
  slotGrid.querySelectorAll('.slot-cell').forEach(el=>el.classList.remove('win'));
  // create reels
  const reels=[]; for(let c=0;c<slotCols;c++){ const reel=[]; for(let i=0;i<50;i++) reel.push(slotSymbols[rng.n(slotSymbols.length)]); const stop=rng.n(reel.length-slotRows); reels.push(reel.slice(stop, stop+slotRows)); }
  // animate update
  for(let r=0;r<slotRows;r++){
    for(let c=0;c<slotCols;c++){
      const cell = slotGrid.querySelector(`.slot-cell[data-r='${r}'][data-c='${c}']`);
      cell.style.opacity=0.2;
      ((cell, s, delay)=>setTimeout(()=>{ cell.textContent=s; cell.style.transition='opacity .3s'; cell.style.opacity=1; }, delay))(cell, reels[c][r], 120*c + 80*r);
    }
  }
  // scoring
  setTimeout(()=>{
    let totalWin=0; const winningCells=[];
    for(let i=0;i<slotLines.length;i++){
      const line = slotLines[i]; const symLine=[]; for(let c=0;c<slotCols;c++) symLine.push(reels[c][line[c]]);
      let sym=symLine[0], count=1; for(let k=1;k<symLine.length;k++){ if(symLine[k]===sym) count++; else break; }
      if(count>=3){ const pay=(slotPaytable[sym] && slotPaytable[sym][count])?slotPaytable[sym][count]:0; if(pay>0){ totalWin += pay * state.bet / 10; for(let c=0;c<count;c++) winningCells.push([line[c], c]); } }
    }
    totalWin = Math.round(totalWin*100)/100;
    // highlight
    winningCells.forEach(([row,col])=> setCellWin(row,col,true));
    if(totalWin>0){ pay(totalWin); appendSlotLog(`Вы выиграли ${totalWin}$ на спине (ставка ${state.bet}$).`,'log-win'); } else { appendSlotLog(`Нет выигрышных линий. Потеря ${state.bet}$.`,'log-lose'); }
    // remove highlight after a while
    setTimeout(()=> winningCells.forEach(([r,c])=> setCellWin(r,c,false)), 1200);
  }, 900);
}

document.getElementById('spinBtn').addEventListener('click', spinSlot);
document.getElementById('maxBet').addEventListener('click', ()=>{ state.bet = Math.min(100, Math.max(1, Math.floor(state.balance/5) || 1)); saveState('demo_bet', state.bet); refreshUI(); });

/* ---------------- WHEEL ---------------- */
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

/* ---------- Init ---------- */
refreshUI();
setInterval(()=>{ // trim logs
  ['bjLog','slotLog','wheelLog'].forEach(id=>{ const el=document.getElementById(id); if(el && el.children.length>100) el.removeChild(el.lastChild); });
}, 5000);