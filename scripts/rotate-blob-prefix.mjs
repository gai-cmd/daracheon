#!/usr/bin/env node
/**
 * BLOB_DATA_PREFIX 로테이션 — 콘텐츠 JSON 데이터 저장 경로(비밀 prefix)를
 * 새 값으로 옮긴다. (평문 노출됐던 prefix 를 무효화하는 defense-in-depth.)
 *
 * ── 왜 단순 env 변경이 아닌가 ────────────────────────────────────────────
 * 사이트의 모든 콘텐츠 JSON(inquiries·leads·pages·outbox·tomb·qr·_snapshots …)
 * 은 `<prefix>/…` 아래에 있다. Vercel env 의 BLOB_DATA_PREFIX 만 새 값으로
 * 바꾸면 앱이 '빈 새 경로'를 읽어 라이브 사이트가 데이터 없음 → 시드 폴백으로
 * 깨진 것처럼 보인다(데이터는 옛 경로에 그대로 있지만). 그래서 반드시:
 *   ① 옛 prefix → 새 prefix 로 전량 복사   ② 검증(개수·sha256 일치)
 *   ③ Vercel BLOB_DATA_PREFIX 를 새 값으로 교체 → 재배포 → 사이트 정상 확인
 *   ④ (충분히 안정된 뒤) 옛 prefix 삭제
 *
 * ── 안전 원칙 ───────────────────────────────────────────────────────────
 * - 기본은 DRY-RUN. 실제 복사는 `--apply` 를 명시해야만 한다.
 * - 복사는 '새 prefix 에 blob 추가'일 뿐 — 라이브 사이트가 읽는 옛 prefix 는
 *   건드리지 않으므로 복사(--apply)만으로는 사이트에 아무 영향이 없다.
 * - 옛 prefix 삭제는 별도 모드(--delete-old)로 분리하고 --apply --yes-delete-old
 *   를 모두 요구한다. env 교체·사이트 안정 확인 전에는 절대 실행 금지.
 * - 어떤 모드도 옛 prefix 를 자동 삭제하지 않는다(복사 모드는 순수 add).
 *
 * ── 사용 ────────────────────────────────────────────────────────────────
 *   # 0) 새 prefix 값 생성(추측 불가한 랜덤)
 *   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
 *
 *   # 1) 계획 확인(dry-run, 읽기만)
 *   node scripts/rotate-blob-prefix.mjs --new <newprefix>
 *
 *   # 2) 복사 실행(옛→새, 사이트 무영향)
 *   node scripts/rotate-blob-prefix.mjs --new <newprefix> --apply
 *
 *   # 3) 검증(옛/새 개수·sha256 대조)
 *   node scripts/rotate-blob-prefix.mjs --new <newprefix> --verify
 *
 *   #  → 여기서 Vercel BLOB_DATA_PREFIX 를 <newprefix> 로 교체 후 재배포,
 *   #    zoellife.com 데이터 정상 확인. 며칠 안정 관찰.
 *
 *   # 4) (안정 후) 옛 prefix 삭제
 *   node scripts/rotate-blob-prefix.mjs --old <oldprefix> --delete-old --apply --yes-delete-old
 *
 * 필요한 환경변수(.env.local 또는 셸):
 *   BLOB_READ_WRITE_TOKEN  (필수)
 *   BLOB_DATA_PREFIX       (--old 미지정 시 옛 prefix 로 사용)
 */

import { list, put, del } from '@vercel/blob';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── .env.local 로드(이미 주입된 값은 덮지 않음) ─────────────────────────────
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const sanitize = (p) => String(p || '').replace(/[^a-zA-Z0-9_-]/g, '');
const fail = (m) => {
  console.error(`\n✖ ${m}\n`);
  process.exit(1);
};
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const CONCURRENCY = 8;

if (!TOKEN) {
  fail(
    'BLOB_READ_WRITE_TOKEN 미설정 (.env.local 또는 셸 환경).\n' +
      '  vercel env pull .env.local --environment=production  으로 받으세요.',
  );
}

