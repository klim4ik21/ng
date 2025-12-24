# Диагностика проблем с DNS (Cloudflare)

Если сайт `santa.richislav.com` не доступен после настройки A-записи в Cloudflare, выполните следующие шаги диагностики.

## Шаг 1: Проверка A-записи в Cloudflare

1. Зайдите в Cloudflare Dashboard
2. Выберите домен `richislav.com`
3. Перейдите в **DNS** → **Records**
4. Найдите запись для `santa` (или `santa.richislav.com`)

**Правильная настройка:**
- **Type**: A
- **Name**: `santa` (или `santa.richislav.com`)
- **IPv4 address**: IP адрес вашего сервера (например, `123.45.67.89`)
- **Proxy status**: 
  - **DNS only** (серое облако) - если хотите прямой доступ к серверу
  - **Proxied** (оранжевое облако) - если используете Cloudflare Proxy

**Важно:**
- Если используете Cloudflare Proxy (оранжевое облако), убедитесь, что SSL/TLS режим установлен на "Full" или "Full (strict)"
- При использовании Proxy IP адрес в A-записи должен быть реальным IP вашего сервера
- Cloudflare Proxy может добавить задержку в распространение DNS

## Шаг 2: Проверка распространения DNS

### С локального компьютера

```bash
# Проверка DNS записи
nslookup santa.richislav.com

# Или используя dig (если установлен)
dig santa.richislav.com

# Проверка с другого DNS сервера (например, Google 8.8.8.8)
nslookup santa.richislav.com 8.8.8.8
```

### Онлайн-инструменты

1. **DNS Checker**: https://dnschecker.org/
   - Введите `santa.richislav.com`
   - Проверьте, какой IP возвращается

2. **MXToolbox**: https://mxtoolbox.com/DNSLookup.aspx
   - Введите `santa.richislav.com`

### С сервера

```bash
# Проверка DNS с самого сервера
dig santa.richislav.com
nslookup santa.richislav.com

# Проверка доступности сайта с сервера
curl -I http://santa.richislav.com
```

## Шаг 3: Проверка правильности IP адреса

Убедитесь, что IP адрес в A-записи совпадает с реальным IP вашего сервера:

```bash
# На сервере - узнать внешний IP
curl ifconfig.me
# или
curl ipinfo.io/ip
# или
wget -qO- ifconfig.me
```

Затем сравните этот IP с IP в A-записи Cloudflare.

## Шаг 4: Проверка Cloudflare Proxy статуса

### Если Proxy ВЫКЛЮЧЕН (серое облако - DNS only):

- DNS распространяется быстрее (обычно 1-5 минут)
- Прямое подключение к вашему серверу
- Используется IP адрес из A-записи напрямую
- Требуется настройка SSL на самом сервере (через certbot)

### Если Proxy ВКЛЮЧЕН (оранжевое облако - Proxied):

- DNS может распространяться дольше (5-30 минут)
- Трафик идет через Cloudflare
- Cloudflare автоматически предоставляет SSL (можно использовать "Flexible" SSL режим)
- **Важно**: Настройте SSL режим в Cloudflare:
  1. Зайдите в **SSL/TLS** → **Overview**
  2. Установите режим: **Full** или **Full (strict)**
     - **Full**: Cloudflare ↔ сервер (может быть самоподписанный сертификат)
     - **Full (strict)**: Cloudflare ↔ сервер (требуется валидный сертификат)

## Шаг 5: Очистка DNS кэша

### На Windows:
```cmd
ipconfig /flushdns
```

### На macOS:
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### На Linux:
```bash
sudo systemd-resolve --flush-caches
# или
sudo /etc/init.d/nscd restart
```

### В браузере:
- Chrome/Edge: `chrome://net-internals/#dns` → Clear host cache
- Firefox: Перезапустите браузер

## Шаг 6: Проверка файрвола на сервере

Убедитесь, что порты 80 и 443 открыты:

```bash
# Проверка статуса ufw
sudo ufw status

# Если нужно открыть порты
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверка с помощью netstat
sudo netstat -tulpn | grep -E ':(80|443)'
```

## Шаг 7: Проверка работы nginx на сервере

```bash
# Проверка статуса nginx
sudo systemctl status nginx

# Проверка конфигурации
sudo nginx -t

# Просмотр логов
sudo tail -f /var/log/nginx/santa-app-error.log

# Проверка, что nginx слушает правильные порты
sudo ss -tlnp | grep nginx
```

## Шаг 8: Проверка доступности сайта напрямую по IP

```bash
# С локального компьютера
curl -H "Host: santa.richislav.com" http://YOUR_SERVER_IP

# Замените YOUR_SERVER_IP на реальный IP вашего сервера
```

Если это работает, значит проблема только в DNS.

## Шаг 9: Временное решение - использование hosts файла

Для быстрого тестирования можно добавить запись в hosts файл:

### Windows:
`C:\Windows\System32\drivers\etc\hosts`
```
YOUR_SERVER_IP santa.richislav.com
```

### macOS/Linux:
`/etc/hosts`
```
YOUR_SERVER_IP santa.richislav.com
```

**Важно:** Удалите эту запись после того, как DNS заработает!

## Типичные проблемы и решения

### Проблема: DNS еще не распространился
**Решение:** Подождите 5-30 минут (при использовании Cloudflare Proxy может быть дольше)

### Проблема: Неправильный IP в A-записи
**Решение:** Обновите A-запись в Cloudflare с правильным IP

### Проблема: Cloudflare Proxy включен, но SSL не настроен
**Решение:** Установите SSL режим "Full" в Cloudflare (SSL/TLS → Overview)

### Проблема: Файрвол блокирует порты
**Решение:** Откройте порты 80 и 443 в файрволе

### Проблема: nginx не запущен или конфигурация неверна
**Решение:** Проверьте статус nginx и конфигурацию (`sudo nginx -t`)

## Проверочный чеклист

- [ ] A-запись создана в Cloudflare
- [ ] IP адрес в A-записи совпадает с IP сервера
- [ ] Прошло достаточно времени для распространения DNS (5-30 минут)
- [ ] Проверено через онлайн DNS checker'и
- [ ] Порты 80 и 443 открыты в файрволе
- [ ] nginx запущен и работает
- [ ] Конфигурация nginx корректна (`sudo nginx -t`)
- [ ] Если используется Cloudflare Proxy - SSL режим установлен на "Full"

## Полезные команды для диагностики

```bash
# На сервере - полная диагностика
echo "=== IP адрес сервера ==="
curl ifconfig.me
echo ""
echo "=== Статус nginx ==="
sudo systemctl status nginx
echo ""
echo "=== Проверка конфигурации nginx ==="
sudo nginx -t
echo ""
echo "=== Открытые порты ==="
sudo ss -tlnp | grep -E ':(80|443)'
echo ""
echo "=== Статус файрвола ==="
sudo ufw status
echo ""
echo "=== DNS запись ==="
dig santa.richislav.com +short
```

## Контакты для помощи

Если проблема не решается:
1. Проверьте логи Cloudflare (Analytics → Logs)
2. Проверьте логи nginx на сервере
3. Убедитесь, что домен правильно делегирован на Cloudflare nameservers
