import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from '@/lib/auth';
import {
  getGoogleOAuthConfig,
  isConsoleNext,
  resolveRedirectUri,
  sanitizeNextPath,
  OAUTH_STATE_COOKIE,
  OAUTH_NEXT_COOKIE,
} from '@/lib/google-oauth';
import { readDataForWrite, writeDataMerged } from '@/lib/db';
import {
  decodeGoogleIdToken,
  getHandoffSecret,
  getWorkshopOpenDomains,
  getWorkshopReturnOrigins,
  isWorkshopOpenAccount,
  signHandoffToken,
  workshopReturnFromNext,
} from '@/lib/workshop-sso';
import type { AdminUser } from '@/lib/admin-users';
import type { AuditEntry, AuditModule } from '@/lib/audit';
import { CONSOLE_DOMAIN, isConsoleAdminEmail, isConsoleConfigured } from '@/lib/console/config';
import { CONSOLE_SESSION_COOKIE, consoleSessionCookieOptions, createConsoleSessionToken } from '@/lib/console/session';
import { appendConsoleAudit } from '@/lib/console/audit';

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

async function auditSsoLogin(
  email: string,
  role: string,
  action: 'login' | 'login_failed',
  summary: string,
  module: AuditModule = 'auth'
) {
  try {
    const entries = await readDataForWrite<AuditEntry>('audit-log');
    entries.push({
      id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actor: email,
      actorRole: role,
      module,
      action,
      summary,
    });
    const trimmed = entries.length > 2000 ? entries.splice(0, entries.length - 2000) : [];
    await writeDataMerged('audit-log', entries, { removedIds: trimmed.map((e) => e.id) });
  } catch (err) {
    console.error('[SSO Audit] login log failed:', err);
  }
}

// Workshop-only entry for verified accounts of an open Workspace domain (default try-n.com) that
// are NOT registered in admin-users. Returns the workshop return URL carrying a role "member"
// handoff token, or null when any condition fails. It never yields a zoellife admin session.
// Threat model and env vars: src/lib/workshop-sso.ts.
function workshopMemberEntry(args: {
  next: string;
  email: string;
  userinfoVerified: boolean;
  profileName: string;
  idToken: string | undefined;
  clientId: string;
}): { redirectTo: URL; domain: string } | null {
  // Null when unset, too short, or equal to ADMIN_SESSION_SECRET: a member token must never be
  // signed with a key that also verifies zoellife admin session cookies.
  const secret = getHandoffSecret();
  if (!secret) return null;

  const redirectTo = workshopReturnFromNext(args.next, getWorkshopReturnOrigins());
  if (!redirectTo) return null;

  const claims = decodeGoogleIdToken(args.idToken);
  if (!claims || claims.email?.toLowerCase() !== args.email) return null;

  const open = isWorkshopOpenAccount(
    {
      email: args.email,
      emailVerified: args.userinfoVerified && claims.email_verified === true,
      hd: claims.hd,
      aud: claims.aud,
    },
    { clientId: args.clientId, domains: getWorkshopOpenDomains() }
  );
  if (!open) return null;

  redirectTo.searchParams.set(
    't',
    signHandoffToken(secret, { email: args.email, name: args.profileName || args.email, role: 'member' })
  );
  return { redirectTo, domain: args.email.slice(args.email.lastIndexOf('@') + 1) };
}

