import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { list } from '@vercel/blob';
import { SYNC_WHITELIST } from '@/lib/seed-sync';

export const dynamic = 'force-dynamic';

// Middleware already enforces authentication on /api/admin/* paths.
// This endpoint only reads metadata (size/uploadedAt), never content,
// so further role gating isn't necessary — any logged-in admin can inspect.

interface FileStatus {
  name: string;
  blob: { size: number; uploadedAt: string | null; url: string } | null;
  seed: { size: number; mtime: string } | null;
  match: boolean; // true iff both exist and sizes match (rough signal)
}

const BLOB_PREFIX = 'db/';
const DB_DIR = path.join(process.cwd(), 'data', 'db');

async function inspectOne(name: string): Promise<FileStatus> {
  let blobInfo: FileStatus['blob'] = null;
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${name}.json`, limit: 1 });
    const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${name}.json`);
    if (match) {
      blobInfo = {
        size: match.size,
        uploadedAt: match.uploadedAt ? new Date(match.uploadedAt).toISOString() : null,
        url: match.url,
      };
    }
  } catch (err) {
    console.warn(`[api:db:status] blob list failed for ${name}`, err);
  }

  let seedInfo: FileStatus['seed'] = null;
  const seedPath = path.join(DB_DIR, `${name}.json`);
  try {
    if (fs.existsSync(seedPath)) {
      const stat = fs.statSync(seedPath);
      seedInfo = { size: stat.size, mtime: stat.mtime.toISOString() };
    }
  } catch (err) {
    console.warn(`[api:db:status] seed stat failed for ${name}`, err);
  }

  const matches = !!blobInfo && !!seedInfo && blobInfo.size === seedInfo.size;
  return { name, blob: blobInfo, seed: seedInfo, match: matches };
}

export async function GET() {
  const t0 = Date.now();
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  const files = await Promise.all(SYNC_WHITELIST.map((n) => inspectOne(n)));

  const totalBlobBytes = files.reduce((s, f) => s + (f.blob?.size ?? 0), 0);
  const totalSeedBytes = files.reduce((s, f) => s + (f.seed?.size ?? 0), 0);
  const mismatchCount = files.filter((f) => !f.match).length;
  const latestUpload = files
    .map((f) => f.blob?.uploadedAt)
    .filter((x): x is string => !!x)
    .sort()
    .at(-1);

  return NextResponse.json({
    hasBlobToken: hasToken,
    files,
    totalBlobBytes,
    totalSeedBytes,
    mismatchCount,
    latestUpload: latestUpload ?? null,
    elapsedMs: Date.now() - t0,
  });
}