const APPLY = has('--apply');
const VERIFY = has('--verify');
const DELETE_OLD = has('--delete-old');
const FORCE = has('--force');
const YES_DELETE = has('--yes-delete-old');

const OLD = sanitize(opt('--old') ?? process.env.BLOB_DATA_PREFIX ?? '');
if (!OLD) fail('옛 prefix 를 알 수 없음 — BLOB_DATA_PREFIX 설정 또는 --old <prefix> 지정.');
const oldPrefix = `${OLD}/`;

// ── 공통 유틸 ───────────────────────────────────────────────────────────
async function listAll(prefix) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, limit: 1000, cursor, token: TOKEN });
    for (const b of page.blobs) {
      if (b.pathname.startsWith(prefix)) out.push({ pathname: b.pathname, url: b.url, size: b.size });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function pool(items, size, fn) {
  const q = [...items];
  let ok = 0;
  let ng = 0;
  const workers = Array.from({ length: Math.min(size, q.length) }, async () => {
    while (q.length) {
      const it = q.shift();
      try {
        await fn(it);
        ok++;
      } catch (err) {
        ng++;
        console.warn(`  ! 실패: ${it.pathname} — ${err?.message || err}`);
      }
    }
  });
  await Promise.all(workers);
  return { ok, ng };
}

async function fetchBuf(url) {
  const res = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || 'application/octet-stream';
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, ct };
}

const fmtSize = (n) => (n < 1024 ? `${n}B` : n < 1048576 ? `${(n / 1024).toFixed(1)}KB` : `${(n / 1048576).toFixed(2)}MB`);

// ── 모드 4: 옛 prefix 삭제 (강력 가드) ──────────────────────────────────
if (DELETE_OLD) {
  const items = await listAll(oldPrefix);
  const total = items.reduce((s, b) => s + (b.size || 0), 0);
  console.log(`\n[delete-old] 대상 prefix: ${oldPrefix}`);
  console.log(`  blob ${items.length}개, ${fmtSize(total)}`);
  if (!APPLY || !YES_DELETE) {
    console.log('\n  DRY-RUN — 실제 삭제하려면 --apply --yes-delete-old 를 모두 지정하세요.');
    console.log('  ⚠️ Vercel BLOB_DATA_PREFIX 를 새 값으로 교체하고 사이트 정상을 확인한 뒤에만 실행하세요.');
    for (const b of items.slice(0, 20)) console.log(`    - ${b.pathname}`);
    if (items.length > 20) console.log(`    … 외 ${items.length - 20}개`);
    process.exit(0);
  }
  console.log('\n  ⚠️ 삭제를 실행합니다 (복구 불가).');
  const { ok, ng } = await pool(items, CONCURRENCY, async (b) => {
    await del(b.url, { token: TOKEN });
  });
  console.log(`\n[delete-old] 완료 — 삭제 ${ok}, 실패 ${ng}`);
  process.exit(ng ? 1 : 0);
}

// ── 모드 1~3: 복사/검증 ─────────────────────────────────────────────────
const NEW = sanitize(opt('--new') ?? '');
if (!NEW) {
  fail(
    '새 prefix 미지정 — --new <prefix>.\n' +
      '  생성: node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))"',
  );
}
if (NEW === OLD) fail('새 prefix 가 옛 prefix 와 동일합니다.');
if (NEW === 'db') fail("새 prefix 'db' 는 예측 가능한 기본값이라 금지 — 랜덤 값을 쓰세요.");
if (NEW.length < 16) fail(`새 prefix 가 너무 짧습니다(${NEW.length}자) — 추측 방지를 위해 16자 이상 랜덤 권장.`);
const newPrefix = `${NEW}/`;

const oldItems = await listAll(oldPrefix);
const newItemsBefore = await listAll(newPrefix);
const totalSize = oldItems.reduce((s, b) => s + (b.size || 0), 0);

