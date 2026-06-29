require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

const db = require('./db');
const { persistFile } = require('./lib/storage');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tnmac_super_secret_2024_key';

// ── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ── Multer (memory storage in all modes; lib/storage persists the buffer) ─
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /jpeg|jpg|png|gif|webp|svg/.test(file.mimetype))
});

// Wrap async route handlers so rejected promises become 500s instead of hanging.
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Auth Middleware ──────────────────────────────────────
function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════
app.post('/api/auth/login', wrap(async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findOne('users', u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: user.username, role: user.role });
}));

app.post('/api/auth/change-password', authRequired, wrap(async (req, res) => {
  const { current, newPass } = req.body;
  const user = await db.findOne('users', u => u.id === req.user.id);
  if (!bcrypt.compareSync(current, user.password))
    return res.status(400).json({ error: 'Current password is wrong' });
  await db.update('users', user.id, { password: bcrypt.hashSync(newPass, 10) });
  res.json({ ok: true });
}));

// ── User Management (superadmin only) ────────────────────
function superadminOnly(req, res, next) {
  if (req.user?.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
  next();
}
app.get('/api/admin/users', authRequired, superadminOnly, wrap(async (req, res) => {
  const users = (await db.find('users')).map(u => ({ id:u.id, username:u.username, role:u.role, created_at:u.created_at }));
  res.json(users);
}));
app.post('/api/admin/users', authRequired, superadminOnly, wrap(async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (await db.findOne('users', u => u.username === username))
    return res.status(400).json({ error: 'Username already exists' });
  const doc = await db.insert('users', { username, password: bcrypt.hashSync(password, 10), role: role || 'editor' });
  res.json({ id: doc.id, ok: true });
}));
app.put('/api/admin/users/:id', authRequired, superadminOnly, wrap(async (req, res) => {
  const { username, password, role } = req.body;
  const updates = { username, role };
  if (password) updates.password = bcrypt.hashSync(password, 10);
  await db.update('users', req.params.id, updates);
  res.json({ ok: true });
}));
app.delete('/api/admin/users/:id', authRequired, superadminOnly, wrap(async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  await db.delete('users', req.params.id);
  res.json({ ok: true });
}));

// ════════════════════════════════════════════════════════
//  PUBLIC API
// ════════════════════════════════════════════════════════
app.get('/api/settings', wrap(async (req, res) => res.json(await db.getAllSettings())));

app.get('/api/stats', wrap(async (req, res) => {
  res.json((await db.find('stats')).sort((a,b) => a.sort_order - b.sort_order));
}));

app.get('/api/news', wrap(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const rows = (await db.find('news', n => n.is_published === 1))
    .sort((a,b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(offset, offset + limit);
  res.json(rows);
}));

app.get('/api/news/:id', wrap(async (req, res) => {
  const row = await db.findOne('news', n => n.id === parseInt(req.params.id) && n.is_published === 1);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
}));

app.get('/api/activities', wrap(async (req, res) => {
  res.json((await db.find('activities')).sort((a,b) => a.sort_order - b.sort_order));
}));

app.get('/api/timeline', wrap(async (req, res) => {
  res.json((await db.find('timeline')).sort((a,b) => a.sort_order - b.sort_order));
}));

app.get('/api/donors', wrap(async (req, res) => {
  res.json((await db.find('donors')).sort((a,b) => a.sort_order - b.sort_order));
}));

app.get('/api/regions', wrap(async (req, res) => {
  res.json((await db.find('regions')).sort((a,b) => a.sort_order - b.sort_order));
}));

app.get('/api/gallery', wrap(async (req, res) => {
  res.json((await db.find('gallery')).sort((a,b) => a.sort_order - b.sort_order));
}));

app.get('/api/contacts', wrap(async (req, res) => {
  res.json((await db.find('contacts')).sort((a,b) => a.sort_order - b.sort_order));
}));

// ════════════════════════════════════════════════════════
//  ADMIN API
// ════════════════════════════════════════════════════════

// Settings
app.get('/api/admin/settings', authRequired, wrap(async (req, res) => res.json(await db.getAllSettingsRaw())));
app.put('/api/admin/settings', authRequired, wrap(async (req, res) => {
  await db.setSettings(req.body);
  res.json({ ok: true });
}));

// Dashboard
app.get('/api/admin/dashboard', authRequired, wrap(async (req, res) => {
  const news = await db.find('news');
  res.json({
    news_total: news.length,
    news_published: news.filter(n => n.is_published === 1).length,
    activities_total: (await db.find('activities')).length,
    donors_total: (await db.find('donors')).length,
    timeline_total: (await db.find('timeline')).length,
    latest_news: news.sort((a,b) => new Date(b.created_at)-new Date(a.created_at))
      .slice(0,5).map(n=>({ id:n.id, title_en:n.title_en, published_at:n.published_at }))
  });
}));

// News CRUD
app.get('/api/admin/news', authRequired, wrap(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json((await db.find('news')).sort((a,b) => new Date(b.published_at)-new Date(a.published_at)).slice(0,limit));
}));

