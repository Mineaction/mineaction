-- ════════════════════════════════════════════════════════════════
--  TNMAC – Supabase schema
--  Run this once in Supabase → SQL Editor (New query → paste → Run).
--  Then run `node scripts/migrate.js` locally to load existing content.
-- ════════════════════════════════════════════════════════════════

-- ── USERS ───────────────────────────────────────────────────────
create table if not exists users (
  id          bigint generated always as identity primary key,
  username    text unique not null,
  password    text not null,          -- bcrypt hash
  role        text not null default 'editor',
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── SETTINGS (key-value) ────────────────────────────────────────
create table if not exists settings (
  key    text primary key,
  value  text,
  label  text,
  type   text
);

-- ── STATS ───────────────────────────────────────────────────────
create table if not exists stats (
  id          bigint generated always as identity primary key,
  key         text,
  icon        text,
  value_en    text,
  label_en    text,
  label_ru    text,
  label_tj    text,
  badge       text,
  badge_type  text default 'up',
  color       text default '#c0392b',
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── REGIONS ─────────────────────────────────────────────────────
create table if not exists regions (
  id          bigint generated always as identity primary key,
  name        text,
  pct         int default 0,
  area_km2    text,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── TIMELINE ────────────────────────────────────────────────────
create table if not exists timeline (
  id          bigint generated always as identity primary key,
  year        text,
  title_en    text,
  title_ru    text,
  title_tj    text,
  body_en     text,
  body_ru     text,
  body_tj     text,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── ACTIVITIES ──────────────────────────────────────────────────
create table if not exists activities (
  id          bigint generated always as identity primary key,
  icon        text,
  title_en    text,
  title_ru    text,
  title_tj    text,
  body_en     text,
  body_ru     text,
  body_tj     text,
  tag_en      text,
  tag_ru      text,
  tag_tj      text,
  color       text default '#c0392b',
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── DONORS ──────────────────────────────────────────────────────
create table if not exists donors (
  id          bigint generated always as identity primary key,
  name        text,
  flag        text,
  website     text,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── NEWS ────────────────────────────────────────────────────────
create table if not exists news (
  id            bigint generated always as identity primary key,
  title_en      text,
  title_ru      text,
  title_tj      text,
  excerpt_en    text,
  excerpt_ru    text,
  excerpt_tj    text,
  body_en       text,
  body_ru       text,
  body_tj       text,
  image         text,
  link          text,
  attachments   jsonb default '[]'::jsonb,
  poll          jsonb,
  published_at  date,
  is_published  int default 1,
  created_at    timestamptz default now(),
  updated_at    timestamptz
);

-- ── GALLERY ─────────────────────────────────────────────────────
create table if not exists gallery (
  id          bigint generated always as identity primary key,
  title_en    text,
  title_ru    text,
  title_tj    text,
  image       text,
  category    text default 'general',
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── CONTACTS ────────────────────────────────────────────────────
create table if not exists contacts (
  id          bigint generated always as identity primary key,
  name        text,
  name_en     text,
  title_en    text,
  title_ru    text,
  title_tj    text,
  phone       text,
  email       text,
  photo       text,
  level       int default 1,
  parent_id   bigint,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── CHARTS (interactive data visualisations) ────────────────────
create table if not exists charts (
  id          bigint generated always as identity primary key,
  type        text default 'bar',          -- line | bar | doughnut
  title_en    text,
  title_ru    text,
  title_tj    text,
  labels      jsonb default '[]'::jsonb,    -- ["2019","2020", ...]
  data        jsonb default '[]'::jsonb,    -- [10, 20, ...]
  unit        text,
  color       text,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────
-- The Node server connects with the service_role key, which BYPASSES RLS.
-- The browser never talks to Supabase directly (all reads go through the API),
-- so we enable RLS with no policies → anon/public clients get zero access,
-- while the server retains full access. This keeps the database locked down.
alter table users      enable row level security;
alter table settings   enable row level security;
alter table stats      enable row level security;
alter table regions    enable row level security;
alter table timeline   enable row level security;
alter table activities enable row level security;
alter table donors     enable row level security;
alter table news       enable row level security;
alter table gallery    enable row level security;
alter table contacts   enable row level security;
alter table charts     enable row level security;

-- ── STORAGE BUCKET for images/photos ────────────────────────────
-- Public bucket so <img> URLs load in the browser. Uploads happen server-side
-- with the service_role key.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Allow public READ of objects in the media bucket (so images display).
create policy "public read media"
  on storage.objects for select
  using ( bucket_id = 'media' );
