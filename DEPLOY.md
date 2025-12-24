# Инструкция по деплою на сервер

Данная инструкция поможет развернуть приложение на чистой Ubuntu машине с доменом `santa.richislav.com`.

## Требования

- Ubuntu 20.04 или новее
- Доступ с правами root или через sudo
- Домен `santa.richislav.com`, указывающий на IP сервера (A-запись)

## Шаг 1: Первоначальная настройка сервера

### 1.1. Подключитесь к серверу

```bash
ssh user@your-server-ip
```

### 1.2. Запустите скрипт первоначальной настройки

```bash
# Если у вас есть доступ к репозиторию, склонируйте его
git clone <your-repo-url> /var/www/santa-app
cd /var/www/santa-app

# Запустите скрипт настройки (от root или с sudo)
sudo bash deploy/setup.sh
```

Скрипт установит:
- Часовой пояс Москвы (Europe/Moscow)
- Node.js 20.x LTS
- npm
- PM2 (менеджер процессов)
- nginx
- certbot (для SSL)

**Важно:** Скрипт автоматически настроит часовой пояс на Europe/Moscow, так как сервер может быть расположен не в России.

## Шаг 2: Настройка приложения

### 2.1. Если репозиторий еще не склонирован

```bash
sudo mkdir -p /var/www/santa-app
sudo chown -R $USER:$USER /var/www/santa-app
git clone <your-repo-url> /var/www/santa-app
cd /var/www/santa-app
```

### 2.2. Установка зависимостей

```bash
# Backend зависимости
cd backend
npm install --production
cd ..

# Frontend зависимости
cd frontend
npm install --production
npm run build
cd ..
```

### 2.3. Настройка переменных окружения

Создайте файл `backend/.env`:

```bash
cd backend
nano .env
```

Добавьте:

```env
PORT=3001
JWT_SECRET=2912335
NODE_ENV=production
FRONTEND_URL=https://santa.richislav.com
TZ=Europe/Moscow
```

**Важно:** 
- Замените `your-super-secret-jwt-key-change-this` на случайную строку!
- `TZ=Europe/Moscow` устанавливает часовой пояс для Node.js приложения

### 2.4. Инициализация базы данных

```bash
cd backend
node scripts/init-db.js
```

При необходимости создайте первую story:

```bash
node scripts/init-stories.js
```

## Шаг 3: Настройка PM2

### 3.1. Важно: Убедитесь, что frontend собран!

Перед запуском PM2 убедитесь, что frontend собран:

```bash
cd /var/www/santa-app/frontend
npm run build
```

Проверьте, что директория `.next` создана:

```bash
ls -la .next
```

### 3.2. Запуск приложения через PM2

```bash
cd /var/www/santa-app
pm2 start deploy/ecosystem.config.js
```

Это запустит оба процесса: backend и frontend.

### 3.3. Сохранение конфигурации PM2

```bash
pm2 save
pm2 startup
```

Последняя команда покажет команду, которую нужно выполнить с sudo (для автозапуска при перезагрузке сервера).

### 3.4. Проверка статуса

```bash
pm2 status
pm2 logs santa-backend
pm2 logs santa-frontend
```

## Шаг 4: Настройка nginx

### 4.1. Копирование конфигурации

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/santa.richislav.com
```

### 4.2. Создание симлинка

```bash
sudo ln -s /etc/nginx/sites-available/santa.richislav.com /etc/nginx/sites-enabled/
```

### 4.3. Удаление дефолтной конфигурации (опционально)

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 4.4. Проверка конфигурации

```bash
sudo nginx -t
```

Если все хорошо, перезапустите nginx:

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Шаг 5: Настройка SSL (HTTPS)

### 5.1. Получение SSL сертификата

```bash
sudo certbot --nginx -d santa.richislav.com
```

Certbot автоматически:
- Получит SSL сертификат
- Настроит nginx для HTTPS
- Настроит автоматическое обновление сертификата

### 5.2. Проверка автообновления сертификата

```bash
sudo certbot renew --dry-run
```

## Шаг 6: Проверка работы

1. Откройте в браузере: `https://santa.richislav.com`
2. Проверьте API: `https://santa.richislav.com/api/health`
3. Проверьте часовой пояс: `timedatectl` (должен быть Europe/Moscow)
4. Проверьте логи:
   ```bash
   pm2 logs santa-backend
   sudo tail -f /var/log/nginx/santa-app-error.log
   ```

