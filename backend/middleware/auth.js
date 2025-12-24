import jwt from 'jsonwebtoken';
import db from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

export function generateToken(inviteToken) {
  return jwt.sign({ inviteToken }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.token || 
                  req.query?.token;

    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }

    // Find user by invite_token
    const user = db.prepare('SELECT * FROM users WHERE invite_token = ?').get(decoded.inviteToken);
    
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка аутентификации' });
  }
}

export function requireAdmin(req, res, next) {
  // Check for admin password in header
  const adminPassword = req.headers['x-admin-password'];
  
  // Admin password is '2912'
  const ADMIN_PASSWORD = '2912';
  
  if (adminPassword === ADMIN_PASSWORD) {
    return next();
  }
  
  return res.status(403).json({ error: 'Доступ запрещён' });
}

