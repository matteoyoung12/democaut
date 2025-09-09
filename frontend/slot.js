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
