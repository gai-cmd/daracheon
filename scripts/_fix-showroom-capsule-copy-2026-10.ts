/**
 * 2026-10-03 운영 Blob 문구 정정 (코드 배포 4fb9e10 과 짝).
 *  1) pages.showroom — 'Daracheon' → 'Daeracheon' (hero.titleEn · intro.tag · visit.addressEn)
 *     /showroom 과 /brand-story 쇼룸 챕터가 같은 데이터를 읽는다.
 *  2) products[daerachoen-cham-agarwood-oil-capsule].description — 함량을 포장 표시사항 기준으로
 *     ("하루 2~3mL · 정확하게 3mL" → "1캡슐 507.5mg 에 3,000mcg(3mg, 0.59%)")
 *
 * 기대값과 다르면 건너뛴다(어드민에서 이미 고쳤거나 문구가 바뀐 경우 덮어쓰지 않음).
 * 쓰기 전 원본을 저장소 밖 백업 폴더(backup-to-local.mjs 와 같은 ~/Backups/zoellife)에 남긴다. prefix·토큰은 env 로만 주입 (비밀값 하드코딩 금지).
 *
 * dry-run:  npx tsx scripts/_fix-showroom-capsule-copy-2026-10.ts
 * 실제 쓰기: npx tsx scripts/_fix-showroom-capsule-copy-2026-10.ts --commit
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { put, list } from '@vercel/blob';

const COMMIT = process.argv.includes('--commit');

const SHOWROOM_EDITS: Array<[path: string, from: string, to: string]> = [
  ['hero.titleEn', 'Daracheon Agarwood Showroom', 'Daeracheon Agarwood Showroom'],
  ['intro.tag', 'Daracheon Agarwood Showroom', 'Daeracheon Agarwood Showroom'],
  ['visit.addressEn', 'Dong Nai Province, Vietnam — Daracheon Direct Showroom', 'Dong Nai Province, Vietnam — Daeracheon Direct Showroom'],
];

const CAPSULE_SLUG = 'daerachoen-cham-agarwood-oil-capsule';
const CAPSULE_FROM =
  '100% 아갈로차 품종 오일 원액의 하루 섭취 권장량은 2~3mL이며 이 캡슐 제품에는 정확하게 3mL가 포함돼 있습니다.';
const CAPSULE_TO =
  '포장 표시 기준 1캡슐(507.5mg)에는 침향나무 수지가 침착된 수간목오일이 3,000mcg(3mg, 0.59%) 들어 있으며, 1일 1회 1캡슐을 섭취합니다.';

function getParent(root: any, path: string) {
  const parts = path.split('.');
  const key = parts.pop()!;
  let cur: any = root;
  for (const p of parts) cur = cur?.[p];
  return { parent: cur, key };
}

async function load(prefix: string, name: string, token: string) {
  const blobPath = `${prefix}/${name}.json`;
  const { blobs } = await list({ prefix: `${prefix}/${name}`, limit: 20, token });
  const hit = blobs.find((b) => b.pathname === blobPath);
  if (!hit) throw new Error(`prod blob 미발견: ${name}.json`);
  const raw = await fetch(`${hit.url}?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.text());
  return { blobPath, raw, data: JSON.parse(raw) };
}

async function save(blobPath: string, data: unknown, token: string) {
  await put(blobPath, JSON.stringify(data, null, 2), {
    access: 'public', token, addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
  });
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const prefixRaw = process.env.BLOB_DATA_PREFIX;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN 미설정');
  if (!prefixRaw) throw new Error('BLOB_DATA_PREFIX 미설정');
  const prefix = prefixRaw.replace(/[^a-zA-Z0-9_-]/g, '');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  // ── 1) pages.showroom ──
  const pages = await load(prefix, 'pages', token);
  const showroom = pages.data.showroom;
  let pageChanges = 0;
  if (!showroom) console.log('? pages.showroom 없음');
  for (const [path, from, to] of SHOWROOM_EDITS) {
    const { parent, key } = getParent(showroom, path);
    if (!parent) { console.log(`? showroom.${path} — 경로 없음`); continue; }
    if (parent[key] === to) { console.log(`= showroom.${path} — 이미 반영됨`); continue; }
    if (parent[key] !== from) { console.log(`! showroom.${path} — 기대값 불일치, 건너뜀: ${JSON.stringify(parent[key])}`); continue; }
    parent[key] = to; pageChanges++; console.log(`~ showroom.${path}`);
  }
  // 위 3곳 외에 쇼룸 데이터에 남은 'Daracheon' 이 있으면 알려만 준다(자동 수정 안 함).
  const leftover = JSON.stringify(showroom ?? {}).match(/[^"]{0,40}Daracheon[^"]{0,40}/g);
  if (leftover) console.log(`  ※ 쇼룸에 남은 Daracheon: ${leftover.join(' | ')}`);

  // ── 2) products — 오일 캡슐 설명 ──
  const products = await load(prefix, 'products', token);
  const list_: any[] = Array.isArray(products.data) ? products.data : products.data.items ?? [];
  const cap = list_.find((p) => p?.slug === CAPSULE_SLUG);
  let productChanges = 0;
  if (!cap) console.log(`? 제품 ${CAPSULE_SLUG} 없음`);
  else if (typeof cap.description !== 'string') console.log('? 캡슐 description 없음');
  else if (cap.description.includes(CAPSULE_TO)) console.log('= 캡슐 description — 이미 반영됨');
  else if (!cap.description.includes(CAPSULE_FROM)) console.log(`! 캡슐 description — 기대 문장 없음, 건너뜀:\n  ${cap.description}`);
  else { cap.description = cap.description.replace(CAPSULE_FROM, CAPSULE_TO); productChanges++; console.log('~ 캡슐 description'); }

  if (!COMMIT) { console.log(`\n[dry-run] 변경 예정 pages ${pageChanges}건 · products ${productChanges}건 — blob 미변경`); return; }

  const backupDir = path.join(process.env.BACKUP_LOCAL_DIR || path.join(os.homedir(), 'Backups', 'zoellife'), `blob-fix-${stamp}`);
  mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  if (pageChanges) {
    writeFileSync(path.join(backupDir, 'pages.json'), pages.raw, { mode: 0o600 });
    await save(pages.blobPath, pages.data, token);
    console.log(`✔ pages.json 갱신 (${pageChanges}건)`);
  }
  if (productChanges) {
    writeFileSync(path.join(backupDir, 'products.json'), products.raw, { mode: 0o600 });
    await save(products.blobPath, products.data, token);
    console.log(`✔ products.json 갱신 (${productChanges}건)`);
  }
  if (!pageChanges && !productChanges) console.log('변경 없음');
  else console.log(`  원본 백업: ${backupDir}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