## Обновление приложения

Для обновления приложения используйте скрипт `update.sh`:

```bash
cd /var/www/santa-app
bash deploy/update.sh
```

Или вручную:

```bash
cd /var/www/santa-app
git pull origin main
cd backend && npm install --production && cd ..
cd frontend && npm install --production && npm run build && cd ..
pm2 restart santa-backend
pm2 restart santa-frontend
```

## Полезные команды

### Часовой пояс

```bash
timedatectl                          # Проверить текущий часовой пояс
timedatectl set-timezone Europe/Moscow  # Установить часовой пояс (если нужно)
date                                 # Показать текущую дату и время
```

### PM2

```bash
pm2 status                    # Статус процессов
pm2 logs santa-backend        # Логи backend
pm2 logs santa-frontend       # Логи frontend
pm2 logs                      # Все логи
pm2 restart santa-backend     # Перезапуск backend
pm2 restart santa-frontend    # Перезапуск frontend
pm2 restart all               # Перезапуск всех процессов
pm2 stop santa-backend        # Остановка backend
pm2 stop santa-frontend       # Остановка frontend
pm2 monit                     # Мониторинг в реальном времени
```

### nginx

```bash
sudo nginx -t              # Проверка конфигурации
sudo systemctl restart nginx  # Перезапуск
sudo systemctl status nginx   # Статус
sudo tail -f /var/log/nginx/santa-app-error.log  # Логи ошибок
```

### База данных

```bash
cd /var/www/santa-app/backend
sqlite3 db/database.sqlite  # Открыть базу данных
```

### SSL сертификаты

```bash
sudo certbot certificates        # Список сертификатов
sudo certbot renew               # Обновление сертификатов
sudo certbot renew --dry-run     # Тестовое обновление
```

## Структура файлов на сервере

```
/var/www/santa-app/
├── backend/
│   ├── .env              # Переменные окружения (не в git!)
│   ├── db/
│   │   └── database.sqlite
│   └── uploads/          # Загруженные файлы
├── frontend/
│   └── .next/            # Собранное приложение
├── deploy/
│   ├── setup.sh
│   ├── update.sh
│   ├── nginx.conf
│   └── ecosystem.config.js
└── ...
```

## Решение проблем

### Backend не запускается

```bash
pm2 logs santa-backend --lines 100
cd /var/www/santa-app/backend
node server.js  # Запуск вручную для отладки
```

### nginx возвращает 502 Bad Gateway

1. Проверьте, что backend запущен: `pm2 status`
2. Проверьте порт: `netstat -tulpn | grep 3001`
3. Проверьте логи nginx: `sudo tail -f /var/log/nginx/santa-app-error.log`

### SSL сертификат не работает

1. Проверьте, что домен указывает на сервер: `nslookup santa.richislav.com`
2. Проверьте firewall: `sudo ufw status`
3. Убедитесь, что порты 80 и 443 открыты: `sudo ufw allow 80 && sudo ufw allow 443`

### Файлы не загружаются

1. Проверьте права доступа: `ls -la /var/www/santa-app/backend/uploads`
2. Проверьте `client_max_body_size` в nginx конфигурации
3. Проверьте права на запись: `sudo chown -R www-data:www-data /var/www/santa-app/backend/uploads`

### Неправильное время на сервере

1. Проверьте часовой пояс: `timedatectl`
2. Установите часовой пояс Москвы: `sudo timedatectl set-timezone Europe/Moscow`
3. Для Node.js приложений также установите переменную окружения в `.env`: `TZ=Europe/Moscow`

## Безопасность

1. **Firewall**: Настройте ufw для ограничения доступа
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **JWT Secret**: Используйте сильный случайный ключ в `backend/.env`

3. **Права доступа**: Убедитесь, что файлы имеют правильные права
   ```bash
   sudo chown -R $USER:$USER /var/www/santa-app
   ```

4. **Регулярные обновления**: Обновляйте систему регулярно
   ```bash
   sudo apt update && sudo apt upgrade
   ```