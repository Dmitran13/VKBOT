# VK Subscription Bot

Бот и веб-панель администратора для управления платными подписками на закрытую группу ВКонтакте.

## Возможности

- Приём платежей через **YooKassa** (ЮKassa)
- Управление подписчиками: активация, продление, льготный период
- Рассылки через VK Long Poll
- Автоматические напоминания об истечении подписки (cron)
- Импорт подписчиков из VK
- Шаблоны сообщений
- Dashboard UI — полное управление через браузер

## Стек

- **Next.js 15** (App Router, TypeScript)
- **Prisma + SQLite**
- **Tailwind CSS + shadcn/ui**
- **PM2** — управление процессами
- **VK Long Poll API** — входящие сообщения
- **YooKassa API** — приём платежей
- **Nginx + Let's Encrypt** — HTTPS

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone https://github.com/YOUR_USERNAME/vk-subscription-bot.git
cd vk-subscription-bot
npm install
```

### 2. Настроить окружение

```bash
cp .env.example .env
```

Отредактировать `.env`:
```
DATABASE_URL=file:./dev.db
APP_URL=https://your-domain.duckdns.org
```

### 3. Инициализировать базу данных

```bash
DATABASE_URL=file:./dev.db npx prisma db push
node restore-settings.js
```

> В `restore-settings.js` замените `YOUR_*` плейсхолдеры на реальные значения перед запуском.

### 4. Запустить

```bash
# Dev режим
DATABASE_URL=file:./dev.db npm run dev

# Production (PM2)
npm run build
pm2 start ecosystem.config.js
pm2 save
```

---

## Настройки (хранятся в БД, управляются через Dashboard)

| Ключ | Описание |
|------|----------|
| `vk_access_token` | Токен доступа VK (сообщества) |
| `vk_group_id` | ID группы VK |
| `vk_confirmation_code` | Код подтверждения Callback API |
| `vk_callback_secret` | Секретный ключ Callback |
| `yookassa_shop_id` | ID магазина YooKassa |
| `yookassa_secret_key` | Секретный ключ YooKassa |
| `grace_period_days` | Льготный период после истечения (дней) |
| `reminder_days` | За сколько дней слать напоминания (напр. `7,3,1`) |
| `auto_remove_expired` | Автоудаление истёкших подписок |

---

## Архитектура процессов (PM2)

| Имя | Скрипт | Описание |
|-----|--------|----------|
| `vk-bot` | `next start -p 3000` | Admin panel + API |
| `vk-longpoll` | `longpoll-worker.js` | VK Long Poll Worker |

---

## Команды бота

| Сообщение | Ответ |
|-----------|-------|
| `старт`, `start`, `/start` | Список тарифов |
| `помощь`, `help` | Справка |
| `статус`, `моя подписка` | Статус подписки |
| `1`–`9` | Ссылка на оплату тарифа |
| Любое другое | Молчит если активный подписчик, иначе просит «старт» |

---

## HTTPS / Nginx

Пример конфига для Nginx + Let's Encrypt:

```nginx
server {
    listen 80;
    server_name your-domain.duckdns.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/your-domain.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.duckdns.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Получить сертификат:
```bash
certbot --nginx -d your-domain.duckdns.org
```

---

## Cron (напоминания)

```bash
crontab -e
# Добавить строку:
0 * * * * curl -s -X POST http://localhost:3000/api/cron/check-expirations >> /path/to/logs/cron.log 2>&1
```

---

## Лицензия

MIT
