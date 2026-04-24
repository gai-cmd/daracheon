import { list, put, del } from '@vercel/blob';
import { readData, readSingle, writeData, writeSingle, isBlobEnabled } from './db';
import { pushSnapshotToGitHub, isGitHubBackupConfigured, fetchGitHubBackup, listGitHubBackups, type GitHubBackupEntry } from './backup-github';
import { sendEmailBackup, isEmailBackupConfigured } from './backup-email';
import { encryptString, decryptString, isEncryptionConfigured, looksEncrypted } from './backup-crypto';

/**
 * 고객 DB 보호용 스냅샷 레이어.
 *
 * - 일일 cron: /api/cron/daily-backup 이 createSnapshot('daily') 호출
 * - 수동 백업: 관리자 UI 에서 createSnapshot('manual')
 * - 위험한 작업 전: createSnapshot('pre-delete') — 관리자 API 가 자동 호출
 *
 * 저장 경로: <BLOB_DATA_PREFIX>/_snapshots/<label>-<isoTimestamp>.json
 * BLOB_DATA_PREFIX 는 추측 불가 값이라 공개 URL 로도 접근 불가.
 */

const BLOB_DATA_PREFIX_RAW = process.env.BLOB_DATA_PREFIX ?? 'db';
const BLOB_DATA_PREFIX = BLOB_DATA_PREFIX_RAW.replace(/[^a-zA-Z0-9_-]/g, '');
const SNAPSHOT_PREFIX = `${BLOB_DATA_PREFIX}/_snapshots/`;

const DB_FILES = [
  'products',
  'reviews',
  'inquiries',
  'broadcasts',
  'faq',
  'media',
  'productCategories',
  'admin-users',
  'audit-log',
] as const;

const SINGLETON_FILES = ['company', 'announcement', 'pages', 'navigation'] as const;

type DbKey = (typeof DB_FILES)[number];
type SingletonKey = (typeof SINGLETON_FILES)[number];

export type SnapshotLabel = 'daily' | 'manual' | 'pre-delete' | 'pre-restore';

export interface SnapshotSummary {
  id: string;
  label: SnapshotLabel | string;
  createdAt: string;
  size: number;
  url: string;
  pathname: string;
}

export interface SnapshotPayload {
  createdAt: string;
  label: SnapshotLabel;
  version: string;
  meta?: Record<string, unknown>;
  data: Partial<Record<DbKey | SingletonKey, unknown>>;
}

function snapshotId(label: SnapshotLabel): string {
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  return `${label}-${iso}`;
}

/**
 * 전체 DB 스냅샷 생성. blob 미설정 환경에선 조용히 no-op 반환.
 * 운영에선 반드시 blob 필요.
 */
export async function createSnapshot(
  label: SnapshotLabel,
  meta?: Record<string, unknown>
): Promise<{ id: string; size: number; url: string; body: string } | null> {
  if (!isBlobEnabled()) {
    console.warn('[backup] blob disabled — createSnapshot skipped');
    return null;
  }

  const data: Partial<Record<DbKey | SingletonKey, unknown>> = {};
  for (const f of DB_FILES) {
    try {
      data[f] = await readData(f);
    } catch (err) {
      // 일시 장애도 스냅샷을 막지 말고 빈 배열로 대체. 로그만 남김.
      console.error(`[backup] read failed for ${f}`, err);
      data[f] = [];
    }
  }
  for (const f of SINGLETON_FILES) {
    try {
      data[f] = await readSingle(f);
    } catch (err) {
      console.error(`[backup] read failed for ${f}`, err);
      data[f] = null;
    }
  }

  const payload: SnapshotPayload = {
    createdAt: new Date().toISOString(),
    label,
    version: '1.1',
    ...(meta ? { meta } : {}),
    data,
  };

  const id = snapshotId(label);
  const body = JSON.stringify(payload);
  const pathname = `${SNAPSHOT_PREFIX}${id}.json`;

  const result = await put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });

  return { id, size: body.length, url: result.url, body };
}

/**
 * 생성된 스냅샷 본문을 Tier 2 (GitHub) · Tier 3 (Email) 로 미러링.
 * 외부 시스템으로 나가는 복사본은 항상 암호화한다 (BACKUP_ENCRYPTION_KEY).
 * 키가 없으면 평문 대신 전송을 중단 — 고객 PII 누출 방지.
 */
