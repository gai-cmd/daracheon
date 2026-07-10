#!/usr/bin/env node
/**
 * 로컬(내 Mac) 백업 — 프로덕션 Vercel Blob 데이터를 읽기 전용으로 내려받아
 * 로컬 디스크에 저장한다.
 *
 * 안전 원칙:
 *   - 라이브 DB(Blob)에 절대 쓰지 않는다. list + fetch(GET) 만 수행한다.
 *   - prefix 아래 전체(_snapshots/ 제외)를 받으므로 live 컬렉션뿐 아니라
 *     QR per-record 레코드(qr-events/*, qr-serials/*, qr-coupons/*)까지 포함된다.
 *
 * 사용:
 *   node scripts/backup-to-local.mjs [--dry-run] [--plain]
 *   (또는) npm run backup:local
 *
 * 필요한 환경변수(.env.local 또는 셸 환경):
 *   BLOB_READ_WRITE_TOKEN  (필수)  Vercel Blob 토큰
 *   BLOB_DATA_PREFIX       (필수)  프로덕션 데이터 prefix (비밀값 — 소스에 하드코딩 금지)
 *   BACKUP_ENCRYPTION_KEY  (선택)  설정 시 AES-256-GCM 로 암호화 저장(권장, PII 보호)
 *   BACKUP_LOCAL_DIR       (선택)  백업 루트. 기본: ~/Backups/zoellife
 *   BACKUP_KEEP            (선택)  보관할 백업 회차 수. 기본 30
 *
 * 복원은 이 스크립트가 하지 않는다(라이브 DB 쓰기 금지). 복원 절차는 README-BACKUP-LOCAL.md 참고.
 */

import { list } from '@vercel/blob';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createCipheriv, randomBytes, scryptSync, createHash } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const PLAIN = args.has('--plain');

// ── .env.local 로드(이미 주입된 값은 덮지 않음) ─────────────────────────────
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PREFIX_RAW = (process.env.BLOB_DATA_PREFIX || '').replace(/[^a-zA-Z0-9_-]/g, '');
const ENC_KEY = process.env.BACKUP_ENCRYPTION_KEY;
const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP || '30'));
const BACKUP_ROOT =
  process.env.BACKUP_LOCAL_DIR || path.join(os.homedir(), 'Backups', 'zoellife');

function fail(msg) {
  console.error(`FATAL: ${msg}`);
  process.exit(1);
}

if (!TOKEN) fail('BLOB_READ_WRITE_TOKEN 미설정 (.env.local 확인)');
// prefix 는 프로덕션 PII Blob 을 보호하는 비밀값 — 하드코딩 fallback 없이 반드시 주입.
if (!PREFIX_RAW) {
  fail(
    'BLOB_DATA_PREFIX 미설정 — 프로덕션 prefix 를 .env.local 에 추가하거나\n' +
      '       BLOB_DATA_PREFIX=<prefix> node scripts/backup-to-local.mjs 로 실행하세요.'
  );
}
const PREFIX = PREFIX_RAW.endsWith('/') ? PREFIX_RAW : `${PREFIX_RAW}/`;

// ── AES-256-GCM (src/lib/backup-crypto.ts 와 동일 포맷) ──────────────────────
function encryptString(plaintext) {
  const key = /^[0-9a-fA-F]{64}$/.test(ENC_KEY)
    ? Buffer.from(ENC_KEY, 'hex')
    : scryptSync(ENC_KEY, 'daracheon-backup-salt-v1', 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    cipher: ct.toString('base64'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    alg: 'aes-256-gcm',
    v: 1,
  });
}

const willEncrypt = Boolean(ENC_KEY) && !PLAIN;

