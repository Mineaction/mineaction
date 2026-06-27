# 🇹🇯 TNMAC — Tajikistan National Mine Action Centre

**Официальный сайт Таджикского национального центра по разминированию**  
Полнофункциональный веб-сайт с административной панелью и поддержкой трёх языков (EN / RU / TJ).

---

## 🛠 Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Backend | Node.js 18+ · Express.js |
| База данных | JSON-файлы (без СУБД) |
| Frontend | Vanilla HTML · CSS · JavaScript |
| Аутентификация | JWT + bcryptjs |
| Загрузка файлов | Multer |
| Языки | English · Русский · Тоҷикӣ |

---

## ✨ Функции сайта

- 🌐 Полная трёхязычная поддержка (EN / RU / TJ)
- 📰 Новости с мультимедиа (фото, PDF, DOCX, опросы)
- 📊 Интерактивные графики (Chart.js)
- 🗺️ Карта регионов с статистикой заражения
- 🖼️ Галерея с автослайдшоу и фильтрами по категориям
- 👥 Иерархическая схема руководства (org chart)
- 🏅 Программы: разминирование, МБО, помощь пострадавшим
- ⚙️ Административная панель для управления всем контентом
- 👤 Управление пользователями (superadmin / editor)
- 📱 Адаптивный дизайн (мобильные устройства)

---

## 🚀 Запуск на локальном компьютере (Windows / Mac / Linux)

### Требования
- [Node.js](https://nodejs.org) версия **18 или выше**
- Git (опционально)

### Установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/BurjiBokhtar/mineaction.git
cd mineaction

# 2. Установить зависимости
npm install

# 3. Запустить сервер
npm start
```

### Открыть в браузере
- 🌐 **Сайт** → http://localhost:3000
- 🔐 **Админка** → http://localhost:3000/admin

### Данные для входа в админку
```
Логин:    admin
Пароль:   Admin@TNMAC2024!
```
> ⚠️ Смените пароль сразу после первого входа через Admin → Account

---

## 🖥 Развёртывание на VPS / выделенном сервере

### Требования к серверу
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+
- Открытый порт (80, 443 или любой другой)

### Шаг 1 — Установка Node.js (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # должно показать v18.x.x
```

### Шаг 2 — Загрузка проекта
```bash
# Через Git
git clone https://github.com/BurjiBokhtar/mineaction.git
cd mineaction
npm install

# Или через архив — распаковать в /var/www/tnmac
```

### Шаг 3 — Запуск через PM2 (работает постоянно, перезапускается после перезагрузки)
```bash
# Установить PM2
npm install -g pm2

# Запустить приложение
pm2 start server.js --name tnmac

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save

# Полезные команды PM2
pm2 status          # статус
pm2 logs tnmac      # логи
pm2 restart tnmac   # перезапуск
pm2 stop tnmac      # остановка
```

### Шаг 4 — Nginx как обратный прокси (если нужен порт 80/443)
```nginx
# /etc/nginx/sites-available/tnmac
server {
    listen 80;
    server_name mineaction.tj www.mineaction.tj;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Загруженные файлы
    location /uploads {
        alias /var/www/tnmac/uploads;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/tnmac /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 5 — SSL-сертификат (HTTPS бесплатно через Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mineaction.tj -d www.mineaction.tj
```

---

## 🌍 Развёртывание у хостинг-провайдера

### Вариант A — Railway.app (рекомендуется, бесплатный тариф)

1. Зарегистрируйся на [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Выбери репозиторий `mineaction`
4. Railway автоматически определит Node.js и запустит `npm start`
5. В настройках добавь переменную: `PORT = 3000`

> ✅ Готово! Сайт доступен по URL вида `https://xxx.railway.app`

### Вариант B — Vercel (только для просмотра, без сохранения файлов)

1. Зарегистрируйся на [vercel.com](https://vercel.com)
2. **Add New Project** → импортируй GitHub репозиторий
3. Vercel автоматически использует `vercel.json`

> ⚠️ На Vercel загрузка файлов и сохранение данных не работает (read-only файловая система). Только для демонстрации.

### Вариант C — Передача провайдеру (архив)

```bash
# Создать архив без node_modules
zip -r tnmac-site.zip . -x "node_modules/*" -x ".git/*" -x "uploads/*"
```

**Инструкция для провайдера:**
```
1. Распаковать архив на сервер
2. Установить Node.js 18+
3. В папке проекта: npm install
4. Запустить: node server.js  (или pm2 start server.js --name tnmac)
5. Порт по умолчанию: 3000 (задаётся через переменную PORT)
```

---

## 📁 Структура проекта

```
mineaction/
├── server.js              # Express API сервер
├── vercel.json            # Конфиг для Vercel
├── package.json
├── db/
│   └── init.js            # Движок БД + начальные данные
├── data/                  # JSON база данных
│   ├── news.json
│   ├── stats.json
│   ├── activities.json
│   ├── timeline.json
│   ├── regions.json
│   ├── donors.json
│   ├── gallery.json
│   ├── contacts.json
│   └── settings.json
├── public/                # Фронтенд (трёхъязычный)
│   ├── index.html
│   ├── logo.png
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── i18n.js        # Переводы EN/RU/TJ
│       └── main.js        # Логика фронтенда
├── admin/                 # Административная панель
│   ├── index.html         # Страница входа
│   └── dashboard.html     # Дашборд
└── uploads/               # Загруженные фото/файлы
```

---

## 🔑 Переменные окружения (опционально)

Создайте файл `.env` в корне проекта:

```env
PORT=3000
JWT_SECRET=your_secret_key_here_change_this
```

> На продакшн сервере обязательно смените `JWT_SECRET` на случайную строку длиной 32+ символа.

---

## 📞 Поддержка

- **Разработчик**: [IMRON](https://www.instagram.com/iammirzozoda)
- **Организация**: ГКРМТТ / TNMAC · [tnmac.gov.tj](https://tnmac.gov.tj)
- **Email**: info@tnmac.gov.tj

---

*Developed with ❤️ for peace and humanitarian mine action in Tajikistan*
