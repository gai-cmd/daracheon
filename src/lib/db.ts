import fs from 'fs';
import path from 'path';
import { put, list, del } from '@vercel/blob';
import { revalidateTag, unstable_cache } from 'next/cache';

/**
 * Persistent JSON store
 *
 * Strategy:
 *  ─ Prod (BLOB_READ_WRITE_TOKEN set): reads+writes go to Vercel Blob.
 *     - Reads go through Next's shared data cache tagged `db:<filename>`.
 *     - Writes overwrite the blob AND revalidate the tag, so every
 *       serverless instance sees the new value on the next read.
 *     - First read on a fresh store: no blob exists → fall back to the
 *       bundled JSON seed in /data/db (included via .vercelignore whitelist).
 *  ─ Dev (no token): reads+writes use the local filesystem.
 *
 * Previously this module maintained its own per-instance cache, which
 * broke admin→frontend propagation (admin's write updated only its own
 * instance; frontend instances kept returning stale data until recycled).
 * revalidateTag flushes Vercel's shared data cache globally.
 */

const DB_DIR = path.join(process.cwd(), 'data', 'db');
const BLOB_PREFIX = 'db/';

const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

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
async function blobReadRawUncached(filename: string): Promise<unknown | typeof NOT_FOUND> {
  const t0 = Date.now();
  const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
  const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
  if (!match) {
    console.log(`[db:read] ${filename}: NOT_FOUND (list returned ${blobs.length} entries)`);
    return NOT_FOUND;
  }
  const bust = match.uploadedAt
    ? `?v=${new Date(match.uploadedAt).getTime()}`
    : `?v=${Date.now()}`;
  const res = await fetch(`${match.url}${bust}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`[db] blob fetch failed ${filename}: HTTP ${res.status}`);
  }
  const body = await res.json();
  console.log(`[db:read] ${filename}: OK (${Date.now() - t0}ms, uploaded=${match.uploadedAt})`);
  return body;
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
  // 기존 CDN cache entry 의 TTL(default 1년) 무효화를 위해 put 전에 del.
  // del 실패는 무시(blob 미존재 or 동시 경합).
  const t0 = Date.now();
  let delResult: 'deleted' | 'none' | 'error' = 'none';
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
    const existing = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
    if (existing) {
      await del(existing.url);
      delResult = 'deleted';
    }
  } catch (err) {
    delResult = 'error';
    console.warn(`[db:write] ${filename}: pre-write del skipped`, err);
  }
  const putRes = await put(`${BLOB_PREFIX}${filename}.json`, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
  console.log(`[db:write] ${filename}: OK (${Date.now() - t0}ms, del=${delResult}, url=${putRes.url})`);
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
    try {
      revalidateTag(dbTag(filename));
      console.log(`[db:write] ${filename}: revalidateTag OK`);
    } catch (err) {
      console.warn(`[db:write] ${filename}: revalidateTag failed`, err);
    }
    // Post-write read-back (uncached) — blob 의 실제 최신 상태를 확인해 로그한다.
    // 동일 요청 내에서 CDN 레이어가 새 값을 돌려주는지 체크하는 진단 용도.
    try {
      const verify = await blobReadRawUncached(filename);
      if (verify === NOT_FOUND) {
        console.warn(`[db:write] ${filename}: post-write read returned NOT_FOUND (CDN propagation delay?)`);
      } else {
        const ok = JSON.stringify(verify) === JSON.stringify(data);
        console.log(`[db:write] ${filename}: post-write read-back ${ok ? 'MATCH' : 'MISMATCH'}`);
      }
    } catch (err) {
      console.warn(`[db:write] ${filename}: post-write read-back threw`, err);
    }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeData<T = any>(filename: string, data: T[]): Promise<void> {
  await writeRaw(filename, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingle<T = any>(filename: string): Promise<T | null> {
  const data = await readRaw(filename);
  if (data === null || Array.isArray(data)) return null;
  return data as T;
}

// 프론트엔드 RSC 용: blob 일시 장애도 null 로 흡수.
// 페이지는 DEFAULT_* fallback 으로 안전하게 렌더링 유지.
// admin PUT 처럼 '사용자 저장분 보호' 가 필요한 경로는 그냥 readSingle 사용.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSingleSafe<T = any>(filename: string): Promise<T | null> {
  try {
    return await readSingle<T>(filename);
  } catch (err) {
    console.warn(`[db:safe] ${filename}: read failed, returning null`, err);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readDataSafe<T = any>(filename: string): Promise<T[]> {
  try {
    return await readData<T>(filename);
  } catch (err) {
    console.warn(`[db:safe] ${filename}: read failed, returning []`, err);
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
