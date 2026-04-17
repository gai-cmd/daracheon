const SECRET = process.env.ADMIN_SESSION_SECRET || 'dev-only-insecure-secret';
const MAX_AGE_DAYS = Number(process.env.ADMIN_SESSION_MAX_AGE_DAYS ?? '7');

export const SESSION_COOKIE = 'daracheon_admin_session';
export const SESSION_MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

export interface AdminSession {
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
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
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(
  session: Omit<AdminSession, 'issuedAt' | 'expiresAt'>
): Promise<string> {
  const now = Date.now();
  const body: AdminSession = {
    ...session,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const payload = stringToBase64Url(JSON.stringify(body));
  const signature = await hmacSign(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<AdminSession | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = await hmacSign(payload);
  if (!constantTimeEqual(expected, signature)) return null;
  try {
    const decoded = JSON.parse(base64UrlToString(payload)) as AdminSession;
    if (decoded.expiresAt < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyCredentials(email: string, password: string): AdminSession['role'] | null {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return null;
  if (email.trim().toLowerCase() === adminEmail.trim().toLowerCase() && password === adminPassword) {
    return 'super_admin';
  }
  return null;
}
