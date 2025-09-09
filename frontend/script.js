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