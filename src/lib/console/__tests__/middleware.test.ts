import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { SESSION_COOKIE, createSessionToken } from '@/lib/auth';
import { createPartnerToken } from '@/lib/partner-auth';
import { signHandoffToken } from '@/lib/workshop-sso';
import { CONSOLE_SESSION_COOKIE, createConsoleSessionToken } from '../session';

// SPEC-CONSOLE-001 console block of src/middleware.ts: AC-CON-004 (console part), AC-CON-005,
// AC-CON-006 (redirect and 401 part), REQ-CON-024 headers. Synthetic secrets only.

const NOW = Date.UTC(2026, 10, 15, 0, 0, 0);
const ENV: Record<string, string> = {
  ADMIN_SESSION_SECRET: 'unit-admin-session-secret-aaaaaaaaaaaaaaaa',
  WORKSHOP_SSO_SECRET: 'unit-workshop-sso-secret-bbbbbbbbbbbbbbbbbb',
  PARTNER_SESSION_SECRET: 'unit-partner-session-secret-cccccccccccccc',
  CONSOLE_SESSION_SECRET: 'unit-console-session-secret-0123456789abcdef',
  CONSOLE_SECRETS_KEY: 'a'.repeat(64),
};
const savedEnv: Record<string, string | undefined> = {};

function req(path: string, cookie?: string, init: { method?: string } = {}) {
  return new NextRequest(`https://zoellife.com${path}`, {
    method: init.method ?? 'GET',
    headers: cookie ? { cookie } : {},
  });
}

async function consoleCookie() {
  const t = await createConsoleSessionToken({ email: 'minji@try-n.com', name: '민지' });
  return `${CONSOLE_SESSION_COOKIE}=${t}`;
}

beforeEach(() => {
  for (const k of [...Object.keys(ENV), 'CONSOLE_SESSION_MAX_AGE_HOURS']) savedEnv[k] = process.env[k];
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.restoreAllMocks();
});

describe('signed out', () => {
  it.each([
    ['/console', '/console'],
    ['/console/x', '/console/x'],
  ])('%s -> 302 /console/login?next=%s', async (path, next) => {
    const res = await middleware(req(path));
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get('location')!);
    expect(`${loc.origin}${loc.pathname}`).toBe('https://zoellife.com/console/login');
    expect(loc.searchParams.get('next')).toBe(next);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it.each([
    ['GET', '/api/console/bootstrap'],
    ['POST', '/api/console/items'],
    ['POST', '/api/console/items/item-1/credential'],
  ])('%s %s -> 401 JSON', async (method, path) => {
    const res = await middleware(req(path, undefined, { method }));
    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('lets the sign-in page and the sign-out endpoint through without a session', async () => {
    for (const [method, path] of [
      ['GET', '/console/login'],
      ['POST', '/api/console/auth/logout'],
    ]) {
      const res = await middleware(req(path, undefined, { method }));
      expect(res.status, path).toBe(200);
      expect(res.headers.get('x-middleware-next')).toBe('1');
      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
      expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    }
  });

  it('does not treat lookalike paths as console paths', async () => {
    const res = await middleware(req('/consolex'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(res.headers.get('x-robots-tag')).toBeNull();
  });
});

describe('signed in', () => {
  it('passes /console and console APIs with noindex and no-referrer headers', async () => {
    const cookie = await consoleCookie();
    for (const path of ['/console', '/console/x', '/api/console/bootstrap']) {
      const res = await middleware(req(path, cookie));
      expect(res.headers.get('x-middleware-next'), path).toBe('1');
      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
      expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    }
  });
});

describe('AC-CON-005 tokens of other kinds never open the console', () => {
  function signWith(payload: unknown, secret: string) {
    const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${p}.${createHmac('sha256', secret).update(p).digest('base64url')}`;
  }

  it('answers 401 for admin, workshop, partner, marker-less and expired tokens', async () => {
    const tokens: Array<[string, string]> = [
      ['admin session', await createSessionToken({ email: 'a@try-n.com', role: 'admin' })],
      ['workshop handoff', signHandoffToken(ENV.WORKSHOP_SSO_SECRET, { email: 'a@try-n.com', name: 'a', role: 'member' }, NOW)],
      ['partner', await createPartnerToken({ accountId: 'p1', loginId: 'p', name: 'p' })],
      ['console secret, no marker', signWith({ email: 'a@try-n.com', name: 'a', iat: NOW, exp: NOW + 1000 }, ENV.CONSOLE_SESSION_SECRET)],
      ['console secret, expired', signWith({ k: 'console', email: 'a@try-n.com', name: 'a', iat: NOW - 2000, exp: NOW - 1 }, ENV.CONSOLE_SESSION_SECRET)],
    ];
    for (const [label, token] of tokens) {
      const res = await middleware(req('/api/console/bootstrap', `${CONSOLE_SESSION_COOKIE}=${token}`));
      expect(res.status, label).toBe(401);
    }
  });

  it('a console token sent as the admin cookie does not open /api/admin', async () => {
    const t = await createConsoleSessionToken({ email: 'minji@try-n.com', name: '민지' });
    const res = await middleware(req('/api/admin/products', `${SESSION_COOKIE}=${t}`));
    expect(res.status).toBe(401);
  });

  it('an admin session does not open the console', async () => {
    const t = await createSessionToken({ email: 'a@try-n.com', role: 'super_admin' });
    const res = await middleware(req('/console', `${SESSION_COOKIE}=${t}`));
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/console/login');
  });
});

describe('AC-CON-004 console secret invalid -> closed', () => {
  it.each([
    ['unset', undefined],
    ['equal to ADMIN_SESSION_SECRET', ENV.ADMIN_SESSION_SECRET],
    ['31 characters', 'x'.repeat(31)],
  ])('%s: pages go to console_not_configured, APIs answer 503', async (_label, value) => {
    const cookie = await consoleCookie(); // minted while the secret was valid
    if (value === undefined) delete process.env.CONSOLE_SESSION_SECRET;
    else process.env.CONSOLE_SESSION_SECRET = value;

    const page = await middleware(req('/console', cookie));
    expect(page.status).toBe(302);
    expect(page.headers.get('location')).toBe('https://zoellife.com/console/login?error=console_not_configured');

    const api = await middleware(req('/api/console/bootstrap', cookie));
    expect(api.status).toBe(503);

    const login = await middleware(req('/console/login'));
    expect(login.headers.get('x-middleware-next')).toBe('1');
  });
});
