// Console session token (SPEC-CONSOLE-001 REQ-CON-005/006, design.md §2.4).
// Edge-runtime safe (the middleware verifies it): Web Crypto only, like src/lib/auth.ts.
//
// Format: base64url(payload).base64url(HMAC-SHA256(CONSOLE_SESSION_SECRET, payload))
// Payload: { k: "console", email, name, iat, exp } (ms). The `k` marker and the dedicated secret keep
// admin session, workshop handoff and partner tokens from ever verifying as console sessions.

import { getConsoleSessionMaxAgeSeconds, getConsoleSessionSecret, isConsoleDomainEmail } from './config';

type Env = Record<string, string | undefined>;
interface Opts {
  env?: Env;
  now?: number;
}

export const CONSOLE_SESSION_COOKIE = 'zoel_console_session';
const MARKER = 'console';

export interface ConsoleSession {
  email: string;
  name: string;
  exp: number;
}

const enc = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToString(b64url: string): string {
  const pad = b64url.length % 4;
  const bin = atob((b64url + (pad ? '='.repeat(4 - pad) : '')).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload))));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mints a console session token, or null when the console is not configured or the address is not admitted. */
export async function createConsoleSessionToken(
  user: { email: string; name: string },
  opts: Opts = {}
): Promise<string | null> {
  const env = opts.env ?? process.env;
  const secret = getConsoleSessionSecret(env);
  const email = user.email.trim().toLowerCase();
  if (!secret || !isConsoleDomainEmail(email)) return null;
  const now = opts.now ?? Date.now();
  const payload = bytesToBase64Url(
    enc.encode(
      JSON.stringify({ k: MARKER, email, name: user.name, iat: now, exp: now + getConsoleSessionMaxAgeSeconds(env) * 1000 })
    )
  );
  return `${payload}.${await hmac(secret, payload)}`;
}

/** Verifies a console session token. Any deviation -> null. */
export async function verifyConsoleSessionToken(
  token: string | null | undefined,
  opts: Opts = {}
): Promise<ConsoleSession | null> {
  if (!token || typeof token !== 'string') return null;
  const secret = getConsoleSessionSecret(opts.env ?? process.env);
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payload, signature] = parts;
  if (!constantTimeEqual(await hmac(secret, payload), signature)) return null;
  try {
    const p = JSON.parse(base64UrlToString(payload)) as Record<string, unknown> | null;
    if (!p || typeof p !== 'object' || p.k !== MARKER) return null;
    if (typeof p.exp !== 'number' || !Number.isFinite(p.exp) || p.exp <= (opts.now ?? Date.now())) return null;
    if (typeof p.email !== 'string' || !isConsoleDomainEmail(p.email) || p.email !== p.email.toLowerCase()) return null;
    return { email: p.email, name: typeof p.name === 'string' ? p.name : p.email, exp: p.exp };
  } catch {
    return null;
  }
}

export function consoleSessionCookieOptions(env: Env = process.env) {
  return {
    httpOnly: true,
    // Lax, not Strict: the callback is reached by a top-level GET coming back from Google.
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: getConsoleSessionMaxAgeSeconds(env),
  };
}

/** Reads and verifies the console session from a request's Cookie header (route handlers). */
export async function readConsoleSession(request: Request, opts: Opts = {}): Promise<ConsoleSession | null> {
  const prefix = `${CONSOLE_SESSION_COOKIE}=`;
  const raw = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix))
    ?.slice(prefix.length);
  return verifyConsoleSessionToken(raw, opts);
}
