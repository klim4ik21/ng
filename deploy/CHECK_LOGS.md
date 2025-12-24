# Как проверить логи приложения

## Логи PM2 (Backend и Frontend)

### Просмотр всех логов
```bash
pm2 logs
```

### Логи только backend
```bash
pm2 logs santa-backend --lines 100
```

### Логи только frontend
```bash
pm2 logs santa-frontend --lines 100
```

### Логи в реальном времени
```bash
pm2 logs --lines 0
```

### Очистка логов
```bash
pm2 flush
```

## Логи nginx

### Логи ошибок
```bash
sudo tail -f /var/log/nginx/santa-app-error.log
```

### Логи доступа
```bash
sudo tail -f /var/log/nginx/santa-app-access.log
```

### Последние 50 строк ошибок
```bash
sudo tail -50 /var/log/nginx/santa-app-error.log
```

## Логи в браузере (для Telegram Mini App)

В Telegram Mini App сложно открыть консоль браузера, но можно:

1. **Откройте приложение в обычном браузере** (не в Telegram):
   - Скопируйте URL из Telegram Mini App
   - Откройте в Chrome/Safari
   - Откройте DevTools (F12 или Cmd+Option+I)
   - Смотрите вкладку Console

2. **Или используйте логи на сервере** - все `console.log` из frontend будут видны в логах PM2

## Проверка статуса приложения

```bash
# Статус всех процессов
pm2 status

# Детальная информация
pm2 describe santa-backend
pm2 describe santa-frontend

# Мониторинг в реальном времени
pm2 monit
```

## Проверка работы API

```bash
# Проверка health endpoint
curl https://santa.richislav.com/api/health

# Проверка с токеном (если есть)
curl -H "Authorization: Bearer YOUR_TOKEN" https://santa.richislav.com/api/auth/me
```

## Типичные проблемы и их диагностика

### Бесконечная загрузка в Telegram

1. **Проверьте логи frontend:**
   ```bash
   pm2 logs santa-frontend --lines 50
   ```
   Ищите ошибки или сообщения о загрузке

2. **Проверьте логи backend:**
   ```bash
   pm2 logs santa-backend --lines 50
   ```
   Ищите ошибки API запросов

3. **Проверьте nginx логи:**
   ```bash
   sudo tail -50 /var/log/nginx/santa-app-error.log
   ```

4. **Проверьте, что процессы запущены:**
   ```bash
   pm2 status
   ```
   Оба процесса должны быть `online`

5. **Проверьте доступность API:**
   ```bash
   curl https://santa.richislav.com/api/health
   ```

### Проблемы с авторизацией

Если видите ошибки 401 в логах:
- Проверьте, что токен сохраняется в localStorage
- Проверьте, что токен передается в заголовках
- Проверьте логи backend на предмет ошибок JWT

### Проблемы с загрузкой статики

```bash
# Проверьте права доступа
ls -la /var/www/santa-app/frontend/.next

# Проверьте, что frontend собран
ls -la /var/www/santa-app/frontend/.next/prerender-manifest.json
```

## Быстрая диагностика

Выполните эту команду для полной диагностики:

```bash
echo "=== PM2 Status ===" && \
pm2 status && \
echo -e "\n=== Backend Logs (last 20) ===" && \
pm2 logs santa-backend --lines 20 --nostream && \
echo -e "\n=== Frontend Logs (last 20) ===" && \
pm2 logs santa-frontend --lines 20 --nostream && \
echo -e "\n=== Nginx Errors (last 10) ===" && \
sudo tail -10 /var/log/nginx/santa-app-error.log && \
echo -e "\n=== API Health ===" && \
curl -s https://santa.richislav.com/api/health || echo "API недоступен"
```
