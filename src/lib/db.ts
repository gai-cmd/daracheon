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

async function blobReadRawUncached(filename: string): Promise<unknown | null> {
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
    const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
    if (!match) return null;
    // match.url 은 Vercel CDN 에서 서빙되며 기본 TTL 이 1년 — overwrite 해도
    // CDN 이 이전 콘텐츠를 계속 서빙함. list 가 응답에 포함해주는
    // uploadedAt 타임스탬프를 query 로 붙여 CDN cache key 를 uploadedAt 별로
    // 갈라 버린다. 새 uploadedAt = 새 캐시 엔트리 = origin 히트 = fresh.
    const bust = match.uploadedAt
      ? `?v=${new Date(match.uploadedAt).getTime()}`
      : `?v=${Date.now()}`;
    const res = await fetch(`${match.url}${bust}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[db] blob read failed for ${filename}`, err);
    return null;
  }
}

// Wrap the blob read with Next's data cache, tagged so writes can
// invalidate every serverless instance globally in one call. We throw
// on null so the cache entry is not persisted — otherwise a missing
// blob (e.g. before eventual consistency on list) would be cached as
// null for the entire revalidate window.
const NOT_FOUND = Symbol('not_found');
async function blobReadRaw(filename: string): Promise<unknown | null> {
  const cached = unstable_cache(
    async () => {
      const data = await blobReadRawUncached(filename);
      if (data === null) throw NOT_FOUND;
      return data;
    },
    ['db', filename],
    { tags: [dbTag(filename)], revalidate: 300 }
  );
  try {
    return await cached();
  } catch (err) {
    if (err === NOT_FOUND) return null;
    throw err;
  }
}

async function blobWriteRaw(filename: string, data: unknown) {
  await put(`${BLOB_PREFIX}${filename}.json`, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    // 기본값(31536000s)이면 Vercel CDN 이 overwrite 후에도 이전 콘텐츠를
    // 오랫동안 서빙해 admin 저장 → 프론트 반영이 지연됨. 0 으로 내려
    // 다음 요청마다 origin 까지 가도록 강제.
    cacheControlMaxAge: 0,
  });
}

async function readRaw(filename: string): Promise<unknown | null> {
  if (hasBlob) {
    const data = await blobReadRaw(filename);
    // First-time seed: fall back to bundled JSON when blob has no entry yet
    return data ?? fsReadRaw(filename);
  }
  return fsReadRaw(filename);
}

async function writeRaw(filename: string, data: unknown): Promise<void> {
  if (hasBlob) {
    await blobWriteRaw(filename, data);
    // Bust Next's shared data cache so every instance fetches fresh.
    try {
      revalidateTag(dbTag(filename));
    } catch (err) {
      // revalidateTag may throw outside a request scope — safe to ignore.
      console.warn(`[db] revalidateTag failed for ${filename}`, err);
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
