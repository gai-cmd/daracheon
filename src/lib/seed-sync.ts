import fs from 'fs';
import path from 'path';
import { list } from '@vercel/blob';

/**
 * Blob → fs seed snapshot utility.
 *
 * Vercel 빌드 시(prebuild) 한 번 호출해서 현재 blob 상태를 번들에
 * 포함될 `/data/db/*.json` 에 덮어쓴다. 이렇게 하면 런타임의 3계층
 * fallback 중 T3(fs seed) 도 최신 콘텐츠를 제공하게 됨. admin UI 의
 * "Resync now" 액션에서도 동일 유틸을 호출.
 *
 * 화이트리스트는 .vercelignore 의 공개 데이터 목록과 일치해야 한다.
 * 민감/휘발성 파일(admin-users, audit-log 등)은 절대 스냅샷하지 않음.
 */

export const SYNC_WHITELIST = [
  'products',
  'productCategories',
  'reviews',
  'media',
  'broadcasts',
  'faq',
  'announcement',
  'pages',
  'company',
  'navigation',
] as const;

export type SyncFilename = (typeof SYNC_WHITELIST)[number];

const BLOB_PREFIX = 'db/';
const DB_DIR = path.join(process.cwd(), 'data', 'db');

export interface FileResult {
  name: string;
  status: 'written' | 'skipped-not-in-blob' | 'error';
  bytes?: number;
  uploadedAt?: string;
  error?: string;
}

export interface SyncResult {
  attempted: number;
  written: number;
  skipped: number;
  errors: number;
  files: FileResult[];
  reason?: string; // top-level skip reason (no token, preview env, etc.)
}

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

async function fetchOne(filename: string): Promise<FileResult> {
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}.json`, limit: 1 });
    const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}.json`);
    if (!match) {
      return { name: filename, status: 'skipped-not-in-blob' };
    }
    const bust = match.uploadedAt ? `?v=${new Date(match.uploadedAt).getTime()}` : `?v=${Date.now()}`;
    const res = await fetch(`${match.url}${bust}`, { cache: 'no-store' });
    if (!res.ok) {
      return { name: filename, status: 'error', error: `HTTP ${res.status}` };
    }
    const body = await res.text(); // keep verbatim JSON
    // Validate JSON before writing so a corrupted blob doesn't poison the seed.
    try {
      JSON.parse(body);
    } catch (e) {
      return { name: filename, status: 'error', error: 'invalid JSON in blob' };
    }
    ensureDir();
    const target = path.join(DB_DIR, `${filename}.json`);
    fs.writeFileSync(target, body, 'utf-8');
    return {
      name: filename,
      status: 'written',
      bytes: body.length,
      uploadedAt: match.uploadedAt ? new Date(match.uploadedAt).toISOString() : undefined,
    };
  } catch (err) {
    return { name: filename, status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

export async function syncSeedFromBlob(options?: {
  /** Skip the VERCEL_ENV=preview guard (for admin-triggered resync in any env). */
  allowPreview?: boolean;
}): Promise<SyncResult> {
  const empty: SyncResult = { attempted: 0, written: 0, skipped: 0, errors: 0, files: [] };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ...empty, reason: 'BLOB_READ_WRITE_TOKEN not set — skipping (dev/local env)' };
  }
  if (!options?.allowPreview && process.env.VERCEL_ENV === 'preview') {
    return { ...empty, reason: 'VERCEL_ENV=preview — skipping to avoid polluting prod seed' };
  }

  // Parallel fetch — whitelist is small (~10 files) and blob CDN handles it easily.
  const files = await Promise.all(SYNC_WHITELIST.map((name) => fetchOne(name)));
  const written = files.filter((f) => f.status === 'written').length;
  const skipped = files.filter((f) => f.status === 'skipped-not-in-blob').length;
  const errors = files.filter((f) => f.status === 'error').length;

  return { attempted: files.length, written, skipped, errors, files };
}
