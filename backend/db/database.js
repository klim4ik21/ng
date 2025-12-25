import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/challenge.db');

// Настройки для конкурентного доступа
const db = new Database(dbPath, {
  // Включаем WAL mode для лучшей конкурентности (чтение и запись одновременно)
  // Это позволяет нескольким процессам читать БД, пока один пишет
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Включаем WAL mode (Write-Ahead Logging) для конкурентного доступа
// WAL позволяет читать БД во время записи
db.pragma('journal_mode = WAL');

// Устанавливаем busy timeout (в миллисекундах)
// Если БД заблокирована, ждем до 5 секунд перед ошибкой
db.pragma('busy_timeout = 5000');

// Оптимизация для production
db.pragma('synchronous = NORMAL'); // Баланс между безопасностью и производительностью
db.pragma('cache_size = -64000'); // 64MB кэша (отрицательное значение = в KB)

export default db;

