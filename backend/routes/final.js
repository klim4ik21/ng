import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /final
router.get('/', authenticate, (req, res) => {
  try {
    // Get all submissions grouped by task type/category
    // This is a simplified version - you might want to add task categories
    
    // Get all text submissions (for movies, music, etc.)
    const textSubmissions = db.prepare(`
      SELECT s.*, t.title, t.day_number, u.id as user_id
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      JOIN users u ON s.user_id = u.id
      WHERE s.text_answer IS NOT NULL
      ORDER BY s.created_at DESC
    `).all();

    // Get all photo submissions (for gallery)
    const photoSubmissions = db.prepare(`
      SELECT s.*, t.title, t.day_number, u.id as user_id
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      JOIN users u ON s.user_id = u.id
      WHERE s.media_url IS NOT NULL
      ORDER BY s.created_at DESC
    `).all();

    // Get roulette winner
    const winner = db.prepare(`
      SELECT u.*, r.prize_type
      FROM roulette_results r
      JOIN users u ON r.user_id = u.id
      WHERE r.prize_type = 'main'
      LIMIT 1
    `).get();

    res.json({
      text_submissions: textSubmissions,
      photo_submissions: photoSubmissions,
      winner: winner || null
    });
  } catch (error) {
    console.error('Get final error:', error);
    res.status(500).json({ error: 'Ошибка при получении финальных данных' });
  }
});

export default router;