app.post('/api/admin/news', authRequired, upload.fields([
  {name:'image',maxCount:1}, {name:'attachments',maxCount:10}
]), wrap(async (req, res) => {
  const d = req.body;
  const files = req.files || {};
  const image = files.image?.[0] ? await persistFile(files.image[0]) : (d.image || null);
  const attachments = await Promise.all((files.attachments || []).map(async f => ({
    name: f.originalname, url: await persistFile(f), type: f.mimetype, size: f.size
  })));
  let poll = null;
  if (d.poll) { try { poll = JSON.parse(d.poll); } catch(e){} }
  const doc = await db.insert('news', {
    title_en:d.title_en, title_ru:d.title_ru||null, title_tj:d.title_tj||null,
    excerpt_en:d.excerpt_en||null, excerpt_ru:d.excerpt_ru||null, excerpt_tj:d.excerpt_tj||null,
    body_en:d.body_en||null, body_ru:d.body_ru||null, body_tj:d.body_tj||null,
    image, link:d.link||null, attachments, poll,
    published_at:d.published_at||new Date().toISOString().slice(0,10),
    is_published: d.is_published !== undefined ? parseInt(d.is_published) : 1
  });
  res.json({ id: doc.id, ok: true });
}));

app.put('/api/admin/news/:id', authRequired, upload.fields([
  {name:'image',maxCount:1}, {name:'attachments',maxCount:10}
]), wrap(async (req, res) => {
  const d = req.body;
  const files = req.files || {};
  const existing = await db.findById('news', req.params.id);
  const image = files.image?.[0] ? await persistFile(files.image[0]) : (d.image || existing?.image || null);
  const newAttachments = await Promise.all((files.attachments || []).map(async f => ({
    name: f.originalname, url: await persistFile(f), type: f.mimetype, size: f.size
  })));
  const attachments = [...(existing?.attachments || []), ...newAttachments];
  let poll = existing?.poll || null;
  if (d.poll) { try { poll = JSON.parse(d.poll); } catch(e){} }
  await db.update('news', req.params.id, {
    title_en:d.title_en, title_ru:d.title_ru||null, title_tj:d.title_tj||null,
    excerpt_en:d.excerpt_en||null, excerpt_ru:d.excerpt_ru||null, excerpt_tj:d.excerpt_tj||null,
    body_en:d.body_en||null, body_ru:d.body_ru||null, body_tj:d.body_tj||null,
    image, link:d.link||null, attachments, poll,
    published_at:d.published_at, is_published: parseInt(d.is_published)||1
  });
  res.json({ ok: true });
}));

// Vote on poll
app.post('/api/news/:id/vote', wrap(async (req, res) => {
  const item = await db.findById('news', req.params.id);
  if (!item?.poll) return res.status(404).json({error:'No poll'});
  const idx = parseInt(req.body.option);
  if (isNaN(idx) || !item.poll.options[idx]) return res.status(400).json({error:'Invalid option'});
  item.poll.options[idx].votes = (item.poll.options[idx].votes || 0) + 1;
  await db.update('news', req.params.id, { poll: item.poll });
  res.json({ poll: item.poll });
}));

app.delete('/api/admin/news/:id', authRequired, wrap(async (req, res) => {
  await db.delete('news', req.params.id);
  res.json({ ok: true });
}));

