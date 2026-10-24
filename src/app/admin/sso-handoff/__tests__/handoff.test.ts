import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'crypto';

// The handoff route signs the token for an already logged-in admin. After moving the HMAC into
// signHandoffToken, its output must stay byte-identical to the previous inline implementation.

const auth = vi.hoisted(() => ({ session: null as null | Record<string, unknown> }));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, verifySessionToken: vi.fn(async () => auth.session) };
});

import { GET } from '../route';
import { SESSION_COOKIE } from '@/lib/auth';

const NOW = Date.UTC(2026, 9, 24, 0, 0, 0);
const SECRET = 'unit-test-workshop-secret-0123456789';
const ADMIN_SECRET = 'unit-test-admin-session-secret-0123456789';
const ORIGIN = 'https://zoel-workshop.vercel.app';
const RETURN_URL = `${ORIGIN}/api/auth?action=handoff&from=/`;

const ENV_KEYS = ['WORKSHOP_SSO_SECRET', 'WORKSHOP_SSO_RETURN_ORIGINS', 'ADMIN_SESSION_SECRET'] as const;
const savedEnv: Record<string, string | undefined> = {};

// Verbatim copy of the inline implementation this route used before the refactor.
function previousImplementationLocation(
  session: { email: string; name?: string; role: string },
  returnUrl: string,
  secret: string,
  now: number
) {
  const ret = new URL(returnUrl);
  const payload = Buffer.from(
    JSON.stringify({ email: session.email, name: session.name ?? session.email, role: session.role, exp: now + 60_000 })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  ret.searchParams.set('t', `${payload}.${sig}`);
  return ret.toString();
}

function call(returnParam: string | null, withCookie = true) {
  const url = new URL('https://zoellife.com/admin/sso-handoff');
  if (returnParam !== null) url.searchParams.set('return', returnParam);
  return GET(
    new Request(url, { headers: withCookie ? { cookie: `${SESSION_COOKIE}=session-fixture` } : {} })
  );
}

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.WORKSHOP_SSO_SECRET = SECRET;
  process.env.ADMIN_SESSION_SECRET = ADMIN_SECRET;
  process.env.WORKSHOP_SSO_RETURN_ORIGINS = `${ORIGIN}/`; // trailing slash is stripped
  auth.session = { email: 'boss@zoellife.com', name: 'Test Admin', role: 'super_admin', issuedAt: NOW, expiresAt: NOW + 1 };
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.restoreAllMocks();
});

describe('/admin/sso-handoff', () => {
  it('(f) redirects to exactly the URL the previous implementation produced (session with a name)', async () => {
    const res = await call(RETURN_URL);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      previousImplementationLocation(
        { email: 'boss@zoellife.com', name: 'Test Admin', role: 'super_admin' },
        RETURN_URL,
        SECRET,
        NOW
      )
    );
  });

  it('(f) falls back to the email as the name, as before', async () => {
    auth.session = { email: 'editor@zoellife.com', role: 'editor', issuedAt: NOW, expiresAt: NOW + 1 };
    const res = await call(RETURN_URL);
    expect(res.headers.get('location')).toBe(
      previousImplementationLocation({ email: 'editor@zoellife.com', role: 'editor' }, RETURN_URL, SECRET, NOW)
    );
    const t = new URL(res.headers.get('location')!).searchParams.get('t')!;
    expect(JSON.parse(Buffer.from(t.split('.')[0], 'base64url').toString('utf8'))).toEqual({
      email: 'editor@zoellife.com',
      name: 'editor@zoellife.com',
      role: 'editor',
      exp: NOW + 60_000,
    });
  });

  it('keeps the 503 when the secret is not configured', async () => {
    delete process.env.WORKSHOP_SSO_SECRET;
    const res = await call(RETURN_URL);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ success: false, message: 'sso handoff not configured' });
  });

  it.each([
    ['equal to ADMIN_SESSION_SECRET', ADMIN_SECRET],
    ['shorter than 32 characters', 'short-secret'],
    ['whitespace only', ' '.repeat(40)],
  ])('answers 503 and signs nothing when the secret is %s', async (_label, secret) => {
    process.env.WORKSHOP_SSO_SECRET = secret;
    const res = await call(RETURN_URL);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ success: false, message: 'sso handoff not configured' });
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects to the admin login when there is no valid session', async () => {
    auth.session = null;
    const res = await call(RETURN_URL, false);
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/admin/login');
  });

  it('keeps the 400 for an unparsable return', async () => {
    const res = await call('not-a-url');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, message: 'invalid return' });
  });

  it('keeps the 400 for a missing return', async () => {
    const res = await call(null);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, message: 'invalid return' });
  });

  it('refuses an http return even if the allow list names the http origin', async () => {
    process.env.WORKSHOP_SSO_RETURN_ORIGINS = 'http://zoel-workshop.vercel.app';
    const res = await call('http://zoel-workshop.vercel.app/x');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, message: 'return origin not allowed' });
  });

  it.each([
    ['an origin that is not allowed', 'https://evil.example/x'],
    ['plain http', 'http://zoel-workshop.vercel.app/x'],
  ])('keeps the 400 for %s', async (_label, returnParam) => {
    const res = await call(returnParam);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, message: 'return origin not allowed' });
  });
});
