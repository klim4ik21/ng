import express from 'express';
import db from '../db/database.js';
import { requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST /admin/login - Admin login (public endpoint, before requireAdmin)
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (password === '2912') {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Неверный пароль' });
  }
});

// All admin routes require admin password
router.use(requireAdmin);

// GET /admin/tasks - Get all tasks
router.get('/tasks', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY day_number, order_number').all();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении заданий' });
  }
});

// POST /admin/tasks - Create task
router.post('/tasks', (req, res) => {
  try {
    const { day_number, title, description, input_type, order_number, text_prompt, is_active } = req.body;
    
    const result = db.prepare(`
      INSERT INTO tasks (day_number, title, description, input_type, order_number, text_prompt, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(day_number, title, description, input_type, order_number, text_prompt || null, is_active ? 1 : 0);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании задания' });
  }
});

// PUT /admin/tasks/:id - Update task
router.put('/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { day_number, title, description, input_type, order_number, text_prompt, is_active } = req.body;
    
    db.prepare(`
      UPDATE tasks 
      SET day_number = ?, title = ?, description = ?, input_type = ?, order_number = ?, text_prompt = ?, is_active = ?
      WHERE id = ?
    `).run(day_number, title, description, input_type, order_number, text_prompt || null, is_active ? 1 : 0, id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении задания' });
  }
});

// DELETE /admin/tasks/:id - Delete task
router.delete('/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении задания' });
  }
});

// GET /admin/submissions - Get all submissions
router.get('/submissions', (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT s.*, u.invite_token, u.name, t.title as task_title, t.day_number
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN tasks t ON s.task_id = t.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении ответов' });
  }
});

// GET /admin/users - Get all users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении пользователей' });
  }
});

// PUT /admin/users/:id/weight - Update user roulette_weight
router.put('/users/:id/weight', (req, res) => {
  try {
    const { id } = req.params;
    const { roulette_weight } = req.body;
    
    db.prepare('UPDATE users SET roulette_weight = ? WHERE id = ?').run(roulette_weight, id);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении веса' });
  }
});

// DELETE /admin/users/:id/onboarding - Reset user onboarding (clear name)
router.delete('/users/:id/onboarding', (req, res) => {
  try {
    const { id } = req.params;
    
    db.prepare('UPDATE users SET name = NULL WHERE id = ?').run(id);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при сбросе онбординга' });
  }
});

// GET /admin/roulette/winner - Get roulette winner
router.get('/roulette/winner', (req, res) => {
  try {
    const winner = db.prepare(`
      SELECT u.*, r.prize_type, r.created_at as spun_at
      FROM roulette_results r
      JOIN users u ON r.user_id = u.id
      WHERE r.prize_type = 'main'
      LIMIT 1
    `).get();
    res.json(winner || null);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении победителя' });
  }
});

// POST /admin/comments - Add comment to user
router.post('/comments', (req, res) => {
  try {
    const { user_id, comment } = req.body;
    
    const result = db.prepare(`
      INSERT INTO admin_comments (user_id, comment)
      VALUES (?, ?)
    `).run(user_id, comment);

    const commentRecord = db.prepare('SELECT * FROM admin_comments WHERE id = ?').get(result.lastInsertRowid);
    res.json(commentRecord);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при добавлении комментария' });
  }
});

// POST /admin/upload - Upload file
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// GET /admin/stories - Get all stories
router.get('/stories', (req, res) => {
  try {
    const stories = db.prepare('SELECT * FROM stories ORDER BY order_number, created_at DESC').all();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении stories' });
  }
});

// POST /admin/stories - Create story
router.post('/stories', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const { title, media_type, is_active, order_number } = req.body;
    const mediaUrl = `/uploads/${req.file.filename}`;
    
    const result = db.prepare(`
      INSERT INTO stories (media_url, media_type, title, is_active, order_number)
      VALUES (?, ?, ?, ?, ?)
    `).run(mediaUrl, media_type || 'image', title || null, is_active ? 1 : 0, order_number || 0);

    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(result.lastInsertRowid);
    res.json(story);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании story' });
  }
});

// PUT /admin/stories/:id - Update story
router.put('/stories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, is_active, order_number } = req.body;
    
    db.prepare(`
      UPDATE stories 
      SET title = ?, is_active = ?, order_number = ?
      WHERE id = ?
    `).run(title || null, is_active ? 1 : 0, order_number || 0, id);

    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
    res.json(story);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении story' });
  }
});

// DELETE /admin/stories/:id - Delete story
router.delete('/stories/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM stories WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении story' });
  }
});

// GET /admin/invite-tokens - Get all invite tokens
router.get('/invite-tokens', (req, res) => {
  try {
    const tokens = db.prepare(`
      SELECT it.*, u.name as used_by_name, u.invite_token as used_by_token
      FROM invite_tokens it
      LEFT JOIN users u ON it.used_by_user_id = u.id
      ORDER BY it.created_at DESC
    `).all();
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении токенов' });
  }
});

// POST /admin/invite-tokens - Create new invite token
router.post('/invite-tokens', (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    
    const result = db.prepare(`
      INSERT INTO invite_tokens (token)
      VALUES (?)
    `).run(token);

    const newToken = db.prepare('SELECT * FROM invite_tokens WHERE id = ?').get(result.lastInsertRowid);
    res.json(newToken);
  } catch (error) {
    console.error('Create invite token error:', error);
    res.status(500).json({ error: 'Ошибка при создании токена' });
  }
});

// DELETE /admin/invite-tokens/:id - Delete invite token
router.delete('/invite-tokens/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if token is used
    const token = db.prepare('SELECT * FROM invite_tokens WHERE id = ?').get(id);
    if (token && token.used_at) {
      return res.status(400).json({ error: 'Нельзя удалить использованный токен' });
    }
    
    db.prepare('DELETE FROM invite_tokens WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении токена' });
  }
});

export default router;

