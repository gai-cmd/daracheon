#!/usr/bin/env node
/**
 * 복원 리허설 — 로컬 암호화 백업(Tier 4)이 "실제로 복원 가능한가"를
 * end-to-end 로 증명한다 (진단 P3 · "복원 리허설 통과 전 데이터 불가침" 원칙).
 *
 * 하는 일: 백업 회차 복호화 → 라이브와 무관한 격리 prefix
 * `_rehearsal-<타임스탬프>/` 에 업로드 → 다시 내려받아 sha256 전량 대조.
 * 이 경로가 통과하면 실제 복원(대상 prefix 만 라이브로 바꾼 동일 코드)이
 * 가능함이 증명된다.
 *
 * 안전 원칙:
 *   - 라이브 prefix(BLOB_DATA_PREFIX)는 읽지도 쓰지도 않는다.
 *   - 기본은 DRY-RUN(계획 출력만). 실제 업로드는 --apply 명시 필요.
 *   - 격리 prefix 정리는 별도 --cleanup <prefix> 모드 (삭제는 리허설 prefix 한정,
 *     `_rehearsal-` 로 시작하지 않으면 거부).
 *
 * 사용:
 *   node scripts/restore-rehearsal.mjs                     # dry-run (최신 회차)
 *   node scripts/restore-rehearsal.mjs --apply             # 리허설 실행
 *   node scripts/restore-rehearsal.mjs --apply --dir <경로> # 특정 회차
 *   node scripts/restore-rehearsal.mjs --cleanup _rehearsal-2026-...  # 정리
 */
import { put, list, del } from '@vercel/blob';
import { createDecipheriv, scryptSync, createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── env 로딩 (.env.local) ──────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const ENC_KEY = process.env.BACKUP_ENCRYPTION_KEY;
if (!TOKEN) fail('BLOB_READ_WRITE_TOKEN 미설정');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const dirIdx = args.indexOf('--dir');
const cleanupIdx = args.indexOf('--cleanup');

function fail(msg) {
  console.error(`[rehearsal] ✖ ${msg}`);
  process.exit(1);
}

// ── cleanup 모드 — 리허설 prefix 만 삭제 허용 ──────────────────────────
if (cleanupIdx >= 0) {
  const target = args[cleanupIdx + 1];
  if (!target || !/^_rehearsal-[0-9TZ-]+$/.test(target)) {
    fail(`--cleanup 대상은 _rehearsal-<타임스탬프> 형식만 허용: "${target ?? ''}"`);
  }
  const { blobs } = await list({ token: TOKEN, prefix: `${target}/`, limit: 1000 });
  console.log(`[rehearsal] 정리 대상 ${blobs.length}개 (${target}/)`);
  if (blobs.length === 0) process.exit(0);
  await del(blobs.map((b) => b.url), { token: TOKEN });
  console.log('[rehearsal] 정리 완료');
  process.exit(0);
}

// ── 리허설 대상 회차 선택 ──────────────────────────────────────────────
const backupRoot = path.join(os.homedir(), 'Backups', 'zoellife');
let backupDir;
if (dirIdx >= 0) {
  backupDir = args[dirIdx + 1];
} else {
  const dirs = fs
    .readdirSync(backupRoot)
    .filter((d) => d.startsWith('zoellife-backup-'))
    .sort()
    .reverse();
  if (!dirs.length) fail(`백업 회차가 없습니다: ${backupRoot}`);
  backupDir = path.join(backupRoot, dirs[0]);
}
const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf8'));
console.log(`[rehearsal] 회차: ${backupDir}`);
console.log(`[rehearsal] 파일 ${manifest.files.length}개, 암호화=${manifest.encrypted}`);

if (manifest.encrypted && !ENC_KEY) fail('암호화 회차인데 BACKUP_ENCRYPTION_KEY 미설정');

// ── 복호화 (backup-to-local.mjs 와 동일 포맷) ─────────────────────────
function decryptString(payload) {
  const key = /^[0-9a-fA-F]{64}$/.test(ENC_KEY)
    ? Buffer.from(ENC_KEY, 'hex')
    : scryptSync(ENC_KEY, 'daracheon-backup-salt-v1', 32);
  const o = JSON.parse(payload);
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(o.iv, 'hex'));
  d.setAuthTag(Buffer.from(o.tag, 'hex'));
  return Buffer.concat([d.update(Buffer.from(o.cipher, 'base64')), d.final()]).toString('utf-8');
}

// ── 1) 전 파일 복호화 + manifest sha256 대조 (로컬 검증) ──────────────
const plain = new Map(); // 원본 상대경로 → 평문
for (const f of manifest.files) {
  const raw = fs.readFileSync(path.join(backupDir, f.path), 'utf8');
  const text = manifest.encrypted ? decryptString(raw) : raw;
  const sha = createHash('sha256').update(text).digest('hex');
  if (sha !== f.sha256) fail(`로컬 sha 불일치: ${f.path}`);
  plain.set(f.path.replace(/\.enc$/, ''), { text, sha: f.sha256 });
}
console.log(`[rehearsal] 1/3 복호화·로컬 무결성: ${plain.size}/${manifest.files.length} 통과`);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const REHEARSAL_PREFIX = `_rehearsal-${stamp}`;

if (!APPLY) {
  console.log(`[rehearsal] --dry-run: 여기까지. --apply 시 ${REHEARSAL_PREFIX}/ 에 ${plain.size}개 업로드 → 재다운로드 sha 대조.`);
  process.exit(0);
}

// ── 2) 격리 prefix 로 업로드 (라이브 prefix 무관) ─────────────────────
let uploaded = 0;
const entries = [...plain.entries()];
for (let i = 0; i < entries.length; i += 8) {
  await Promise.all(
    entries.slice(i, i + 8).map(async ([rel, { text }]) => {
      await put(`${REHEARSAL_PREFIX}/${rel}`, text, {
        token: TOKEN,
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0,
      });
      uploaded++;
    })
  );
}
console.log(`[rehearsal] 2/3 업로드: ${uploaded}/${plain.size} → ${REHEARSAL_PREFIX}/`);

// ── 3) 재다운로드 → sha256 전량 대조 (round-trip 증명) ────────────────
const listed = [];
let cursor;
do {
  const page = await list({ token: TOKEN, prefix: `${REHEARSAL_PREFIX}/`, cursor, limit: 1000 });
  listed.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

let verified = 0;
const mismatches = [];
for (const b of listed) {
  const rel = b.pathname.slice(REHEARSAL_PREFIX.length + 1);
  const expect = plain.get(rel);
  if (!expect) { mismatches.push(`예상 밖 파일: ${rel}`); continue; }
  const res = await fetch(`${b.url}?v=${Date.now()}`, { cache: 'no-store' });
  const text = await res.text();
  const sha = createHash('sha256').update(text).digest('hex');
  if (sha !== expect.sha) { mismatches.push(`sha 불일치: ${rel}`); continue; }
  verified++;
}

console.log(`[rehearsal] 3/3 round-trip 검증: ${verified}/${plain.size} 통과`);
if (mismatches.length || verified !== plain.size) {
  fail(`불일치 ${mismatches.length}건: ${mismatches.slice(0, 5).join(' | ')}`);
}
console.log(`[rehearsal] ✅ 복원 리허설 통과 — 백업이 실제로 복원 가능함을 증명.`);
console.log(`[rehearsal] 정리: node scripts/restore-rehearsal.mjs --cleanup ${REHEARSAL_PREFIX}`);
