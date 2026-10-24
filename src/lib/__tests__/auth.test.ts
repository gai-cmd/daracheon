import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createHmac } from 'crypto';
import { createSessionToken, verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { signHandoffToken } from '@/lib/workshop-sso';

// 관리자 세션 토큰(HMAC-SHA256 서명)의 위조·만료·변조 방어 검증.
const SECRET_A = 'test-secret-at-least-32-bytes-long-abcdef';

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = SECRET_A;
});

describe('admin session token', () => {
  it('round-trips a valid session (email·role 보존)', async () => {
    const token = await createSessionToken({ email: 'admin@zoellife.com', role: 'super_admin' });
    const s = await verifySessionToken(token);
    expect(s).not.toBeNull();
    expect(s!.email).toBe('admin@zoellife.com');
    expect(s!.role).toBe('super_admin');
    expect(s!.expiresAt).toBeGreaterThan(s!.issuedAt);
  });

  it('rejects null / empty / malformed', async () => {
    expect(await verifySessionToken(null)).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
    expect(await verifySessionToken('garbage-no-dot')).toBeNull();
  });

  it('rejects a tampered payload (signature mismatch)', async () => {
    const token = await createSessionToken({ email: 'a@b.com', role: 'editor' });
    // payload 를 바꾸면 재계산된 서명이 원 서명과 달라 거부돼야 한다.
    const forged = 'x' + token;
    expect(await verifySessionToken(forged)).toBeNull();
  });

  it('rejects a token signed with a different secret (위조 불가)', async () => {
    const token = await createSessionToken({ email: 'a@b.com', role: 'admin' });
    process.env.ADMIN_SESSION_SECRET = 'a-completely-different-secret-value-1234';
    expect(await verifySessionToken(token)).toBeNull();
    process.env.ADMIN_SESSION_SECRET = SECRET_A; // 복구
  });

  it('rejects an expired token', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const token = await createSessionToken({ email: 'a@b.com', role: 'admin' });
    vi.setSystemTime(new Date('2026-03-01T00:00:00Z')); // +59일 > 7일 max-age
    expect(await verifySessionToken(token)).toBeNull();
    vi.useRealTimers();
  });

  it('exposes a stable cookie name', () => {
    expect(SESSION_COOKIE).toBe('daracheon_admin_session');
  });
});

// 같은 HMAC·같은 wire format 을 쓰는 다른 토큰(워크숍 핸드오프 토큰)이 시크릿 재사용 시
// 관리자 세션으로 통과하지 못하게 하는 도메인 분리 검증.
describe('session shape (no confusion with other HMAC tokens)', () => {
  // A token signed exactly like createSessionToken does, but with an arbitrary payload.
  function signRaw(body: unknown, secret = SECRET_A): string {
    const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
    return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
  }
  const FUTURE = Date.UTC(2999, 0, 1);

  it('rejects a workshop handoff token even when WORKSHOP_SSO_SECRET equals ADMIN_SESSION_SECRET', async () => {
    const token = signHandoffToken(SECRET_A, { email: 'm@try-n.com', name: 'M', role: 'member' });
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('keeps rejecting that handoff token long after its own 60 s exp (it must never become a session)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T00:00:00Z'));
    const token = signHandoffToken(SECRET_A, { email: 'm@try-n.com', name: 'M', role: 'member' });
    vi.setSystemTime(new Date('2027-10-24T00:00:00Z'));
    expect(await verifySessionToken(token)).toBeNull();
    vi.useRealTimers();
  });

  it.each([
    ['member', 'member'],
    ['an unknown role', 'owner'],
    ['an empty role', ''],
    ['a missing role', undefined],
    ['a non-string role', 7],
  ])('rejects a signed token with %s even when it has a valid expiry', async (_label, role) => {
    expect(await verifySessionToken(signRaw({ email: 'a@b.com', role, issuedAt: 1, expiresAt: FUTURE }))).toBeNull();
  });

  it.each([
    ['missing', undefined],
    ['a string', '2999-01-01'],
    ['null', null],
    ['a boolean', true],
  ])('rejects a signed token whose expiresAt is %s', async (_label, expiresAt) => {
    expect(await verifySessionToken(signRaw({ email: 'a@b.com', role: 'admin', issuedAt: 1, expiresAt }))).toBeNull();
  });

  it('rejects a signed payload that is JSON null', async () => {
    expect(await verifySessionToken(signRaw(null))).toBeNull();
  });

  it.each(['super_admin', 'admin', 'editor'] as const)('still accepts a %s session', async (role) => {
    const s = await verifySessionToken(await createSessionToken({ email: 'a@b.com', role, name: '이름' }));
    expect(s).toMatchObject({ email: 'a@b.com', role, name: '이름' });
  });
});
