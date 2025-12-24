import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /stories - Get all active stories and check which are unread
router.get('/', authenticate, (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active stories
    const stories = db.prepare(`
      SELECT s.*, 
             CASE WHEN sv.id IS NOT NULL THEN 1 ELSE 0 END as is_viewed
      FROM stories s
      LEFT JOIN story_views sv ON s.id = sv.story_id AND sv.user_id = ?
      WHERE s.is_active = 1
      ORDER BY s.order_number, s.created_at DESC
    `).all(userId);

    // Check if user has any unread stories
    const hasUnread = stories.some(s => s.is_viewed === 0);

    res.json({
      stories: stories.map(s => ({
        id: s.id,
        media_url: s.media_url,
        media_type: s.media_type,
        title: s.title,
        is_viewed: s.is_viewed === 1
      })),
      has_unread: hasUnread
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Ошибка при получении stories' });
  }
});

// POST /stories/:id/view - Mark story as viewed
router.post('/:id/view', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = parseInt(req.params.id);

    // Check if story exists
    const story = db.prepare('SELECT * FROM stories WHERE id = ? AND is_active = 1').get(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story не найдена' });
    }

    // Mark as viewed (ignore if already viewed)
    db.prepare(`
      INSERT OR IGNORE INTO story_views (user_id, story_id)
      VALUES (?, ?)
    `).run(userId, storyId);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark story viewed error:', error);
    res.status(500).json({ error: 'Ошибка при отметке просмотра' });
  }
});

export default router;

