/**
 * Unified file-upload helper.
 *   • Supabase mode → upload buffer to the `media` Storage bucket, return public URL.
 *   • local mode    → write buffer to ./uploads, return /uploads/<file>.
 *
 * In both modes multer uses memoryStorage(), so handlers receive file.buffer.
 */
const path = require('path');
const fs = require('fs');
const db = require('../db');

const BUCKET = process.env.SUPABASE_BUCKET || 'media';
const uploadsDir = path.join(__dirname, '..', 'uploads');

function uniqueName(originalname) {
  const ext = path.extname(originalname || '') || '';
  return Date.now() + '-' + Math.random().toString(36).slice(2) + ext;
}

/**
 * Persist a single multer (memoryStorage) file. Returns the public URL string,
 * or null when no file was provided.
 */
async function persistFile(file) {
  if (!file || !file.buffer) return null;
  const name = uniqueName(file.originalname);

  if (db.isSupabase) {
    const key = 'uploads/' + name;
    const { error } = await db._client.storage
      .from(BUCKET)
      .upload(key, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) { console.error('[storage] upload:', error.message); throw error; }
    const { data } = db._client.storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  // local fallback
  try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
  fs.writeFileSync(path.join(uploadsDir, name), file.buffer);
  return '/uploads/' + name;
}

module.exports = { persistFile };
