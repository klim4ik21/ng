import db from './database.js';

export function initDatabase() {
  // Invite tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invite_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME,
      used_by_user_id INTEGER,
      FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invite_token TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_completed_tasks INTEGER DEFAULT 0,
      roulette_weight INTEGER DEFAULT 0,
      has_spun_roulette BOOLEAN DEFAULT 0
    )
  `);
  
  // Add name column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN name TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  
  // Create index for faster lookups
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_invite_tokens_used ON invite_tokens(used_at)`);
  } catch (e) {
    // Indexes already exist, ignore
  }

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_number INTEGER NOT NULL CHECK(day_number BETWEEN 1 AND 7),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      input_type TEXT NOT NULL CHECK(input_type IN ('text', 'photo', 'text+photo')),
      order_number INTEGER NOT NULL CHECK(order_number BETWEEN 1 AND 3),
      text_prompt TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add text_prompt column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN text_prompt TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      text_answer TEXT,
      media_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE(user_id, task_id)
    )
  `);

  // Roulette results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS roulette_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      prize_type TEXT NOT NULL CHECK(prize_type IN ('main', 'consolation')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Admin comments table (optional)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Stories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
      title TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      order_number INTEGER DEFAULT 0
    )
  `);

  // Story views table (track which users viewed which stories)
  db.exec(`
    CREATE TABLE IF NOT EXISTS story_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      story_id INTEGER NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      UNIQUE(user_id, story_id)
    )
  `);

  console.log('Database initialized successfully');
}

