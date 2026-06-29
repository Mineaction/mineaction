/**
 * TNMAC – JSON-file database engine (LOCAL DEV FALLBACK)
 * Used when SUPABASE_URL is not set. Stores each collection in data/{name}.json.
 * Exposes the SAME async interface as db/supabase.js so server.js code is identical.
 *
 * NOTE: file writes do NOT persist on serverless hosts (Vercel) — that is exactly
 * why production must use Supabase. This module is for local development only.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}

function filePath(name) { return path.join(DATA_DIR, name + '.json'); }

function readDB(name) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch { return []; }
}

function writeDB(name, data) {
  try {
    fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn(`writeDB(${name}) skipped — read-only fs:`, e.message);
  }
}

function nextId(rows) {
  return rows.length ? Math.max(...rows.map(r => r.id || 0)) + 1 : 1;
}

const db = {
  // ── read ────────────────────────────────────────────────
  async find(col, predicate) {
    const rows = readDB(col);
    return predicate ? rows.filter(predicate) : rows;
  },
  async findOne(col, predicate) {
    return readDB(col).find(predicate) || null;
  },
  async findById(col, id) {
    return readDB(col).find(r => r.id === parseInt(id)) || null;
  },

  // ── write ───────────────────────────────────────────────
  async insert(col, doc) {
    const rows = readDB(col);
    const newDoc = { ...doc, id: nextId(rows), created_at: new Date().toISOString() };
    rows.push(newDoc);
    writeDB(col, rows);
    return newDoc;
  },
  async update(col, id, updates) {
    const rows = readDB(col);
    const idx = rows.findIndex(r => r.id === parseInt(id));
    if (idx === -1) return false;
    rows[idx] = { ...rows[idx], ...updates, updated_at: new Date().toISOString() };
    writeDB(col, rows);
    return true;
  },
  async delete(col, id) {
    const rows = readDB(col);
    const filtered = rows.filter(r => r.id !== parseInt(id));
    writeDB(col, filtered);
    return rows.length !== filtered.length;
  },

  // ── settings (key-value) ────────────────────────────────
  async getSetting(key) {
    const found = readDB('settings').find(r => r.key === key);
    return found ? found.value : null;
  },
  async getAllSettings() {
    const obj = {};
    readDB('settings').forEach(r => obj[r.key] = r.value);
    return obj;
  },
  async getAllSettingsRaw() { return readDB('settings'); },
  async setSettings(obj) {
    const rows = readDB('settings');
    for (const [key, value] of Object.entries(obj)) {
      const idx = rows.findIndex(r => r.key === key);
      if (idx >= 0) rows[idx].value = value;
      else rows.push({ key, value });
    }
    writeDB('settings', rows);
  }
};

// ════════════════════════════════════════════════════════
//  SEED – only runs if data files don't exist yet
// ════════════════════════════════════════════════════════
require('./seed')(filePath, writeDB, fs, bcrypt);

console.log('✅ TNMAC Database (JSON local mode) ready');
module.exports = db;
