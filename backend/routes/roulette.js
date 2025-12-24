import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Check if roulette is available (exactly at Dec 31, 23:59:59)
function isRouletteAvailable() {
  const now = new Date();
  const rouletteDate = new Date('2025-12-31T23:59:59');
  return now >= rouletteDate;
}

// Get time until roulette (in milliseconds)
function getTimeUntilRoulette() {
  const now = new Date();
  const rouletteDate = new Date('2025-12-31T23:59:59');
  return Math.max(0, rouletteDate.getTime() - now.getTime());
}

// GET /roulette/status
router.get('/status', authenticate, (req, res) => {
  const user = req.user;
  const available = isRouletteAvailable();
  const timeUntil = getTimeUntilRoulette();
  
  res.json({
    available,
    has_spun: user.has_spun_roulette === 1,
    roulette_weight: user.roulette_weight,
    time_until: timeUntil
  });
});

// POST /roulette/spin
router.post('/spin', authenticate, (req, res) => {
  try {
    const user = req.user;

    // Check if roulette is available
    if (!isRouletteAvailable()) {
      return res.status(403).json({ error: 'Рулетка ещё не доступна' });
    }

    // Check if already spun
    if (user.has_spun_roulette === 1) {
      return res.status(400).json({ error: 'Ты уже крутил рулетку!' });
    }

    // Get all users with their weights
    const allUsers = db.prepare('SELECT id, roulette_weight FROM users').all();
    const totalWeight = allUsers.reduce((sum, u) => sum + u.roulette_weight, 0);

    if (totalWeight === 0) {
      return res.status(400).json({ error: 'Недостаточно данных для рулетки' });
    }

    // Weighted random selection
    let random = Math.random() * totalWeight;
    let winnerId = null;
    
    for (const u of allUsers) {
      random -= u.roulette_weight;
      if (random <= 0) {
        winnerId = u.id;
        break;
      }
    }

    // Determine prize type
    const isMainPrize = winnerId === user.id;
    const prizeType = isMainPrize ? 'main' : 'consolation';

    // Save result
    db.prepare(`
      INSERT INTO roulette_results (user_id, prize_type)
      VALUES (?, ?)
    `).run(user.id, prizeType);

    // Mark user as spun
    db.prepare('UPDATE users SET has_spun_roulette = 1 WHERE id = ?').run(user.id);

    res.json({
      prize_type: prizeType,
      message: isMainPrize 
        ? '🎉 Поздравляем! Ты выиграл главный приз!' 
        : '🎁 Ты получил утешительный приз!'
    });
  } catch (error) {
    console.error('Spin roulette error:', error);
    res.status(500).json({ error: 'Ошибка при крутке рулетки' });
  }
});

export default router;

