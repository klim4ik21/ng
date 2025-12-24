import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /progress
router.get('/', authenticate, (req, res) => {
  try {
    const userId = req.user.id;

    // Get user stats
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    // Calculate days participated
    const daysParticipated = db.prepare(`
      SELECT COUNT(DISTINCT t.day_number) as days
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.user_id = ?
    `).get(userId);

    res.json({
      total_completed_tasks: user.total_completed_tasks,
      days_participated: daysParticipated.days || 0,
      roulette_weight: user.roulette_weight
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Ошибка при получении прогресса' });
  }
});

export default router;

