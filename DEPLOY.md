# Развёртывание TNMAC: GitHub → Supabase → Vercel

Сайт хранит **данные в Supabase (Postgres)** и **фото в Supabase Storage**.
Локально без Supabase сайт работает в режиме JSON-файлов (для разработки).

> ⚠️ Почему раньше изменения в админке «исчезали» на Vercel: данные писались в
> `data/*.json` и фото — в папку `uploads/`. На Vercel файловая система доступна
> только для чтения, поэтому запись молча терялась. Теперь всё идёт в Supabase.

---

## 1. Создать проект Supabase

1. Зайти на https://supabase.com → **New project** (запомните пароль БД).
2. Когда проект создан, открыть **SQL Editor → New query**, вставить весь файл
   [`supabase-schema.sql`](supabase-schema.sql) и нажать **Run**.
   Это создаёт таблицы, включает защиту (RLS) и публичный bucket `media` для фото.
3. Открыть **Project Settings → API** и скопировать:
   - **Project URL** → это `SUPABASE_URL`
   - **service_role** ключ (секретный!) → это `SUPABASE_SERVICE_KEY`

   `service_role` — только для сервера. Никогда не публиковать в браузере/репозитории.

---

## 2. Загрузить существующий контент в Supabase

На своём компьютере, в папке проекта:

```bash
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Открыть `.env` и заполнить `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`.
Сгенерировать секрет:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Затем загрузить данные из `data/*.json` (новости, статистику, контакты и т.д.):

```bash
npm run migrate
```

Проверить в Supabase → **Table editor**, что таблицы заполнились.
Логин админа по умолчанию: **admin / Admin@TNMAC2024!** (смените пароль после входа).

(Можно проверить локально против Supabase: `npm start` → http://localhost:3000)

---

## 3. Залить код на GitHub

В аккаунте **mineaction** уже создан репозиторий. Привязать и запушить:

```bash
git add .
git commit -m "Migrate storage to Supabase (Postgres + Storage)"
git branch -M main
git remote add origin https://github.com/mineaction/ИМЯ-РЕПО.git
git push -u origin main
```

> Если `origin` уже существует: `git remote set-url origin <URL>`.
> Файл `.env` НЕ попадёт в репозиторий (он в `.gitignore`) — это правильно.

---

## 4. Развернуть на Vercel

1. https://vercel.com → **Add New… → Project** → импортировать репозиторий `mineaction`.
2. Framework Preset: **Other** (настройки уже в `vercel.json`). Build/Output не трогать.
3. До деплоя открыть **Settings → Environment Variables** и добавить (Production + Preview):

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | URL проекта Supabase |
   | `SUPABASE_SERVICE_KEY` | service_role ключ |
   | `SUPABASE_BUCKET` | `media` |
   | `JWT_SECRET` | тот же длинный секрет, что в `.env` |

4. Нажать **Deploy**.

После деплоя:
- Сайт: `https://<проект>.vercel.app`
- Админка: `https://<проект>.vercel.app/admin`

Теперь вход под админом и любые изменения (новости, фото, статистика, контакты)
**сохраняются в Supabase** и видны на сайте сразу — на всех устройствах.

---

## Локальная разработка без Supabase

Просто не задавайте `SUPABASE_URL` (пустой или нет `.env`) — сайт будет читать/писать
`data/*.json` и сохранять фото в `uploads/`. Удобно для офлайн-правок, но эти изменения
живут только на вашем компьютере.

## Переменные окружения

| Переменная | Назначение |
|-----------|-----------|
| `SUPABASE_URL` | URL проекта; если пусто → локальный JSON-режим |
| `SUPABASE_SERVICE_KEY` | service_role ключ (доступ сервера к БД/Storage) |
| `SUPABASE_BUCKET` | bucket для фото, по умолчанию `media` |
| `JWT_SECRET` | подпись токенов входа в админку |
