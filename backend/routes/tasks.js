import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to get current day (1-7)
function getCurrentDay() {
  // Assuming challenge starts on Dec 25
  const startDate = new Date('2025-12-25');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  
  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return Math.max(1, Math.min(7, diffDays));
}

// GET /tasks/today
router.get('/today', authenticate, (req, res) => {
  try {
    const currentDay = getCurrentDay();
    const userId = req.user.id;

    // Get tasks for today
    const tasks = db.prepare(`
      SELECT t.*, 
             CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as is_completed,
             s.id as submission_id
      FROM tasks t
      LEFT JOIN submissions s ON t.id = s.task_id AND s.user_id = ?
      WHERE t.day_number = ? AND t.is_active = 1
      ORDER BY t.order_number
    `).all(userId, currentDay);

    res.json({
      day: currentDay,
      tasks: tasks.map(task => ({
        id: task.id,
        day_number: task.day_number,
        title: task.title,
        description: task.description,
        input_type: task.input_type,
        order: task.order_number,
        text_prompt: task.text_prompt || null,
        is_completed: task.is_completed === 1
      }))
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Ошибка при получении заданий' });
  }
});

// GET /tasks/:id/submission - Get user's submission for a task
router.get('/:id/submission', authenticate, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;

    const submission = db.prepare(`
      SELECT s.*, t.title, t.description, t.input_type
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.task_id = ? AND s.user_id = ?
    `).get(taskId, userId);

    if (!submission) {
      return res.status(404).json({ error: 'Ответ не найден' });
    }

    res.json({
      id: submission.id,
      task_id: submission.task_id,
      text_answer: submission.text_answer,
      media_url: submission.media_url,
      created_at: submission.created_at,
      task: {
        title: submission.title,
        description: submission.description,
        input_type: submission.input_type,
      }
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Ошибка при получении ответа' });
  }
});

// POST /tasks/:id/submit
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const { text_answer, media_url } = req.body;

    // Check if task exists and is active
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND is_active = 1').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    // Check if already submitted
    const existing = db.prepare('SELECT * FROM submissions WHERE user_id = ? AND task_id = ?').get(userId, taskId);
    if (existing) {
      return res.status(400).json({ error: 'Задание уже выполнено' });
    }

    // Validate input based on input_type
    if (task.input_type === 'text' && !text_answer) {
      return res.status(400).json({ error: 'Текстовый ответ обязателен' });
    }
    if (task.input_type === 'photo' && !media_url) {
      return res.status(400).json({ error: 'Фото обязательно' });
    }
    if (task.input_type === 'text+photo' && (!text_answer || !media_url)) {
      return res.status(400).json({ error: 'Требуются и текст, и фото' });
    }

    // Create submission
    db.prepare(`
      INSERT INTO submissions (user_id, task_id, text_answer, media_url)
      VALUES (?, ?, ?, ?)
    `).run(userId, taskId, text_answer || null, media_url || null);

    // Update user stats
    db.prepare(`
      UPDATE users 
      SET total_completed_tasks = total_completed_tasks + 1,
          roulette_weight = roulette_weight + 1
      WHERE id = ?
    `).run(userId);

    res.json({ success: true, message: 'Задание выполнено!' });
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ error: 'Ошибка при отправке задания' });
  }
});

export default router;

