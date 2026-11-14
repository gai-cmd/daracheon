import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-001 console mode of the shared Google callback: AC-CON-001, AC-CON-002, AC-CON-003,
// AC-CON-004 (start/callback part) and AC-CON-016 (sign-in audit part). All fixtures are synthetic.

const db = vi.hoisted(() => ({
  docs: new Map<string, unknown[]>(),
  reads: [] as string[],
  writes: [] as string[],
}));

vi.mock('@/lib/db', () => ({
  readDataForWrite: vi.fn(async (name: string) => {
    db.reads.push(name);
    return [...((db.docs.get(name) as unknown[]) ?? [])];
  }),
  readDataUncached: vi.fn(async (name: string) => {
    db.reads.push(name);
    return [...((db.docs.get(name) as unknown[]) ?? [])];
  }),
  writeDataMerged: vi.fn(async (name: string, data: unknown[], opts: { removedIds?: string[] } = {}) => {
    db.writes.push(name);
    const removed = new Set(opts.removedIds ?? []);
    db.docs.set(
      name,
      data.filter((r) => !removed.has((r as { id?: string }).id ?? ''))
    );
  }),
}));

import { GET } from '../route';
import { GET as startGET } from '../../start/route';
import { SESSION_COOKIE } from '@/lib/auth';
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE } from '@/lib/google-oauth';
import { CONSOLE_SESSION_COOKIE, verifyConsoleSessionToken } from '@/lib/console/session';

const NOW = Date.UTC(2026, 10, 15, 0, 0, 0);
const CLIENT_ID = 'unit-test-client.apps.googleusercontent.com';
const CONSOLE_SECRET = 'unit-console-session-secret-0123456789abcdef';
const OAUTH_CODE = 'oauth-code-fixture-7d1c';
const ACCESS_TOKEN = 'access-token-fixture-55aa';

const ENV = {
  GOOGLE_CLIENT_ID: CLIENT_ID,
  GOOGLE_CLIENT_SECRET: 'unit-test-client-secret',
  ADMIN_SESSION_SECRET: 'unit-admin-session-secret-aaaaaaaaaaaaaaaa',
  WORKSHOP_SSO_SECRET: 'unit-workshop-sso-secret-bbbbbbbbbbbbbbbbbb',
  PARTNER_SESSION_SECRET: 'unit-partner-session-secret-cccccccccccccc',
  SERIAL_SCAN_SECRET: 'unit-serial-scan-secret-dddddddddddddddddd',
  QR_TRACK_SECRET: 'unit-qr-track-secret-eeeeeeeeeeeeeeeeeeeeeee',
  BACKUP_ENCRYPTION_KEY: 'unit-backup-encryption-key-ffffffffffffff',
  CONSOLE_SECRETS_KEY: 'a'.repeat(64),
  CONSOLE_SESSION_SECRET: CONSOLE_SECRET,
  CONSOLE_ADMIN_EMAILS: 'adm@try-n.com',
} as Record<string, string>;
const ENV_KEYS = [...Object.keys(ENV), 'GOOGLE_OAUTH_REDIRECT_URI', 'WORKSHOP_OPEN_DOMAINS', 'WORKSHOP_SSO_RETURN_ORIGINS'];
const savedEnv: Record<string, string | undefined> = {};

function b64(o: unknown) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}

function idTokenFor(email: string, overrides: Record<string, unknown> = {}) {
  const claims = {
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    exp: NOW / 1000 + 3600,
    email,
    email_verified: true,
    hd: 'try-n.com',
    name: 'Test Member',
    ...overrides,
  };
  return `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(claims)}.unsigned`;
}

interface Scenario {
  email?: string;
  profile?: Record<string, unknown>;
  idTokenClaims?: Record<string, unknown>;
  next?: string;
  token?: () => Response;
  userinfo?: () => Response;
  state?: string;
  extraCookie?: string;
}

function stubFetch(s: Scenario) {
  const email = s.email ?? 'minji@try-n.com';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        return s.token ? s.token() : Response.json({ access_token: ACCESS_TOKEN, id_token: idTokenFor(email, s.idTokenClaims) });
      }
      if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
        return s.userinfo ? s.userinfo() : Response.json({ email, email_verified: true, name: '민지', ...s.profile });
      }
      throw new Error(`unexpected fetch: ${url}`);
    })
  );
}