// Stats
app.get('/api/admin/stats', authRequired, wrap(async (req, res) => {
  res.json((await db.find('stats')).sort((a,b) => a.sort_order - b.sort_order));
}));
app.put('/api/admin/stats/:id', authRequired, wrap(async (req, res) => {
  const d = req.body;
  await db.update('stats', req.params.id, {
    icon:d.icon, value_en:d.value_en, label_en:d.label_en,
    label_ru:d.label_ru||null, label_tj:d.label_tj||null,
    badge:d.badge||null, badge_type:d.badge_type||'up',
    color:d.color||'#c0392b', sort_order:parseInt(d.sort_order)||0
  });
  res.json({ ok: true });
}));

// Activities
app.get('/api/admin/activities', authRequired, wrap(async (req, res) => {
  res.json((await db.find('activities')).sort((a,b) => a.sort_order - b.sort_order));
}));
app.post('/api/admin/activities', authRequired, wrap(async (req, res) => {
  const d = req.body;
  const doc = await db.insert('activities', {
    icon:d.icon, title_en:d.title_en, title_ru:d.title_ru||null, title_tj:d.title_tj||null,
    body_en:d.body_en, body_ru:d.body_ru||null, body_tj:d.body_tj||null,
    tag_en:d.tag_en||null, tag_ru:d.tag_ru||null, tag_tj:d.tag_tj||null,
    color:d.color||'#c0392b', sort_order:parseInt(d.sort_order)||0
  });
  res.json({ id: doc.id, ok: true });
}));
app.put('/api/admin/activities/:id', authRequired, wrap(async (req, res) => {
  const d = req.body;
  await db.update('activities', req.params.id, {
    icon:d.icon, title_en:d.title_en, title_ru:d.title_ru||null, title_tj:d.title_tj||null,
    body_en:d.body_en, body_ru:d.body_ru||null, body_tj:d.body_tj||null,
    tag_en:d.tag_en||null, tag_ru:d.tag_ru||null, tag_tj:d.tag_tj||null,
    color:d.color||'#c0392b', sort_order:parseInt(d.sort_order)||0
  });
  res.json({ ok: true });
}));
app.delete('/api/admin/activities/:id', authRequired, wrap(async (req, res) => {
  await db.delete('activities', req.params.id); res.json({ ok: true });
}));

// Timeline
app.get('/api/admin/timeline', authRequired, wrap(async (req, res) => {
  res.json((await db.find('timeline')).sort((a,b) => a.sort_order - b.sort_order));
}));
app.post('/api/admin/timeline', authRequired, wrap(async (req, res) => {
  const d = req.body;
  const doc = await db.insert('timeline', {
    year:d.year, title_en:d.title_en, title_ru:d.title_ru||null, title_tj:d.title_tj||null,
    body_en:d.body_en, body_ru:d.body_ru||null, body_tj:d.body_tj||null, sort_order:parseInt(d.sort_order)||0
  });
  res.json({ id: doc.id, ok: true });
}));
app.put('/api/admin/timeline/:id', authRequired, wrap(async (req, res) => {
  const d = req.body;
  await db.update('timeline', req.params.id, {
    year:d.year, title_en:d.title_en, title_ru:d.title_ru||null, title_tj:d.title_tj||null,
    body_en:d.body_en, body_ru:d.body_ru||null, body_tj:d.body_tj||null, sort_order:parseInt(d.sort_order)||0
  });
  res.json({ ok: true });
}));
app.delete('/api/admin/timeline/:id', authRequired, wrap(async (req, res) => {
  await db.delete('timeline', req.params.id); res.json({ ok: true });
}));

// Donors
app.get('/api/admin/donors', authRequired, wrap(async (req, res) => {
  res.json((await db.find('donors')).sort((a,b) => a.sort_order - b.sort_order));
}));
app.post('/api/admin/donors', authRequired, wrap(async (req, res) => {
  const d = req.body;
  const doc = await db.insert('donors', { name:d.name, flag:d.flag||null, website:d.website||null, sort_order:parseInt(d.sort_order)||0 });
  res.json({ id: doc.id, ok: true });
}));
app.put('/api/admin/donors/:id', authRequired, wrap(async (req, res) => {
  const d = req.body;
  await db.update('donors', req.params.id, { name:d.name, flag:d.flag||null, website:d.website||null, sort_order:parseInt(d.sort_order)||0 });
  res.json({ ok: true });
}));
app.delete('/api/admin/donors/:id', authRequired, wrap(async (req, res) => {
  await db.delete('donors', req.params.id); res.json({ ok: true });
}));

