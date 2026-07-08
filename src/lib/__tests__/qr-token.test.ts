import { describe, it, expect, beforeAll, vi } from 'vitest';
import { signQrSession, verifyQrSession } from '@/lib/qr/token';

// QR 세션 토큰(HMAC 서명, 30분 TTL). 서명이 뚫리면 가짜 동선·CTA 이벤트를
// 주입해 마케팅 분석을 오염시킬 수 있으므로 위·변조·만료 방어를 고정한다.
const SECRET = 'qr-test-secret-fixed-value-123456';

beforeAll(() => {
  process.env.QR_TRACK_SECRET = SECRET;
});

describe('qr session token', () => {
  it('round-trips slug·qsid', async () => {
    const token = await signQrSession({ slug: 'agarwood-01', qsid: 'q-abc' });
    expect(await verifyQrSession(token)).toEqual({ slug: 'agarwood-01', qsid: 'q-abc' });
  });

  it('rejects null / empty / malformed', async () => {
    expect(await verifyQrSession(null)).toBeNull();
    expect(await verifyQrSession(undefined)).toBeNull();
    expect(await verifyQrSession('')).toBeNull();
    expect(await verifyQrSession('no-dot')).toBeNull();
    expect(await verifyQrSession('a.b')).toBeNull();
  });

  it('rejects a tampered payload (signature mismatch)', async () => {
    const token = await signQrSession({ slug: 'abc', qsid: 'q1' });
    const [payload, sig] = token.split('.');
    expect(await verifyQrSession('x' + payload + '.' + sig)).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signQrSession({ slug: 'abc', qsid: 'q1' });
    process.env.QR_TRACK_SECRET = 'a-different-qr-secret-000000000000';
    expect(await verifyQrSession(token)).toBeNull();
    process.env.QR_TRACK_SECRET = SECRET;
  });

  it('rejects an expired token (TTL 30m)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    const token = await signQrSession({ slug: 'abc', qsid: 'q1' });
    vi.setSystemTime(new Date('2026-06-01T00:31:00Z')); // +31분 > 30분 TTL
    expect(await verifyQrSession(token)).toBeNull();
    vi.useRealTimers();
  });
});
