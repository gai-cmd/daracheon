import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'crypto';

// Google SSO callback: registered admin-users keep the old flow; an unregistered, verified
// Workspace account of an open domain (default try-n.com) is sent to the workshop as role
// "member" and never receives the zoellife admin session cookie. All fixtures are synthetic.

const db = vi.hoisted(() => ({
  adminUsers: [] as Array<Record<string, unknown>>,
  auditLog: [] as Array<Record<string, unknown>>,
  reads: [] as string[],
  writes: [] as Array<{ name: string; data: unknown }>,
}));

vi.mock('@/lib/db', () => ({
  readDataForWrite: vi.fn(async (name: string) => {
    db.reads.push(name);
    if (name === 'admin-users') return db.adminUsers;
    if (name === 'audit-log') return db.auditLog;
    return [];
  }),
  writeDataMerged: vi.fn(async (name: string, data: unknown) => {
    db.writes.push({ name, data });
  }),
}));

import { GET } from '../route';
import { GET as startGET } from '../../start/route';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE } from '@/lib/google-oauth';

const NOW = Date.UTC(2026, 9, 24, 0, 0, 0);
const CLIENT_ID = 'unit-test-client.apps.googleusercontent.com';
const WORKSHOP_SECRET = 'unit-test-workshop-secret';
const ORIGIN = 'https://zoel-workshop.vercel.app';
const HANDOFF_URL = `${ORIGIN}/api/auth?action=handoff&from=/`;
const HANDOFF_NEXT = `/admin/sso-handoff?return=${encodeURIComponent(HANDOFF_URL)}`;
const LOGIN_NOT_AUTHORIZED = 'https://zoellife.com/admin/login?error=not_authorized';

const ENV_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_OAUTH_REDIRECT_URI',
  'ADMIN_SESSION_SECRET',
  'WORKSHOP_SSO_SECRET',
  'WORKSHOP_SSO_RETURN_ORIGINS',
  'WORKSHOP_OPEN_DOMAINS',
] as const;
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
  idToken?: string | null; // null = token response carries no id_token
  idTokenClaims?: Record<string, unknown>;
  next?: string;
}

async function runCallback(s: Scenario = {}) {
  const email = s.email ?? 'member@try-n.com';
  const idToken = s.idToken === null ? undefined : (s.idToken ?? idTokenFor(email, s.idTokenClaims));
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        return Response.json({ access_token: 'access-token-fixture', ...(idToken ? { id_token: idToken } : {}) });
      }
      if (url === 'https://www.googleapis.com/oauth2/v3/userinfo') {
        return Response.json({ email, email_verified: true, name: 'Test Member', ...s.profile });
      }
      throw new Error(`unexpected fetch: ${url}`);
    })
  );
  const cookie = `${OAUTH_STATE_COOKIE}=st; ${OAUTH_NEXT_COOKIE}=${encodeURIComponent(s.next ?? HANDOFF_NEXT)}`;
  return GET(
    new Request('https://zoellife.com/api/admin/auth/google/callback?code=abc&state=st', {
      headers: { cookie },
    })
  );
}

function setCookies(res: Response): string[] {
  return res.headers.getSetCookie();
}

function hasSessionCookie(res: Response): boolean {
  return setCookies(res).some((c) => c.startsWith(`${SESSION_COOKIE}=`));
}

function parseToken(location: string) {
  const t = new URL(location).searchParams.get('t');
  expect(t).toBeTruthy();
  const [payload, sig] = t!.split('.');
  return {
    payload: JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>,
    sigOk: sig === createHmac('sha256', WORKSHOP_SECRET).update(payload).digest('base64url'),
  };
}

