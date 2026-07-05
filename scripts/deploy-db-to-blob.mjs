#!/usr/bin/env node
/**
 * 선택한 data/db/<name>.json 콘텐츠 파일을 운영(Vercel Blob) prefix 경로로 배포한다.
 *
 * Why: 이 사이트는 런타임에 Blob 을 읽는다(force-dynamic). 시드(data/db/*.json) 를
 *      git 에 커밋·푸시해도 프로덕션은 바뀌지 않는다 — Blob 에 직접 써야 라이브 반영된다.
 *      슬랙/Claude 세션이 브랜치 커밋까지는 하지만 이 마지막 단계에서 막히던 문제를 자동화한다.
 *
 * 안전장치: data/db 에는 콘텐츠(pages, products …) 와 런타임 수집 데이터(inquiries,
 *      reviews, audit-log …) 가 섞여 있다. 후자를 시드에서 덮으면 프로덕션 실데이터가 날아간다.
 *      그래서 화이트리스트에 없는 파일은 FORCE=1 없이는 배포하지 않는다.
 *      또한 덮어쓰기 전에 현재 운영 Blob 사본을 backups/blob/ 로 백업한다.
 *
 * 실행:
 *   node scripts/deploy-db-to-blob.mjs                 # 기본: pages
 *   node scripts/deploy-db-to-blob.mjs pages products  # 여러 개
 *   FORCE=1 node scripts/deploy-db-to-blob.mjs reviews # 런타임 파일 강제
 *
 * 필요 env: BLOB_READ_WRITE_TOKEN (필수), BLOB_DATA_PREFIX (없으면 운영 기본값 사용)
 *   로컬은 .env.local 에서 자동 로드, CI 는 GitHub Actions secrets 로 주입.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put, list } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'data', 'db');

// 로컬 실행 편의: .env.local 이 있으면(그리고 아직 주입 안 됐으면) 읽어 온다.
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PREFIX = (process.env.BLOB_DATA_PREFIX || 'fd290ae46c4cb398d2afcdc4fc7cfe95').replace(
  /[^a-zA-Z0-9_-]/g,
  ''
);
if (!TOKEN) {
  console.error('FATAL: BLOB_READ_WRITE_TOKEN 미설정 (.env.local 또는 Actions secret 확인)');
  process.exit(1);
}

// 시드에서 배포해도 안전한 콘텐츠 파일
const ALLOW = new Set([
  'pages',
  'products',
  'company',
  'faq',
  'media',
  'navigation',
  'broadcasts',
  'announcement',
  'productCategories',
  'blogCategories',
  'blogPosts',
]);
// 런타임에 쌓이는 데이터 — 시드로 덮으면 프로덕션 실데이터 손실
const RUNTIME = new Set(['admin-users', 'audit-log', 'inquiries', 'rate-limit', 'reviews', 'qr-codes']);

const force = process.env.FORCE === '1';
const names = (process.argv.slice(2).length ? process.argv.slice(2) : ['pages']).map((f) =>
  f.replace(/\.json$/, '')
);

let failed = 0;
let deployed = 0;

for (const name of names) {
  if (!ALLOW.has(name) && !force) {
    const why = RUNTIME.has(name) ? '런타임 수집 데이터' : '화이트리스트에 없음';
    console.error(`SKIP ${name}: ${why} — 배포 금지 (의도적이면 FORCE=1)`);
    failed++;
    continue;
  }
  const local = path.join(DB, `${name}.json`);
  if (!fs.existsSync(local)) {
    console.error(`SKIP ${name}: ${local} 없음`);
    failed++;
    continue;
  }
  const body = fs.readFileSync(local, 'utf-8');
  try {
    JSON.parse(body);
  } catch (e) {
    console.error(`SKIP ${name}: JSON 파싱 실패 — ${e.message}`);
    failed++;
    continue;
  }

  const pathname = `${PREFIX}/${name}.json`;

  // 덮어쓰기 전 현재 운영 사본 백업
  try {
    const { blobs } = await list({ prefix: pathname, limit: 1, token: TOKEN });
    const existing = blobs.find((b) => b.pathname === pathname);
    if (existing) {
      const prev = await fetch(existing.url + '?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.text());
      const bdir = path.join(ROOT, 'backups', 'blob');
      fs.mkdirSync(bdir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const bfile = path.join(bdir, `${name}.${stamp}.json`);
      fs.writeFileSync(bfile, prev);
      console.log(`  ↳ 백업: ${path.relative(ROOT, bfile)} (${prev.length}B)`);
    } else {
      console.log(`  ↳ 운영 Blob 없음 — 신규 생성`);
    }
  } catch (e) {
    console.warn(`  ↳ 백업 경고 ${name}: ${e.message}`);
  }

  const r = await put(pathname, body, {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    cacheControlMaxAge: 0,
    token: TOKEN,
  });
  const verify = await fetch(r.url + '?t=' + Date.now(), { cache: 'no-store' }).then((x) => x.text());
  const ok = verify.length === body.length;
  console.log(`✓ ${name}.json → ${pathname} (${Buffer.byteLength(body)}B, verify ${ok ? 'OK' : 'LEN-DIFF'})`);
  console.log(`  → ${r.url}`);
  deployed++;
}

console.log(`\n배포 완료: ${deployed}개 성공, ${failed}개 스킵/실패`);
if (failed > 0 && deployed === 0) process.exit(1);
