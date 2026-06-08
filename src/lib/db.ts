import fs from 'fs';
import path from 'path';
import { put, list, del } from '@vercel/blob';
import { revalidateTag, unstable_cache } from 'next/cache';

/**
 * Persistent JSON store — 3-tier resilient read pipeline.
 *
 * Write path (prod):
 *   blob put(allowOverwrite) → revalidateTag('db:<file>') → post-write verify.
 *   ⚠️ put 전에 del 금지 — del→put 은 list() 인덱스에서 파일이 사라져 보이는
 *   구간을 만들고(인덱스는 eventually consistent), 그 NOT_FOUND 가 시드
 *   폴백을 타면 빌드 시점 스냅샷으로 덮어써 누적 데이터가 유실된다
 *   (2026-06-07 inquiries 사고). `revalidateTag` flushes Next's shared
 *   data cache globally, so every serverless instance picks up the new
 *   value on its next read. Admin PUT also calls revalidatePath.
 *
 * Read path (prod, *Safe variants used by RSC pages):
 *   T1. blob fetch with up to 3 retries (250/500ms backoff) — absorbs
 *       transient network/CDN hiccups that used to make content flicker
 *       "on/off" between requests.
 *   T2. process-local LKG (last-known-good) cache — every successful
 *       blob read populates this map, so a subsequent failure within
 *       the same warm instance still serves the most recent real data.
 *   T3. bundled fs seed at /data/db/*.json (.vercelignore whitelisted)
 *       — last resort when both blob and LKG are unavailable (e.g.
 *       cold start during a blob outage). Seed is stale by definition,
 *       but "stale content" >> "missing content".
 *
 * Admin write path uses readSingle (non-Safe): it *must* throw on blob
 * failure so the merged payload isn't polluted by stale seed/LKG. A
 * user's save should fail loudly, not silently overwrite with old data.
 *
 * Dev (no BLOB_READ_WRITE_TOKEN): both reads and writes go to the local
 * filesystem — the fs seed path doubles as the dev store.
 */

const DB_DIR = path.join(process.cwd(), 'data', 'db');
// BLOB_DATA_PREFIX: Vercel Blob 은 public access 만 지원하므로 경로가 예측
// 가능하면 PII JSON (inquiries, admin-users, password-reset-tokens)이
// 공개 URL 로 유출됨. 운영에서는 반드시 추측 불가한 긴 랜덤 값으로 설정:
//   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
const BLOB_DATA_PREFIX_RAW = process.env.BLOB_DATA_PREFIX ?? 'db';
const BLOB_PREFIX = `${BLOB_DATA_PREFIX_RAW.replace(/[^a-zA-Z0-9_-]/g, '')}/`;

if (process.env.VERCEL && BLOB_DATA_PREFIX_RAW === 'db') {
  console.warn(
    '[db] WARNING: BLOB_DATA_PREFIX 가 설정되지 않아 db/*.json 파일이 ' +
      '예측 가능한 공개 URL 로 노출됩니다. PII 유출 위험이 있으므로 ' +
      'Vercel 환경변수에 랜덤 값을 지정하세요.'
  );
}

const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

// Retry tuning for blob reads. Transient Vercel Blob / CDN failures
// typically resolve in <1s; 3 attempts @ 250ms/500ms covers the common
// case without adding meaningful latency to the happy path (first
// attempt usually succeeds in <100ms).
const BLOB_READ_MAX_ATTEMPTS = 3;
const BLOB_READ_BACKOFF_MS = [0, 250, 500];

// Process-local last-known-good cache. Populated on every successful
// blob read; consulted only by the *Safe variants on failure. Does NOT
// persist across cold starts or serverless instance boundaries — that's
// what Next's shared data cache (via unstable_cache) is for. This map
// is the "belt" to unstable_cache's "suspenders".
const lastKnownGood = new Map<string, unknown>();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function dbTag(filename: string) {
  return `db:${filename}`;
}

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function fsReadRaw(filename: string): unknown | null {
  const filePath = path.join(DB_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`[db] failed to parse ${filename}.json`, err);
    return null;
  }
}