async function runCallback(s: Scenario = {}) {
  stubFetch(s);
  const cookie = [
    `${OAUTH_STATE_COOKIE}=st`,
    `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(s.next ?? '/console')}`,
    ...(s.extraCookie ? [s.extraCookie] : []),
  ].join('; ');
  return GET(
    new Request(`https://zoellife.com/api/admin/auth/google/callback?code=${OAUTH_CODE}&state=${s.state ?? 'st'}`, {
      headers: { cookie },
    })
  );
}

const setCookies = (res: Response) => res.headers.getSetCookie();
const cookieNamed = (res: Response, name: string) => setCookies(res).find((c) => c.startsWith(`${name}=`));
const consoleAudit = () => (db.docs.get('console-audit-log') ?? []) as Array<Record<string, unknown>>;
const siteAudit = () => (db.docs.get('audit-log') ?? []) as Array<Record<string, unknown>>;

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
  delete process.env.GOOGLE_OAUTH_REDIRECT_URI;
  delete process.env.WORKSHOP_OPEN_DOMAINS;
  delete process.env.WORKSHOP_SSO_RETURN_ORIGINS;
  db.docs = new Map();
  db.reads = [];
  db.writes = [];
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AC-CON-001 console entry', () => {
  it('issues only the console cookie, never touches admin-users, and audits auth.login', async () => {
    const res = await runCallback({ extraCookie: `${SESSION_COOKIE}=some-admin-token` });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://zoellife.com/console');

    const cookie = cookieNamed(res, CONSOLE_SESSION_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    const token = cookie!.split(';')[0].slice(CONSOLE_SESSION_COOKIE.length + 1);
    expect(await verifyConsoleSessionToken(token)).toMatchObject({ email: 'minji@try-n.com', name: '민지' });

    // The admin session cookie is neither set nor cleared, admin-users is neither read nor written.
    expect(cookieNamed(res, SESSION_COOKIE)).toBeUndefined();
    expect(db.reads).not.toContain('admin-users');
    expect(db.writes).not.toContain('admin-users');

    expect(consoleAudit()).toHaveLength(1);
    expect(consoleAudit()[0]).toMatchObject({
      actor: 'minji@try-n.com',
      actorRole: 'console-member',
      module: 'console',
      action: 'auth.login',
    });
    // Exactly one line in the site audit log, too.
    expect(siteAudit()).toHaveLength(1);
    expect(siteAudit()[0]).toMatchObject({ actor: 'minji@try-n.com', module: 'console', action: 'login' });

    // OAuth temp cookies are cleared.
    expect(setCookies(res).some((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=;`))).toBe(true);
    expect(setCookies(res).some((c) => c.startsWith(`${OAUTH_NEXT_COOKIE}=;`))).toBe(true);
  });

  it('returns to the deep link it was given', async () => {
    const res = await runCallback({ next: '/console/x?tab=2' });
    expect(res.headers.get('location')).toBe('https://zoellife.com/console/x?tab=2');
  });

  it('marks a console admin as console-admin in the audit entry', async () => {
    await runCallback({ email: 'adm@try-n.com' });
    expect(consoleAudit()[0]).toMatchObject({ actor: 'adm@try-n.com', actorRole: 'console-admin', action: 'auth.login' });
  });

  it('accepts an upper-case address and stores it lower-cased', async () => {
    const res = await runCallback({ email: 'X@TRY-N.COM', idTokenClaims: { email: 'x@Try-N.com' } });
    expect(res.headers.get('location')).toBe('https://zoellife.com/console');
    const token = cookieNamed(res, CONSOLE_SESSION_COOKIE)!.split(';')[0].slice(CONSOLE_SESSION_COOKIE.length + 1);
    expect((await verifyConsoleSessionToken(token))!.email).toBe('x@try-n.com');
  });

  it('never needs the account to be in admin-users', async () => {
    db.docs.set('admin-users', [{ email: 'someone-else@zoellife.com', role: 'admin' }]);
    const res = await runCallback();
    expect(res.headers.get('location')).toBe('https://zoellife.com/console');
  });
});

describe('AC-CON-002 rejection table (identity known)', () => {
  it.each<[string, Scenario]>([
    ['x@try-n.com.evil.io', { email: 'x@try-n.com.evil.io' }],
    ['x@mail.try-n.com', { email: 'x@mail.try-n.com' }],
    ['x@evil-try-n.com', { email: 'x@evil-try-n.com', idTokenClaims: { hd: 'evil-try-n.com' } }],
    ['x@try-n.co', { email: 'x@try-n.co', idTokenClaims: { hd: 'try-n.co' } }],
    ['a@b@try-n.com', { email: 'a@b@try-n.com' }],
    ['@try-n.com', { email: '@try-n.com' }],
    ['hd missing', { email: 'x@try-n.com', idTokenClaims: { hd: undefined } }],
    ['hd=evil.io', { email: 'x@try-n.com', idTokenClaims: { hd: 'evil.io' } }],
    ['userinfo email_verified false', { email: 'x@try-n.com', profile: { email_verified: false } }],
    ['id token email_verified false', { email: 'x@try-n.com', idTokenClaims: { email_verified: false } }],
    ['aud of another client', { email: 'x@try-n.com', idTokenClaims: { aud: 'other.apps.googleusercontent.com' } }],
    ['id token email differs', { email: 'x@try-n.com', idTokenClaims: { email: 'y@try-n.com' } }],
    ['no id token', { email: 'x@try-n.com', token: () => Response.json({ access_token: ACCESS_TOKEN }) }],
    ['expired id token', { email: 'x@try-n.com', idTokenClaims: { exp: NOW / 1000 - 1 } }],
  ])('%s -> /console/login?error=not_allowed', async (_label, scenario) => {
    const res = await runCallback(scenario);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://zoellife.com/console/login?error=not_allowed');
    expect(cookieNamed(res, CONSOLE_SESSION_COOKIE)).toBeUndefined();
    expect(cookieNamed(res, SESSION_COOKIE)).toBeUndefined();
    expect(consoleAudit()).toHaveLength(1);
    expect(consoleAudit()[0]).toMatchObject({ module: 'console', action: 'auth.login_failed' });
    expect(siteAudit()).toHaveLength(1);
    expect(db.reads).not.toContain('admin-users');
  });
});

describe('AC-CON-002 pre-identity failures stay on the console sign-in page', () => {
  it.each<[string, string, () => void, Scenario]>([
    ['OAuth not configured', 'sso_not_configured', () => delete process.env.GOOGLE_CLIENT_ID, {}],
    ['console secret invalid', 'console_not_configured', () => delete process.env.CONSOLE_SESSION_SECRET, {}],
    ['state mismatch', 'oauth_state', () => {}, { state: 'other' }],
    ['token endpoint 4xx', 'oauth_token', () => {}, { token: () => new Response('x', { status: 400 }) }],
    ['token response without access_token', 'oauth_token', () => {}, { token: () => Response.json({}) }],
    ['userinfo 4xx', 'oauth_userinfo', () => {}, { userinfo: () => new Response('x', { status: 401 }) }],
    ['userinfo without email', 'oauth_email', () => {}, { userinfo: () => Response.json({ email_verified: true }) }],
    [
      'unexpected exception',
      'oauth_failed',
      () => {},
      {
        token: () => {
          throw new Error('boom');
        },
      },
    ],
  ])('%s -> /console/login?error=%s, no audit entry', async (_label, code, arrange, scenario) => {
    arrange();
    const res = await runCallback(scenario);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(`https://zoellife.com/console/login?error=${code}`);
    expect(res.headers.get('location')).not.toContain('/admin/login');
    expect(cookieNamed(res, CONSOLE_SESSION_COOKIE)).toBeUndefined();
    expect(consoleAudit()).toHaveLength(0);
    expect(siteAudit()).toHaveLength(0);
    expect(setCookies(res).some((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=;`))).toBe(true);
  });

  it.each([
    ['unset', undefined],
    ['31 characters', 'x'.repeat(31)],
    ['equal to ADMIN_SESSION_SECRET', ENV.ADMIN_SESSION_SECRET],
    ['equal to WORKSHOP_SSO_SECRET', ENV.WORKSHOP_SSO_SECRET],
    ['equal to CONSOLE_SECRETS_KEY', ENV.CONSOLE_SECRETS_KEY],
  ])('AC-CON-004: CONSOLE_SESSION_SECRET %s -> no console token is ever issued', async (_label, value) => {
    if (value === undefined) delete process.env.CONSOLE_SESSION_SECRET;
    else process.env.CONSOLE_SESSION_SECRET = value;
    const res = await runCallback();
    expect(res.headers.get('location')).toBe('https://zoellife.com/console/login?error=console_not_configured');
    expect(cookieNamed(res, CONSOLE_SESSION_COOKIE)).toBeUndefined();
  });

  it('AC-CON-016: 50 bad-state requests never grow the console audit log', async () => {
    for (let i = 0; i < 50; i++) {
      const res = await runCallback({ state: `wrong-${i}` });
      expect(res.headers.get('location')).toBe('https://zoellife.com/console/login?error=oauth_state');
    }
    expect(consoleAudit()).toHaveLength(0);
  });
});

describe('AC-CON-016 sign-in audit', () => {
  it('adds exactly two site audit lines for one success and one identity-known rejection', async () => {
    await runCallback();
    await runCallback({ email: 'x@evil.io', idTokenClaims: { hd: 'evil.io' } });
    expect(siteAudit()).toHaveLength(2);
    expect(consoleAudit().map((e) => e.action)).toEqual(['auth.login', 'auth.login_failed']);
    const all = JSON.stringify([...consoleAudit(), ...siteAudit()]);
    expect(all).not.toContain(OAUTH_CODE);
    expect(all).not.toContain(ACCESS_TOKEN);
    expect(all).not.toContain('unsigned');
  });
});

describe('AC-CON-003 dot-segment return paths are not console mode', () => {
  it.each(['/console/../admin', '/console/%2E%2E/admin', '/console/./../admin'])(
    '%s runs the admin flow and never issues a console cookie',
    async (next) => {
      const res = await runCallback({ next, email: 'stranger@gmail.com', idTokenClaims: { hd: undefined } });
      expect(res.headers.get('location')).toBe('https://zoellife.com/admin/login?error=not_authorized');
      expect(cookieNamed(res, CONSOLE_SESSION_COOKIE)).toBeUndefined();
      expect(consoleAudit()).toHaveLength(0);
    }
  );
});

describe('start route console mode', () => {
  async function start(query: string) {
    return startGET(new Request(`https://zoellife.com/api/admin/auth/google/start?${query}`));
  }
  const nextCookieOf = (res: Response) =>
    decodeURIComponent(cookieNamed(res, OAUTH_NEXT_COOKIE)!.split(';')[0].slice(OAUTH_NEXT_COOKIE.length + 1));

  it('carries a console deep link in the next cookie and goes to Google', async () => {
    const res = await start(`next=${encodeURIComponent('/console/x')}`);
    expect(new URL(res.headers.get('location')!).origin).toBe('https://accounts.google.com');
    expect(nextCookieOf(res)).toBe('/console/x');
  });

  it('sends a missing OAuth configuration to the console sign-in page', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const res = await start('next=%2Fconsole');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://zoellife.com/console/login?error=sso_not_configured');
  });

  it('AC-CON-004: refuses console mode while the console secret is invalid', async () => {
    process.env.CONSOLE_SESSION_SECRET = ENV.ADMIN_SESSION_SECRET;
    const res = await start('next=%2Fconsole');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://zoellife.com/console/login?error=console_not_configured');
    expect(cookieNamed(res, OAUTH_STATE_COOKIE)).toBeUndefined();
  });

  it.each(['/console/../admin', '/console/%2E%2E/admin', '/console/./../admin'])(
    '%s is not console mode (next cookie becomes /admin)',
    async (next) => {
      const res = await start(`next=${encodeURIComponent(next)}`);
      expect(new URL(res.headers.get('location')!).origin).toBe('https://accounts.google.com');
      expect(nextCookieOf(res)).toBe('/admin');
    }
  );
});
