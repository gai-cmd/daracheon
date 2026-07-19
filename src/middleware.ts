import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { PARTNER_COOKIE, verifyPartnerToken } from '@/lib/partner-auth';

const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/login',
  '/admin/password-reset',
]);

const PUBLIC_ADMIN_API_PREFIXES = [
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
  '/api/admin/auth/password-reset',
  '/api/admin/auth/google/', // SSO start·callback (세션 없이 진입)
  '/api/admin/revalidate-pages',
];

function isPublicAdminPath(pathname: string): boolean {
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return true;
  return PUBLIC_ADMIN_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  // www → apex 정규화. 네이버 지도 Web 서비스 URL 등록이 apex 만 허용해서
  // www 도메인에서 인증 실패. 모든 트래픽을 apex 로 영구 이동.
  const host = request.headers.get('host');
  if (host === 'www.zoellife.com') {
    const url = request.nextUrl.clone();
    url.host = 'zoellife.com';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  const pathname = request.nextUrl.pathname.toLowerCase();

  // 침향 논문 아카이브(/thesis): 비밀번호 한 칸짜리 자체 로그인 화면 + 쿠키.
  // (HTTP Basic Auth 는 브라우저가 아이디 칸을 강제하므로 사용하지 않음 — "아이디 필요 없음")
  // 기존 사이트 로직과 완전히 독립된 추가 블록 — /thesis 외 경로에는 영향 없음.
  if (pathname.startsWith('/thesis')) {
    const THESIS_COOKIE = 'thesis_auth';
    // 하드코딩 기본값 없음 — env 미설정 시 어떤 쿠키도 통과시키지 않는다(fail-closed).
    const THESIS_TOKEN = process.env.THESIS_TOKEN;
    const cookie = request.cookies.get(THESIS_COOKIE)?.value;
    if (THESIS_TOKEN && cookie === THESIS_TOKEN) {
      return NextResponse.next();
    }
    const hasError = request.nextUrl.searchParams.get('e') === '1';
    const loginHtml = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Thesis Archive</title>
<style>html,body{height:100%}body{margin:0;display:flex;align-items:center;justify-content:center;
background:#0b0f14;color:#e6edf3;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Apple SD Gothic Neo","Noto Sans KR",sans-serif}
.box{background:#1a2129;border:1px solid #2a3441;border-radius:12px;padding:32px 28px;width:340px;text-align:center}
h2{margin:0 0 6px;font-size:18px}p{color:#8b98a5;font-size:13px;margin:0 0 18px}
input{width:100%;padding:11px 12px;background:#0f1620;color:#e6edf3;border:1px solid #2a3441;border-radius:8px;font-size:14px;margin-bottom:10px}
button{width:100%;padding:11px;background:#4493f8;color:#fff;border:0;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600}
.err{color:#f0726a;font-size:12px;min-height:16px;margin-top:8px}</style></head>
<body><div class="box"><h2>🔒 Thesis Archive</h2><p>침향(Agarwood) 논문 아카이브<br>비밀번호를 입력하세요</p>
<form method="post" action="/api/thesis-unlock">
<input type="password" name="password" placeholder="비밀번호" autofocus autocomplete="current-password">
<button type="submit">열기</button>
<div class="err">${hasError ? '비밀번호가 올바르지 않습니다' : ''}</div>
</form></div></body></html>`;
    return new NextResponse(loginHtml, {
      status: 401,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  // 외부 위탁업체 업로드 포털(/partner) — 관리자와 완전 분리된 별도 쿠키 인증.
  // 파트너 세션으로는 /admin·/api/admin 접근 불가 (아래 관리자 블록은 관리자
  // 쿠키만 검사), 반대로 관리자 쿠키도 여기서는 무효.
  const isPartnerPage = pathname.startsWith('/partner');
  const isPartnerApi = pathname.startsWith('/api/partner');
  if (isPartnerPage || isPartnerApi) {
    const isPublicPartnerPath =
      pathname === '/partner/login' || pathname.startsWith('/api/partner/auth/');
    if (isPublicPartnerPath) return NextResponse.next();

    const partnerToken = request.cookies.get(PARTNER_COOKIE)?.value;
    const partnerSession = await verifyPartnerToken(partnerToken);
    if (!partnerSession) {
      if (isPartnerApi) {
        return NextResponse.json(
          { success: false, message: '인증이 필요합니다.' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/partner/login', request.url));
    }
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) return NextResponse.next();
  if (isPublicAdminPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (isAdminApi) {
      return NextResponse.json(
        { success: false, message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/admin/login', request.url);
    if (pathname !== '/admin') loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('x-admin-email', session.email);
  response.headers.set('x-admin-role', session.role);
  return response;
}

export const config = {
  // www→apex 리다이렉트 + 어드민 인증을 모두 처리. 정적 파일·이미지 최적화는 제외.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|uploads/).*)'],
};
