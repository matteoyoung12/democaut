let minerCells = 25;
let mines = [];
let opened = 0;
let currentCoeff = 1;
let gameActive = false;
let minerBet = 0;

const board = document.getElementById("minerBoard");
const minesInput = document.getElementById("minerMinesInput");
const coefLabel = document.getElementById("minerCoef");
const statusLabel = document.getElementById("minerStatus");
const startBtn = document.getElementById("minerStartBtn");
const cashoutBtn = document.getElementById("minerCashoutBtn");

// баланс общий
const balanceBox = document.getElementById("balance");


startBtn.addEventListener("click", startMiner);
cashoutBtn.addEventListener("click", cashOut);

function startMiner() {
  let balance = parseFloat(balanceBox.textContent);
  minerBet = parseFloat(betInput.value) || 10;

  if (minerBet > balance) {
    statusLabel.textContent = "Недостаточно средств!";
    return;
  }

  // списываем ставку
  balance -= minerBet;
  balanceBox.textContent = balance.toFixed(2);

  const minesCount = Math.min(
    24,Math.max(1, parseInt(minesInput.value) || 1)
  );

  opened = 0;
  currentCoeff = 1;
  gameActive = true;
  mines = [];
  cashoutBtn.disabled = false;
  statusLabel.textContent = "Игра началась! Открывай клетки.";

  board.innerHTML = "";
  for (let i = 0; i < minerCells; i++) {
    const cell = document.createElement("div");
    cell.className = "miner-cell";
    cell.dataset.index = i;
    cell.addEventListener("click", () => clickCell(i, cell));
    board.appendChild(cell);
  }

  // ставим мины
  while (mines.length < minesCount) {
    let r = Math.floor(Math.random() * minerCells);
    if (!mines.includes(r)) mines.push(r);
  }

  coefLabel.textContent = "×1.00";
}

function clickCell(index, cell) {
  if (!gameActive || cell.classList.contains("open")) return;

  if (mines.includes(index)) {
    cell.classList.add("open", "mine");
    statusLabel.textContent = "💥 Мина! Раунд окончен.";
    gameOver(false);
    return;
  }

  cell.classList.add("open", "safe");
  opened++;
  updateCoeff();
}

function updateCoeff() {
  let safeLeft = minerCells - opened - mines.length;
  let totalLeft = minerCells - opened;

  if (safeLeft > 0) {
    let step = totalLeft / safeLeft;
    currentCoeff *= step;
    coefLabel.textContent = "×" + currentCoeff.toFixed(2);
    statusLabel.textContent = "Открыл клетку. Играй дальше или забери!";
  }
}

function cashOut() {
  if (!gameActive) return;
  let balance = parseFloat(balanceBox.textContent);

  let win = minerBet * currentCoeff;
  balance += win;
  balanceBox.textContent = balance.toFixed(2);

  statusLabel.textContent =
    "✅ Забрал " + win.toFixed(2) + " $ с коэфф. " + currentCoeff.toFixed(2);

  gameOver(true);
}

function gameOver(won) {
  gameActive = false;
  cashoutBtn.disabled = true;

  // показать все клетки
  const cells = board.querySelectorAll(".miner-cell");
  cells.forEach((cell, i) => {
    if (mines.includes(i)) {
      cell.classList.add("reveal", "mine");
    } else if (!cell.classList.contains("open")) {
      cell.classList.add("reveal", "safe");
    }
  });
}
