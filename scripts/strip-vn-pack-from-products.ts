/**
 * 모든 제품의 gallery 에서 /uploads/vn/* (vn-pack 영상·현장 사진) 항목을 제거.
 * 어드민에서 일부 제품에 해당 항목이 남아 있던 경우 일괄 정리용.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();
import { put, list, del } from '@vercel/blob';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PREFIX = 'fd290ae46c4cb398d2afcdc4fc7cfe95/';

type Product = {
  slug: string;
  name: string;
  image?: string;
  gallery?: string[];
  [k: string]: unknown;
};

function isVnPack(url: string): boolean {
  return /\/uploads\/vn\//.test(url);
}

async function main() {
  if (!TOKEN) { console.error('no token'); process.exit(1); }

  const { blobs } = await list({ prefix: `${PREFIX}products.json`, limit: 1, token: TOKEN });
  const target = blobs.find((b) => b.pathname === `${PREFIX}products.json`);
  if (!target) { console.error('products.json not found in blob'); process.exit(1); }

  const r = await fetch(`${target.url}?v=${Date.now()}`, { cache: 'no-store' });
  const data = (await r.json()) as Product[];
  if (!Array.isArray(data)) { console.error('not array'); process.exit(1); }

  let touched = 0;
  for (const p of data) {
    const before = (p.gallery ?? []).slice();
    const after = before.filter((u) => !isVnPack(u));
    if (after.length !== before.length) {
      p.gallery = after;
      console.log(`  · ${p.slug}: ${before.length} -> ${after.length} (removed ${before.length - after.length})`);
      touched++;
    }
  }
  console.log(`▶ touched: ${touched}/${data.length}`);

  if (process.env.DRY_RUN === '1') {
    console.log('DRY_RUN — skip write');
    return;
  }
  if (touched === 0) {
    console.log('nothing to do');
    return;
  }

  // 기존 blob 삭제 후 재업로드 (CDN cache 무효화)
  try { await del(target.url, { token: TOKEN }); } catch (e) { console.warn('pre-write del skipped', e); }
  await put(`${PREFIX}products.json`, JSON.stringify(data, null, 2), {
    access: 'public', allowOverwrite: true, contentType: 'application/json',
    cacheControlMaxAge: 0, token: TOKEN,
  });
  console.log('OK products.json updated');
}
main().catch((e) => { console.error(e); process.exit(1); });
