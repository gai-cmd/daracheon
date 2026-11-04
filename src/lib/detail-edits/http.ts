/**
 * 상세페이지 시안 편집기 — 라우트 공용 HTTP 보조 함수.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken, type AdminSession } from '@/lib/auth';
import { isSameSiteWrite } from './origin';
import { isDetailSlug } from './pages';

export const NO_STORE = 'no-store';

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': NO_STORE, ...headers },
  });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
): NextResponse {
  return jsonResponse({ success: false, code, message, ...extra }, status);
}

export const notFound = () => errorResponse(404, 'NOT_FOUND', '존재하지 않는 시안입니다.');

/** Next 15 의 params(Promise)를 풀어 허용 슬러그만 돌려준다. 아니면 null. */
export async function resolveSlug(params: Promise<{ slug: string }>): Promise<string | null> {
  const { slug } = await params;
  return isDetailSlug(slug) ? slug : null;
}

/**
 * 핸들러 수준 관리자 세션 확인 (미들웨어가 이미 막지만 라우트도 직접 검증한다).
 * 어느 역할이든 유효한 관리자 세션이면 통과 — 편집자(editor)도 콘텐츠를 고칠 수 있다.
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let session: AdminSession | null = null;
  try {
    session = await verifySessionToken(token);
  } catch (err) {
    // ADMIN_SESSION_SECRET 미설정 등 — 세션을 확인할 수 없으면 인증 실패로 취급한다.
    console.error('[detail-edits] 세션 검증 오류', err);
  }
  if (!session) {
    return { response: errorResponse(401, 'UNAUTHORIZED', '인증이 필요합니다.') };
  }
  return { session };
}

/** 쓰기 요청의 CSRF 방어 — Origin 의 host 가 Host 와 같아야 한다. 아니면 403 응답을 돌려준다. */
export function csrfGuard(request: Request): NextResponse | null {
  if (isSameSiteWrite(request)) return null;
  return errorResponse(403, 'CSRF', '허용되지 않은 출처의 요청입니다.');
}

export type BodyResult =
  | { ok: true; text: string }
  | { ok: false; response: NextResponse };

/**
 * 요청 본문을 상한(바이트)까지만 읽는다. 상한을 넘으면 읽기를 중단하고 413.
 * Content-Length 가 이미 상한 초과면 본문을 읽지 않는다.
 */
export async function readBodyLimited(request: Request, maxBytes: number): Promise<BodyResult> {
  const tooLarge = () =>
    ({
      ok: false,
      response: errorResponse(413, 'TOO_LARGE', '저장할 내용이 너무 큽니다.'),
    }) as const;

  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return tooLarge();

  if (!request.body) return { ok: true, text: '' };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return tooLarge();
    }
    chunks.push(value);
  }
  return { ok: true, text: new TextDecoder('utf-8').decode(Buffer.concat(chunks)) };
}

/** JSON 파싱 — 실패하면 null. */
export function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}
