class GameService {
  static generateSlotResult(betAmount) {
    const symbols = ['🍒', '🔔', '⭐', '💎', '🍋', '🍊'];
    const reels = [];
    
    for (let i = 0; i < 5; i++) {
      const reel = [];
      for (let j = 0; j < 3; j++) {
        reel.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      reels.push(reel);
    }

    const winAmount = this.calculateWin(reels, betAmount);
    
    return {
      reels,
      winAmount,
      timestamp: new Date().toISOString()
    };
  }

  static calculateWin(reels, betAmount) {
    // Логика расчета выигрыша (упрощенная)
    let totalWin = 0;
    
    // Проверка линий
    const lines = [
      [reels[0][0], reels[1][0], reels[2][0], reels[3][0], reels[4][0]], // Линия 1
      [reels[0][1], reels[1][1], reels[2][1], reels[3][1], reels[4][1]], // Линия 2
      [reels[0][2], reels[1][2], reels[2][2], reels[3][2], reels[4][2]], // Линия 3
    ];

    const paytable = {
      '💎': {3: 20, 4: 60, 5: 150},
      '⭐': {3: 12, 4: 30, 5: 80},
      '🔔': {3: 8, 4: 20, 5: 50},
      '🍒': {3: 5, 4: 10, 5: 25}
    };

    lines.forEach(line => {
      for (let count = 5; count >= 3; count--) {
        const symbols = line.slice(0, count);
        if (new Set(symbols).size === 1 && paytable[symbols[0]]?.[count]) {
          totalWin += paytable[symbols[0]][count] * (betAmount / 10);
          break;
        }
      }
    });

    return Math.round(totalWin * 100) / 100;
  }
}

module.exports = GameService;