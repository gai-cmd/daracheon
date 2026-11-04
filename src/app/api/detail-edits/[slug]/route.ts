import { NextResponse, type NextRequest } from 'next/server';
import { corsOriginFor } from '@/lib/detail-edits/origin';
import { jsonResponse, resolveSlug } from '@/lib/detail-edits/http';
import { detailEditStore } from '@/lib/detail-edits/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

/** 시안 사이트(별도 오리진)에서 읽어 가는 공개 API — 허용 오리진만 CORS 를 열어 준다. */
function corsHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { Vary: 'Origin' };
  const allowed = corsOriginFor(request.headers.get('origin'));
  if (allowed) headers['Access-Control-Allow-Origin'] = allowed;
  return headers;
}

const notFound = (request: NextRequest) =>
  jsonResponse({ success: false, code: 'NOT_FOUND' }, 404, corsHeaders(request));

/**
 * GET /api/detail-edits/<slug> — 인증 없음. 편집 문서(updatedBy 제외)를 돌려준다.
 * 저장소가 실패하면 200 + 빈 문서(+ X-DE-Degraded)로 응답해 시안 페이지가 원본 그대로 보이게 한다(fail-open).
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const slug = await resolveSlug(params);
  if (!slug) return notFound(request);

  const { doc, degraded } = await detailEditStore.readPublic(slug);
  return NextResponse.json(doc, {
    status: 200,
    headers: {
      ...corsHeaders(request),
      'Cache-Control': degraded ? 'no-store' : 'public, s-maxage=15, stale-while-revalidate=60',
      'X-Robots-Tag': 'noindex, nofollow',
      ...(degraded ? { 'X-DE-Degraded': '1' } : {}),
    },
  });
}

export async function OPTIONS(request: NextRequest, { params }: Ctx) {
  const slug = await resolveSlug(params);
  if (!slug) return notFound(request);
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(request),
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '600',
      'Cache-Control': 'no-store',
    },
  });
}
