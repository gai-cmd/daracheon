import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createSessionToken, verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

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
