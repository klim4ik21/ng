# Переменные окружения (.env файлы)

## Backend `.env` файл

Создайте файл `backend/.env` со следующим содержимым:

```env
# Порт сервера (по умолчанию 3001)
PORT=3001

# Секретный ключ для JWT токенов (ОБЯЗАТЕЛЬНО измените!)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# Режим работы (production для продакшена)
NODE_ENV=production

# URL фронтенда (для CORS и ссылок)
FRONTEND_URL=https://santa.richislav.com

# Часовой пояс (опционально, лучше установить на уровне системы)
TZ=Europe/Moscow

# Telegram Bot Token (опционально, нужен только если используете авторизацию через Telegram)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_from_botfather

# Telegram Bot Secret (опционально, нужен только для проверки initData на сервере)
TELEGRAM_BOT_SECRET=your_telegram_bot_secret_from_botfather
```

## Важно

### Обязательные переменные:

1. **JWT_SECRET** - ОБЯЗАТЕЛЬНО измените на случайную строку!
   ```bash
   # Можно сгенерировать случайную строку:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **NODE_ENV** - для production используйте `production`

### Опциональные переменные:

1. **TELEGRAM_BOT_TOKEN** - нужен ТОЛЬКО если:
   - Вы хотите использовать авторизацию через Telegram
   - Вы хотите проверять `initData` на сервере
   - Вы хотите отправлять уведомления через бота

   **Для базовой работы Telegram Mini App НЕ нужен!** Приложение будет работать как обычное веб-приложение, просто запускается из Telegram.

2. **TELEGRAM_BOT_SECRET** - нужен только для проверки подписи `initData` на сервере (для безопасности). Для базовой работы не нужен.

## Frontend переменные окружения

Для frontend создайте файл `.env.local` (если нужно) или используйте `next.config.js`:

```env
# URL API (для production)
NEXT_PUBLIC_API_URL=https://santa.richislav.com/api
```

Или установите через PM2 (уже сделано в `deploy/ecosystem.config.js`).

## Минимальная конфигурация для работы

Для базовой работы приложения достаточно:

```env
PORT=3001
JWT_SECRET=ваш-случайный-секретный-ключ
NODE_ENV=production
FRONTEND_URL=https://santa.richislav.com
```

Telegram токены НЕ нужны для базовой работы - приложение работает через invite токены, которые создаются в админке.

## Генерация JWT_SECRET

```bash
# На сервере выполните:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Скопируйте вывод и используйте как JWT_SECRET.

## Пример полного .env файла

```env
# Server
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# URLs
FRONTEND_URL=https://santa.richislav.com

# Timezone
TZ=Europe/Moscow

# Telegram (опционально, для авторизации через Telegram)
# TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
# TELEGRAM_BOT_SECRET=your_bot_secret_here
```

## Проверка переменных окружения

После создания `.env` файла, проверьте что переменные загружаются:

```bash
cd backend
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');"
```


