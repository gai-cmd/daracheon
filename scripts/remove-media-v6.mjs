// /media 5번째 영상 (v6 동나이 유기농 침향 농장) 제거
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put, list, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}
const PREFIX = (process.env.BLOB_DATA_PREFIX ?? 'fd290ae46c4cb398d2afcdc4fc7cfe95').replace(/[^a-zA-Z0-9_-]/g, '');

const file = path.join(ROOT, 'data', 'db', 'media.json');
const media = JSON.parse(fs.readFileSync(file, 'utf-8'));
const before = media.length;
const filtered = media.filter((m) => m.id !== 'v6');
console.log(`media: ${before} → ${filtered.length}`);

const body = JSON.stringify(filtered, null, 2);
fs.writeFileSync(file, body, 'utf-8');

const pathname = `${PREFIX}/media.json`;
try {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  const existing = blobs.find((b) => b.pathname === pathname);
  if (existing) await del(existing.url);
} catch {}
const res = await put(pathname, body, {
  access: 'public',
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'application/json',
  cacheControlMaxAge: 0,
});
console.log(`blob: ${res.url}`);
