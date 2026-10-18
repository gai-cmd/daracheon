import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * SSO 핸드오프 — 콘텐츠 작업실(zoel-workshop) 등 사내 도구가 대라천 관리자 Google SSO 를
 * 로그인 모듈로 재사용하기 위한 출구.
 *
 * 흐름: 도구의 로그인 모달 → /api/admin/auth/google/start?next=/admin/sso-handoff?return=<도구 URL>
 *   → (Google 로그인, admin-users 인가, 관리자 세션 발급) → 이 라우트 → 짧은 서명 토큰을 붙여
 *   도구의 return URL 로 302. 도구는 WORKSHOP_SSO_SECRET 으로 서명을 검증해 자기 세션을 만든다.
 *
 * - /admin 아래 경로라 미들웨어 관리자 세션 게이트를 그대로 통과해야만 도달한다.
 * - return 은 WORKSHOP_SSO_RETURN_ORIGINS(쉼표 구분 origin 허용 목록)에 있는 origin 만 허용.
 * - 토큰 수명 60초, 1회 리디렉션용. 대라천 세션 쿠키는 그대로 유지된다.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function allowedOrigins(): string[] {
  return (process.env.WORKSHOP_SSO_RETURN_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.WORKSHOP_SSO_SECRET;
  if (!secret) return NextResponse.json({ success: false, message: 'sso handoff not configured' }, { status: 503 });

  const cookie = request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const session = await verifySessionToken(cookie);
  if (!session) return NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(url.pathname + url.search)}`, request.url));

  let ret: URL;
  try {
    ret = new URL(url.searchParams.get('return') ?? '');
  } catch {
    return NextResponse.json({ success: false, message: 'invalid return' }, { status: 400 });
  }
  if (ret.protocol !== 'https:' || !allowedOrigins().includes(ret.origin)) {
    return NextResponse.json({ success: false, message: 'return origin not allowed' }, { status: 400 });
  }

  const payload = Buffer.from(
    JSON.stringify({ email: session.email, name: session.name ?? session.email, role: session.role, exp: Date.now() + 60_000 })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  ret.searchParams.set('t', `${payload}.${sig}`);
  return NextResponse.redirect(ret.toString());
}
