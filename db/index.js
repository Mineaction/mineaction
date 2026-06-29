/**
 * Database selector.
 *   • SUPABASE_URL set  → Supabase (Postgres + Storage)  — production / Vercel
 *   • otherwise         → local JSON files               — local development
 */
require('dotenv').config();

const useSupabase = !!process.env.SUPABASE_URL;
module.exports = useSupabase ? require('./supabase') : require('./json');
module.exports.isSupabase = useSupabase;
