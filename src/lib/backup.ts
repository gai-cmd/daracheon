import { list, put, del } from '@vercel/blob';
import { readDataForWrite, readSingle, writeSingle, restoreData, isBlobEnabled } from './db';
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
  // 2026-07-08 백업 커버리지 확장 (진단 DATA-3: 아래 컬렉션들이 어느 티어에도
  // 백업되지 않아 blob 손상·오삭제 시 영구 손실 위험이었음).
  'leads',              // 고객 리드(PII)
  'partner-accounts',   // 파트너 포털 계정
  'media-submissions',  // 파트너 현장 업로드 제출물
  'blogPosts',          // 블로그 글 (실제 blob 파일명은 camelCase — 2026-07-08 실측 확인)
  'blogCategories',     // 블로그 카테고리 (실제 파일명 camelCase)
  'qr-codes',           // QR 코드 레지스트리
  'product-guides',     // 제품 사용설명서
] as const;

// ⚠️ 미백업 잔여 항목(다음 단계): QR 하위 per-record 컬렉션
//   (qr-events/*, qr-serials/*, qr-coupons/*)은 단일 파일이 아니라 prefix 아래
//   키별 blob 이므로 prefix 워커 기반 별도 아카이버가 필요하다. flat 컬렉션 커버리지
//   확보 후 위 prefix 아카이빙을 추가할 것.

const SINGLETON_FILES = [
  'company',
  'announcement',
  'pages',
  'navigation',
  // 2026-07-08 확장 (진단 DATA-3).
  'mail-settings',
  'integration-settings',
  'telegram-bot-state', // 텔레그램 봇 상태(readSingle 로 읽는 싱글턴 — 2026-07-08 실측 확인)
] as const;

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

const SNAPSHOT_LABELS: readonly SnapshotLabel[] = ['pre-restore', 'pre-delete', 'manual', 'daily'];

/**
 * 스냅샷 id 에서 라벨을 분리한다.
 *
 * 2026-07-26 수정: 기존 구현은 `id.split('-')[0]` 이라 'pre-delete-2026-...' 를
 * 'pre' 로 잘랐다. pruneSnapshots 의 정책 키 'pre-delete' 가 매칭되지 않아 보존
 * 한도 20 이 적용되지 않고 기본값 30 으로 동작했다(실측: pre-delete 34개 잔존).
 * 하이픈이 포함된 라벨을 먼저 시도하도록 긴 것부터 검사한다.
 */
export function parseSnapshotLabel(id: string): SnapshotLabel | 'unknown' {
  for (const label of SNAPSHOT_LABELS) {
    if (id.startsWith(`${label}-`)) return label;
  }
  return 'unknown';
}

/**
 * 스냅샷 id 에 박힌 생성 시각을 복원한다. id 형식은 `<label>-<ISO(: . → -)>`.
 * blob 의 uploadedAt 은 경로 이전·재업로드 시 리셋되므로(2026-07-26 prefix
 * 로테이션에서 105개 전부 리셋됨) "실제로 언제 만든 백업인가"를 판단할 땐
 * uploadedAt 이 아니라 이 값을 봐야 한다. 파싱 실패 시 null.
 */
