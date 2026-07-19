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

// 오픈 리다이렉트 방지: /admin 이하 내부 경로만 허용, 그 외는 /admin 으로.
export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return '/admin';
  // 절대 URL(//host, http://...) 및 admin 밖 경로 차단
  if (!raw.startsWith('/admin') || raw.startsWith('//')) return '/admin';
  return raw;
}
