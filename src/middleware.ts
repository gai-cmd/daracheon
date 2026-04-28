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
];

function isPublicAdminPath(pathname: string): boolean {
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return true;
  return PUBLIC_ADMIN_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
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
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