export function parseSnapshotCreatedAt(id: string): string | null {
  const label = parseSnapshotLabel(id);
  if (label === 'unknown') return null;
  const raw = id.slice(label.length + 1);
  // 2026-07-25T16-44-14-564Z → 2026-07-25T16:44:14.564Z
  const restored = raw.replace(
    /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
    '$1:$2:$3.$4Z'
  );
  const ms = Date.parse(restored);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

/**
 * 전체 DB 스냅샷 생성. blob 미설정 환경에선 조용히 no-op 반환.
 * 운영에선 반드시 blob 필요.
 */
export async function createSnapshot(
  label: SnapshotLabel,
  meta?: Record<string, unknown>
): Promise<{ id: string; size: number; url: string; body: string; degraded: string[] } | null> {
  if (!isBlobEnabled()) {
    console.warn('[backup] blob disabled — createSnapshot skipped');
    return null;
  }

  const data: Partial<Record<DbKey | SingletonKey, unknown>> = {};
  // 읽기에 실패한(일시 장애 등) 컬렉션. 스냅샷에 담지 않고 degraded 로 기록한다 —
  // 빈 배열/누락을 정상값처럼 저장하면 복원 시 실데이터를 덮어써 소실되는
  // "poison 백업"이 된다(진단 DATA-4).
  const degraded: string[] = [];

  // 블로그는 2026-08-10 부터 Neon 이 단일 진실 원천 — Neon 활성 시 스토어에서
  // 읽어 스냅샷에 싣는다(Blob 의 낡은 사본을 백업하면 복원 시 데이터 소실).
  // DATABASE_URL 미설정(폴백)이면 기존 Blob 경로 그대로.
  const { isNeonEnabled, readPosts, readCategories } = await import('./blog/store');
  const blogViaNeon = isNeonEnabled();

  for (const f of DB_FILES) {
    try {
      if (blogViaNeon && f === 'blogPosts') {
        data[f] = await readPosts();
        continue;
      }
      if (blogViaNeon && f === 'blogCategories') {
        data[f] = await readCategories();
        continue;
      }
      // readDataForWrite 는 blob 일시 장애 시 throw 한다(readDataUncached 처럼
      // LKG/seed/[] 로 삼키지 않음) → 장애를 확실히 감지해 degraded 처리한다.
      // 최신 blob 을 직접 읽으므로 스냅샷은 캐시 지연 없는 최신 상태.
      data[f] = await readDataForWrite(f);
    } catch (err) {
      console.error(`[backup] read failed for ${f} — degraded, 스냅샷에서 제외`, err);
      degraded.push(f);
    }
  }
  for (const f of SINGLETON_FILES) {
    try {
      // readSingle(캐시본)은 일시 장애 시 throw. 싱글턴은 변경이 드물어 캐시본으로 충분.
      data[f] = await readSingle(f);
    } catch (err) {
      console.error(`[backup] read failed for ${f} — degraded, 스냅샷에서 제외`, err);
      degraded.push(f);
    }
  }

  const mergedMeta: Record<string, unknown> = {
    ...(meta ?? {}),
    ...(degraded.length ? { degraded } : {}),
  };

  const payload: SnapshotPayload = {
    createdAt: new Date().toISOString(),
    label,
    version: '1.2',
    ...(Object.keys(mergedMeta).length ? { meta: mergedMeta } : {}),
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

  if (degraded.length) {
    console.error(`[backup] snapshot ${id} DEGRADED — 미포함 컬렉션: ${degraded.join(', ')}`);
  }

  return { id, size: body.length, url: result.url, body, degraded };
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
      const label = parseSnapshotLabel(id);
      const uploadedAt = b.uploadedAt instanceof Date
        ? b.uploadedAt.toISOString()
        : String(b.uploadedAt ?? '');
      return {
        id,
        label,
        // id 에 박힌 생성 시각을 우선한다 — uploadedAt 은 blob 이전/재업로드로
        // 리셋되므로 "언제 만든 백업인가"의 근거가 되지 못한다.
        createdAt: parseSnapshotCreatedAt(id) ?? uploadedAt,
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
 * daily=30, manual=30, pre-delete=20 기본값.
 *
 * 2026-07-26: daily 를 14 → 30 으로 상향. 보존 기간은 곧 "사고를 늦게 발견해도
 * 되는 허용 시간"인데, 이번 백업 정지 사고는 발생부터 발견까지 11일이 걸렸다.
 * 14일 보존이면 여유가 3일뿐이다. 스냅샷 1회차가 약 1.3MB 라 30회차로 늘려도
 * 스토어 부담은 40MB 수준으로 무시할 만하다.
 */
export async function pruneSnapshots(
  policy: Partial<Record<SnapshotLabel | string, number>> = {
    daily: 30,
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
export { isBlobEnabled } from './db';
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
): Promise<{ restored: string[]; skipped: string[]; missingInBackup: string[]; preRestoreId: string | null }> {
  // 복원 전 현재 상태 스냅샷 — Blob 활성 시 실패하면 복원 중단 (롤백 포인트 없는 상태에서 덮어쓰기 방지)
  const preRestore = await createSnapshot('pre-restore', {
    source: options.sourceNote ?? 'payload',
    originalLabel: payload.label,
    originalCreatedAt: payload.createdAt,
  });

  if (!preRestore && isBlobEnabled()) {
    throw new Error(
      '복원 전 안전 스냅샷(pre-restore) 생성에 실패했습니다. 롤백 포인트 없이 복원할 수 없습니다. Blob 상태를 확인하세요.'
    );
  }
  // 롤백 포인트가 일부 컬렉션을 읽지 못했다면(불완전) 복원을 중단한다 — 복원이
  // 잘못됐을 때 되돌릴 안전망이 불완전한 상태로 실데이터를 덮어쓰지 않기 위함.
  if (preRestore?.degraded?.length) {
    throw new Error(
      `복원 중단: 복원 전 안전 스냅샷이 일부 컬렉션(${preRestore.degraded.join(', ')})을 읽지 못해 롤백 포인트가 불완전합니다. Blob 상태 확인 후 재시도하세요.`
    );
  }

  const restored: string[] = [];
  const skipped: string[] = [];
  const missingInBackup: string[] = [];

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
      // 블로그는 Neon 활성 시 Neon 으로 복원한다 — Blob 에 복원하면 실서비스가
      // 읽지 않는 사본만 갱신되고 Neon 은 그대로라 "복원했는데 안 바뀜"이 된다.
      // FK(posts.category_id → categories.id) 때문에 두 키를 함께, 카테고리 먼저
      // 처리한다. DB_FILES 순서상 blogPosts 가 먼저 오므로 그 시점에 둘 다 복원하고
      // blogCategories 차례에서는 건너뛴다.
      if (key === 'blogPosts' || key === 'blogCategories') {
        const store = await import('./blog/store');
        if (store.isNeonEnabled()) {
          if (restored.includes('blogPosts') || restored.includes('blogCategories')) continue;
          await store.ensureBlogSchema();
          const cats = payload.data['blogCategories'];
          const posts = payload.data['blogPosts'];
          if (Array.isArray(cats)) {
            await store.writeCategories(cats as never);
            restored.push('blogCategories');
          } else {
            missingInBackup.push('blogCategories');
          }
          if (Array.isArray(posts)) {
            await store.writePosts(posts as never);
            restored.push('blogPosts');
          } else {
            missingInBackup.push('blogPosts');
          }
          continue;
        }
      }
      // 의도적 전체 교체(full-replace) — 복원은 스냅샷 시점 상태로 되돌리는 것이
      // 목적이므로 writeDataMerged 로 바꾸면 안 된다 (merge 가 복원을 오염시킴).
      // restoreData 는 먼저 tombstone 을 비워, 과거 삭제로 남은 흔적이 복원된
      // 레코드를 reconcile/merge 단계에서 다시 지우지 못하게 한다.
      await restoreData(key, value);
      restored.push(key);
    } else if (value === undefined || value === null) {
      missingInBackup.push(key);
    } else {
      // 배열이 아닌 타입 — 백업 손상
      missingInBackup.push(key);
    }
  }
  for (const key of SINGLETON_FILES) {
    const value = payload.data[key];
    if (value !== null && value !== undefined && typeof value === 'object') {
      await writeSingle(key, value);
      restored.push(key);
    } else if (value === undefined) {
      missingInBackup.push(key);
    } else {
      skipped.push(key);
    }
  }

  return { restored, skipped, missingInBackup, preRestoreId: preRestore?.id ?? null };
}

export async function restoreSnapshot(
  id: string,
  options: { restoreUsers?: boolean; restoreAuditLog?: boolean } = {}
): Promise<{ restored: string[]; skipped: string[]; missingInBackup: string[]; preRestoreId: string | null }> {
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
