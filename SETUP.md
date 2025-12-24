# Инструкция по запуску проекта

## Backend

1. Перейдите в папку backend:
```bash
cd backend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Отредактируйте `.env` и установите свои значения:
```
PORT=3001
JWT_SECRET=your-secret-key-change-this
ADMIN_TOKEN=your-admin-token-change-this
UPLOAD_DIR=./uploads
```

5. Инициализируйте базу данных:
```bash
npm run init-db
```

6. Запустите сервер:
```bash
npm run dev
```

Backend будет доступен на `http://localhost:3001`

## Frontend

1. Перейдите в папку frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Запустите dev сервер:
```bash
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

## Использование

### Создание пользователей

Пользователи создаются автоматически при переходе по ссылке вида:
```
http://localhost:3000/join/{invite_token}
```

Где `invite_token` - уникальный токен для каждого участника.

### Админ-панель

Админ-панель доступна через API с заголовком:
```
x-admin-token: your-admin-token
```

Примеры запросов:
- `GET /api/admin/tasks` - получить все задания
- `POST /api/admin/tasks` - создать задание
- `GET /api/admin/submissions` - получить все ответы
- `GET /api/admin/users` - получить всех пользователей

### Структура задания

При создании задания через админ-панель:
```json
{
  "day_number": 1,
  "title": "Название задания",
  "description": "Описание задания",
  "input_type": "text|photo|text+photo",
  "order_number": 1,
  "is_active": true
}
```

## Важные даты

- Челлендж начинается: 25 декабря 2025
- Рулетка активируется: 31 декабря 2025 в 23:59:59

Эти даты можно изменить в коде:
- Backend: `backend/routes/tasks.js` (функция `getCurrentDay`)
- Backend: `backend/routes/roulette.js` (функция `isRouletteAvailable`)

