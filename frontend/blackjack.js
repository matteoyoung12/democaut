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
const deckRanks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const suits = ['♠','♥','♦','♣'];

function newDeck(numDecks=6){
  const d = [];
  for(let s of suits) for(let r of deckRanks) d.push({r,s});
  let big=[];
  for(let i=0;i<numDecks;i++) big = big.concat(d.map(x=>({...x})));
  for(let i=big.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [big[i],big[j]]=[big[j],big[i]];
  }
  return big;
}
function cardValueBJ(card){
  if(card.r==='A') return 1;
  if(['J','Q','K'].includes(card.r)) return 10;
  return Number(card.r);
}
function sumHand(cards){
  let sum=0, aces=0;
  for(let c of cards){ sum += cardValueBJ(c); if(c.r==='A') aces++; }
  for(let i=0;i<aces;i++){ if(sum+10<=21) sum+=10; }
  return sum;
}

let bjDeck = newDeck(4);
let bjPlayer = [], bjDealer = [], dealerHidden=true;
const bjLog = document.getElementById('bjLog');

function makeCardEl(c, small=false){
  const div=document.createElement('div');
  div.className='card'+(small?' small':'')+' fade-in';
  div.innerHTML=`<div>${c.r}${c.s}</div><div class="suit">${c.s}</div>`;
  return div;
}
function makeBackEl(small=false){
  const div=document.createElement('div');
  div.className='card back'+(small?' small':'')+' fade-in';
  div.textContent='★';
  return div;
}

function renderBJ(){
  const ph = document.getElementById('playerHand');
  const dh = document.getElementById('dealerHand');
  ph.innerHTML=''; dh.innerHTML='';
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

function enableBJControls(active){
  document.getElementById('bjHit').disabled = !active;
  document.getElementById('bjStand').disabled = !active;
}

function bjStart(){
  if(!canBet()){ appendBJLog('Недостаточно средств для ставки','log-lose'); return; }
  takeBet(); // списываем ставку

  reshuffleIfNeeded(); bjPlayer=[]; bjDealer=[]; dealerHidden=true; renderBJ();
  enableBJControls(true);

  // deal
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
  if(p===21 && d!==21){ 
    appendBJLog('Blackjack! Выплата 1.5×','log-win'); 
    pay(state.bet*2.5); 
    enableBJControls(false); 
  }
  else if(p===21 && d===21){ 
    appendBJLog('Ничья (оба Blackjack). Возврат ставки.'); 
    pay(state.bet); 
    enableBJControls(false); 
  }
}

function bjHit(){
  if(!bjPlayer.length){ appendBJLog('Нажмите Deal прежде чем брать карты.'); return;}
  bjPlayer.push(bjDeck.pop());
  renderBJ();
  const s=sumHand(bjPlayer);
  appendBJLog('Игрок взял карту. Сумма: '+s);
  if(s>21){
    appendBJLog('Перебор! Вы проиграли.','log-lose');
    dealerHidden = false;
    renderBJ();
    enableBJControls(false);
    // ставка проиграна, поэтому ничего не возвращаем
  }
}

function bjStand(){
  if(!bjPlayer.length){ appendBJLog('Нажмите Deal прежде чем стоять.'); return;}
  dealerHidden=false; renderBJ();
  (function dealerPlay(){
    const ds=sumHand(bjDealer);
    if(ds<17){ setTimeout(()=>{ bjDealer.push(bjDeck.pop()); renderBJ(); dealerPlay(); }, 250); }
    else { bjFinish(); }
  })();
}

function bjFinish(){
  const p=sumHand(bjPlayer), d=sumHand(bjDealer);
  renderBJ();
  if(p>21){ 
    appendBJLog('Перебор! Вы проиграли.','log-lose'); 
    enableBJControls(false); 
    return; 
  }
  if(d>21 || p>d){ 
    appendBJLog(`Вы выиграли! +${state.bet*2}`,'log-win'); 
    pay(state.bet*2); 
  }
  else if(p===d){ 
    appendBJLog('Ничья — ставка возвращена.'); 
    pay(state.bet); 
  }
  else { 
    appendBJLog('Дилер выиграл — ставка потеряна.','log-lose'); 
  }
  enableBJControls(false);
}

document.getElementById('bjDeal').addEventListener('click', bjStart);
document.getElementById('bjHit').addEventListener('click', bjHit);
document.getElementById('bjStand').addEventListener('click', bjStand);

