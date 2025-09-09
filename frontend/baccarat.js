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

function saveState(k,v){
  try{
  localStorage.setItem(k, JSON.stringify(v))}
  catch(e){}
}
function loadState(k,def){
  try{
    return JSON.parse(localStorage.getItem(k)) ?? def
  }
    catch(e){return def}}

let state = { balance: loadState('demo_balance', 1000), bet: loadState('demo_bet', 10) };
function formatMoney(v){ return Math.round(v*100)/100; }

/* ---------- UI glue ---------- */
const balanceEl = document.getElementById('balance');
const betInput = document.getElementById('betInput');
const currentBetText = document.getElementById('currentBetText');
const giveBonusBtn = document.getElementById('giveBonus');

function refreshUI(){
   balanceEl.textContent = formatMoney(state.balance); 
   betInput.value = state.bet; 
   currentBetText.textContent = state.bet; }
refreshUI();

betInput.addEventListener('change', e=>{
  let v = Number(e.target.value)||1; if(v<1) v=1; state.bet = Math.round(v*100)/100; saveState('demo_bet', state.bet); refreshUI();
});

giveBonusBtn.addEventListener('click', ()=>{ state.balance += 100; saveState('demo_balance', state.balance); refreshUI(); });

/* ---------- Navigation ---------- */
const items = document.querySelectorAll('.game-item');
const panels = {
  blackjack: document.getElementById('blackjack'),
  baccarat: document.getElementById('baccarat'),
  slot: document.getElementById('slot'),
  wheel: document.getElementById('wheel'),
  plinko: document.getElementById('plinko'),
  miner : document.getElementById('miner')
};

const titles = {
  blackjack: ['Blackjack','Классическая игра 21'],
  baccarat: ['Baccarat','Ставки: Player / Banker / Tie'],
  slot: ['Slot 3×5','5 барабанов, 3 ряда, 20 линий'],
  wheel: ['Колесо фортуны','Множители и удача'],
  plinko: ['Plinko','Игра с мячиками и платформами'],
  miner: ['Miner','Не попади на мину']
};

let active = 'blackjack';
items.forEach(it=>{
  it.addEventListener('click', ()=>{
    setActive(it.dataset.game);
  });
});

function setActive(name){
  active = name;
  document.getElementById('gameTitle').textContent = titles[name][0];
  document.getElementById('gameSubtitle').textContent = titles[name][1];

  Object.values(panels).forEach(p => p.style.display = 'none');
  panels[name].style.display = 'block';
}

setActive('blackjack');


/* ---------- Helpers for bets ---------- */
function canBet(){ return state.balance >= state.bet && state.bet>0; }
function takeBet(){ state.balance = Math.round((state.balance - state.bet)*100)/100; saveState('demo_balance', state.balance); refreshUI(); }
function pay(amount){ state.balance = Math.round((state.balance + amount)*100)/100; saveState('demo_balance', state.balance); refreshUI(); }

/* ---------- Init ---------- */
refreshUI();
setInterval(()=>{ // trim logs
  ['bjLog','slotLog','wheelLog'].forEach(id=>{ const el=document.getElementById(id); if(el && el.children.length>100) el.removeChild(el.lastChild); });
}, 5000);
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