export interface MirrorResult {
  tier2Github: { ok: boolean; path?: string; sha?: string; url?: string; error?: string; skipped?: string };
  tier3Email: { ok: boolean; recipient?: string; error?: string; skipped?: string };
}

export async function mirrorSnapshot(
  label: SnapshotLabel,
  body: string,
  options: { sendEmail?: boolean; meta?: Record<string, unknown> } = {}
): Promise<MirrorResult> {
  const result: MirrorResult = {
    tier2Github: { ok: false, skipped: 'not-attempted' },
    tier3Email: { ok: false, skipped: 'not-attempted' },
  };

  if (!isEncryptionConfigured()) {
    const msg = 'BACKUP_ENCRYPTION_KEY 미설정 — 외부 미러링 스킵 (평문 전송 금지)';
    result.tier2Github = { ok: false, skipped: msg };
    result.tier3Email = { ok: false, skipped: msg };
    console.warn(`[backup:mirror] ${msg}`);
    return result;
  }

  let encrypted: string;
  try {
    encrypted = encryptString(body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.tier2Github = { ok: false, error: `encrypt failed: ${msg}` };
    result.tier3Email = { ok: false, error: `encrypt failed: ${msg}` };
    return result;
  }

  // Tier 2: GitHub (일일)
  if (isGitHubBackupConfigured()) {
    const gh = await pushSnapshotToGitHub(label, encrypted);
    result.tier2Github = gh;
  } else {
    result.tier2Github = { ok: false, skipped: 'GITHUB_BACKUP_TOKEN/REPO 미설정' };
  }

  // Tier 3: Email (주 1회 - cron 이 sendEmail=true 전달)
  if (options.sendEmail) {
    if (isEmailBackupConfigured()) {
      const em = await sendEmailBackup(label, encrypted, options.meta);
      result.tier3Email = em;
    } else {
      result.tier3Email = { ok: false, skipped: 'RESEND_API_KEY / BACKUP_EMAIL_RECIPIENT 미설정' };
    }
  } else {
    result.tier3Email = { ok: false, skipped: '이메일 주기 아님 (매주 일요일만)' };
  }

  return result;
}

/**
 * 저장된 스냅샷 목록. 최신순 정렬.
 */
export async function listSnapshots(): Promise<SnapshotSummary[]> {
  if (!isBlobEnabled()) return [];
  const { blobs } = await list({ prefix: SNAPSHOT_PREFIX, limit: 200 });
  return blobs
    .map((b) => {
      const id = b.pathname.slice(SNAPSHOT_PREFIX.length).replace(/\.json$/, '');
      const label = id.split('-')[0] ?? 'unknown';
      return {
        id,
        label,
        createdAt: (b.uploadedAt instanceof Date
          ? b.uploadedAt.toISOString()
          : String(b.uploadedAt ?? '')),
        size: b.size,
        url: b.url,
        pathname: b.pathname,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 단일 스냅샷 본문을 fetch 해서 파싱.
 */
export async function fetchSnapshot(id: string): Promise<SnapshotPayload | null> {
  if (!isBlobEnabled()) return null;
  const pathname = `${SNAPSHOT_PREFIX}${id}.json`;
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  const match = blobs.find((b) => b.pathname === pathname);
  if (!match) return null;
  const res = await fetch(`${match.url}?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as SnapshotPayload;
}

/**
 * 보존 정책: label 별로 최근 N 개만 유지.
 * daily=14, manual=30, pre-delete=20 기본값.
 */
export async function pruneSnapshots(
  policy: Partial<Record<SnapshotLabel | string, number>> = {
    daily: 14,
    manual: 30,
    'pre-delete': 20,
    'pre-restore': 10,
  }
): Promise<{ kept: number; deleted: number }> {
  if (!isBlobEnabled()) return { kept: 0, deleted: 0 };
  const all = await listSnapshots();
  const byLabel = new Map<string, SnapshotSummary[]>();
  for (const s of all) {
    const arr = byLabel.get(s.label) ?? [];
    arr.push(s);
    byLabel.set(s.label, arr);
  }
  const toDelete: SnapshotSummary[] = [];
  for (const [label, arr] of byLabel) {
    const keep = policy[label] ?? 30;
    if (arr.length > keep) toDelete.push(...arr.slice(keep));
  }
  for (const s of toDelete) {
    try {
      await del(s.url);
    } catch (err) {
      console.warn(`[backup] prune del failed for ${s.id}`, err);
    }
  }
  return { kept: all.length - toDelete.length, deleted: toDelete.length };
}

/**
 * 스냅샷을 현재 DB 에 복원. 복원 전에 'pre-restore' 스냅샷을 먼저 생성해
 * 롤백 가능하게 함. admin-users / audit-log 는 위험해서 플래그로만 복원.
 */
export { listGitHubBackups, fetchGitHubBackup, isGitHubBackupConfigured } from './backup-github';
export { isEmailBackupConfigured } from './backup-email';
export { isEncryptionConfigured, decryptString, looksEncrypted } from './backup-crypto';
export type { GitHubBackupEntry } from './backup-github';

/**
 * GitHub (Tier 2) 에서 특정 백업 파일을 가져와 복호화된 SnapshotPayload 반환.
 */
export async function fetchGitHubSnapshot(path: string): Promise<SnapshotPayload | null> {
  const raw = await fetchGitHubBackup(path);
  if (!raw) return null;
  try {
    const body = looksEncrypted(raw) ? decryptString(raw) : raw;
    return JSON.parse(body) as SnapshotPayload;
  } catch (err) {
    console.error('[backup] fetchGitHubSnapshot decrypt/parse failed', err);
    return null;
  }
}

/**
 * 임의 소스(업로드·이메일 첨부 등)의 백업 문자열을 받아 복호화 후 파싱.
 * 암호화 블롭이 아니면 평문 JSON 으로 가정.
 */
export function parseBackupString(raw: string): SnapshotPayload | null {
  try {
    const body = looksEncrypted(raw) ? decryptString(raw) : raw;
    return JSON.parse(body) as SnapshotPayload;
  } catch (err) {
    console.error('[backup] parseBackupString failed', err);
    return null;
  }
}

/**
 * SnapshotPayload 를 실제 DB 에 기록. 호출자는 fetchSnapshot / fetchGitHubSnapshot
 * / parseBackupString 등으로 payload 를 이미 확보한 상태.
 */
export async function restoreFromPayload(
  payload: SnapshotPayload,
  options: { restoreUsers?: boolean; restoreAuditLog?: boolean; sourceNote?: string } = {}
): Promise<{ restored: string[]; skipped: string[]; preRestoreId: string | null }> {
  // 현재 상태를 pre-restore 로 백업
  const preRestore = await createSnapshot('pre-restore', {
    source: options.sourceNote ?? 'payload',
    originalLabel: payload.label,
    originalCreatedAt: payload.createdAt,
  });

  const restored: string[] = [];
  const skipped: string[] = [];

  for (const key of DB_FILES) {
    if (key === 'admin-users' && !options.restoreUsers) {
      skipped.push(key);
      continue;
    }
    if (key === 'audit-log' && !options.restoreAuditLog) {
      skipped.push(key);
      continue;
    }
    const value = payload.data[key];
    if (Array.isArray(value)) {
      await writeData(key, value);
      restored.push(key);
    } else {
      skipped.push(key);
    }
  }
  for (const key of SINGLETON_FILES) {
    const value = payload.data[key];
    if (value !== null && value !== undefined && typeof value === 'object') {
      await writeSingle(key, value);
      restored.push(key);
    } else {
      skipped.push(key);
    }
  }

  return { restored, skipped, preRestoreId: preRestore?.id ?? null };
}

export async function restoreSnapshot(
  id: string,
  options: { restoreUsers?: boolean; restoreAuditLog?: boolean } = {}
): Promise<{ restored: string[]; skipped: string[]; preRestoreId: string | null }> {
  const payload = await fetchSnapshot(id);
  if (!payload) throw new Error(`스냅샷을 찾을 수 없습니다: ${id}`);
  return restoreFromPayload(payload, { ...options, sourceNote: `blob:${id}` });
}

/**
 * 위험한 작업 전 자동 스냅샷. 실패해도 작업 자체는 진행 (블로킹 금지).
 */
export async function snapshotBeforeDestructive(
  actor: string | undefined,
  reason: string
): Promise<string | null> {
  try {
    const result = await createSnapshot('pre-delete', { actor, reason });
    return result?.id ?? null;
  } catch (err) {
    console.error('[backup] pre-delete snapshot failed — proceeding anyway', err);
    return null;
  }
}
