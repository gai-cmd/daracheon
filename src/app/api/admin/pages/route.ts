import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type PagesData = Record<string, unknown>;

const PAGE_PUBLIC_PATHS: Record<string, string[]> = {
  aboutAgarwood: ['/about-agarwood'],
  brandStory: ['/brand-story'],
  home: ['/'],
  company: ['/company'],
  process: ['/process'],
  support: ['/support'],
};

const VALID_KEYS = Object.keys(PAGE_PUBLIC_PATHS);

function errorResponse(stage: string, message: string, status: number, detail?: unknown) {
  console.error(`[api:pages] stage=${stage} msg=${message}`, detail ?? '');
  return NextResponse.json(
    {
      success: false,
      stage,
      message,
      detail: detail instanceof Error ? detail.message : detail,
    },
    { status }
  );
}

export async function GET() {
  const t0 = Date.now();
  try {
    console.log('[api:pages] GET stage=1:read begin');
    const pages = await readSingle('pages');
    console.log(`[api:pages] GET stage=1:read done (${Date.now() - t0}ms, has=${!!pages})`);
    if (!pages) {
      return NextResponse.json(
        { success: false, stage: 'read', message: '페이지 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ pages });
  } catch (error) {
    return errorResponse('read', '데이터 로드 실패', 500, error);
  }
}

export async function PUT(request: Request) {
  const t0 = Date.now();
  let body: { key: string; data: unknown };

  // Stage 1: 요청 파싱
  try {
    body = (await request.json()) as { key: string; data: unknown };
    console.log(`[api:pages] PUT stage=1:parse key=${body?.key} dataType=${typeof body?.data}`);
  } catch (err) {
    return errorResponse('parse', 'JSON 파싱 실패 (잘못된 요청)', 400, err);
  }

  // Stage 2: 키 검증
  if (!body.key || !VALID_KEYS.includes(body.key)) {
    return errorResponse('validate', `유효하지 않은 페이지 키: ${body.key}`, 400, { validKeys: VALID_KEYS });
  }
  if (body.data === undefined || body.data === null) {
    return errorResponse('validate', 'data 필드가 비어있습니다.', 400);
  }

  // Stage 3: 기존 pages blob 로드
  let existing: PagesData;
  try {
    const loaded = await readSingle<PagesData>('pages');
    existing = loaded ?? {};
    console.log(`[api:pages] PUT stage=3:load-existing keys=${Object.keys(existing).join(',')}`);
  } catch (err) {
    return errorResponse('load-existing', '기존 데이터 로드 실패 — 덮어쓰기 중단 (데이터 보호)', 503, err);
  }

  // Stage 4: merge
  const updated: PagesData = { ...existing, [body.key]: body.data };
  console.log(`[api:pages] PUT stage=4:merge merged key=${body.key}, total keys=${Object.keys(updated).length}`);

  // Stage 5: blob 쓰기
  try {
    await writeSingle('pages', updated);
    console.log(`[api:pages] PUT stage=5:write done`);
  } catch (err) {
    return errorResponse('write', 'Blob 저장 실패', 500, err);
  }

  // Stage 6: 감사 로그
  try {
    await logAdmin('settings', 'update', {
      summary: `페이지 수정: ${body.key}`,
      targetId: body.key,
    });
  } catch (err) {
    console.warn('[api:pages] audit log failed (non-fatal)', err);
  }

  // Stage 7: 프론트 재검증
  const revalidated: string[] = [];
  for (const p of PAGE_PUBLIC_PATHS[body.key] ?? []) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (err) {
      console.warn(`[api:pages] revalidate ${p} failed`, err);
    }
  }
  console.log(`[api:pages] PUT stage=7:revalidate paths=${revalidated.join(',')} total=${Date.now() - t0}ms`);

  return NextResponse.json({
    success: true,
    key: body.key,
    revalidated,
    totalMs: Date.now() - t0,
    pages: updated,
  });
}
