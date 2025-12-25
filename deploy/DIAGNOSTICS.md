# Диагностика проблем с сайтом

## Быстрая проверка статуса

```bash
# 1. Проверить статус PM2 процессов
pm2 status

# 2. Проверить, что процессы запущены и слушают порты
netstat -tlnp | grep -E ':(3000|3001)'

# 3. Проверить статус nginx
sudo systemctl status nginx

# 4. Проверить логи PM2
pm2 logs santa-frontend --lines 50
pm2 logs santa-backend --lines 50

# 5. Проверить логи nginx
sudo tail -50 /var/log/nginx/santa-app-error.log
sudo tail -50 /var/log/nginx/santa-app-access.log
```

## Если frontend не запущен

```bash
# Проверить, что frontend собран
cd /var/www/santa-app/frontend
ls -la .next

# Если .next не существует или поврежден - пересобрать
rm -rf .next
npm run build

# Запустить через PM2
cd /var/www/santa-app
pm2 restart santa-frontend
```

## Если backend не запущен

```bash
# Проверить .env файл
cd /var/www/santa-app/backend
cat .env

# Перезапустить backend
pm2 restart santa-backend
```

## Если nginx не работает

```bash
# Проверить конфигурацию
sudo nginx -t

# Проверить, что конфигурация активна
ls -la /etc/nginx/sites-enabled/ | grep santa

# Перезапустить nginx
sudo systemctl restart nginx
```

## Проверка портов

```bash
# Проверить, что порты слушаются
sudo lsof -i :3000  # Frontend
sudo lsof -i :3001  # Backend
sudo lsof -i :80    # Nginx HTTP
sudo lsof -i :443   # Nginx HTTPS
```

## Полный перезапуск

```bash
# Остановить все
pm2 stop all

# Очистить кэш frontend
cd /var/www/santa-app/frontend
rm -rf .next
npm run build

# Запустить все заново
cd /var/www/santa-app
pm2 start deploy/ecosystem.config.js

# Перезапустить nginx
sudo systemctl restart nginx

# Проверить статус
pm2 status
pm2 logs --lines 20
```

