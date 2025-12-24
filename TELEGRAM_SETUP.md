# Настройка Telegram Mini App

Это руководство поможет интегрировать приложение в Telegram Mini App.

## Что такое Telegram Mini App?

Telegram Mini App - это веб-приложение, которое запускается прямо внутри Telegram. Пользователи могут открыть его, нажав кнопку в боте, не покидая Telegram.

## Преимущества:

✅ **Удобство** - пользователи не покидают Telegram  
✅ **Авторизация** - можно использовать Telegram авторизацию  
✅ **Нативные функции** - доступ к камере, файлам через Telegram  
✅ **Уведомления** - можно отправлять уведомления через бота  
✅ **Меньше шагов** - не нужно копировать ссылки  

## Шаг 1: Создание бота через BotFather

1. Откройте Telegram и найдите [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Новогодний челлендж")
4. Введите username бота (должен заканчиваться на `bot`, например: `santa_challenge_bot`)
5. Сохраните токен бота (выглядит как: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Настройка Mini App

1. Отправьте BotFather команду `/newapp`
2. Выберите вашего бота из списка
3. Введите заголовок приложения (например: "Новогодний челлендж 2025")
4. Введите описание (например: "7 дней до Нового года с заданиями и призами")
5. Загрузите фото (опционально, 640x360px)
6. Введите **Web App URL**: `https://santa.richislav.com`
7. Готово! BotFather даст вам ссылку вида: `https://t.me/your_bot/santa_challenge`

## Шаг 3: Получение секретного ключа для проверки авторизации

Для безопасности нужно получить секретный ключ бота:

1. Отправьте BotFather команду `/newapp` (если еще не создавали)
2. Или используйте команду `/myapps` чтобы увидеть существующие
3. Выберите ваше приложение
4. Нажмите "Bot Secret" чтобы получить секретный ключ

**Важно:** Сохраните этот секретный ключ - он нужен для проверки авторизации на бэкенде.

## Шаг 4: Настройка переменных окружения

Добавьте в `backend/.env`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_SECRET=your_bot_secret_from_botfather
```

## Шаг 5: Адаптация приложения

Приложение уже должно работать как Mini App! Telegram автоматически добавляет:
- `window.Telegram.WebApp` - API для работы с Telegram
- Параметры пользователя в `window.Telegram.WebApp.initData`

## Использование Mini App

### Открытие через бота:

1. Найдите вашего бота в Telegram
2. Откройте бота
3. Нажмите кнопку "Open App" или используйте команду `/start`
4. Приложение откроется прямо в Telegram

### Прямая ссылка:

```
https://t.me/your_bot_username/your_app_name
```

## Дополнительные возможности

### Авторизация через Telegram

Можно использовать авторизацию через Telegram вместо invite токенов:

```javascript
// Получение данных пользователя Telegram
const tg = window.Telegram?.WebApp;
if (tg) {
  const user = tg.initDataUnsafe?.user;
  // user.id, user.first_name, user.username и т.д.
}
```

### Нативные функции Telegram

- **Камера**: Через Telegram API можно получить доступ к камере
- **Файлы**: Загрузка файлов через Telegram
- **Клавиатура**: Встроенная клавиатура бота
- **Кнопки**: Кнопки "Назад", "Закрыть" и т.д.

### Закрытие Mini App

```javascript
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.close();
}
```

## Проверка что Mini App работает

1. Откройте бота в Telegram
2. Нажмите кнопку Mini App
3. В консоли браузера (если открыли в веб-версии) проверьте:
   ```javascript
   console.log(window.Telegram?.WebApp);
   ```
4. Должен быть объект с API Telegram

## Безопасность

⚠️ **Важно:** Всегда проверяйте `initData` на сервере перед использованием данных пользователя!

Telegram Mini App передает `initData` - подписанные данные пользователя. На сервере нужно проверить подпись используя секретный ключ бота.

## Пример проверки initData на сервере (опционально)

```javascript
import crypto from 'crypto';

function verifyTelegramAuth(initData, botToken) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}
```

## Что дальше?

Приложение уже готово работать как Mini App! Telegram автоматически:
- Добавляет Telegram API
- Передает данные пользователя
- Предоставляет нативные функции

Вы можете использовать существующую систему invite токенов ИЛИ добавить авторизацию через Telegram как альтернативу.
