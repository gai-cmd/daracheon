import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Characterization (SPEC-CONSOLE-001 M2, first step): pins the admin-mode error exits of the Google
// callback and start routes exactly as they behave before the console mode is added. Every exit
// must keep its address, error code, status and OAuth temp-cookie cleanup byte for byte.
// All fixtures are synthetic.

const db = vi.hoisted(() => ({
  adminUsers: [] as Array<Record<string, unknown>>,
  writes: [] as string[],
}));

vi.mock('@/lib/db', () => ({
  readDataForWrite: vi.fn(async (name: string) => (name === 'admin-users' ? db.adminUsers : [])),
  writeDataMerged: vi.fn(async (name: string) => {
    db.writes.push(name);
  }),
}));

import { GET } from '../route';
import { GET as startGET } from '../../start/route';
import { SESSION_COOKIE } from '@/lib/auth';
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, sanitizeNextPath } from '@/lib/google-oauth';

const NOW = Date.UTC(2026, 10, 15, 0, 0, 0);
const CLIENT_ID = 'unit-test-client.apps.googleusercontent.com';
const ENV_KEYS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_OAUTH_REDIRECT_URI', 'ADMIN_SESSION_SECRET'] as const;
const savedEnv: Record<string, string | undefined> = {};

type FetchPlan = {
  token?: () => Response;
  userinfo?: () => Response;
};

function stubFetch(plan: FetchPlan) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        return (plan.token ?? (() => Response.json({ access_token: 'access-token-fixture' })))();
      }
      if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
        return (plan.userinfo ?? (() => Response.json({ email: 'boss@zoellife.com', email_verified: true })))();
      }
      throw new Error(`unexpected fetch: ${url}`);
    })
  );
}

function callback(opts: { next?: string; cookie?: string; query?: string } = {}) {
  const cookie =
    opts.cookie ?? `${OAUTH_STATE_COOKIE}=st; ${OAUTH_NEXT_COOKIE}=${encodeURIComponent(opts.next ?? '/admin')}`;
  return GET(
    new Request(`https://zoellife.com/api/admin/auth/google/callback?${opts.query ?? 'code=abc&state=st'}`, {
      headers: { cookie },
    })
  );
}

function expectAdminExit(res: Response, code: string) {
  expect(res.status).toBe(307);
  expect(res.headers.get('location')).toBe(`https://zoellife.com/admin/login?error=${code}`);
  const cookies = res.headers.getSetCookie();
  expect(cookies.some((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=;`))).toBe(true);
  expect(cookies.some((c) => c.startsWith(`${OAUTH_NEXT_COOKIE}=;`))).toBe(true);
  expect(cookies.some((c) => c.startsWith(`${SESSION_COOKIE}=`))).toBe(false);
}

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
  process.env.GOOGLE_CLIENT_SECRET = 'unit-test-client-secret';
  delete process.env.GOOGLE_OAUTH_REDIRECT_URI;
  process.env.ADMIN_SESSION_SECRET = 'unit-test-admin-session-secret-0123456789';
  db.adminUsers = [];
  db.writes = [];
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('callback admin-mode exits (8 codes, all to /admin/login)', () => {
  it('1. sso_not_configured when the OAuth client is not configured', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    expectAdminExit(await callback(), 'sso_not_configured');
  });

  it.each([
    ['no state cookie', { cookie: `${OAUTH_NEXT_COOKIE}=%2Fadmin` }],
    ['state mismatch', { query: 'code=abc&state=other' }],
    ['no code', { query: 'state=st' }],
  ])('2. oauth_state: %s', async (_label, opts) => {
    stubFetch({});
    expectAdminExit(await callback(opts), 'oauth_state');
  });

  it('3. oauth_token when the token endpoint answers 4xx', async () => {
    stubFetch({ token: () => new Response('bad', { status: 400 }) });
    expectAdminExit(await callback(), 'oauth_token');
  });

  it('3. oauth_token when the token response has no access_token', async () => {
    stubFetch({ token: () => Response.json({ id_token: 'x' }) });
    expectAdminExit(await callback(), 'oauth_token');
  });

  it('4. oauth_userinfo when userinfo answers 4xx', async () => {
    stubFetch({ userinfo: () => new Response('no', { status: 401 }) });
    expectAdminExit(await callback(), 'oauth_userinfo');
  });

  it.each([
    ['no email', {}],
    ['email_verified false', { email: 'boss@zoellife.com', email_verified: false }],
  ])('5. oauth_email: %s', async (_label, profile) => {
    stubFetch({ userinfo: () => Response.json(profile) });
    expectAdminExit(await callback(), 'oauth_email');
    expect(db.writes).toEqual([]);
  });

  it('6. not_authorized for an unregistered account', async () => {
    stubFetch({ userinfo: () => Response.json({ email: 'stranger@gmail.com', email_verified: true }) });
    expectAdminExit(await callback(), 'not_authorized');
  });

  it('7. account_locked for a locked admin', async () => {
    db.adminUsers = [{ email: 'boss@zoellife.com', role: 'admin', lockedUntil: new Date(NOW + 60_000).toISOString() }];
    stubFetch({});
    expectAdminExit(await callback(), 'account_locked');
  });

  it('8. oauth_failed when processing throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );
    expectAdminExit(await callback(), 'oauth_failed');
  });
});

describe('start route admin mode', () => {
  it('sends sso_not_configured to /admin/login', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const res = await startGET(new Request('https://zoellife.com/api/admin/auth/google/start?next=/admin/blog'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://zoellife.com/admin/login?error=sso_not_configured');
  });

  it('stores the sanitized admin next in the next cookie', async () => {
    const res = await startGET(new Request('https://zoellife.com/api/admin/auth/google/start?next=%2F%2Fevil.io'));
    const nextCookie = res.headers.getSetCookie().find((c) => c.startsWith(`${OAUTH_NEXT_COOKIE}=`))!;
    expect(decodeURIComponent(nextCookie.split(';')[0].slice(OAUTH_NEXT_COOKIE.length + 1))).toBe('/admin');
  });
});

describe('sanitizeNextPath admin rules (unchanged)', () => {
  it.each([
    [null, '/admin'],
    [undefined, '/admin'],
    ['', '/admin'],
    ['/admin', '/admin'],
    ['/admin/blog?x=1', '/admin/blog?x=1'],
    ['/admin/sso-handoff?return=https%3A%2F%2Fx', '/admin/sso-handoff?return=https%3A%2F%2Fx'],
    ['/adminx', '/adminx'],
    ['//evil.io/admin', '/admin'],
    ['https://evil.io/admin', '/admin'],
    ['/blog', '/admin'],
    ['/console-evil', '/admin'],
    ['/consolex', '/admin'],
    ['//evil.io/console', '/admin'],
    ['https://evil.io/console', '/admin'],
    ['/%2Fevil.io', '/admin'],
  ])('%s -> %s', (raw, expected) => {
    expect(sanitizeNextPath(raw as string | null | undefined)).toBe(expected);
  });
});
