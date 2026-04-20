import { NextResponse } from 'next/server';
import { readSingle, writeSingle } from '@/lib/db';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 자가진단용 — admin 저장 경로와 동일한 writeSingle/readSingle 를 사용해
// write + read round-trip 을 end-to-end 검증. probe 키는 일부러 삭제하지
// 않음 — 매 호출마다 새 blob 을 만들면 Vercel Blob `list` 의 eventual
// consistency 때문에 방금 쓴 걸 못 찾는 레이스가 생김. probe 를 영속화
// 하면 두 번째 호출부터는 "기존 blob 덮어쓰기" 가 되어 실제 admin 저장
// 플로우(항상 기존 pages blob 을 덮어씀)와 동일 조건이 된다.
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

  // 2) read-back — 첫 호출(새 blob)은 list eventual consistency 로 실패할 수
  //    있으므로 최대 3초간 500ms 간격 재시도.
  let match = false;
  let lastNonce: string | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const read = await readSingle<typeof testValue>(testKey);
    lastNonce = read?.nonce ?? null;
    if (lastNonce === testValue.nonce) { match = true; break; }
    await new Promise((r) => setTimeout(r, 500));
  }
  steps.push({
    step: 'readSingle round-trip',
    ok: match,
    detail: match
      ? `nonce matched (${testValue.nonce})`
      : `expected ${testValue.nonce}, got ${lastNonce ?? 'null'} — list eventual consistency?`,
  });

  // 3) blob list (확인용)
  let blobCount = 0;
  try {
    const { blobs } = await list({ prefix: 'db/', limit: 100 });
    blobCount = blobs.length;
    steps.push({ step: 'blob list', ok: true, detail: `${blobCount} blobs under db/ prefix` });
  } catch (err) {
    steps.push({ step: 'blob list', ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  const allOk = steps.every((s) => s.ok);
  return NextResponse.json(
    {
      ok: allOk,
      summary: allOk ? '✓ Blob read/write 정상 — admin 저장 → 프론트 반영 OK' : '✗ 문제 발견 — steps 참조',
      blobCount,
      steps,
    },
    { status: allOk ? 200 : 500 }
  );
}
