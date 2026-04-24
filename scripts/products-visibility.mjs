// cham-oil-capsule 가격을 249,000원으로 조정하고 공개 상태로,
// 나머지 모든 제품은 비공개(published=false) 로 설정.
// fs seed + Vercel Blob 동기 기록.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put, list, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB_DIR = path.join(ROOT, 'data', 'db');

const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const PREFIX = (process.env.BLOB_DATA_PREFIX ?? 'fd290ae46c4cb398d2afcdc4fc7cfe95').replace(
  /[^a-zA-Z0-9_-]/g,
  ''
);

const file = path.join(DB_DIR, 'products.json');
const products = JSON.parse(fs.readFileSync(file, 'utf-8'));

const VISIBLE_ID = 'cham-oil-capsule';
const NEW_PRICE = 249000;
const NEW_PRICE_DISPLAY = '249,000원';

for (const p of products) {
  if (p.id === VISIBLE_ID) {
    p.published = true;
    p.price = NEW_PRICE;
    p.priceDisplay = NEW_PRICE_DISPLAY;
    // 1병 variant 존재 시 동기화
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        if (v.id === 'v-cap-30' || /30캡슐/.test(v.label ?? '')) {
          v.price = NEW_PRICE;
          v.priceDisplay = NEW_PRICE_DISPLAY;
        }
      }
    }
    console.log(`+ ${p.id}: 공개 + 가격 ${NEW_PRICE_DISPLAY}`);
  } else {
    p.published = false;
    console.log(`- ${p.id}: 비공개 (published=false)`);
  }
}

const body = JSON.stringify(products, null, 2);
fs.writeFileSync(file, body, 'utf-8');
console.log(`\nfs seed 저장 (${body.length} bytes)`);

const pathname = `${PREFIX}/products.json`;
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
console.log(`Blob 저장: ${res.url}`);
