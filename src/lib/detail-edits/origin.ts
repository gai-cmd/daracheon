/**
 * 상세페이지 시안 편집기 — 오리진 규칙.
 *
 * - 시안 사이트(정적, 별도 Vercel 프로젝트)의 오리진은 상수다. 서버는 이 오리진 외에는
 *   절대 fetch 하지 않는다(SSRF 방어).
 * - 로컬 E2E 용 `DETAIL_CONCEPTS_ORIGIN` 환경변수는 `NODE_ENV !== 'production'` 일 때만 인정한다.
 *   운영 빌드에서는 값이 있어도 무시한다.
 * - 공개 읽기 API 의 CORS 허용 목록과 관리자 쓰기 API 의 CSRF(Origin = Host) 판정도 여기서 한다.
 */

/** 운영 시안 사이트 오리진 (Vercel 프로젝트 daeracheon-detail-concepts). */
export const CONCEPT_ORIGIN = 'https://daeracheon-detail-concepts.vercel.app';

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** 로컬 오버라이드: 비운영에서만, http(s) 오리진 형태(경로·계정정보 없음)일 때만 인정. */
function overrideOrigin(): string | null {
  if (isProduction()) return null;
  const raw = process.env.DETAIL_CONCEPTS_ORIGIN?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** 서버가 fetch 하는 시안 사이트 오리진. 비운영에서만 오버라이드 가능. */
export function getConceptOrigin(): string {
  return overrideOrigin() ?? CONCEPT_ORIGIN;
}

/** 공개 읽기 API 에서 CORS 를 허용하는 오리진 목록 (운영: 상수 하나, 비운영: + 오버라이드). */
export function corsAllowedOrigins(): string[] {
  const extra = overrideOrigin();
  return extra && extra !== CONCEPT_ORIGIN ? [CONCEPT_ORIGIN, extra] : [CONCEPT_ORIGIN];
}

/** 요청 Origin 이 허용 목록에 있으면 그 값을 돌려주고, 아니면 null (ACAO 헤더를 붙이지 않는다). */
export function corsOriginFor(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  return corsAllowedOrigins().includes(requestOrigin) ? requestOrigin : null;
}

/**
 * 같은 사이트에서 온 쓰기 요청인가 — `Origin` 의 host 가 `Host` 헤더와 같아야 한다.
 * Origin 이 없거나("null" 포함) 파싱되지 않으면 거절한다(브라우저의 PUT/POST 는 항상 Origin 을 보낸다).
 */
export function isSameSiteWrite(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Host 헤더로 허용하는 형태 — 호스트명(또는 IPv4/IPv6 대괄호)과 선택적 포트뿐. */
const HOST_RE = /^(?:[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?|\[[0-9A-Fa-f:.]+\])(?::[0-9]{1,5})?$/;

/**
 * 편집 페이지가 주입하는 스크립트 URL 의 기준 오리진 — 관리자 쿠키가 있는 zoellife 오리진.
 * `<base>` 가 시안 오리진으로 걸려 있어 루트 상대 경로는 시안 쪽으로 풀리므로 절대 URL 이 필요하다.
 *
 * 호스트는 Host 헤더를 쓴다: NextRequest 는 `request.url` 의 127.0.0.1 을 localhost 로 바꿔 버려서,
 * 로컬에서 127.0.0.1 로 접속한 문서가 localhost 의 스크립트(다른 오리진 → CSP 차단·쿠키 불일치)를 가리키게 된다.
 * 스킴은 request.url 의 것을 쓰고, Host 가 비었거나 형식이 이상하면 request.url 의 오리진으로 돌아간다.
 */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get('host')?.trim();
  if (host && HOST_RE.test(host)) return `${url.protocol}//${host}`;
  return url.origin;
}
