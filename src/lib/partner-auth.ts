/**
 * 외부 위탁업체(베트남 현장) 업로드 포털 전용 세션.
 * 관리자 세션(auth.ts)과 완전히 분리 — 쿠키 이름·페이로드·역할이 다르고,
 * 파트너 토큰으로는 /admin, /api/admin 에 절대 접근할 수 없다 (middleware 가
 * 각각 다른 쿠키를 검사). Edge(middleware)와 Node 런타임 양쪽에서 동작해야
 * 하므로 crypto.subtle 만 사용한다.
 */

const MAX_AGE_DAYS = Number(process.env.PARTNER_SESSION_MAX_AGE_DAYS ?? '30');

function getSecret(): string {
  // 전용 시크릿이 있으면 우선, 없으면 관리자 세션 시크릿 재사용.
  // (HMAC 페이로드 구조가 달라 토큰 혼용은 불가능하지만, 운영에서는
  //  PARTNER_SESSION_SECRET 별도 지정을 권장 — 키 로테이션 독립성.)
  const raw = process.env.PARTNER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (raw) return raw;
  if (process.env.VERCEL || process.env.ADMIN_SESSION_ENFORCE_SECRET === '1') {
    throw new Error(
      'PARTNER_SESSION_SECRET(또는 ADMIN_SESSION_SECRET) 환경변수가 설정되지 않았습니다.'
    );
  }
  return 'dev-only-insecure-partner-secret';
}

export const PARTNER_COOKIE = 'daracheon_partner_session';
export const PARTNER_SESSION_MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

export interface PartnerSession {
  /** partner-accounts 레코드 id */
  accountId: string;
  /** 로그인 아이디 */
  loginId: string;
  /** 업로더 표시 이름 (업체/현장 담당자명) */
  name: string;
  kind: 'partner';
  issuedAt: number;
  expiresAt: number;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str));
}

function base64UrlToString(b64url: string): string {
  const pad = b64url.length % 4;
  const padded = b64url + (pad ? '='.repeat(4 - pad) : '');
  const bin = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`partner:${getSecret()}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createPartnerToken(
  account: Pick<PartnerSession, 'accountId' | 'loginId' | 'name'>
): Promise<string> {
  const now = Date.now();
  const body: PartnerSession = {
    ...account,
    kind: 'partner',
    issuedAt: now,
    expiresAt: now + PARTNER_SESSION_MAX_AGE_SECONDS * 1000,
  };
  const payload = stringToBase64Url(JSON.stringify(body));
  const signature = await hmacSign(payload);
  return `${payload}.${signature}`;
}

export async function verifyPartnerToken(
  token: string | undefined | null
): Promise<PartnerSession | null> {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  try {
    const expected = await hmacSign(payload);
    if (!constantTimeEqual(expected, signature)) return null;
    const session = JSON.parse(base64UrlToString(payload)) as PartnerSession;
    if (session.kind !== 'partner') return null;
    if (typeof session.expiresAt !== 'number' || Date.now() > session.expiresAt) return null;
    if (typeof session.name !== 'string' || !session.name.trim()) return null;
    if (typeof session.accountId !== 'string' || !session.accountId) return null;
    return session;
  } catch {
    return null;
  }
}
