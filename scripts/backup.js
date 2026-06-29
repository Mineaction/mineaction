/**
 * Reverse of migrate.js: pulls the CURRENT data out of Supabase and writes it
 * into /data/*.json. Use this to snapshot the live content into the git repo as
 * a backup (so GitHub mirrors what admins have edited on the site).
 *
 *   node scripts/backup.js
 *
 * Note: the live source of truth is Supabase. These JSON files are a backup /
 * local-dev seed only — editing them does NOT change the live site.
 * `users` is intentionally skipped so password hashes are not written to git.
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

const TABLES = ['settings', 'stats', 'regions', 'timeline', 'activities', 'donors', 'news', 'gallery', 'contacts', 'charts'];

(async () => {
  console.log('→ Exporting Supabase → data/*.json …\n');
  for (const t of TABLES) {
    const order = t === 'settings' ? 'key' : 'id';
    const { data, error } = await sb.from(t).select('*').order(order, { ascending: true });
    if (error) { console.error(`❌ ${t}:`, error.message); continue; }
    fs.writeFileSync(path.join(DATA_DIR, t + '.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ ${t}: ${data.length} rows`);
  }
  console.log('\n🎉 Backup complete. Review with `git diff data/`, then commit.');
  process.exit(0);
})();
