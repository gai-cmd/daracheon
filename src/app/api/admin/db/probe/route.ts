import { NextResponse } from 'next/server';
import { readSingle, writeSingle } from '@/lib/db';
import { list, put, del } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Admin-gated copy of /api/health/blob: runs a blob write→read round-trip
// using a throwaway probe key. Middleware enforces the admin session,
// so no extra auth check needed.

export async function GET() {
  const steps: Array<{ step: string; ok: boolean; detail?: string; error?: string }> = [];
  const testKey = '__admin_db_probe__';
  const testValue = { ts: new Date().toISOString(), nonce: Math.random().toString(36).slice(2) };

  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  steps.push({ step: 'env.BLOB_READ_WRITE_TOKEN', ok: hasToken, detail: hasToken ? 'set' : 'NOT set' });

  if (!hasToken) {
    return NextResponse.json(
      { ok: false, summary: 'Blob 토큰 미설정 — 로컬 환경으로 추정', steps },
      { status: 503 }
    );
  }

  // 1. Clear any prior probe blob
  try {
    const { blobs } = await list({ prefix: `db/${testKey}.json`, limit: 1 });
    const existing = blobs.find((b) => b.pathname === `db/${testKey}.json`);
    if (existing) await del(existing.url);
    steps.push({ step: 'clear prior probe', ok: true, detail: existing ? 'deleted' : 'none' });
  } catch (err) {
    steps.push({ step: 'clear prior probe', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  // 2. Put
  let putUrl: string | null = null;
  try {
    const raw = await put(`db/${testKey}.json`, JSON.stringify(testValue), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
    });
    putUrl = raw.url;
    steps.push({ step: 'put', ok: true, detail: raw.url });
  } catch (err) {
    steps.push({ step: 'put', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  // 3. Fetch with retry (edge propagation)
  if (putUrl) {
    let attempts = 0;
    let matched = false;
    for (; attempts < 15; attempts++) {
      const bust = `${putUrl}?v=${Date.now()}`;
      const res = await fetch(bust, { cache: 'no-store' });
      const body = res.ok ? await res.json() : null;
      if (body && typeof body === 'object' && 'nonce' in body && (body as { nonce: string }).nonce === testValue.nonce) {
        matched = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    steps.push({
      step: 'fetch with cache-buster',
      ok: matched,
      detail: matched ? `matched after ${attempts + 1} attempt(s)` : `still stale after ${attempts} attempts`,
    });
  }

  // 4. Round-trip via db.ts API
  try {
    await writeSingle(testKey, testValue);
    steps.push({ step: 'writeSingle', ok: true });
  } catch (err) {
    steps.push({ step: 'writeSingle', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  let match = false;
  let lastNonce: string | null = null;
  for (let i = 0; i < 6; i++) {
    const read = await readSingle<typeof testValue>(testKey);
    lastNonce = read?.nonce ?? null;
    if (lastNonce === testValue.nonce) {
      match = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  steps.push({
    step: 'readSingle round-trip',
    ok: match,
    detail: match ? 'nonce matched' : `expected ${testValue.nonce}, got ${lastNonce ?? 'null'}`,
  });

  // 5. Cleanup probe blob (best-effort)
  try {
    const { blobs } = await list({ prefix: `db/${testKey}.json`, limit: 1 });
    const toDel = blobs.find((b) => b.pathname === `db/${testKey}.json`);
    if (toDel) await del(toDel.url);
  } catch { /* ignore */ }

  const allOk = steps.every((s) => s.ok);
  return NextResponse.json(
    { ok: allOk, summary: allOk ? '✓ 전 경로 정상' : '✗ 일부 실패', steps },
    { status: allOk ? 200 : 500 }
  );
}
