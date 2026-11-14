import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'crypto';
import {
  CONSOLE_SESSION_COOKIE,
  consoleSessionCookieOptions,
  createConsoleSessionToken,
  readConsoleSession,
  verifyConsoleSessionToken,
} from '../session';
import { createSessionToken } from '@/lib/auth';
import { signHandoffToken } from '@/lib/workshop-sso';

// SPEC-CONSOLE-001 REQ-CON-005 / REQ-CON-006 / AC-CON-005 (unit part). Synthetic secrets only.

const NOW = Date.UTC(2026, 10, 15, 0, 0, 0);
const SECRET = 'unit-console-session-secret-0123456789abcdef';
const ADMIN_SECRET = 'unit-admin-session-secret-aaaaaaaaaaaaaaaa';

const env = { CONSOLE_SESSION_SECRET: SECRET, ADMIN_SESSION_SECRET: ADMIN_SECRET };

function b64(o: unknown) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}
function sign(payload: unknown, secret = SECRET) {
  const p = b64(payload);
  return `${p}.${createHmac('sha256', secret).update(p).digest('base64url')}`;
}

const savedAdmin = process.env.ADMIN_SESSION_SECRET;
beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = ADMIN_SECRET;
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  if (savedAdmin === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = savedAdmin;
  vi.restoreAllMocks();
});

describe('console session token', () => {
  it('round-trips with the console marker and a 12 hour default expiry', async () => {
    const token = await createConsoleSessionToken({ email: 'Minji@try-n.com', name: '민지' }, { env, now: NOW });
    expect(token).toBeTruthy();
    const payload = JSON.parse(Buffer.from(token!.split('.')[0], 'base64url').toString('utf8'));
    expect(payload).toEqual({ k: 'console', email: 'minji@try-n.com', name: '민지', iat: NOW, exp: NOW + 12 * 3600_000 });
    expect(await verifyConsoleSessionToken(token, { env, now: NOW })).toEqual({ email: 'minji@try-n.com', name: '민지', exp: NOW + 12 * 3600_000 });
  });

  it('honours CONSOLE_SESSION_MAX_AGE_HOURS', async () => {
    const token = await createConsoleSessionToken(
      { email: 'a@try-n.com', name: 'a' },
      { env: { ...env, CONSOLE_SESSION_MAX_AGE_HOURS: '2' }, now: NOW }
    );
    expect((await verifyConsoleSessionToken(token, { env, now: NOW }))!.exp).toBe(NOW + 2 * 3600_000);
  });

  it('is not minted when the console secret is invalid (no fallback secret)', async () => {
    expect(await createConsoleSessionToken({ email: 'a@try-n.com', name: 'a' }, { env: { ADMIN_SESSION_SECRET: ADMIN_SECRET }, now: NOW })).toBeNull();
    expect(
      await createConsoleSessionToken({ email: 'a@try-n.com', name: 'a' }, { env: { CONSOLE_SESSION_SECRET: ADMIN_SECRET, ADMIN_SESSION_SECRET: ADMIN_SECRET }, now: NOW })
    ).toBeNull();
  });

  it('refuses to mint a token for a non-console address', async () => {
    expect(await createConsoleSessionToken({ email: 'x@try-n.com.evil.io', name: 'x' }, { env, now: NOW })).toBeNull();
  });

  it('rejects every token that is not a live console session', async () => {
    const valid = { k: 'console', email: 'a@try-n.com', name: 'a', iat: NOW, exp: NOW + 1000 };
    const cases: Array<[string, string | null | undefined]> = [
      ['empty', ''],
      ['null', null],
      ['garbage', 'not.a.token'],
      ['no marker', sign({ ...valid, k: undefined })],
      ['other marker', sign({ ...valid, k: 'admin' })],
      ['expired', sign({ ...valid, exp: NOW - 1 })],
      ['expiry not a number', sign({ ...valid, exp: String(NOW + 1000) })],
      ['lookalike email', sign({ ...valid, email: 'a@try-n.com.evil.io' })],
      ['signed with another secret', sign(valid, ADMIN_SECRET)],
      ['tampered payload', `${b64({ ...valid, email: 'b@try-n.com' })}.${sign(valid).split('.')[1]}`],
      ['admin session token', await createSessionToken({ email: 'a@try-n.com', role: 'admin' })],
      ['workshop handoff token', signHandoffToken('unit-workshop-sso-secret-bbbbbbbbbbbbbbbbbb', { email: 'a@try-n.com', name: 'a', role: 'member' }, NOW)],
    ];
    for (const [label, token] of cases) {
      expect(await verifyConsoleSessionToken(token, { env, now: NOW }), label).toBeNull();
    }
  });

  it('rejects everything when the console secret becomes invalid', async () => {
    const token = await createConsoleSessionToken({ email: 'a@try-n.com', name: 'a' }, { env, now: NOW });
    expect(await verifyConsoleSessionToken(token, { env: {}, now: NOW })).toBeNull();
  });

  it('a marker-less token signed with the console secret still fails (marker is the second guard)', async () => {
    // Shape of an admin session, but signed with the console secret.
    const adminShaped = sign({ email: 'a@try-n.com', role: 'admin', issuedAt: NOW, expiresAt: NOW + 1000 });
    expect(await verifyConsoleSessionToken(adminShaped, { env, now: NOW })).toBeNull();
  });
});

describe('cookie helpers', () => {
  it('uses an HttpOnly, SameSite=Lax cookie on path / with the session lifetime', () => {
    expect(CONSOLE_SESSION_COOKIE).toBe('zoel_console_session');
    expect(consoleSessionCookieOptions({ ...env, NODE_ENV: 'production' })).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 12 * 3600,
    });
  });

  it('reads the session from a request cookie header', async () => {
    const token = await createConsoleSessionToken({ email: 'a@try-n.com', name: 'a' }, { env, now: NOW });
    const req = new Request('https://zoellife.com/api/console/bootstrap', {
      headers: { cookie: `other=1; ${CONSOLE_SESSION_COOKIE}=${token}` },
    });
    expect(await readConsoleSession(req, { env, now: NOW })).toMatchObject({ email: 'a@try-n.com' });
    expect(await readConsoleSession(new Request('https://zoellife.com/x'), { env, now: NOW })).toBeNull();
  });
});
