import { describe, it, expect, vi } from 'vitest';
import {
  generateTOTP,
  verifyTOTP,
  verifyTOTPOnce,
  generateSecretBase32,
  toBase32,
  fromBase32,
} from '@/lib/totp';

describe('totp', () => {
  const secret = generateSecretBase32();

  it('generates a 6-digit numeric code', () => {
    expect(generateTOTP(secret)).toMatch(/^\d{6}$/);
  });

  it('is deterministic for a fixed timestamp', () => {
    const t = 1_700_000_000_000;
    expect(generateTOTP(secret, t)).toBe(generateTOTP(secret, t));
  });

  it('verifies a freshly generated code', () => {
    expect(verifyTOTP(secret, generateTOTP(secret))).toBe(true);
  });

  it('rejects malformed tokens (length/non-digit)', () => {
    expect(verifyTOTP(secret, '12345')).toBe(false); // 5자리
    expect(verifyTOTP(secret, 'abcdef')).toBe(false); // 숫자 아님
    expect(verifyTOTP(secret, '')).toBe(false);
  });

  it('rejects an old code once the window (window=0) passes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    const code = generateTOTP(secret); // Date.now() = T
    vi.setSystemTime(new Date('2026-06-01T00:05:00Z')); // +300s (10 periods)
    expect(verifyTOTP(secret, code)).toBe(false);
    vi.useRealTimers();
  });

  it('base32 round-trips arbitrary bytes', () => {
    const buf = Buffer.from('hello world! 침향');
    expect(fromBase32(toBase32(buf)).equals(buf)).toBe(true);
  });

  it('verifyTOTPOnce blocks replay of the same code', () => {
    const s2 = generateSecretBase32();
    const code = generateTOTP(s2);
    expect(verifyTOTPOnce('user@x.com', s2, code)).toBe(true);
    expect(verifyTOTPOnce('user@x.com', s2, code)).toBe(false); // 재사용 차단
  });
});
