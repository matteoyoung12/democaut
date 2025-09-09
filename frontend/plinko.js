const game = document.getElementById("game");
const lastWinEl = document.getElementById("lastWin"); // вывод последнего выигрыша
let slots = [];
let multipliers = [];
let currentMode = "green";

// Пины
function createPins(rows = 12) {
  const fieldWidth = 500;  // фикс как в CSS
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      const pin = document.createElement("div");
      pin.className = "pin";

      // центрирование
      const x = fieldWidth / 2 - row * 20 + col * 40;
      const y = 40 + row * 40;

      pin.style.left = x + "px";
      pin.style.top = y + "px";

      game.appendChild(pin);
    }
  }
}

// Слоты
function createSlots() {
  const baseMultipliers = {
    green: [18,3.2,1.6,1.2,1.1,1,0.5,1,1.1,1.2,1.6,3.2,18],
    yellow:[55,5.6,3.2,1.6,1,0.7,0.3,0.7,1,1.6,3.2,5.6,55],
    red:   [353,49,14,5.3,2,0.5,0.1,0.5,2,5.3,14,49,353]
  };

  multipliers = baseMultipliers[currentMode];
  slots.forEach(s => s.remove());
  slots = [];

  const width = 500 / multipliers.length;

  multipliers.forEach((m, i) => {
    const slot = document.createElement("div");
    slot.className = "slot " + currentMode;
    slot.style.left = i * width + "px";
    slot.style.bottom = "0";   // фиксируем у низа поля
    slot.style.width = width + "px";
    slot.textContent = m + "x";
    game.appendChild(slot);
    slots.push(slot);
  });
}


// Режим
function setMode(mode) {
  currentMode = mode;
  createSlots();
}

// Падение шарика
function dropBall() {
  if (!canBet()) {
    alert("Недостаточно средств для ставки");
    return;
  }

  const bet = state.bet;
  takeBet();

  const ball = document.createElement("div");
  ball.className = "ball";
  game.appendChild(ball);

  let x = game.clientWidth / 2;
  let y = 0;

  const interval = setInterval(() => {
    y += 40;
    x += Math.random() < 0.5 ? -20 : 20;

    if (y >= 480) {
      clearInterval(interval);
      const slotIndex = Math.floor(x / (500 / multipliers.length));
      const mult = multipliers[slotIndex] || 0;
      const win = Math.round(bet * mult * 100) / 100;

      if (win > 0) {
        pay(win);
      }

      lastWinEl.textContent = win.toFixed(2);

      setTimeout(() => ball.remove(), 1000);
    }

    ball.style.top = y + "px";
    ball.style.left = x + "px";
  }, 200);
}


createPins();
createSlots();