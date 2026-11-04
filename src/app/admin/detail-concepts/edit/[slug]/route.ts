import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { buildEditCsp, fetchConceptHtml, transformConceptHtml } from '@/lib/detail-edits/edit-page';
import { getConceptOrigin, requestOrigin } from '@/lib/detail-edits/origin';
import { isDetailSlug } from '@/lib/detail-edits/pages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

/** 오류 안내용 최소 HTML — 시안 본문이 아니므로 별도(엄격한) CSP 를 쓴다. */
function messagePage(status: number, title: string, message: string, link?: { href: string; label: string }) {
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const html =
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title>` +
    `<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f5f2;color:#1f1d19;` +
    `font:16px/1.6 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}` +
    `main{max-width:420px;padding:32px 28px;background:#fff;border:1px solid #e2dfd8;border-radius:12px}` +
    `h1{margin:0 0 8px;font-size:18px}p{margin:0 0 16px;color:#57534a}a{color:#7a3b17}</style></head>` +
    `<body><main><h1>${esc(title)}</h1><p>${esc(message)}</p>` +
    (link ? `<a href="${esc(link.href)}">${esc(link.label)}</a>` : '') +
    `</main></body></html>`;
  return new NextResponse(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}

/**
 * GET /admin/detail-concepts/edit/<slug> — 시안 HTML 에 편집기를 입혀 zoellife 오리진으로 돌려준다.
 * 미들웨어가 /admin/* 를 관리자 쿠키로 막지만, 여기서도 세션을 직접 확인한다.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  if (!isDetailSlug(slug)) {
    return messagePage(404, '존재하지 않는 시안입니다', '주소를 다시 확인해 주세요.', {
      href: '/admin/detail-concepts',
      label: '시안 목록으로',
    });
  }

  let session = null;
  try {
    session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  } catch (err) {
    console.error('[detail-edits] 편집 페이지 세션 검증 오류', err);
  }
  if (!session) {
    return messagePage(401, '로그인이 필요합니다', '관리자 로그인 후 다시 열어 주세요.', {
      href: `/admin/login?next=${encodeURIComponent(`/admin/detail-concepts/edit/${slug}`)}`,
      label: '로그인',
    });
  }

  const conceptOrigin = getConceptOrigin();
  const upstream = await fetchConceptHtml(slug, conceptOrigin);
  if (!upstream.ok) {
    return messagePage(502, '시안 페이지를 불러오지 못했습니다', '시안 사이트가 응답하지 않거나 올바른 페이지가 아닙니다. 잠시 후 다시 시도해 주세요.', {
      href: '/admin/detail-concepts',
      label: '시안 목록으로',
    });
  }

  const html = transformConceptHtml(upstream.html, {
    slug,
    conceptOrigin,
    scriptOrigin: requestOrigin(request),
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'same-origin',
      // 전역 헤더(next.config.ts)가 이 경로에 이미 같은 이름의 헤더를 붙이면 Next 는 이쪽 값을 버린다 — README '전역 헤더' 참조.
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': buildEditCsp(conceptOrigin),
    },
  });
}
