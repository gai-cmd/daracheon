/**
 * QR 세션 쿠키 서명 (isomorphic, Web Crypto HMAC).
 *
 * /q/<slug> 스캔 시 발급하는 세션 토큰을 서명해 위조를 막는다. 서명이 없으면
 * 아무나 /api/q/track 에 임의 slug/qsid 로 가짜 동선·CTA 이벤트를 주입해
 * 마케팅 분석을 오염시킬 수 있다. 토큰은 민감정보가 아니라(slug+qsid) 위·변조
 * 방지가 목적이므로 쿠키는 non-HttpOnly 로 두어 클라이언트 비콘이 "QR 세션인가"
 * 게이트로 존재 여부를 읽게 한다.
 */

const TOKEN_TTL_MS = 30 * 60 * 1000; // 세션 30분

function getSecret(): string {
  const raw = process.env.QR_TRACK_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (raw) return raw;
  if (process.env.VERCEL) {
    // 운영에서 시크릿이 없으면 서명이 무의미 → 명확히 실패시키지 않고,
    // ADMIN_SESSION_SECRET 가 항상 설정되는 운영 전제 하에 여기 도달 시 경고.
    console.warn('[qr:token] QR_TRACK_SECRET/ADMIN_SESSION_SECRET 미설정 — 서명 약함');
  }
  return 'qr-dev-insecure-secret';
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function strToB64url(s: string): string {
  return b64urlEncode(new TextEncoder().encode(s));
}
function b64urlToStr(b: string): string {
  const pad = b.length % 4;
  const padded = b + (pad ? '='.repeat(4 - pad) : '');
  const bin = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64urlEncode(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface QrSession {
  slug: string;
  qsid: string;
}

export async function signQrSession(session: QrSession): Promise<string> {
  const body = { s: session.slug, q: session.qsid, t: Date.now() };
  const payload = strToB64url(JSON.stringify(body));
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifyQrSession(token: string | undefined | null): Promise<QrSession | null> {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = await hmac(payload);
  if (!timingSafeEqual(expected, sig)) return null;
  try {
    const body = JSON.parse(b64urlToStr(payload)) as { s?: string; q?: string; t?: number };
    if (!body.s || !body.q || typeof body.t !== 'number') return null;
    if (Date.now() - body.t > TOKEN_TTL_MS) return null;
    return { slug: body.s, qsid: body.q };
  } catch {
    return null;
  }
}
