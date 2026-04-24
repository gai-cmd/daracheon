// 옛 db/*.json 블롭을 새 BLOB_DATA_PREFIX 로 이주하며 숫자 오류(10ha·17,000·20ha)
// 및 한글 가독성(문장 단위 문단 나누기) 를 일괄 수정.
//
// 실행: node scripts/migrate-db-blobs.mjs
// 필요: .env.local → BLOB_READ_WRITE_TOKEN, BLOB_DATA_PREFIX

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { list, put, del } from '@vercel/blob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB_DIR = path.join(ROOT, 'data', 'db');

// .env.local 로드
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const NEW_PREFIX = (process.env.BLOB_DATA_PREFIX ?? 'fd290ae46c4cb398d2afcdc4fc7cfe95').replace(
  /[^a-zA-Z0-9_-]/g,
  ''
);
const OLD_PREFIX = 'db';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN not set (check .env.local)');
}
if (NEW_PREFIX === OLD_PREFIX) {
  throw new Error(`NEW_PREFIX (${NEW_PREFIX}) === OLD_PREFIX, aborting to avoid data loss`);
}

/**
 * 텍스트 치환 — 숫자 오류 수정.
 * 단어 경계 사용해서 Google Drive 파일 ID 같은 것 안 건드림.
 */
function fixNumbers(s) {
  return s
    // 10ha 부지 → 200ha 부지
    .replace(/\b10ha\s+부지/g, '200ha 부지')
    // 17,000그루 → 400만 그루
    .replace(/17,?000\s*그루/g, '400만 그루')
    // 직영 20ha → 직영 200ha (하띤 농장 특정)
    .replace(/(직영|하띤성?|Ha\s*Tinh)\s+20ha\b/g, '$1 200ha')
    // 단독 20ha → 200ha (글로벌 안전 — URL 안의 20ha 는 숫자 경계 때문에 영향 없음)
    .replace(/(^|[^0-9a-zA-Z_-])20ha\b/g, '$1200ha')
    // 하띤성 10ha → 하띤성 200ha
    .replace(/하띤성?\s+10ha\b/g, (m) => m.replace('10ha', '200ha'))
    // 10ha 규모 → 200ha 규모
    .replace(/\b10ha\s+규모/g, '200ha 규모');
}

/**
 * 한글 문장 나누기.
 * 마침표·물음표·느낌표 뒤에 공백+한글 이 오면 줄바꿈(\n) 으로 분리.
 * 영문 Aquilaria Agallocha Roxburgh(AAR) 같은 단어 뒤 마침표 포함.
 */
function splitKoreanSentences(s) {
  if (typeof s !== 'string') return s;
  // 단락 구분자(\n\n) 은 건드리지 않음 — 단일 \n 만 더 추가
  return s.replace(/([.!?][)"'」]*)\s+(?=[가-힣(])/g, '$1\n');
}

/**
 * JSON 객체를 재귀적으로 순회해 모든 문자열에 변환 적용.
 * includeReadability 플래그 false 면 숫자만 고침 (pages.json 외 안전).
 */
function transformAll(obj, includeReadability = false) {
  if (typeof obj === 'string') {
    let s = fixNumbers(obj);
    if (includeReadability) s = splitKoreanSentences(s);
    return s;
  }
  if (Array.isArray(obj)) return obj.map((v) => transformAll(v, includeReadability));
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = transformAll(v, includeReadability);
    return out;
  }
  return obj;
}

async function fetchBlob(pathname) {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  const match = blobs.find((b) => b.pathname === pathname);
  if (!match) return null;
  const res = await fetch(`${match.url}?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetch ${pathname} → ${res.status}`);
  return { url: match.url, body: await res.text() };
}

async function writeBlob(pathname, body) {
  return put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}

async function main() {
  console.log(`[migrate] OLD=${OLD_PREFIX}/  NEW=${NEW_PREFIX}/`);

  const { blobs: oldBlobs } = await list({ prefix: `${OLD_PREFIX}/`, limit: 100 });
  const jsonBlobs = oldBlobs.filter(
    (b) => b.pathname.endsWith('.json') && !b.pathname.includes('__health_probe__')
  );
  console.log(`[migrate] found ${jsonBlobs.length} old blobs`);

  for (const b of jsonBlobs) {
    const filename = b.pathname.replace(`${OLD_PREFIX}/`, '').replace('.json', '');
    console.log(`\n--- ${filename} (${b.size} bytes)`);

    const fetched = await fetchBlob(b.pathname);
    if (!fetched) {
      console.warn(`  cannot fetch, skip`);
      continue;
    }

    let data;
    try {
      data = JSON.parse(fetched.body);
    } catch (err) {
      console.error(`  JSON parse error: ${err.message} — skip`);
      continue;
    }

    const applyReadability = filename === 'pages';
    const fixed = transformAll(data, applyReadability);

    const newBody = JSON.stringify(fixed, null, 2);
    const newPathname = `${NEW_PREFIX}/${filename}.json`;

    // 기존 new-prefix 파일 있으면 삭제 후 덮어쓰기 (CDN 갱신)
    try {
      const { blobs: existing } = await list({ prefix: newPathname, limit: 1 });
      const match = existing.find((x) => x.pathname === newPathname);
      if (match) {
        await del(match.url);
        console.log(`  deleted prior new-prefix file`);
      }
    } catch { /* ignore */ }

    const res = await writeBlob(newPathname, newBody);
    console.log(`  wrote ${newPathname}  → ${res.url.split('/').pop()}`);

    // fs seed 도 동기화 (다음 배포에 포함되도록 — .vercelignore whitelist)
    const sensitiveFiles = new Set(['admin-users', 'audit-log', 'password-reset-tokens', 'inquiries', 'rate-limit']);
    if (!sensitiveFiles.has(filename)) {
      const fsPath = path.join(DB_DIR, `${filename}.json`);
      try {
        fs.writeFileSync(fsPath, newBody, 'utf-8');
        console.log(`  synced fs seed: ${fsPath}`);
      } catch (err) {
        console.warn(`  fs seed write failed: ${err.message}`);
      }
    }

    // 옛 blob 삭제
    try {
      await del(b.url);
      console.log(`  deleted old blob ${b.pathname}`);
    } catch (err) {
      console.warn(`  old-blob delete failed: ${err.message}`);
    }
  }

  console.log('\n[migrate] done');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