console.log(`\n옛 prefix: ${oldPrefix}  →  새 prefix: ${newPrefix}`);
console.log(`  복사 대상: blob ${oldItems.length}개, ${fmtSize(totalSize)}`);
if (newItemsBefore.length > 0) {
  console.log(`  ⚠️ 새 prefix 에 이미 blob ${newItemsBefore.length}개가 존재합니다.`);
  if (APPLY && !FORCE) fail('새 prefix 가 비어있지 않습니다 — 덮어쓰기를 허용하려면 --force.');
}

// ── 검증 모드 ──
if (VERIFY && !APPLY) {
  console.log('\n[verify] 옛/새 prefix 내용 sha256 대조…');
  const shaOf = async (items, prefix) => {
    const m = new Map();
    await pool(items, CONCURRENCY, async (b) => {
      const rest = b.pathname.slice(prefix.length);
      const { buf } = await fetchBuf(b.url);
      m.set(rest, createHash('sha256').update(buf).digest('hex'));
    });
    return m;
  };
  const [oldMap, newMap] = await Promise.all([shaOf(oldItems, oldPrefix), shaOf(newItemsBefore, newPrefix)]);
  let missing = 0;
  let mismatch = 0;
  for (const [rest, sha] of oldMap) {
    if (!newMap.has(rest)) {
      missing++;
      console.log(`  ✖ 새 prefix 에 없음: ${rest}`);
    } else if (newMap.get(rest) !== sha) {
      mismatch++;
      console.log(`  ✖ 내용 불일치: ${rest}`);
    }
  }
  const extra = [...newMap.keys()].filter((k) => !oldMap.has(k));
  console.log(
    `\n[verify] 옛 ${oldMap.size} / 새 ${newMap.size} — 누락 ${missing}, 불일치 ${mismatch}, 새쪽 추가 ${extra.length}`,
  );
  console.log(missing || mismatch ? '  → 아직 복사가 완전하지 않습니다.' : '  ✓ 옛 prefix 전량이 새 prefix 에 존재·일치합니다.');
  process.exit(missing || mismatch ? 1 : 0);
}

// ── 계획(dry-run) ──
if (!APPLY) {
  console.log('\n  DRY-RUN — 실제 복사하려면 --apply 를 지정하세요. (사이트 무영향: 새 경로에 add 만)');
  for (const b of oldItems.slice(0, 25)) console.log(`    ${b.pathname}  →  ${newPrefix}${b.pathname.slice(oldPrefix.length)}`);
  if (oldItems.length > 25) console.log(`    … 외 ${oldItems.length - 25}개`);
  console.log('\n  다음: --apply 로 복사 → --verify 로 대조 → Vercel env 교체·재배포 → (안정 후) --delete-old');
  process.exit(0);
}

// ── 복사 실행 ──
console.log('\n[copy] 옛 → 새 복사 시작 (사이트 무영향: 새 경로 add) …');
const { ok, ng } = await pool(oldItems, CONCURRENCY, async (b) => {
  const rest = b.pathname.slice(oldPrefix.length);
  const { buf, ct } = await fetchBuf(b.url);
  await put(`${newPrefix}${rest}`, buf, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: ct,
    cacheControlMaxAge: 0,
    token: TOKEN,
  });
});
console.log(`\n[copy] 완료 — 복사 ${ok}, 실패 ${ng}`);
if (ng) {
  console.log('  ! 일부 실패 — 재실행하면 idempotent(allowOverwrite)하게 재복사됩니다.');
  process.exit(1);
}
console.log('\n  다음 단계:');
console.log(`   1) node scripts/rotate-blob-prefix.mjs --new ${NEW} --verify   (대조)`);
console.log(`   2) Vercel BLOB_DATA_PREFIX 를 '${NEW}' 로 교체 → 재배포 → 사이트 데이터 정상 확인`);
console.log('   3) 며칠 안정 확인 후: --old <옛prefix> --delete-old --apply --yes-delete-old');
process.exit(0);
