// Admin Google SSO (OAuth 2.0) 공용 설정.
// start / callback 라우트가 동일한 redirect_uri 를 계산하도록 한곳에 모은다
// (drift 나면 Google 이 redirect_uri_mismatch 로 거부).
//
// 필요한 env (agarwooding 과 동일 OAuth 클라이언트 재사용):
//   GOOGLE_CLIENT_ID           — OAuth 클라이언트 ID
//   GOOGLE_CLIENT_SECRET       — OAuth 클라이언트 secret
//   GOOGLE_OAUTH_REDIRECT_URI  — (선택) 콜백 URI 를 명시. 미설정 시 아래 규칙으로 유도.
//
// ⚠️ GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY 는 서치콘솔용 서비스계정으로
//    이 OAuth 흐름과 무관하다 (혼동 금지).

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export const OAUTH_CALLBACK_PATH = '/api/admin/auth/google/callback';

// start 와 callback 이 반드시 동일한 값을 만들어야 한다.
// 우선순위: 명시 env → NEXT_PUBLIC_SITE_URL 기반 → 요청 origin.
export function resolveRedirectUri(requestUrl: string): string {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (explicit) return explicit;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(requestUrl).origin).replace(/\/$/, '');
  return `${base}${OAUTH_CALLBACK_PATH}`;
}

export const OAUTH_STATE_COOKIE = 'g_oauth_state';
export const OAUTH_NEXT_COOKIE = 'g_oauth_next';

// @MX:ANCHOR: [AUTO] Single decision point for the console mode of the shared OAuth flow.
// @MX:REASON: start route, callback route, sanitizeNextPath and the console sign-in page all call it;
// a divergence would let a console cookie be issued for a path outside /console (open redirect).
// Console mode of the shared OAuth flow (SPEC-CONSOLE-001 REQ-CON-002, design.md §2.1).
// True only for `/console` or a path beneath `/console/` with no dot segment ('.', '..', literal or
// percent-encoded). start, callback and the console sign-in page all decide the mode with this.
export function isConsoleNext(raw: string | null | undefined): boolean {
  if (typeof raw !== 'string') return false;
  // 1. A same-site absolute path: no scheme-relative form, no backslash, no control characters.
  // eslint-disable-next-line no-control-regex
  if (!raw.startsWith('/') || raw.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(raw)) return false;

  // 2. The first path segment is exactly "console".
  const path = raw.split(/[?#]/, 1)[0];
  const segments = path.split('/');
  if (segments[1] !== 'console') return false;

  // 3. No dot segment, in the forms the WHATWG URL parser treats as one.
  for (const seg of segments) {
    const s = seg.toLowerCase().replace(/%2e/g, '.');
    if (s === '.' || s === '..') return false;
  }

  // 4. Double check against the URL parser: same origin, still under /console.
  try {
    const base = 'https://console.invalid';
    const u = new URL(raw, base);
    return u.origin === base && (u.pathname === '/console' || u.pathname.startsWith('/console/'));
  } catch {
    return false;
  }
}

// 오픈 리다이렉트 방지: /admin 이하 내부 경로만 허용, 그 외는 /admin 으로.
// 콘솔 경로(isConsoleNext)는 그대로 통과 — 콘솔 모드 판정에 쓰인다.
export function sanitizeNextPath(raw: string | null | undefined): string {
  if (isConsoleNext(raw)) return raw as string;
  if (!raw) return '/admin';
  // 절대 URL(//host, http://...) 및 admin 밖 경로 차단
  if (!raw.startsWith('/admin') || raw.startsWith('//')) return '/admin';
  return raw;
}