function fsWriteRaw(filename: string, data: unknown) {
  ensureDir();
  const filePath = path.join(DB_DIR, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Sentinel: blob 에 명백히 없음. 일시 장애(fetch 실패 등)는 throw 로 구분.
const NOT_FOUND = Symbol('not_found');

// 3상태 반환: 데이터 / 명백히 없음(NOT_FOUND) / 일시 장애(throw)
// fs seed fallback 은 NOT_FOUND 에만 적용되어야 함. 일시 장애를
// NOT_FOUND 로 취급하면 admin PUT 의 '기존 데이터 merge' 가
// seed 로 오염되어 사용자 저장분이 소실될 수 있음.
//
// Retry policy: transient failures (list/fetch throws, HTTP 5xx, HTTP
// 404 on the content URL right after a put — CDN propagation lag) get
// up to 3 attempts with backoff. list() no-match 도 즉시 확정하지 않고
// 재시도한다 — Vercel Blob 의 list 인덱스는 eventually consistent 라
// 실재하는 파일이 일시적으로 안 보일 수 있고, 그걸 NOT_FOUND 로 확정하면
// fs 시드 폴백 → 시드 베이스 덮어쓰기(데이터 유실)로 이어진다.
// 모든 시도가 no-match 일 때만 NOT_FOUND, 일부만 no-match 면 throw (모호).
async function blobReadRawUncached(filename: string): Promise<unknown | typeof NOT_FOUND> {
  const t0 = Date.now();
  let lastErr: unknown = null;
  let noMatchCount = 0;

  for (let attempt = 0; attempt < BLOB_READ_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(BLOB_READ_BACKOFF_MS[attempt] ?? 500);
    try {
      const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
      const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
      if (!match) {
        noMatchCount++;
        const note = attempt < BLOB_READ_MAX_ATTEMPTS - 1 ? ' — retrying' : '';
        console.warn(`[db:read] ${filename}: attempt ${attempt + 1} list() no-match (${blobs.length} entries)${note}`);
        continue;
      }
      // Vercel Blob 은 우리가 cacheControlMaxAge:0 으로 put 해도 응답에
      // public,max-age=60 을 강제로 붙인다. ?v=uploadedAt 만으론 부족 —
      // 직전 write 후 list() 가 stale uploadedAt 을 돌려주면 동일 URL 이라
      // CDN HIT 으로 60초간 옛 데이터가 반환됨. 매 호출마다 unique segment
      // 를 추가해 CDN 을 무조건 우회.
      const uploadedTs = match.uploadedAt ? new Date(match.uploadedAt).getTime() : 0;
      const bust = `?v=${uploadedTs}&_=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch(`${match.url}${bust}`, { cache: 'no-store' });
      if (!res.ok) {
        // HTTP error is retryable (CDN propagation, transient 5xx).
        lastErr = new Error(`HTTP ${res.status}`);
        console.warn(`[db:read] ${filename}: attempt ${attempt + 1} HTTP ${res.status}, retrying`);
        continue;
      }
      const body = await res.json();
      const attemptNote = attempt > 0 ? ` after ${attempt} retry` : '';
      console.log(`[db:read] ${filename}: OK (${Date.now() - t0}ms${attemptNote}, uploaded=${match.uploadedAt})`);
      // Refresh the process-local LKG cache on every successful read so
      // the *Safe variants have a recent real snapshot if blob later
      // blips within this instance's lifetime.
      lastKnownGood.set(filename, body);
      return body;
    } catch (err) {
      lastErr = err;
      console.warn(`[db:read] ${filename}: attempt ${attempt + 1} threw, retrying`, err);
    }
  }

  // 전 시도 일관되게 no-match → 진짜 없는 것으로 확정.
  if (noMatchCount === BLOB_READ_MAX_ATTEMPTS) {
    console.log(`[db:read] ${filename}: NOT_FOUND (no-match ${noMatchCount}/${BLOB_READ_MAX_ATTEMPTS} attempts, ${Date.now() - t0}ms)`);
    return NOT_FOUND;
  }

  // All retries exhausted — caller decides whether to fall back (readSingleSafe)
  // or propagate (readSingle / admin PUT).
  throw lastErr ?? new Error(`[db] blob read failed ${filename} after ${BLOB_READ_MAX_ATTEMPTS} attempts`);
}

// Wrap the blob read with Next's data cache, tagged so writes can
// invalidate every serverless instance globally in one call.
// 반환: 데이터 | NOT_FOUND | (장애는 throw 해서 fs seed 오염 방지)
async function blobReadRaw(filename: string): Promise<unknown | typeof NOT_FOUND> {
  const cached = unstable_cache(
    async () => {
      const result = await blobReadRawUncached(filename);
      if (result === NOT_FOUND) throw NOT_FOUND; // 캐시 오염 방지
      return result;
    },
    ['db', filename],
    { tags: [dbTag(filename)], revalidate: 300 }
  );
  try {
    return await cached();
  } catch (err) {
    if (err === NOT_FOUND) return NOT_FOUND;
    throw err; // 일시 장애는 caller 에게 전파
  }
}

async function blobWriteRaw(filename: string, data: unknown) {
  // ⚠️ put 전에 del 하지 않는다 (2026-06-07 inquiries 유실 사고의 원인).
  // del→put 사이/직후에 list() 인덱스에서 파일이 사라진 것처럼 보이는 구간이
  // 생기고(인덱스는 eventually consistent — del 은 반영됐는데 put 이 아직인
  // 리플리카가 수 분간 NOT_FOUND 를 돌려줄 수 있음), 그 NOT_FOUND 가
  // readDataUncached 의 fs 시드 폴백을 타면 빌드 시점 스냅샷이 쓰기 베이스가
  // 되어 그 이후 누적 레코드가 통째로 덮어써진다.
  // allowOverwrite put 은 같은 pathname 의 in-place 갱신이라 인덱스에서
  // 사라지는 구간이 없다. CDN 캐시는 모든 read 가 unique query 로 우회하므로
  // del 에 의한 무효화가 필요 없다.
  const t0 = Date.now();
  const putRes = await put(`${BLOB_PREFIX}${filename}.json`, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
  console.log(`[db:write] ${filename}: OK (${Date.now() - t0}ms, url=${putRes.url})`);
}

async function readRaw(filename: string): Promise<unknown | null> {
  if (hasBlob) {
    const result = await blobReadRaw(filename);
    // fs seed fallback 은 "blob 에 명백히 없음(NOT_FOUND)" 일 때만.
    // 일시 장애(fetch/list 예외)는 blobReadRaw 가 throw 하므로 여기까지
    // 오지 않음 → admin PUT 이 잘못된 seed 로 merge 하지 않음.
    if (result === NOT_FOUND) return fsReadRaw(filename);
    return result;
  }
  return fsReadRaw(filename);
}

async function writeRaw(filename: string, data: unknown): Promise<void> {
  if (hasBlob) {
    await blobWriteRaw(filename, data);
    // Optimistically refresh LKG with what we just wrote — guarantees
    // the current warm instance has the freshest value even if the
    // post-write verify fetch hits a CDN edge that hasn't propagated yet.
    lastKnownGood.set(filename, data);
    try {
      revalidateTag(dbTag(filename));
      console.log(`[db:write] ${filename}: revalidateTag OK`);
    } catch (err) {
      console.warn(`[db:write] ${filename}: revalidateTag failed`, err);
    }
    // Post-write read-back (uncached) — 진단 전용. await 하면 매 write 마다
    // ~500ms 추가 → 어드민 응답이 느려진다. fire-and-forget 으로 백그라운드
    // 검증만 수행. 실패해도 사용자 응답에 영향 없음.
    blobReadRawUncached(filename)
      .then((verify) => {
        if (verify === NOT_FOUND) {
          console.warn(`[db:write] ${filename}: post-write read returned NOT_FOUND (CDN propagation delay?)`);
        } else {
          const ok = JSON.stringify(verify) === JSON.stringify(data);
          console.log(`[db:write] ${filename}: post-write read-back ${ok ? 'MATCH' : 'MISMATCH'}`);
        }
      })
      .catch((err) => {
        console.warn(`[db:write] ${filename}: post-write read-back threw`, err);
      });
    return;
  }
  if (process.env.VERCEL) {
    // Vercel serverless fs is read-only. Refuse the write with a clear signal
    // instead of silently losing data.
    throw new Error(
      'DB write failed: BLOB_READ_WRITE_TOKEN is not set. ' +
        'Create a Vercel Blob store and link it to this project (Dashboard → Storage → Blob).'
    );
  }
  fsWriteRaw(filename, data);
}

/* ─────────────────────────────────────────────────────────
   Public API (all async)
   ───────────────────────────────────────────────────────── */

// Generic defaults to `any` for backwards-compat with call sites that read+mutate
// without an explicit type argument. New code should still specify <T>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readData<T = any>(filename: string): Promise<T[]> {
  const data = await readRaw(filename);
  return Array.isArray(data) ? (data as T[]) : [];
}

// unstable_cache 를 우회해 blob 에서 직접 읽는다.
// ⚠️ display(조회) 용도 전용 — NOT_FOUND 시 fs 시드로 폴백하므로
// read-modify-write 의 베이스로 쓰면 시드 덮어쓰기 유실 위험.
// 쓰기 베이스가 필요하면 readDataForWrite + writeDataMerged 를 사용할 것.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readDataUncached<T = any>(filename: string): Promise<T[]> {
  if (hasBlob) {
    const result = await blobReadRawUncached(filename);
    if (result === NOT_FOUND) {
      // Blob에 파일이 명백히 없음(NOT_FOUND) → fs 시드로 fallback.
      // 일시 장애(throw)와 달리 "아직 한 번도 저장 안 된" 케이스이므로
      // 시드를 베이스라인으로 사용해도 stale 오염이 발생하지 않는다.
      const seed = fsReadRaw(filename);
      return Array.isArray(seed) ? (seed as T[]) : [];
    }
    if (Array.isArray(result)) {
      lastKnownGood.set(filename, result);
      return result as T[];
    }
    return [];
  }
  const data = fsReadRaw(filename);
  return Array.isArray(data) ? (data as T[]) : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeData<T = any>(filename: string, data: T[]): Promise<void> {
  await writeRaw(filename, data);
}

// read-modify-write 의 "쓰기 베이스" 전용 read.
// readDataUncached 와 달리 NOT_FOUND 를 번들 시드로 메우지 않는다.
// 빌드 시점 시드를 베이스로 수정 후 통째로 쓰면 빌드 이후 누적된 레코드가
// 전부 덮어써진다 (2026-06-07 inquiries 유실 사고의 메커니즘). 데이터가
// 존재했던 흔적(LKG 또는 비어있지 않은 시드)이 있는데 blob 에서 안 보이면
// list() 전파 지연으로 간주하고 throw — 쓰기 자체를 실패시키는 것이
// 조용한 유실보다 낫다. 시드조차 비어 있는 진짜 첫 부트스트랩만 [] 로 시작.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readDataForWrite<T = any>(filename: string): Promise<T[]> {
  if (!hasBlob) {
    const data = fsReadRaw(filename);
    return Array.isArray(data) ? (data as T[]) : [];
  }
  const result = await blobReadRawUncached(filename); // 일시 장애는 throw 그대로 전파
  if (result !== NOT_FOUND) {
    if (Array.isArray(result)) {
      lastKnownGood.set(filename, result);
      return result as T[];
    }
    // 비배열(단일객체/오염) 을 조용히 [] 로 바꾸면 이어지는 쓰기가 파일을
    // 통째로 교체한다 — 배열 파일이 아니면 명백한 오용이므로 거부.
    throw new Error(`[db] ${filename}: 배열 파일이 아닙니다 (readDataForWrite 오용 또는 내용 오염).`);
  }
  const lkg = lastKnownGood.get(filename);
  const seed = fsReadRaw(filename);
  const hadData = (Array.isArray(lkg) && lkg.length > 0) || (Array.isArray(seed) && seed.length > 0);
  if (hadData) {
    throw new Error(
      `[db] ${filename}: blob 에서 NOT_FOUND 지만 기존 데이터 흔적(LKG/seed)이 있습니다. ` +
        'list() 전파 지연 의심 — 유실 방지를 위해 쓰기 베이스 제공을 거부합니다. 잠시 후 재시도하세요.'
    );
  }
  return [];
}

export interface WriteMergedOptions {
  /** 이번 쓰기에서 의도적으로 삭제하는 레코드 id — merge 부활 대상에서 제외 */
  removedIds?: string[];
}

// lost-update 방지 쓰기 — put 직전에 blob 을 한 번 더 읽어, next 에는 없는데
// 현재 blob 에는 있는 레코드(= base read 이후 다른 인스턴스가 추가한 것)를
// 되살린 뒤 쓴다. 베이스가 stale 이어도 동시 추가분이 사라지지 않는다.
// 의도적 삭제는 removedIds 로 명시해 부활을 막는다. fresh read 실패 시에는
// merge 없이 진행 (사용자 저장이 read 블립에 막히면 안 됨 — 기존과 동일 동작).
export async function writeDataMerged<T extends { id?: unknown }>(
  filename: string,
  next: T[],
  options: WriteMergedOptions = {},
): Promise<void> {
  let merged = next;
  try {
    const freshRaw = hasBlob ? await blobReadRawUncached(filename) : fsReadRaw(filename);
    if (freshRaw === NOT_FOUND && next.length > 0) {
      // 이번 수정이 겨냥한 바로 그 시그니처(데이터가 있어야 하는데 인덱스에
      // 안 보임) — merge 는 불가능하지만 최소한 흔적은 남긴다.
      console.warn(`[db:write-merged] ${filename}: fresh read NOT_FOUND — merge 생략 (list 전파 지연 의심)`);
    }
    if (Array.isArray(freshRaw)) {
      const fresh = freshRaw as T[];
      const nextIds = new Set(
        next.map((r) => r?.id).filter((id): id is string => typeof id === 'string'),
      );
      const removed = new Set(options.removedIds ?? []);
      const resurrected = fresh.filter(
        (r) => typeof r?.id === 'string' && !nextIds.has(r.id) && !removed.has(r.id),
      );
      if (resurrected.length > 0) {
        console.warn(
          `[db:write-merged] ${filename}: 동시 쓰기 감지 — ${resurrected.length}건 보존`,
          resurrected.map((r) => r.id),
        );
        merged = [...next, ...resurrected];
      }
    }
  } catch (err) {
    console.warn(`[db:write-merged] ${filename}: merge 용 fresh read 실패 — merge 생략`, err);
  }
  await writeRaw(filename, merged);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingle<T = any>(filename: string): Promise<T | null> {
  const data = await readRaw(filename);
  if (data === null || Array.isArray(data)) return null;
  return data as T;
}

// unstable_cache 를 우회해 blob 에서 직접 읽는다 (단일 객체 버전).
// 배너·알림 등 즉시 반영이 필요한 데이터에 사용.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingleUncached<T = any>(filename: string): Promise<T | null> {
  if (hasBlob) {
    try {
      const result = await blobReadRawUncached(filename);
      if (result === NOT_FOUND) return fsReadRaw(filename) as T | null;
      if (result !== null && !Array.isArray(result)) {
        lastKnownGood.set(filename, result);
        return result as T;
      }
      return null;
    } catch {
      const lkg = lastKnownGood.get(filename);
      if (lkg && !Array.isArray(lkg)) return lkg as T;
      return fsReadRaw(filename) as T | null;
    }
  }
  const data = fsReadRaw(filename);
  if (data === null || Array.isArray(data)) return null;
  return data as T;
}

// 프론트엔드 RSC 용: blob 일시 장애 시 LKG → fs seed 순으로 최후 수단 제공.
// Failure ladder:
//   1. blob read (with 3x retry inside blobReadRawUncached)
//   2. process LKG cache (populated on prior successful reads)
//   3. bundled fs seed
//   4. null
// Admin PUT 처럼 '사용자 저장분 보호' 가 필요한 경로는 여전히 readSingle
// (Safe 아님) 을 써서 throw 받도록 유지 — LKG/seed 로 오염될 위험 없음.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingleSafe<T = any>(filename: string): Promise<T | null> {
  try {
    return await readSingle<T>(filename);
  } catch (err) {
    console.warn(`[db:safe] ${filename}: read failed after retries, trying LKG/seed`, err);
    const lkg = lastKnownGood.get(filename);
    if (lkg && !Array.isArray(lkg)) {
      console.log(`[db:safe] ${filename}: served from LKG cache`);
      return lkg as T;
    }
    try {
      const seed = fsReadRaw(filename);
      if (seed && !Array.isArray(seed)) {
        console.log(`[db:safe] ${filename}: served from fs seed`);
        return seed as T;
      }
    } catch { /* ignore */ }
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readDataSafe<T = any>(filename: string): Promise<T[]> {
  try {
    return await readData<T>(filename);
  } catch (err) {
    console.warn(`[db:safe] ${filename}: read failed after retries, trying LKG/seed`, err);
    const lkg = lastKnownGood.get(filename);
    if (Array.isArray(lkg)) {
      console.log(`[db:safe] ${filename}: served from LKG cache`);
      return lkg as T[];
    }
    try {
      const seed = fsReadRaw(filename);
      if (Array.isArray(seed)) {
        console.log(`[db:safe] ${filename}: served from fs seed`);
        return seed as T[];
      }
    } catch { /* ignore */ }
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeSingle<T = any>(filename: string, data: T): Promise<void> {
  await writeRaw(filename, data);
}

/* ─────────────────────────────────────────────────────────
   Low-level escape hatches (rarely needed)
   ───────────────────────────────────────────────────────── */

export async function deleteData(filename: string): Promise<void> {
  if (hasBlob) {
    try {
      const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
      const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
      if (match) await del(match.url);
      revalidateTag(dbTag(filename));
    } catch (err) {
      console.error(`[db] blob delete failed for ${filename}`, err);
    }
  } else {
    const filePath = path.join(DB_DIR, `${filename}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

export function invalidateCache(filename?: string) {
  // Retained for callers — revalidate the shared tag globally.
  if (filename) {
    try { revalidateTag(dbTag(filename)); } catch { /* outside request scope */ }
  }
}

export function isBlobEnabled(): boolean {
  return hasBlob;
}
