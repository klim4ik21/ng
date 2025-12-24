import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initDatabase } from './db/schema.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import progressRoutes from './routes/progress.js';
import rouletteRoutes from './routes/roulette.js';
import finalRoutes from './routes/final.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import storiesRoutes from './routes/stories.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow all origins for mobile testing
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/roulette', rouletteRoutes);
app.use('/api/final', finalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Access from mobile: http://192.168.0.147:${PORT}`);
});

