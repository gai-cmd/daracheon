import { NextResponse } from 'next/server';
import { readSingle, writeSingle } from '@/lib/db';
import { list, put } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 자가진단 — writeSingle/readSingle 경로 전체를 E2E 검증.
// 실패 원인 분리용으로 "raw blob put→fetch" 경로도 나란히 검증.
export async function GET() {
  const steps: Array<{ step: string; ok: boolean; detail?: string; error?: string }> = [];
  const testKey = '__health_probe__';
  const testValue = { timestamp: new Date().toISOString(), nonce: Math.random().toString(36).slice(2) };

  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  steps.push({
    step: 'env.BLOB_READ_WRITE_TOKEN',
    ok: hasToken,
    detail: hasToken ? 'set' : 'NOT set',
  });

  // === A. raw put→fetch (list 우회) ===
  let putUrl: string | null = null;
  try {
    const raw = await put(
      `db/${testKey}.json`,
      JSON.stringify(testValue),
      { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' }
    );
    putUrl = raw.url;
    steps.push({ step: 'A1: put() direct', ok: true, detail: `url=${raw.url}` });
  } catch (err) {
    steps.push({ step: 'A1: put() direct', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  if (putUrl) {
    try {
      // cache-buster 로 CDN 우회 (Vercel Blob default TTL 31,536,000s 극복)
      const bustUrl = `${putUrl}?v=${Date.now()}`;
      const res = await fetch(bustUrl, { cache: 'no-store' });
      const body = res.ok ? await res.json() : null;
      const ok = body?.nonce === testValue.nonce;
      steps.push({
        step: 'A2: fetch(put.url?v=…) with cache-buster',
        ok,
        detail: ok ? `nonce matched` : `body=${JSON.stringify(body)}`,
      });
    } catch (err) {
      steps.push({ step: 'A2: fetch(put.url?v=…) with cache-buster', ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // === B. list consistency ===
  try {
    const { blobs } = await list({ prefix: `db/${testKey}.json`, limit: 5 });
    const found = blobs.find((b) => b.pathname === `db/${testKey}.json`);
    steps.push({
      step: 'B: list() finds just-written probe',
      ok: !!found,
      detail: found ? `url=${found.url}` : `list returned ${blobs.length} entries (none matching)`,
    });
  } catch (err) {
    steps.push({ step: 'B: list() finds just-written probe', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  // === C. writeSingle/readSingle round-trip ===
  try {
    await writeSingle(testKey, testValue);
    steps.push({ step: 'C1: writeSingle', ok: true });
  } catch (err) {
    steps.push({ step: 'C1: writeSingle', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  let match = false;
  let lastNonce: string | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const read = await readSingle<typeof testValue>(testKey);
    lastNonce = read?.nonce ?? null;
    if (lastNonce === testValue.nonce) { match = true; break; }
    await new Promise((r) => setTimeout(r, 500));
  }
  steps.push({
    step: 'C2: readSingle round-trip',
    ok: match,
    detail: match
      ? `nonce matched via readSingle`
      : `expected ${testValue.nonce}, got ${lastNonce ?? 'null'}`,
  });

  // === D. total blob count ===
  let blobCount = 0;
  try {
    const { blobs } = await list({ prefix: 'db/', limit: 100 });
    blobCount = blobs.length;
    steps.push({ step: 'D: blob list total', ok: true, detail: `${blobCount} blobs under db/ prefix` });
  } catch (err) {
    steps.push({ step: 'D: blob list total', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  const allOk = steps.every((s) => s.ok);
  return NextResponse.json(
    {
      ok: allOk,
      summary: allOk ? '✓ 전 경로 정상' : '✗ 일부 실패 — steps 참조',
      blobCount,
      steps,
    },
    { status: allOk ? 200 : 500 }
  );
}
