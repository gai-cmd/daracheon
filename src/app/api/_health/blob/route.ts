import { NextResponse } from 'next/server';
import { readSingle, writeSingle } from '@/lib/db';
import { put, list, del } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 자가진단용 — admin 저장 경로와 동일한 writeSingle/readSingle 를 사용해
// Blob 토큰 유무 + 실제 read/write/delete 가 작동하는지 end-to-end 검증.
// 결과는 JSON 으로 공개 (민감 정보 없음 — 테스트 키는 즉시 삭제).
export async function GET() {
  const steps: Array<{ step: string; ok: boolean; detail?: string; error?: string }> = [];
  const testKey = '__health_probe__';
  const testValue = { timestamp: new Date().toISOString(), nonce: Math.random().toString(36).slice(2) };

  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  steps.push({
    step: 'env.BLOB_READ_WRITE_TOKEN',
    ok: hasToken,
    detail: hasToken ? 'set' : 'NOT set — 저장 실패 원인',
  });

  // 1) write
  try {
    await writeSingle(testKey, testValue);
    steps.push({ step: 'writeSingle', ok: true });
  } catch (err) {
    steps.push({ step: 'writeSingle', ok: false, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ ok: false, steps }, { status: 500 });
  }

  // 2) read-back
  try {
    const read = await readSingle<typeof testValue>(testKey);
    const match = read?.nonce === testValue.nonce;
    steps.push({
      step: 'readSingle round-trip',
      ok: !!match,
      detail: match ? `nonce matched (${testValue.nonce})` : `expected ${testValue.nonce}, got ${read?.nonce ?? 'null'}`,
    });
  } catch (err) {
    steps.push({ step: 'readSingle round-trip', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  // 3) list blob (확인용)
  let blobCount = 0;
  try {
    const { blobs } = await list({ prefix: 'db/', limit: 100 });
    blobCount = blobs.length;
    steps.push({ step: 'blob list', ok: true, detail: `${blobCount} blobs under db/ prefix` });
  } catch (err) {
    steps.push({ step: 'blob list', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  // 4) cleanup
  try {
    const { blobs } = await list({ prefix: `db/${testKey}.json`, limit: 1 });
    const match = blobs.find((b) => b.pathname === `db/${testKey}.json`);
    if (match) {
      await del(match.url);
      steps.push({ step: 'cleanup delete', ok: true });
    } else {
      steps.push({ step: 'cleanup delete', ok: true, detail: 'no test blob to delete' });
    }
  } catch (err) {
    steps.push({ step: 'cleanup delete', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  const allOk = steps.every((s) => s.ok);
  return NextResponse.json(
    {
      ok: allOk,
      summary: allOk ? '✓ Blob read/write 정상 — admin 저장 가능' : '✗ 문제 발견 — steps 참조',
      blobCount,
      steps,
    },
    { status: allOk ? 200 : 500 }
  );
}
