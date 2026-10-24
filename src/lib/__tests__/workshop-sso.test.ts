import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'crypto';
import {
  DEFAULT_OPEN_DOMAINS,
  decodeGoogleIdToken,
  getHandoffSecret,
  getWorkshopOpenDomains,
  getWorkshopReturnOrigins,
  isWorkshopOpenAccount,
  signHandoffToken,
  workshopReturnFromNext,
} from '@/lib/workshop-sso';

// Pure helpers behind the workshop handoff and the open-domain ("anyone at @try-n.com") entry.
// All fixtures are synthetic; no real accounts or secrets.
const SECRET = 'unit-test-workshop-secret-0123456789';
const CLIENT_ID = 'unit-test-client.apps.googleusercontent.com';
const ORIGIN = 'https://zoel-workshop.vercel.app';
const HANDOFF_URL = `${ORIGIN}/api/auth?action=handoff&from=/`;
const NEXT = `/admin/sso-handoff?return=${encodeURIComponent(HANDOFF_URL)}`;
const NOW = Date.UTC(2026, 9, 24, 0, 0, 0);

function idToken(claims: Record<string, unknown>): string {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc(claims)}.unsigned`;
}

describe('signHandoffToken', () => {
  // The inline implementation that sso-handoff/route.ts used before the refactor.
  function legacyToken(secret: string, email: string, name: string, role: string, now: number) {
    const payload = Buffer.from(JSON.stringify({ email, name, role, exp: now + 60_000 })).toString('base64url');
    const sig = createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  it('is byte-identical to the previous inline implementation', () => {
    for (const role of ['member', 'admin', 'super_admin', 'editor'] as const) {
      expect(signHandoffToken(SECRET, { email: 'a@try-n.com', name: '테스트 사용자', role }, NOW)).toBe(
        legacyToken(SECRET, 'a@try-n.com', '테스트 사용자', role, NOW)
      );
    }
  });

  it('puts exactly {email, name, role, exp} in the payload with a 60 second lifetime', () => {
    const token = signHandoffToken(SECRET, { email: 'a@try-n.com', name: 'A', role: 'member' }, NOW);
    const [payload] = token.split('.');
    expect(Buffer.from(payload, 'base64url').toString('utf8')).toBe(
      `{"email":"a@try-n.com","name":"A","role":"member","exp":${NOW + 60_000}}`
    );
  });

  it('carries an HMAC-SHA256 signature that only the secret holder can reproduce', () => {
    const token = signHandoffToken(SECRET, { email: 'a@try-n.com', name: 'A', role: 'member' }, NOW);
    const [payload, sig] = token.split('.');
    expect(sig).toBe(createHmac('sha256', SECRET).update(payload).digest('base64url'));
    expect(sig).not.toBe(createHmac('sha256', 'another-secret').update(payload).digest('base64url'));
  });

  it('defaults now to Date.now()', () => {
    const before = Date.now();
    const token = signHandoffToken(SECRET, { email: 'a@try-n.com', name: 'A', role: 'member' });
    const exp = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8')).exp as number;
    expect(exp).toBeGreaterThanOrEqual(before + 60_000);
    expect(exp).toBeLessThanOrEqual(Date.now() + 60_000);
  });
});

describe('getHandoffSecret', () => {
  const GOOD = 'a-handoff-secret-of-at-least-32-characters';
  const ADMIN = 'an-admin-session-secret-that-is-different-1';

  it('returns a usable secret as is', () => {
    expect(getHandoffSecret({ WORKSHOP_SSO_SECRET: GOOD, ADMIN_SESSION_SECRET: ADMIN })).toBe(GOOD);
    expect(getHandoffSecret({ WORKSHOP_SSO_SECRET: GOOD })).toBe(GOOD);
  });

  it('accepts exactly 32 characters', () => {
    expect(getHandoffSecret({ WORKSHOP_SSO_SECRET: 'x'.repeat(32) })).toBe('x'.repeat(32));
  });

  it.each([
    ['unset', {}],
    ['empty', { WORKSHOP_SSO_SECRET: '' }],
    ['whitespace only', { WORKSHOP_SSO_SECRET: ' '.repeat(40) }],
    ['31 characters', { WORKSHOP_SSO_SECRET: 'x'.repeat(31) }],
    ['under 32 characters once padding is trimmed', { WORKSHOP_SSO_SECRET: `${' '.repeat(10)}${'x'.repeat(25)}${' '.repeat(10)}` }],
    ['equal to ADMIN_SESSION_SECRET', { WORKSHOP_SSO_SECRET: ADMIN, ADMIN_SESSION_SECRET: ADMIN }],
    ['equal to ADMIN_SESSION_SECRET apart from padding', { WORKSHOP_SSO_SECRET: ` ${ADMIN}`, ADMIN_SESSION_SECRET: `${ADMIN}\n` }],
  ] as Array<[string, Record<string, string>]>)('returns null when it is %s', (_label, env) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(getHandoffSecret(env)).toBeNull();
    vi.restoreAllMocks();
  });

  it('logs why a configured secret was refused, without printing the secret', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(getHandoffSecret({ WORKSHOP_SSO_SECRET: ADMIN, ADMIN_SESSION_SECRET: ADMIN })).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain('WORKSHOP_SSO_SECRET');
    expect(JSON.stringify(spy.mock.calls)).not.toContain(ADMIN);
    spy.mockClear();
    // an unset secret is the normal "feature off" state and stays quiet
    expect(getHandoffSecret({})).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe('env getters', () => {
  it('parses return origins like the handoff route (trim, strip one trailing slash, drop empties)', () => {
    expect(getWorkshopReturnOrigins({})).toEqual([]);
    expect(getWorkshopReturnOrigins({ WORKSHOP_SSO_RETURN_ORIGINS: '' })).toEqual([]);
    expect(
      getWorkshopReturnOrigins({ WORKSHOP_SSO_RETURN_ORIGINS: ' https://a.example/ , ,https://b.example ' })
    ).toEqual(['https://a.example', 'https://b.example']);
  });

  it('defaults open domains to try-n.com, honours an override, and treats an empty string as disabled', () => {
    expect(getWorkshopOpenDomains({})).toEqual(['try-n.com']);
    expect(getWorkshopOpenDomains({})).toEqual([...DEFAULT_OPEN_DOMAINS]);
    expect(getWorkshopOpenDomains({ WORKSHOP_OPEN_DOMAINS: ' Try-N.com, Example.org ,' })).toEqual([
      'try-n.com',
      'example.org',
    ]);
    expect(getWorkshopOpenDomains({ WORKSHOP_OPEN_DOMAINS: '' })).toEqual([]);
    expect(getWorkshopOpenDomains({ WORKSHOP_OPEN_DOMAINS: '  ' })).toEqual([]);
  });
});

describe('workshopReturnFromNext', () => {
  const allowed = [ORIGIN];

  it('returns the return URL for the exact handoff path and an allowed https origin', () => {
    const ret = workshopReturnFromNext(NEXT, allowed);
    expect(ret).not.toBeNull();
    expect(ret!.toString()).toBe(HANDOFF_URL);
    expect(ret!.origin).toBe(ORIGIN);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty', ''],
    ['the default /admin', '/admin'],
    ['another admin path', `/admin/blog?return=${encodeURIComponent(HANDOFF_URL)}`],
    ['a longer path', `/admin/sso-handoff/extra?return=${encodeURIComponent(HANDOFF_URL)}`],
    ['a path with a suffix', `/admin/sso-handoffx?return=${encodeURIComponent(HANDOFF_URL)}`],
    ['dot-segment traversal', `/admin/sso-handoff/../login?return=${encodeURIComponent(HANDOFF_URL)}`],
    ['a protocol-relative url', `//evil.example/admin/sso-handoff?return=${encodeURIComponent(HANDOFF_URL)}`],
    ['a missing return param', '/admin/sso-handoff'],
    ['an empty return param', '/admin/sso-handoff?return='],
    ['an unparsable return', '/admin/sso-handoff?return=not-a-url'],
    ['an http return', `/admin/sso-handoff?return=${encodeURIComponent('http://zoel-workshop.vercel.app/x')}`],
    ['a javascript return', `/admin/sso-handoff?return=${encodeURIComponent('javascript:alert(1)')}`],
    ['an origin that is not allowed', `/admin/sso-handoff?return=${encodeURIComponent('https://evil.example/x')}`],
    [
      'userinfo that spoofs the allowed host',
      `/admin/sso-handoff?return=${encodeURIComponent('https://zoel-workshop.vercel.app@evil.example/x')}`,
    ],
    [
      'a lookalike host',
      `/admin/sso-handoff?return=${encodeURIComponent('https://zoel-workshop.vercel.app.evil.example/x')}`,
    ],
  ])('rejects %s', (_label, next) => {
    expect(workshopReturnFromNext(next, allowed)).toBeNull();
  });

  it('rejects everything when the allow list is empty', () => {
    expect(workshopReturnFromNext(NEXT, [])).toBeNull();
  });

  it('is https-only on its own: an http return is refused even if the allow list names the http origin', () => {
    const httpReturn = 'http://zoel-workshop.vercel.app/x';
    const next = `/admin/sso-handoff?return=${encodeURIComponent(httpReturn)}`;
    expect(workshopReturnFromNext(next, ['http://zoel-workshop.vercel.app'])).toBeNull();
  });
});

