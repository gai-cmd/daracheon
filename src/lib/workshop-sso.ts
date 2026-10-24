// Workshop SSO helpers (zoel-workshop <-> zoellife.com Google SSO).
//
// The content workshop (a separate Vercel project) has no login of its own. Its "Sign in with
// Google" button sends the browser through /api/admin/auth/google/start, and the callback ends
// with a short-lived signed handoff token (see src/app/admin/sso-handoff/route.ts) that the
// workshop verifies with the shared secret.
//
// Env vars (all read through the small getters below, never at import time):
//   WORKSHOP_SSO_SECRET          HMAC secret shared with the workshop. Unset = the whole
//                                handoff and the open-domain entry are disabled. Also treated as
//                                unset when blank, under 32 characters, or equal to
//                                ADMIN_SESSION_SECRET (see getHandoffSecret).
//   WORKSHOP_SSO_RETURN_ORIGINS  Comma separated https origins the token may be sent to.
//   WORKSHOP_OPEN_DOMAINS        Comma separated Workspace domains whose verified accounts may
//                                enter the workshop as role "member" without being registered in
//                                admin-users. Default "try-n.com"; an empty string disables it.
//
// Threat model of the open-domain entry:
//   1. It only ever yields a workshop token with role "member". The callback never issues the
//      zoellife admin session cookie on this path, so the admin console stays closed to it.
//   1b. A handoff token has the same wire format and HMAC as an admin session cookie. Sharing the
//      secret between the two would let a member token pass as a session, so verifySessionToken
//      rejects any payload that is not an admin session, and getHandoffSecret refuses to sign
//      with a secret that equals ADMIN_SESSION_SECRET.
//   2. An address ending in "@try-n.com" is not proof of ownership (a consumer Google account can
//      be created with any address), so we also require email_verified, the Workspace "hd"
//      claim equal to that domain, and an id_token whose audience is our own OAuth client.
//   3. The domain is matched exactly: subdomains and lookalikes (a@mail.try-n.com,
//      x@try-n.com.evil.io, x@evil-try-n.com) are rejected.
//   4. The token goes only to a return URL on an allow-listed https origin, reached only via the
//      exact /admin/sso-handoff path, so the flow cannot be used as an open redirect.
//   5. The id_token signature is not verified: it comes straight from Google's token endpoint
//      over TLS in the code exchange, which OpenID Connect Core 3.1.3.7 accepts. We still check
//      iss and exp.

import { createHmac } from 'crypto';
import type { AdminRole } from '@/lib/admin-users';

/** Path that the OAuth `next` value must point at for the workshop handoff. */
export const HANDOFF_PATH = '/admin/sso-handoff';
/** Lifetime of a handoff token. */
export const HANDOFF_TOKEN_TTL_MS = 60_000;
/** Shortest WORKSHOP_SSO_SECRET we will sign with. */
export const MIN_HANDOFF_SECRET_LENGTH = 32;
/** Workspace domains allowed in when WORKSHOP_OPEN_DOMAINS is not set. */
export const DEFAULT_OPEN_DOMAINS: readonly string[] = ['try-n.com'];

type Env = Record<string, string | undefined>;

export type HandoffRole = AdminRole | 'member';

export interface HandoffClaims {
  email: string;
  name: string;
  role: HandoffRole;
}

/**
 * Signs the handoff token the workshop verifies: "<base64url payload>.<base64url hmac-sha256>".
 * The payload JSON is exactly {email, name, role, exp} in that key order.
 */
export function signHandoffToken(secret: string, claims: HandoffClaims, now: number = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ email: claims.email, name: claims.name, role: claims.role, exp: now + HANDOFF_TOKEN_TTL_MS })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/**
 * The secret to sign handoff tokens with, or null when the handoff must stay off: unset, blank,
 * shorter than MIN_HANDOFF_SECRET_LENGTH once trimmed, or equal to ADMIN_SESSION_SECRET. A refused
 * (but set) secret is logged by reason only, never by value.
 */
export function getHandoffSecret(env: Env = process.env): string | null {
  const secret = env.WORKSHOP_SSO_SECRET;
  if (!secret) return null;

  const trimmed = secret.trim();
  let problem: string | null = null;
  if (!trimmed) problem = 'is blank';
  else if (trimmed.length < MIN_HANDOFF_SECRET_LENGTH) problem = `is shorter than ${MIN_HANDOFF_SECRET_LENGTH} characters`;
  else if (trimmed === (env.ADMIN_SESSION_SECRET ?? '').trim()) problem = 'equals ADMIN_SESSION_SECRET';
  if (problem) {
    console.error(`[SSO] WORKSHOP_SSO_SECRET ${problem}; workshop handoff is disabled`);
    return null;
  }
  return secret;
}