async function main() {
  console.log(`[backup-local] prefix=${PREFIX.slice(0, 4)}…(${PREFIX.length}자) 대상 Blob 나열 중…`);

  // ── 1) prefix 아래 전체 blob 나열 (_snapshots/ 제외, cursor 페이지네이션) ──
  const blobs = [];
  let cursor;
  do {
    const page = await list({ token: TOKEN, prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const rel = b.pathname.startsWith(PREFIX) ? b.pathname.slice(PREFIX.length) : b.pathname;
      if (rel.startsWith('_snapshots/')) continue; // 서버측 스냅샷 히스토리는 제외
      if (!rel) continue;
      blobs.push({ rel, url: b.url, size: b.size, uploadedAt: b.uploadedAt });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  console.log(`[backup-local] 대상 ${blobs.length}개 (총 ${(blobs.reduce((s, b) => s + (b.size || 0), 0) / 1024).toFixed(1)}KB)`);
  if (blobs.length === 0) {
    fail('대상 Blob 이 0개입니다. BLOB_DATA_PREFIX 가 올바른 프로덕션 prefix 인지 확인하세요.');
  }
  if (DRY_RUN) {
    console.log('[backup-local] --dry-run: 다운로드 없이 종료. 상위 20개:');
    for (const b of blobs.slice(0, 20)) console.log(`  - ${b.rel} (${b.size}B)`);
    return;
  }

  // ── 2) 이번 회차 폴더 생성 ──
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(BACKUP_ROOT, `zoellife-backup-${stamp}`);
  // 0o700/0o600: 백업본에는 PII·비밀번호 해시가 들어간다(--plain 이면 평문). 소유자 전용.
  fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
  fs.chmodSync(BACKUP_ROOT, 0o700);

  // ── 3) 각 blob 다운로드 → (선택) 암호화 → 저장, 매니페스트 축적 ──
  const manifest = {
    createdAt: new Date().toISOString(),
    encrypted: willEncrypt,
    count: 0,
    totalBytes: 0,
    files: [],
  };
  let ok = 0;
  const failed = [];
  for (const b of blobs) {
    try {
      const res = await fetch(b.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const sha256 = createHash('sha256').update(text).digest('hex');
      const destRel = willEncrypt ? `${b.rel}.enc` : b.rel;
      const dest = path.join(outDir, destRel);
      fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
      const bodyToWrite = willEncrypt ? encryptString(text) : text;
      fs.writeFileSync(dest, bodyToWrite, { mode: 0o600 });
      manifest.files.push({ path: destRel, bytes: text.length, sha256, uploadedAt: b.uploadedAt });
      manifest.count++;
      manifest.totalBytes += text.length;
      ok++;
    } catch (err) {
      console.error(`[backup-local] 실패: ${b.rel} — ${err.message}`);
      failed.push(b.rel);
    }
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });

  // ── 4) 검증: 저장된 파일 수·매니페스트 일치 확인 ──
  if (failed.length > 0) {
    console.error(`[backup-local] ⚠️ ${failed.length}개 파일 다운로드 실패 — 이번 백업은 불완전합니다: ${failed.join(', ')}`);
  }
  console.log(`[backup-local] 저장 완료: ${outDir}`);
  console.log(`[backup-local] 파일 ${ok}/${blobs.length}개, ${(manifest.totalBytes / 1024).toFixed(1)}KB, 암호화=${willEncrypt ? 'ON(AES-256-GCM)' : 'OFF(평문)'}`);
  if (!willEncrypt) {
    console.warn('[backup-local] ⚠️ 평문 저장입니다. PII·비밀번호 해시가 포함되니 BACKUP_ENCRYPTION_KEY 설정을 권장합니다.');
  }

  // ── 5) 오래된 회차 정리(최근 KEEP개만 유지) ──
  const rounds = fs
    .readdirSync(BACKUP_ROOT)
    .filter((d) => d.startsWith('zoellife-backup-'))
    .sort();
  const excess = rounds.length - KEEP;
  if (excess > 0) {
    for (const d of rounds.slice(0, excess)) {
      fs.rmSync(path.join(BACKUP_ROOT, d), { recursive: true, force: true });
      console.log(`[backup-local] 오래된 백업 삭제: ${d}`);
    }
  }

  // 실패가 있으면 비정상 종료코드로 알림(launchd 로그·후속 처리용)
  if (failed.length > 0) process.exit(2);
}

main().catch((err) => fail(err?.message || String(err)));