describe('isWorkshopOpenAccount', () => {
  const opts = { clientId: CLIENT_ID, domains: ['try-n.com'] };
  const ok = { email: 'member@try-n.com', emailVerified: true, hd: 'try-n.com', aud: CLIENT_ID };

  it('accepts a verified Workspace account of the open domain', () => {
    expect(isWorkshopOpenAccount(ok, opts)).toBe(true);
  });

  it('normalises upper case in the email and in hd', () => {
    expect(isWorkshopOpenAccount({ ...ok, email: 'Member@TRY-N.COM' }, opts)).toBe(true);
    expect(isWorkshopOpenAccount({ ...ok, hd: 'TRY-N.com' }, opts)).toBe(true);
  });

  it('honours a different configured domain', () => {
    const other = { clientId: CLIENT_ID, domains: ['example.org'] };
    expect(isWorkshopOpenAccount({ ...ok, email: 'a@example.org', hd: 'example.org' }, other)).toBe(true);
    expect(isWorkshopOpenAccount(ok, other)).toBe(false);
  });

  it.each([
    ['a subdomain', { email: 'a@mail.try-n.com' }],
    ['a subdomain even when hd matches the subdomain', { email: 'a@mail.try-n.com', hd: 'mail.try-n.com' }],
    ['a trailing-suffix lookalike', { email: 'x@try-n.com.evil.io' }],
    ['a prefix lookalike', { email: 'x@evil-try-n.com' }],
    ['a different domain', { email: 'x@gmail.com' }],
    ['two @ signs', { email: 'a@evil.io@try-n.com' }],
    ['an empty local part', { email: '@try-n.com' }],
    ['no @ at all', { email: 'try-n.com' }],
    ['whitespace in the address', { email: 'a b@try-n.com' }],
    ['a missing email', { email: undefined }],
    ['a missing hd (personal account)', { hd: undefined }],
    ['an hd for another domain', { hd: 'evil.io' }],
    ['email_verified false', { emailVerified: false }],
    ['email_verified undefined', { emailVerified: undefined }],
    ['an aud mismatch', { aud: 'another-client.apps.googleusercontent.com' }],
    ['a missing aud', { aud: undefined }],
  ])('rejects %s', (_label, patch) => {
    expect(isWorkshopOpenAccount({ ...ok, ...patch }, opts)).toBe(false);
  });

  it('requires exactly one @ even when the part after the first @ looks like an allowed domain', () => {
    // Without the single-@ rule, "a@b@try-n.com" would be read as domain "b@try-n.com".
    const odd = { clientId: CLIENT_ID, domains: ['b@try-n.com'] };
    expect(isWorkshopOpenAccount({ ...ok, email: 'a@b@try-n.com', hd: 'b@try-n.com' }, odd)).toBe(false);
  });

  it('matches a configured domain case-insensitively when called with mixed-case domains', () => {
    expect(isWorkshopOpenAccount(ok, { clientId: CLIENT_ID, domains: ['Try-N.com'] })).toBe(true);
  });

  it('rejects when the domain list is empty (feature disabled) or the client id is empty', () => {
    expect(isWorkshopOpenAccount(ok, { clientId: CLIENT_ID, domains: [] })).toBe(false);
    expect(isWorkshopOpenAccount({ ...ok, aud: '' }, { clientId: '', domains: ['try-n.com'] })).toBe(false);
  });
});

