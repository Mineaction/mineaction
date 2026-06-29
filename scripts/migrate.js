/**
 * One-time data migration: pushes everything in /data/*.json into Supabase.
 *
 * Usage (after creating tables with supabase-schema.sql):
 *   1. Put SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 *   2. node scripts/migrate.js
 *
 * Safe to re-run: each table is cleared, then re-loaded from the JSON files.
 * Row ids are reassigned by Postgres (the frontend always uses ids from the API,
 * so exact id values don't need to be preserved).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env first.');
  process.exit(1);
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const DATA_DIR = path.join(__dirname, '..', 'data');

// strip auto-managed columns so Postgres assigns them
function clean(row, dropId = true) {
  const r = { ...row };
  if (dropId) delete r.id;
  delete r.created_at;
  delete r.updated_at;
  return r;
}

function read(name) {
  const fp = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return []; }
}

async function loadCollection(table, { keepId = false, pk = 'id' } = {}) {
  const rows = read(table);
  if (!rows.length) { console.log(`• ${table}: no data file, skipped`); return; }

  // clear existing rows
  if (pk === 'key') await sb.from(table).delete().neq('key', '__none__');
  else await sb.from(table).delete().gte('id', 0);

  const payload = rows.map(r => clean(r, !keepId));
  const { error } = await sb.from(table).insert(payload);
  if (error) { console.error(`❌ ${table}:`, error.message); return; }
  console.log(`✅ ${table}: ${payload.length} rows`);
}

(async () => {
  console.log('→ Migrating data/*.json into Supabase…\n');

  // settings keep their natural key
  await loadCollection('settings', { pk: 'key' });

  for (const t of ['users', 'stats', 'regions', 'timeline', 'activities', 'donors', 'news', 'gallery', 'contacts']) {
    await loadCollection(t);
  }

  console.log('\n🎉 Migration complete. Verify in Supabase → Table editor.');
  process.exit(0);
})();