function adminUser(email: string, role = 'admin') {
  return { email, role, passwordHash: 'x', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
}

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
  process.env.GOOGLE_CLIENT_SECRET = 'unit-test-client-secret';
  delete process.env.GOOGLE_OAUTH_REDIRECT_URI;
  process.env.ADMIN_SESSION_SECRET = 'unit-test-admin-session-secret-0123456789';
  process.env.WORKSHOP_SSO_SECRET = WORKSHOP_SECRET;
  process.env.WORKSHOP_SSO_RETURN_ORIGINS = ORIGIN;
  delete process.env.WORKSHOP_OPEN_DOMAINS;
  db.adminUsers = [];
  db.auditLog = [];
  db.reads = [];
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

describe('registered admin-users (unchanged flow)', () => {
  it('issues the admin session cookie and redirects to next', async () => {
    db.adminUsers = [adminUser('boss@zoellife.com', 'super_admin')];
    const res = await runCallback({ email: 'boss@zoellife.com', next: '/admin/blog', idToken: null });

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://zoellife.com/admin/blog');
    const cookie = setCookies(res).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
    expect(cookie).toBeDefined();
    const session = await verifySessionToken(cookie!.split(';')[0].slice(SESSION_COOKIE.length + 1));
    expect(session).toMatchObject({ email: 'boss@zoellife.com', role: 'super_admin', name: 'Test Member' });
    // lastLoginAt is recorded in admin-users, and the login is audited.
    expect(db.writes.map((w) => w.name)).toEqual(['admin-users', 'audit-log']);
    expect(db.auditLog.at(-1)).toMatchObject({ actor: 'boss@zoellife.com', actorRole: 'super_admin', action: 'login' });
    // oauth temp cookies are cleared
    expect(setCookies(res).some((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=;`))).toBe(true);
  });

  it('keeps the admin flow (not the member entry) for a registered try-n.com account, handoff next included', async () => {
    db.adminUsers = [adminUser('staff@try-n.com', 'editor')];
    const res = await runCallback({ email: 'staff@try-n.com', next: HANDOFF_NEXT });

    expect(res.headers.get('location')).toBe(`https://zoellife.com${HANDOFF_NEXT}`);
    expect(new URL(res.headers.get('location')!).searchParams.get('t')).toBeNull();
    expect(hasSessionCookie(res)).toBe(true);
  });

  it('still blocks a locked admin account', async () => {
    db.adminUsers = [{ ...adminUser('locked@try-n.com'), lockedUntil: new Date(NOW + 60_000).toISOString() }];
    const res = await runCallback({ email: 'locked@try-n.com' });

    expect(res.headers.get('location')).toBe('https://zoellife.com/admin/login?error=account_locked');
    expect(hasSessionCookie(res)).toBe(false);
  });
});

describe('unregistered open-domain account (workshop member entry)', () => {
  it('redirects to the workshop with a verifiable role=member token and NO admin session cookie', async () => {
    db.adminUsers = [adminUser('someone-else@zoellife.com')];
    const res = await runCallback({ email: 'member@try-n.com' });

    expect(res.status).toBe(307);
    const location = res.headers.get('location')!;
    const target = new URL(location);
    expect(target.origin).toBe(ORIGIN);
    expect(target.pathname).toBe('/api/auth');
    expect(target.searchParams.get('action')).toBe('handoff');
    expect(target.searchParams.get('from')).toBe('/');

    const { payload, sigOk } = parseToken(location);
    expect(sigOk).toBe(true);
    expect(payload).toEqual({ email: 'member@try-n.com', name: 'Test Member', role: 'member', exp: NOW + 60_000 });

    expect(hasSessionCookie(res)).toBe(false);
    expect(res.headers.get('set-cookie') ?? '').not.toContain(SESSION_COOKIE);
    // oauth temp cookies are still cleared
    expect(setCookies(res).some((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=;`))).toBe(true);
    expect(setCookies(res).some((c) => c.startsWith(`${OAUTH_NEXT_COOKIE}=;`))).toBe(true);
  });

  it('works end to end with the cookies the real start route sets (workshop button -> start -> callback)', async () => {
    // The workshop sends the browser to start?next=/admin/sso-handoff?return=<encoded handoff url>.
    const startUrl = new URL('https://zoellife.com/api/admin/auth/google/start');
    startUrl.searchParams.set('next', HANDOFF_NEXT);
    const startRes = await startGET(new Request(startUrl));
    const cookieHeader = setCookies(startRes)
      .map((c) => c.split(';')[0])
      .join('; ');
    const state = new URL(startRes.headers.get('location')!).searchParams.get('state')!;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input) === 'https://oauth2.googleapis.com/token'
          ? Response.json({ access_token: 'access-token-fixture', id_token: idTokenFor('member@try-n.com') })
          : Response.json({ email: 'member@try-n.com', email_verified: true, name: 'Test Member' })
      )
    );
    const res = await GET(
      new Request(`https://zoellife.com/api/admin/auth/google/callback?code=abc&state=${state}`, {
        headers: { cookie: cookieHeader },
      })
    );

    expect(res.status).toBe(307);
    const target = new URL(res.headers.get('location')!);
    expect(`${target.origin}${target.pathname}`).toBe(`${ORIGIN}/api/auth`);
    expect(target.searchParams.get('action')).toBe('handoff');
    expect(target.searchParams.get('from')).toBe('/');
    expect(parseToken(res.headers.get('location')!)).toMatchObject({
      sigOk: true,
      payload: { email: 'member@try-n.com', role: 'member' },
    });
    expect(hasSessionCookie(res)).toBe(false);
  });

  it('audits the entry and never writes admin-users', async () => {
    const res = await runCallback({ email: 'member@try-n.com' });
    expect(res.status).toBe(307);

    expect(db.writes.map((w) => w.name)).toEqual(['audit-log']);
    expect(db.auditLog.at(-1)).toMatchObject({
      actor: 'member@try-n.com',
      actorRole: 'workshop-member',
      module: 'auth',
      action: 'login',
      summary: '작업실 입장(try-n.com 도메인)',
    });
    // admin-users is read exactly once: the pre-existing registration lookup, before this branch.
    expect(db.reads.filter((n) => n === 'admin-users')).toHaveLength(1);
  });

  it('falls back to the email as the name when the profile has none', async () => {
    const res = await runCallback({
      email: 'member@try-n.com',
      profile: { name: undefined },
      idTokenClaims: { name: undefined },
    });
    expect(parseToken(res.headers.get('location')!).payload.name).toBe('member@try-n.com');
  });

  it('normalises an upper-case address', async () => {
    const res = await runCallback({ email: 'X@TRY-N.COM', idTokenClaims: { email: 'x@Try-N.com' } });

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).origin).toBe(ORIGIN);
    expect(parseToken(res.headers.get('location')!).payload.email).toBe('x@try-n.com');
    expect(hasSessionCookie(res)).toBe(false);
  });

  it('accepts a domain configured through WORKSHOP_OPEN_DOMAINS', async () => {
    process.env.WORKSHOP_OPEN_DOMAINS = 'example.org';
    const res = await runCallback({ email: 'a@example.org', idTokenClaims: { hd: 'example.org' } });

    expect(new URL(res.headers.get('location')!).origin).toBe(ORIGIN);
    expect(db.auditLog.at(-1)).toMatchObject({ summary: '작업실 입장(example.org 도메인)' });
  });
});

describe('everything else is still not_authorized', () => {
  async function expectDenied(s: Scenario) {
    const res = await runCallback(s);
    expect(res.headers.get('location')).toBe(LOGIN_NOT_AUTHORIZED);
    expect(hasSessionCookie(res)).toBe(false);
    expect(db.auditLog.at(-1)).toMatchObject({ actorRole: 'unknown', action: 'login_failed' });
    expect(db.auditLog.at(-1)!.summary).toContain('미등록 계정 SSO 로그인 시도');
    expect(db.writes.map((w) => w.name)).toEqual(['audit-log']);
  }

  it('(c) an unregistered personal gmail account', async () => {
    await expectDenied({ email: 'someone@gmail.com', idTokenClaims: { hd: undefined } });
  });

  it('an unregistered gmail account even when it claims hd=try-n.com', async () => {
    await expectDenied({ email: 'someone@gmail.com' });
  });

  it.each([
    ['hd missing', { idTokenClaims: { hd: undefined } }],
    ['hd for another domain', { idTokenClaims: { hd: 'other.example' } }],
    ['id_token email_verified false', { idTokenClaims: { email_verified: false } }],
    ['id_token email_verified missing', { idTokenClaims: { email_verified: undefined } }],
    ['userinfo email_verified missing', { profile: { email_verified: undefined } }],
    ['aud mismatch', { idTokenClaims: { aud: 'another-client.apps.googleusercontent.com' } }],
    ['expired id_token', { idTokenClaims: { exp: NOW / 1000 - 1 } }],
    ['foreign issuer', { idTokenClaims: { iss: 'https://evil.example' } }],
    ['id_token email differs from userinfo email', { idTokenClaims: { email: 'other@try-n.com' } }],
    ['no id_token in the token response', { idToken: null }],
    ['garbage id_token', { idToken: 'garbage' }],
    ['next is not the handoff path', { next: '/admin/blog' }],
    ['next is the plain /admin default', { next: '/admin' }],
    ['next carries a handoff path with extra segments', { next: HANDOFF_NEXT.replace('sso-handoff', 'sso-handoff/x') }],
    ['return origin not allowed', { next: `/admin/sso-handoff?return=${encodeURIComponent('https://evil.example/x')}` }],
    ['return is plain http', { next: `/admin/sso-handoff?return=${encodeURIComponent('http://zoel-workshop.vercel.app/x')}` }],
  ] as Array<[string, Scenario]>)('(d) x@try-n.com but %s', async (_label, scenario) => {
    await expectDenied({ email: 'x@try-n.com', ...scenario });
  });

  it('(d) x@try-n.com when WORKSHOP_SSO_SECRET is unset', async () => {
    delete process.env.WORKSHOP_SSO_SECRET;
    await expectDenied({ email: 'x@try-n.com' });
  });

  it('(d) x@try-n.com when WORKSHOP_SSO_RETURN_ORIGINS is unset', async () => {
    delete process.env.WORKSHOP_SSO_RETURN_ORIGINS;
    await expectDenied({ email: 'x@try-n.com' });
  });

  it('(d) x@try-n.com when WORKSHOP_OPEN_DOMAINS is the empty string (feature off)', async () => {
    process.env.WORKSHOP_OPEN_DOMAINS = '';
    await expectDenied({ email: 'x@try-n.com' });
  });

  it('(e) x@try-n.com.evil.io', async () => {
    await expectDenied({ email: 'x@try-n.com.evil.io' });
  });

  it('(e) x@evil-try-n.com', async () => {
    await expectDenied({ email: 'x@evil-try-n.com', idTokenClaims: { hd: 'evil-try-n.com' } });
  });

  it.each(['try-n.com', 'mail.try-n.com'])('(e) a@mail.try-n.com with hd=%s', async (hd) => {
    await expectDenied({ email: 'a@mail.try-n.com', idTokenClaims: { hd } });
  });

  it('existing behaviour: userinfo email_verified=false is rejected earlier as oauth_email', async () => {
    const res = await runCallback({ email: 'x@try-n.com', profile: { email_verified: false } });
    expect(res.headers.get('location')).toBe('https://zoellife.com/admin/login?error=oauth_email');
    expect(hasSessionCookie(res)).toBe(false);
    expect(db.writes).toEqual([]);
  });
});
