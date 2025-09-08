const express = require('express');
const GameService = require('../services/gameService');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

router.post('/slot/spin', async (req, res) => {
  try {
    const { betAmount } = req.body;
    const userId = req.user.userId;

    // Проверка баланса
    const user = await User.findById(userId);
    if (user.balance < betAmount) {
      return res.status(400).json({ error: 'Недостаточно средств' });
    }

    // Генерация результата
    const result = GameService.generateSlotResult(betAmount);

    // Обновление баланса
    const newBalance = await User.updateBalance(userId, -betAmount + result.winAmount);

    // Сохранение транзакции
    await Transaction.create({
      userId,
      type: result.winAmount > 0 ? 'win' : 'loss',
      amount: result.winAmount > 0 ? result.winAmount : -betAmount,
      gameType: 'slot',
      gameData: result
    });

    res.json({
      success: true,
      balance: newBalance,
      result: result
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Аналогичные endpoints для других игр...

module.exports = router;