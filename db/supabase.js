/**
 * TNMAC – Supabase (Postgres) database engine — PRODUCTION.
 * Same async interface as db/json.js, so server.js code is identical in both modes.
 *
 * Tables are small, so predicate-based reads fetch the collection and filter in JS,
 * preserving the exact semantics of the original JSON engine.
 *
 * Requires env vars:
 *   SUPABASE_URL          – https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  – service_role key (server-side only, never expose to client)
 */
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

async function rows(col) {
  const { data, error } = await sb.from(col).select('*');
  if (error) { console.error(`[supabase] select ${col}:`, error.message); return []; }
  return data || [];
}

const db = {
  // ── read ────────────────────────────────────────────────
  async find(col, predicate) {
    const data = await rows(col);
    return predicate ? data.filter(predicate) : data;
  },
  async findOne(col, predicate) {
    return (await rows(col)).find(predicate) || null;
  },
  async findById(col, id) {
    const { data, error } = await sb.from(col).select('*').eq('id', parseInt(id)).maybeSingle();
    if (error) { console.error(`[supabase] findById ${col}:`, error.message); return null; }
    return data || null;
  },

  // ── write ───────────────────────────────────────────────
  async insert(col, doc) {
    const { data, error } = await sb.from(col).insert(doc).select().single();
    if (error) { console.error(`[supabase] insert ${col}:`, error.message); throw error; }
    return data;
  },
  async update(col, id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await sb.from(col).update(payload).eq('id', parseInt(id)).select();
    if (error) { console.error(`[supabase] update ${col}:`, error.message); throw error; }
    return (data || []).length > 0;
  },
  async delete(col, id) {
    const { error } = await sb.from(col).delete().eq('id', parseInt(id));
    if (error) { console.error(`[supabase] delete ${col}:`, error.message); throw error; }
    return true;
  },

  // ── settings (key-value, PK = key) ──────────────────────
  async getSetting(key) {
    const { data } = await sb.from('settings').select('value').eq('key', key).maybeSingle();
    return data ? data.value : null;
  },
  async getAllSettings() {
    const { data } = await sb.from('settings').select('key,value');
    const obj = {};
    (data || []).forEach(r => obj[r.key] = r.value);
    return obj;
  },
  async getAllSettingsRaw() {
    const { data } = await sb.from('settings').select('*');
    return data || [];
  },
  async setSettings(obj) {
    for (const [key, value] of Object.entries(obj)) {
      // update value only, so label/type are preserved; insert if the key is new
      const { data } = await sb.from('settings').update({ value }).eq('key', key).select();
      if (!data || data.length === 0) {
        await sb.from('settings').insert({ key, value });
      }
    }
  },

  // expose raw client for storage uploads
  _client: sb
};

console.log('✅ TNMAC Database (Supabase mode) ready');
module.exports = db;
