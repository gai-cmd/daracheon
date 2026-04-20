import fs from 'fs';
import path from 'path';
import { put, list, del } from '@vercel/blob';

/**
 * Persistent JSON store
 *
 * Strategy:
 *  ─ Prod (BLOB_READ_WRITE_TOKEN set): reads+writes go to Vercel Blob.
 *     - First read on a fresh store: no blob exists → fall back to the
 *       bundled JSON seed in /data/db (included via .vercelignore whitelist).
 *     - First write: materializes the blob; subsequent reads come from blob.
 *  ─ Dev (no token): reads+writes use the local filesystem as before.
 *
 * A module-scope cache avoids a Blob round-trip on every call within the
 * same serverless instance. Writes invalidate the cache entry and persist
 * to Blob before returning, so the next read in the same request sees
 * the latest value.
 */

const DB_DIR = path.join(process.cwd(), 'data', 'db');
const BLOB_PREFIX = 'db/';

const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

type CacheEntry = { data: unknown };
const cache = new Map<string, CacheEntry>();

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

async function blobReadRaw(filename: string): Promise<unknown | null> {
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
    const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
    if (!match) return null;
    const res = await fetch(match.url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[db] blob read failed for ${filename}`, err);
    return null;
  }
}

async function blobWriteRaw(filename: string, data: unknown) {
  await put(`${BLOB_PREFIX}${filename}.json`, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

async function readRaw(filename: string): Promise<unknown | null> {
  const cached = cache.get(filename);
  if (cached) return cached.data;

  let data: unknown | null = null;
  if (hasBlob) {
    data = await blobReadRaw(filename);
    // First-time seed: fall back to bundled JSON when blob has no entry yet
    if (data === null) data = fsReadRaw(filename);
  } else {
    data = fsReadRaw(filename);
  }

  cache.set(filename, { data });
  return data;
}

async function writeRaw(filename: string, data: unknown): Promise<void> {
  cache.set(filename, { data });
  if (hasBlob) {
    await blobWriteRaw(filename, data);
  } else if (process.env.VERCEL) {
    // Vercel serverless fs is read-only. Refuse the write with a clear signal
    // instead of silently losing data.
    throw new Error(
      'DB write failed: BLOB_READ_WRITE_TOKEN is not set. ' +
        'Create a Vercel Blob store and link it to this project (Dashboard → Storage → Blob).'
    );
  } else {
    fsWriteRaw(filename, data);
  }
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
  cache.delete(filename);
  if (hasBlob) {
    try {
      const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
      const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
      if (match) await del(match.url);
    } catch (err) {
      console.error(`[db] blob delete failed for ${filename}`, err);
    }
  } else {
    const filePath = path.join(DB_DIR, `${filename}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

export function invalidateCache(filename?: string) {
  if (filename) cache.delete(filename);
  else cache.clear();
}

export function isBlobEnabled(): boolean {
  return hasBlob;
}
