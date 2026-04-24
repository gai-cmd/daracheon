// Drive 에서 다운받은 로컬 이미지(scripts/drive-cache/dc-XX.jpg)를
// Vercel Blob 에 업로드하고 products.json 에 URL 을 기록.
//
// 실행: node scripts/drive-upload-products.mjs
// 필요: .env.local 에 BLOB_READ_WRITE_TOKEN

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CACHE = path.join(__dirname, 'drive-cache');
const DB_FILE = path.join(ROOT, 'data', 'db', 'products.json');

// .env.local 수동 로드 (Node 내장 로더는 .env.local 읽지 않음)
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN not set (check .env.local)');
}

// 제품 id → [드라이브 dc 번호 리스트] 매핑.
// 첫 번째 = main image, 나머지 = gallery (main 도 gallery 앞에 포함).
const PRODUCT_IMAGES = {
  'cham-oil-capsule':    [13, 14, 17, 8],
  'cham-oil-raw':        [28],
  'cham-pill-chimhyang': [21],
  'cham-pill-gibo':      [23, 22],
  'cham-water':          [10, 11],
  'cham-tea-paramignya': [25, 26],
  'cham-tea-water-set':  [25, 11],
  'cham-stick':          [20, 19, 7],
  'cham-incense-line':   [38],
  'cham-beads':          [1, 2, 5, 24, 7],
};

async function uploadImage(localPath, pathname) {
  const buf = fs.readFileSync(localPath);
  console.log(`  put ${pathname} (${(buf.length / 1024).toFixed(1)} KB)...`);
  const res = await put(pathname, buf, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'image/jpeg',
  });
  return res.url;
}

// 드라이브 dc 번호 → Blob URL 캐시 (중복 업로드 방지)
const uploadCache = new Map();

async function uploadByDcNum(num) {
  if (uploadCache.has(num)) return uploadCache.get(num);
  const nn = String(num).padStart(2, '0');
  const local = path.join(CACHE, `dc-${nn}.jpg`);
  if (!fs.existsSync(local)) {
    console.warn(`  !! missing ${local}`);
    return null;
  }
  const blobPath = `uploads/products/drive-${nn}-${Date.now()}.jpg`;
  const url = await uploadImage(local, blobPath);
  uploadCache.set(num, url);
  return url;
}

async function main() {
  const products = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  console.log(`Loaded ${products.length} products`);

  for (const product of products) {
    const imgNums = PRODUCT_IMAGES[product.id];
    if (!imgNums || imgNums.length === 0) {
      console.log(`- ${product.id}: no mapping, skip`);
      continue;
    }
    console.log(`+ ${product.id}: uploading ${imgNums.length} image(s)`);
    const urls = [];
    for (const num of imgNums) {
      const url = await uploadByDcNum(num);
      if (url) urls.push(url);
    }
    if (urls.length === 0) continue;
    product.image = urls[0];
    product.gallery = urls;
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(products, null, 2), 'utf-8');
  console.log(`\nWrote ${DB_FILE}`);

  // data/db/ 는 gitignored 라 커밋 안 됨. 프로덕션 반영을 위해 Blob 에도 기록.
  // 경로: <BLOB_DATA_PREFIX>/products.json (production 과 동일 prefix)
  const prefix = (process.env.BLOB_DATA_PREFIX ?? 'db').replace(/[^a-zA-Z0-9_-]/g, '');
  const dbPathname = `${prefix}/products.json`;
  const body = JSON.stringify(products, null, 2);
  console.log(`\nUploading DB blob: ${dbPathname}`);
  // 기존 blob 삭제 후 put — CDN 캐시 무효화
  try {
    const { list, del } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: dbPathname, limit: 1 });
    const existing = blobs.find((b) => b.pathname === dbPathname);
    if (existing) {
      await del(existing.url);
      console.log(`  deleted existing: ${existing.url}`);
    }
  } catch (err) {
    console.warn('  existing-check failed (continuing):', err.message);
  }
  const dbRes = await put(dbPathname, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
  console.log(`  wrote: ${dbRes.url}`);

  console.log('\nUpload summary:');
  for (const [num, url] of uploadCache) console.log(`  #${num}: ${url}`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
