#!/bin/bash

# Скрипт первоначальной настройки сервера для деплоя
# Запускать на чистой Ubuntu машине от root или с sudo

set -e

echo "🚀 Начало настройки сервера..."

# Установка часового пояса Москвы
echo "🕐 Настройка часового пояса (Москва)..."
export DEBIAN_FRONTEND=noninteractive
apt install -y tzdata
timedatectl set-timezone Europe/Moscow
echo "✅ Часовой пояс установлен: Europe/Moscow"

# Обновление системы
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Установка необходимых пакетов
echo "📦 Установка базовых пакетов..."
apt install -y curl wget git build-essential

# Установка Node.js 20.x LTS
echo "📦 Установка Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка версии Node.js
node_version=$(node --version)
npm_version=$(npm --version)
echo "✅ Node.js установлен: $node_version"
echo "✅ npm установлен: $npm_version"

# Установка PM2 глобально
echo "📦 Установка PM2..."
npm install -g pm2

# Установка nginx
echo "📦 Установка nginx..."
apt install -y nginx

# Установка certbot для SSL
echo "📦 Установка certbot..."
apt install -y certbot python3-certbot-nginx

# Создание директории для приложения
APP_DIR="/var/www/santa-app"
echo "📁 Создание директории приложения: $APP_DIR"
mkdir -p $APP_DIR
chown -R $SUDO_USER:$SUDO_USER $APP_DIR

# Создание директории для логов PM2
mkdir -p /var/log/pm2
chown -R $SUDO_USER:$SUDO_USER /var/log/pm2

# Проверка часового пояса
echo ""
echo "🕐 Текущий часовой пояс:"
timedatectl

echo ""
echo "✅ Базовая настройка завершена!"
echo ""
echo "📝 Следующие шаги:"
echo "1. Склонируйте репозиторий: git clone <your-repo-url> $APP_DIR"
echo "2. Перейдите в директорию: cd $APP_DIR"
echo "3. Скопируйте конфигурацию nginx: sudo cp deploy/nginx.conf /etc/nginx/sites-available/santa.richislav.com"
echo "4. Создайте симлинк: sudo ln -s /etc/nginx/sites-available/santa.richislav.com /etc/nginx/sites-enabled/"
echo "5. Установите зависимости backend: cd backend && npm install"
echo "6. Установите зависимости frontend: cd ../frontend && npm install"
echo "7. Соберите frontend: npm run build"
echo "8. Настройте переменные окружения в backend/.env"
echo "9. Инициализируйте базу данных: cd backend && node scripts/init-db.js"
echo "10. Запустите приложение через PM2: pm2 start deploy/ecosystem.config.js"
echo "11. Сохраните конфигурацию PM2: pm2 save && pm2 startup"
echo "12. Проверьте конфигурацию nginx: sudo nginx -t"
echo "13. Запустите nginx: sudo systemctl start nginx && sudo systemctl enable nginx"
echo "14. Настройте SSL: sudo certbot --nginx -d santa.richislav.com"
echo ""
