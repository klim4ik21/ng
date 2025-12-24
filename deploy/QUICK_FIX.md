# Быстрое решение проблем после распространения DNS

Если DNS checker показывает, что DNS записи распространились, но браузер все еще не может подключиться, выполните следующие шаги:

## 1. Очистка DNS кэша (обязательно!)

### Windows:
```cmd
ipconfig /flushdns
```
Затем перезапустите браузер.

### macOS:
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```
Затем перезапустите браузер.

### Linux:
```bash
sudo systemd-resolve --flush-caches
# или
sudo /etc/init.d/nscd restart
```

## 2. Проверка в режиме инкогнито/приватном режиме

Откройте браузер в режиме инкогнито (Ctrl+Shift+N / Cmd+Shift+N) и попробуйте открыть сайт. Это исключит влияние расширений браузера и кэша.

## 3. Попробуйте другой браузер

Попробуйте открыть сайт в другом браузере, чтобы исключить проблемы с конкретным браузером.

## 4. Проверка доступности по HTTP (не HTTPS)

Попробуйте открыть: `http://santa.richislav.com` (без s)

Если используете Cloudflare Proxy, сайт должен быть доступен и по HTTP (Cloudflare автоматически добавит SSL).

## 5. Проверка на сервере

Выполните на сервере:

```bash
# Проверка статуса nginx
sudo systemctl status nginx

# Проверка конфигурации
sudo nginx -t

# Проверка портов
sudo ss -tlnp | grep -E ':(80|443)'

# Проверка файрвола
sudo ufw status

# Проверка логов
sudo tail -20 /var/log/nginx/santa-app-error.log
```

## 6. Проверка работы сайта с сервера

```bash
# Проверка localhost
curl http://localhost:3000

# Проверка через nginx
curl http://localhost

# Проверка с указанием Host
curl -H "Host: santa.richislav.com" http://localhost
```

## 7. Если используете Cloudflare Proxy

Убедитесь, что SSL режим установлен правильно:

1. Зайдите в Cloudflare Dashboard
2. Выберите домен `richislav.com`
3. Перейдите в **SSL/TLS** → **Overview**
4. Установите режим: **Full** (рекомендуется) или **Full (strict)**

**Важно:** Если у вас еще не настроен SSL на сервере через certbot, используйте режим **Full**, а не **Full (strict)**.

## 8. Временное решение - проверка через hosts файл

Если ничего не помогает, можно временно использовать hosts файл для проверки:

### Windows:
Откройте `C:\Windows\System32\drivers\etc\hosts` как администратор и добавьте:
```
YOUR_SERVER_IP santa.richislav.com
```

### macOS/Linux:
```bash
sudo nano /etc/hosts
```
Добавьте:
```
YOUR_SERVER_IP santa.richislav.com
```

**Важно:** После проверки удалите эту строку!

## 9. Проверка с другого устройства/сети

Попробуйте открыть сайт:
- С мобильного устройства (через мобильный интернет, не WiFi)
- С другого компьютера
- Через VPN

Это поможет определить, проблема локальная или глобальная.

## 10. Проверка Cloudflare статуса

Убедитесь, что в Cloudflare:
- Домен активирован (не в режиме "Development Mode")
- Нет правил, блокирующих трафик (Firewall Rules)
- Rate Limiting не блокирует запросы

## Типичные ошибки браузера и решения

### "DNS_PROBE_FINISHED_NXDOMAIN"
- DNS еще не полностью распространился (подождите 5-10 минут)
- Неправильная A-запись (проверьте IP адрес)

### "ERR_CONNECTION_REFUSED"
- Сервер не принимает подключения (проверьте nginx и файрвол)
- Неправильный порт в nginx конфигурации

### "ERR_SSL_PROTOCOL_ERROR" или "ERR_CERT_AUTHORITY_INVALID"
- Проблема с SSL сертификатом
- Неправильный SSL режим в Cloudflare
- Сертификат еще не получен (используйте HTTP или режим "Full" в Cloudflare)

### "ERR_CONNECTION_TIMED_OUT"
- Файрвол блокирует подключение
- nginx не запущен
- Неправильный IP адрес в A-записи

## Команды для быстрой проверки на сервере

```bash
# Полная проверка за одну команду
echo "=== IP адрес ===" && curl -s ifconfig.me && \
echo -e "\n=== Статус nginx ===" && sudo systemctl is-active nginx && \
echo "=== Порты ===" && sudo ss -tlnp | grep -E ':(80|443)' && \
echo "=== Файрвол ===" && sudo ufw status | head -5 && \
echo "=== nginx config ===" && sudo nginx -t 2>&1 | tail -1
```