// Console mode (SPEC-CONSOLE-001 REQ-CON-002/003/004, design.md §2.3): every exit goes to the
// console sign-in page, and admin-users and the admin session cookie are never read or written.
function consoleLoginRedirect(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/console/login?error=${error}`, request.url), 302);
}

// Admits a verified account of exactly try-n.com (no admin-users registration needed) and issues
// the console session cookie. Rejections once Google has returned an identity are audited; the
// domain list is the console constant, not WORKSHOP_OPEN_DOMAINS.
async function consoleEntry(
  request: Request,
  args: {
    next: string;
    email: string;
    userinfoVerified: boolean;
    profileName: string;
    idToken: string | undefined;
    clientId: string;
  }
): Promise<NextResponse> {
  const { email } = args;
  const role = isConsoleAdminEmail(email) ? 'console-admin' : 'console-member';

  const claims = decodeGoogleIdToken(args.idToken);
  const admitted =
    !!claims &&
    claims.email?.toLowerCase() === email &&
    isWorkshopOpenAccount(
      {
        email,
        emailVerified: args.userinfoVerified && claims.email_verified === true,
        hd: claims.hd,
        aud: claims.aud,
      },
      { clientId: args.clientId, domains: [CONSOLE_DOMAIN] }
    );

  const token = admitted ? await createConsoleSessionToken({ email, name: args.profileName || email }) : null;
  if (!token) {
    await auditConsoleLogin(email, 'unknown', false);
    return clearOAuthCookies(consoleLoginRedirect(request, 'not_allowed'));
  }

  await auditConsoleLogin(email, role, true);
  const response = NextResponse.redirect(new URL(args.next, request.url), 302);
  response.cookies.set(CONSOLE_SESSION_COOKIE, token, consoleSessionCookieOptions());
  return clearOAuthCookies(response);
}

// One console audit entry plus exactly one line in the site audit-log per identified attempt.
// Best effort, like auditSsoLogin: a logging failure never blocks or opens the sign-in.
async function auditConsoleLogin(email: string, role: 'console-admin' | 'console-member' | 'unknown', ok: boolean) {
  try {
    await appendConsoleAudit({
      actor: email,
      actorRole: role,
      action: ok ? 'auth.login' : 'auth.login_failed',
      ...(ok ? {} : { meta: { reason: 'not_allowed' } }),
    });
  } catch (err) {
    console.error('[Console SSO] console audit write failed:', err);
  }
  await auditSsoLogin(
    email,
    role,
    ok ? 'login' : 'login_failed',
    ok ? `콘솔 입장: ${email}` : `콘솔 로그인 거절(not_allowed): ${email}`,
    'console'
  );
}

function readCookie(request: Request, name: string): string | undefined {
  return request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

// 구글 리다이렉트 처리:
// state(CSRF) 검증 → code 교환 → 검증된 이메일 획득 →
// admin-users 등록 멤버만 인가 → 기존 세션 토큰 발급.
// 예외 출구: 미등록이지만 열린 Workspace 도메인(기본 try-n.com)의 검증된 계정은 작업실 role=member
// 토큰만 받고(관리자 세션 없음), 자세한 조건은 src/lib/workshop-sso.ts 참고.
// 콘솔 모드: next 쿠키가 콘솔 경로면(isConsoleNext) 맨 앞에서 모드를 정하고, 모든 오류 출구가
// /console/login 으로 간다. 관리자 모드의 출구 주소·코드·순서는 그대로다.
export async function GET(request: Request) {
  const url = new URL(request.url);

  // The mode is decided before any other step, from the next cookie.
  // A malformed percent sequence in the cookie must not throw; sanitizeNextPath(null) gives /admin.
  const nextRaw = readCookie(request, OAUTH_NEXT_COOKIE);
  let nextDecoded: string | null = null;
  try {
    nextDecoded = nextRaw ? decodeURIComponent(nextRaw) : null;
  } catch {
    nextDecoded = null;
  }
  const next = sanitizeNextPath(nextDecoded);
  const consoleMode = isConsoleNext(next);

  // Single error exit: console sign-in page in console mode, the unchanged admin exit otherwise.
  // Pre-identity console failures are not audited (anonymous requests must not fill the log).
  const fail = (code: string) => {
    if (consoleMode) console.error(`[Console SSO] sign-in failed: ${code}`);
    return clearOAuthCookies(consoleMode ? consoleLoginRedirect(request, code) : redirectToLogin(request, code));
  };

  const config = getGoogleOAuthConfig();
  if (!config) return fail('sso_not_configured');
  if (consoleMode && !isConsoleConfigured()) return fail('console_not_configured');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = readCookie(request, OAUTH_STATE_COOKIE);

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail('oauth_state');
  }

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
    if (!tokenRes.ok) return fail('oauth_token');
    const tokens = (await tokenRes.json()) as { access_token?: string; id_token?: string };
    if (!tokens.access_token) return fail('oauth_token');

    // 2) 검증된 이메일 조회
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userinfoRes.ok) return fail('oauth_userinfo');
    const profile = (await userinfoRes.json()) as {
      email?: string;
      email_verified?: boolean;
      /** 워크스페이스 프로필 이름 (한글 이름) — scope 'profile' 로 수신. */
      name?: string;
    };
    const email = profile.email?.trim().toLowerCase();
    const profileName = typeof profile.name === 'string' ? profile.name.trim() : '';

    // Console mode branches off before the admin email check: it judges a missing email
    // (oauth_email) and an unverified one (not_allowed, audited) itself.
    if (consoleMode) {
      if (!email) return fail('oauth_email');
      return await consoleEntry(request, {
        next,
        email,
        userinfoVerified: profile.email_verified === true,
        profileName,
        idToken: tokens.id_token,
        clientId: config.clientId,
      });
    }

    if (!email || profile.email_verified === false) {
      return fail('oauth_email');
    }

    // 3) 인가: admin-users 에 등록된 멤버만 통과 (agarwooding 과 동일 모델)
    const users = await readDataForWrite<AdminUser>('admin-users');
    const idx = users.findIndex((u) => u.email === email);
    if (idx < 0) {
      // Not an admin-user: an open-domain Workspace account may still enter the workshop as a
      // member. No admin session cookie is set and admin-users is not touched on this path.
      const workshop = workshopMemberEntry({
        next,
        email,
        userinfoVerified: profile.email_verified === true,
        profileName,
        idToken: tokens.id_token,
        clientId: config.clientId,
      });
      if (workshop) {
        await auditSsoLogin(email, 'workshop-member', 'login', `작업실 입장(${workshop.domain} 도메인)`);
        return clearOAuthCookies(NextResponse.redirect(workshop.redirectTo.toString()));
      }

      await auditSsoLogin(email, 'unknown', 'login_failed', `미등록 계정 SSO 로그인 시도: ${email}`);
      return fail('not_authorized');
    }

    const user = users[idx];

    // 잠금 상태면 SSO 도 차단 (비밀번호 로그인과 동일 정책)
    if (user.lockedUntil && Date.now() < new Date(user.lockedUntil).getTime()) {
      await auditSsoLogin(email, user.role, 'login_failed', '잠긴 계정 SSO 로그인 시도');
      return fail('account_locked');
    }

    // lastLoginAt 갱신 (실패해도 로그인은 진행)
    try {
      user.lastLoginAt = new Date().toISOString();
      user.failedAttempts = 0;
      // 구글 프로필 이름을 기록 — 블로그 바이라인 작성자명의 원천.
      if (profileName) user.displayName = profileName;
      delete user.lockedUntil;
      users[idx] = user;
      await writeDataMerged('admin-users', users);
    } catch (err) {
      console.error('[SSO] lastLoginAt 갱신 실패:', err);
    }

    await auditSsoLogin(email, user.role, 'login', `구글 SSO 로그인: ${email}`);

    // 4) 세션 발급 (토큰은 비밀번호 로그인과 동일)
    const token = await createSessionToken({
      email,
      role: user.role,
      ...(profileName ? { name: profileName } : {}),
    });
    const response = NextResponse.redirect(new URL(next, request.url));
    // ⚠️ SameSite=Lax (Strict 아님): 이 콜백은 google.com 리디렉션으로 진입하므로,
    //    Strict 세션쿠키는 이어지는 /admin 최초 요청에 전송되지 않아 로그인 화면으로
    //    되돌아온다. Lax 는 top-level GET 이동에 쿠키를 실어 SSO 진입을 성사시킨다.
    //    (비밀번호 로그인은 fetch 후 클라이언트 이동이라 Strict 로도 동작.)
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return clearOAuthCookies(response);
  } catch (err) {
    console.error('[SSO Callback] error:', err);
    return fail('oauth_failed');
  }
}
