import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import {
  getGoogleOAuthConfig,
  resolveRedirectUri,
  sanitizeNextPath,
  OAUTH_STATE_COOKIE,
  OAUTH_NEXT_COOKIE,
} from '@/lib/google-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 브라우저를 구글 동의화면으로 리다이렉트한다.
// CSRF 방지용 state 를 쿠키에 심고, 콜백에서 대조한다.
export async function GET(request: Request) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return NextResponse.redirect(new URL('/admin/login?error=sso_not_configured', request.url));
  }

  const url = new URL(request.url);
  const next = sanitizeNextPath(url.searchParams.get('next'));
  const redirectUri = resolveRedirectUri(request.url);
  const state = randomBytes(16).toString('hex');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authUrl.toString());
  const secure = process.env.NODE_ENV === 'production';
  // SameSite=Lax: 구글에서 되돌아오는 top-level GET 에서 쿠키가 전송되어야 함.
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 600,
  });
  response.cookies.set(OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 600,
  });
  return response;
}
