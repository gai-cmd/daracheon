import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from '@/lib/auth';
import {
  getGoogleOAuthConfig,
  resolveRedirectUri,
  sanitizeNextPath,
  OAUTH_STATE_COOKIE,
  OAUTH_NEXT_COOKIE,
} from '@/lib/google-oauth';
import { readDataForWrite, writeDataMerged } from '@/lib/db';
import type { AdminUser } from '@/lib/admin-users';
import type { AuditEntry } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function redirectToLogin(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/admin/login?error=${error}`, request.url));
}

// 오류 응답에도 oauth 임시 쿠키를 정리한다.
function clearOAuthCookies(res: NextResponse) {
  res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set(OAUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

async function auditSsoLogin(email: string, role: string, action: 'login' | 'login_failed', summary: string) {
  try {
    const entries = await readDataForWrite<AuditEntry>('audit-log');
    entries.push({
      id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actor: email,
      actorRole: role,
      module: 'auth',
      action,
      summary,
    });
    const trimmed = entries.length > 2000 ? entries.splice(0, entries.length - 2000) : [];
    await writeDataMerged('audit-log', entries, { removedIds: trimmed.map((e) => e.id) });
  } catch (err) {
    console.error('[SSO Audit] login log failed:', err);
  }
}

// 구글 리다이렉트 처리:
// state(CSRF) 검증 → code 교환 → 검증된 이메일 획득 →
// admin-users 등록 멤버만 인가 → 기존 세션 토큰 발급.
export async function GET(request: Request) {
  const url = new URL(request.url);

  const config = getGoogleOAuthConfig();
  if (!config) return clearOAuthCookies(redirectToLogin(request, 'sso_not_configured'));

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.slice(OAUTH_STATE_COOKIE.length + 1);

  if (!code || !state || !cookieState || state !== cookieState) {
    return clearOAuthCookies(redirectToLogin(request, 'oauth_state'));
  }

  const nextRaw = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_NEXT_COOKIE}=`))
    ?.slice(OAUTH_NEXT_COOKIE.length + 1);
  const next = sanitizeNextPath(nextRaw ? decodeURIComponent(nextRaw) : null);

  try {
    const redirectUri = resolveRedirectUri(request.url);

    // 1) code → tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return clearOAuthCookies(redirectToLogin(request, 'oauth_token'));
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return clearOAuthCookies(redirectToLogin(request, 'oauth_token'));

    // 2) 검증된 이메일 조회
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userinfoRes.ok) return clearOAuthCookies(redirectToLogin(request, 'oauth_userinfo'));
    const profile = (await userinfoRes.json()) as { email?: string; email_verified?: boolean };
    const email = profile.email?.trim().toLowerCase();
    if (!email || profile.email_verified === false) {
      return clearOAuthCookies(redirectToLogin(request, 'oauth_email'));
    }

    // 3) 인가: admin-users 에 등록된 멤버만 통과 (agarwooding 과 동일 모델)
    const users = await readDataForWrite<AdminUser>('admin-users');
    const idx = users.findIndex((u) => u.email === email);
    if (idx < 0) {
      await auditSsoLogin(email, 'unknown', 'login_failed', `미등록 계정 SSO 로그인 시도: ${email}`);
      return clearOAuthCookies(redirectToLogin(request, 'not_authorized'));
    }

    const user = users[idx];

    // 잠금 상태면 SSO 도 차단 (비밀번호 로그인과 동일 정책)
    if (user.lockedUntil && Date.now() < new Date(user.lockedUntil).getTime()) {
      await auditSsoLogin(email, user.role, 'login_failed', '잠긴 계정 SSO 로그인 시도');
      return clearOAuthCookies(redirectToLogin(request, 'account_locked'));
    }

    // lastLoginAt 갱신 (실패해도 로그인은 진행)
    try {
      user.lastLoginAt = new Date().toISOString();
      user.failedAttempts = 0;
      delete user.lockedUntil;
      users[idx] = user;
      await writeDataMerged('admin-users', users);
    } catch (err) {
      console.error('[SSO] lastLoginAt 갱신 실패:', err);
    }

    await auditSsoLogin(email, user.role, 'login', `구글 SSO 로그인: ${email}`);

    // 4) 세션 발급 (비밀번호 로그인과 동일한 토큰/쿠키)
    const token = await createSessionToken({ email, role: user.role });
    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return clearOAuthCookies(response);
  } catch (err) {
    console.error('[SSO Callback] error:', err);
    return clearOAuthCookies(redirectToLogin(request, 'oauth_failed'));
  }
}
