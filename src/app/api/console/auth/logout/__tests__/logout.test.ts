import { describe, it, expect, afterEach } from 'vitest';
import { POST } from '../route';
import { SESSION_COOKIE } from '@/lib/auth';
import { CONSOLE_SESSION_COOKIE } from '@/lib/console/session';

// SPEC-CONSOLE-001 REQ-CON-006 / AC-CON-005 (sign-out part).

const saved = process.env.NEXT_PUBLIC_SITE_URL;
afterEach(() => {
  if (saved === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = saved;
});

function logout(origin: string | null, cookie?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (origin) headers.origin = origin;
  if (cookie) headers.cookie = cookie;
  return POST(new Request('https://zoellife.com/api/console/auth/logout', { method: 'POST', headers, body: '{}' }));
}

describe('POST /api/console/auth/logout', () => {
  it('clears the console cookie for a same-origin request, even without a session', async () => {
    const res = await logout('https://zoellife.com');
    expect(res.status).toBe(200);
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith(`${CONSOLE_SESSION_COOKIE}=`));
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/Max-Age=0/i);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('never clears the admin session cookie', async () => {
    const res = await logout('https://zoellife.com', `${SESSION_COOKIE}=admin-token; ${CONSOLE_SESSION_COOKIE}=x`);
    expect(res.headers.getSetCookie().some((c) => c.startsWith(`${SESSION_COOKIE}=`))).toBe(false);
  });

  it('accepts the configured site origin', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://zoellife.com/';
    const res = await POST(
      new Request('https://internal-host.vercel.app/api/console/auth/logout', {
        method: 'POST',
        headers: { origin: 'https://zoellife.com' },
      })
    );
    expect(res.status).toBe(200);
  });

  it.each([
    ['a foreign origin', 'https://evil.io'],
    ['a lookalike origin', 'https://zoellife.com.evil.io'],
    ['no origin header', null],
  ])('refuses %s with 403 and sets no cookie', async (_label, origin) => {
    const res = await logout(origin);
    expect(res.status).toBe(403);
    expect(res.headers.getSetCookie()).toEqual([]);
  });
});