/** Allowed https return origins from WORKSHOP_SSO_RETURN_ORIGINS (trimmed, trailing slash stripped). */
export function getWorkshopReturnOrigins(env: Env = process.env): string[] {
  return (env.WORKSHOP_SSO_RETURN_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

/** Workspace domains open to the workshop. Unset -> default; empty string -> none (feature off). */
export function getWorkshopOpenDomains(env: Env = process.env): string[] {
  const raw = env.WORKSHOP_OPEN_DOMAINS;
  if (raw === undefined) return [...DEFAULT_OPEN_DOMAINS];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Extracts the workshop return URL from the sanitized OAuth `next` value
 * (e.g. "/admin/sso-handoff?return=https%3A%2F%2Fzoel-workshop.vercel.app%2F..."), applying the
 * same checks as the handoff route: exact handoff path, https, origin on the allow list.
 */
export function workshopReturnFromNext(
  next: string | null | undefined,
  allowedOrigins: readonly string[]
): URL | null {
  if (!next || !next.startsWith(HANDOFF_PATH)) return null;
  let nextUrl: URL;
  try {
    nextUrl = new URL(next, 'https://next.invalid');
  } catch {
    return null;
  }
  if (nextUrl.pathname !== HANDOFF_PATH) return null;

  const rawReturn = nextUrl.searchParams.get('return');
  if (!rawReturn) return null;
  let ret: URL;
  try {
    ret = new URL(rawReturn);
  } catch {
    return null;
  }
  if (ret.protocol !== 'https:' || !allowedOrigins.includes(ret.origin)) return null;
  return ret;
}

export interface OpenAccountClaims {
  /** Email address (userinfo / id_token). */
  email?: string;
  /** True only when both Google sources report email_verified === true. */
  emailVerified?: boolean;
  /** Google ID-token `hd` claim: the hosted Workspace domain. Absent for personal accounts. */
  hd?: string;
  /** Google ID-token `aud` claim. */
  aud?: string;
}

/**
 * True when the account belongs to one of the open Workspace domains. Every condition must hold:
 * verified email, exactly one "@" with a non-empty local part, exact domain match (no
 * subdomains), `hd` equal to that domain, and `aud` equal to our OAuth client id.
 */
export function isWorkshopOpenAccount(
  account: OpenAccountClaims,
  opts: { clientId: string; domains: readonly string[] }
): boolean {
  const { email, emailVerified, hd, aud } = account;
  if (emailVerified !== true) return false;
  if (typeof email !== 'string' || typeof hd !== 'string') return false;
  // A missing or non-string aud can never equal the (string) client id.
  if (!opts.clientId || aud !== opts.clientId) return false;

  const lower = email.toLowerCase();
  const at = lower.indexOf('@');
  if (at <= 0 || at !== lower.lastIndexOf('@') || /\s/.test(lower)) return false;

  const domain = lower.slice(at + 1);
  if (!domain || !opts.domains.some((d) => d.toLowerCase() === domain)) return false;
  return hd.toLowerCase() === domain;
}

export interface GoogleIdTokenClaims {
  iss: string;
  aud: string | undefined;
  /** Seconds since the epoch, as in the JWT. */
  exp: number;
  email: string | undefined;
  email_verified: boolean | undefined;
  hd: string | undefined;
  name: string | undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

/**
 * Decodes the payload of a Google ID token WITHOUT verifying its signature (see the threat model
 * above). Returns null unless the token is well formed, issued by Google and not yet expired.
 */
export function decodeGoogleIdToken(idToken: unknown, now: number = Date.now()): GoogleIdTokenClaims | null {
  if (typeof idToken !== 'string') return null;
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;

  if (p.iss !== 'https://accounts.google.com' && p.iss !== 'accounts.google.com') return null;
  if (typeof p.exp !== 'number' || !Number.isFinite(p.exp) || p.exp * 1000 <= now) return null;

  return {
    iss: p.iss,
    aud: str(p.aud),
    exp: p.exp,
    email: str(p.email),
    email_verified: typeof p.email_verified === 'boolean' ? p.email_verified : undefined,
    hd: str(p.hd),
    name: str(p.name),
  };
}
