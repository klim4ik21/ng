import express from 'express';
import db from '../db/database.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// POST /join/:token
router.post('/join/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Токен обязателен' });
    }

    // Check if invite token exists and is not used
    const inviteToken = db.prepare('SELECT * FROM invite_tokens WHERE token = ?').get(token);
    
    if (!inviteToken) {
      return res.status(404).json({ error: 'Токен не найден' });
    }

    if (inviteToken.used_at) {
      // Token already used - check if user exists
      const existingUser = db.prepare('SELECT * FROM users WHERE invite_token = ?').get(token);
      if (existingUser) {
        const jwtToken = generateToken(token);
        return res.json({
          user: {
            id: existingUser.id,
            invite_token: existingUser.invite_token,
            name: existingUser.name,
            created_at: existingUser.created_at,
            total_completed_tasks: existingUser.total_completed_tasks,
            roulette_weight: existingUser.roulette_weight,
            has_spun_roulette: existingUser.has_spun_roulette === 1
          },
          token: jwtToken
        });
      }
      return res.status(400).json({ error: 'Токен уже использован' });
    }

    // Check if user already exists (shouldn't happen, but just in case)
    let user = db.prepare('SELECT * FROM users WHERE invite_token = ?').get(token);

    if (!user) {
      // Create new user with this invite token
      const result = db.prepare(`
        INSERT INTO users (invite_token, total_completed_tasks, roulette_weight, has_spun_roulette)
        VALUES (?, 0, 0, 0)
      `).run(token);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      
      // Mark token as used
      db.prepare(`
        UPDATE invite_tokens 
        SET used_at = CURRENT_TIMESTAMP, used_by_user_id = ?
        WHERE id = ?
      `).run(user.id, inviteToken.id);
    }

    // Generate JWT token
    const jwtToken = generateToken(token);

    res.json({
      user: {
        id: user.id,
        invite_token: user.invite_token,
        name: user.name,
        created_at: user.created_at,
        total_completed_tasks: user.total_completed_tasks,
        roulette_weight: user.roulette_weight,
        has_spun_roulette: user.has_spun_roulette === 1
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Join error:', error);
    res.status(500).json({ error: 'Ошибка при создании/поиске пользователя' });
  }
});

// GET /me
router.get('/me', authenticate, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    invite_token: user.invite_token,
    name: user.name || null,
    created_at: user.created_at,
    total_completed_tasks: user.total_completed_tasks,
    roulette_weight: user.roulette_weight,
    has_spun_roulette: user.has_spun_roulette === 1
  });
});

// PUT /auth/me - Update current user (name)
router.put('/me', authenticate, (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Имя не может быть пустым' });
    }

    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), userId);
    
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении пользователя' });
  }
});

export default router;

