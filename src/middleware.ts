import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/login',
  '/admin/password-reset',
]);

const PUBLIC_ADMIN_API_PREFIXES = [
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
  '/api/admin/auth/password-reset',
  '/api/admin/revalidate-pages',
  '/api/admin/seed-process-tab',
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