// Regions
app.get('/api/admin/regions', authRequired, wrap(async (req, res) => {
  res.json((await db.find('regions')).sort((a,b) => a.sort_order - b.sort_order));
}));
app.put('/api/admin/regions/:id', authRequired, wrap(async (req, res) => {
  const d = req.body;
  await db.update('regions', req.params.id, { name:d.name, pct:parseInt(d.pct)||0, area_km2:d.area_km2||null, sort_order:parseInt(d.sort_order)||0 });
  res.json({ ok: true });
}));

// Gallery CRUD
app.get('/api/admin/gallery', authRequired, wrap(async (req, res) => {
  res.json((await db.find('gallery')).sort((a,b) => a.sort_order - b.sort_order));
}));
app.post('/api/admin/gallery', authRequired, upload.single('image'), wrap(async (req, res) => {
  const d = req.body;
  const image = req.file ? await persistFile(req.file) : (d.image || '');
  const doc = await db.insert('gallery', {
    title_en:d.title_en||'', title_ru:d.title_ru||'', title_tj:d.title_tj||'',
    image, category:d.category||'general', sort_order:parseInt(d.sort_order)||0
  });
  res.json({ id: doc.id, ok: true });
}));
app.put('/api/admin/gallery/:id', authRequired, upload.single('image'), wrap(async (req, res) => {
  const d = req.body;
  const existing = await db.findById('gallery', req.params.id);
  const image = req.file ? await persistFile(req.file) : (d.image || existing?.image || '');
  await db.update('gallery', req.params.id, {
    title_en:d.title_en||'', title_ru:d.title_ru||'', title_tj:d.title_tj||'',
    image, category:d.category||'general', sort_order:parseInt(d.sort_order)||0
  });
  res.json({ ok: true });
}));
app.delete('/api/admin/gallery/:id', authRequired, wrap(async (req, res) => {
  await db.delete('gallery', req.params.id); res.json({ ok: true });
}));

// Contacts CRUD
app.get('/api/admin/contacts', authRequired, wrap(async (req, res) => {
  res.json((await db.find('contacts')).sort((a,b) => a.sort_order - b.sort_order));
}));
app.post('/api/admin/contacts', authRequired, upload.single('photo'), wrap(async (req, res) => {
  const d = req.body;
  const photo = req.file ? await persistFile(req.file) : (d.photo || '');
  const doc = await db.insert('contacts', {
    name:d.name||'', title_en:d.title_en||'', title_ru:d.title_ru||'', title_tj:d.title_tj||'',
    phone:d.phone||'', email:d.email||'', photo, sort_order:parseInt(d.sort_order)||0
  });
  res.json({ id: doc.id, ok: true });
}));
app.put('/api/admin/contacts/:id', authRequired, upload.single('photo'), wrap(async (req, res) => {
  const d = req.body;
  const existing = await db.findById('contacts', req.params.id);
  const photo = req.file ? await persistFile(req.file) : (d.photo || existing?.photo || '');
  await db.update('contacts', req.params.id, {
    name:d.name||'', title_en:d.title_en||'', title_ru:d.title_ru||'', title_tj:d.title_tj||'',
    phone:d.phone||'', email:d.email||'', photo, sort_order:parseInt(d.sort_order)||0
  });
  res.json({ ok: true });
}));
app.delete('/api/admin/contacts/:id', authRequired, wrap(async (req, res) => {
  await db.delete('contacts', req.params.id); res.json({ ok: true });
}));

// Image Upload
app.post('/api/admin/upload', authRequired, upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: await persistFile(req.file) });
}));

// ── SPA Fallbacks ─────────────────────────────────────────
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── Error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

// ── Start ─────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🇹🇯  TNMAC Website  →  http://localhost:${PORT}`);
    console.log(`🔐  Admin Panel    →  http://localhost:${PORT}/admin`);
    console.log(`📊  API            →  http://localhost:${PORT}/api\n`);
  });
}

module.exports = app;