describe('decodeGoogleIdToken', () => {
  const base = {
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    exp: NOW / 1000 + 3600,
    email: 'member@try-n.com',
    email_verified: true,
    hd: 'try-n.com',
    name: 'Test Member',
  };

  it('decodes the payload of a well formed, unexpired Google token', () => {
    expect(decodeGoogleIdToken(idToken(base), NOW)).toEqual(base);
  });

  it('accepts the scheme-less issuer too', () => {
    expect(decodeGoogleIdToken(idToken({ ...base, iss: 'accounts.google.com' }), NOW)?.iss).toBe('accounts.google.com');
  });

  it('leaves optional claims undefined when absent or of the wrong type', () => {
    const claims = decodeGoogleIdToken(
      idToken({ iss: base.iss, exp: base.exp, aud: ['a', 'b'], email_verified: 'true', hd: 5 }),
      NOW
    );
    expect(claims).toEqual({
      iss: base.iss,
      exp: base.exp,
      aud: undefined,
      email: undefined,
      email_verified: undefined,
      hd: undefined,
      name: undefined,
    });
  });

  it.each([
    ['a foreign issuer', { ...base, iss: 'https://evil.example' }],
    ['a missing issuer', { ...base, iss: undefined }],
    ['an expired token', { ...base, exp: NOW / 1000 - 1 }],
    ['a token expiring exactly now', { ...base, exp: NOW / 1000 }],
    ['a missing exp', { ...base, exp: undefined }],
    ['a string exp', { ...base, exp: String(NOW / 1000 + 3600) }],
    ['a non-finite exp', { ...base, exp: null }],
  ])('returns null for %s', (_label, claims) => {
    expect(decodeGoogleIdToken(idToken(claims), NOW)).toBeNull();
  });

  it.each([
    ['undefined', undefined],
    ['a number', 42],
    ['an empty string', ''],
    ['a token without three parts', 'abc.def'],
    ['a token with four parts', `h.${Buffer.from(JSON.stringify(base)).toString('base64url')}.s.extra`],
    ['a payload that is not JSON', `a.${Buffer.from('not json').toString('base64url')}.c`],
    ['a payload that is a JSON array', `a.${Buffer.from('[1,2]').toString('base64url')}.c`],
    ['a payload that is JSON null', `a.${Buffer.from('null').toString('base64url')}.c`],
  ])('returns null for %s', (_label, value) => {
    expect(decodeGoogleIdToken(value, NOW)).toBeNull();
  });

  it('defaults now to Date.now()', () => {
    const live = idToken({ ...base, exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(decodeGoogleIdToken(live)).not.toBeNull();
    expect(decodeGoogleIdToken(idToken({ ...base, exp: Math.floor(Date.now() / 1000) - 10 }))).toBeNull();
  });
});
