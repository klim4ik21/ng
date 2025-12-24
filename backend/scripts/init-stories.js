import db from '../db/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize first story from public/stories.png
// This assumes the file will be copied to uploads directory
const initStories = () => {
  try {
    // Check if stories table exists, if not, it will be created by schema
    const stories = db.prepare('SELECT COUNT(*) as count FROM stories').get();
    
    if (stories.count === 0) {
      // Insert the first story
      // Note: You'll need to copy stories.png to backend/uploads/ directory
      // or update the path accordingly
      db.prepare(`
        INSERT INTO stories (media_url, media_type, title, is_active, order_number)
        VALUES (?, ?, ?, ?, ?)
      `).run('/uploads/stories.png', 'image', null, 1, 0);
      
      console.log('✅ First story initialized');
    } else {
      console.log('ℹ️  Stories already exist');
    }
  } catch (error) {
    console.error('Error initializing stories:', error);
  }
};

initStories();

