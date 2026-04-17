import crypto from 'crypto';

/**
 * RFC 6238 TOTP (Time-based One-Time Password)
 * 외부 의존성 없이 구현. Google Authenticator/Authy 호환.
 */

const DEFAULT_PERIOD = 30;
const DEFAULT_DIGITS = 6;
const DEFAULT_ALGORITHM = 'SHA1';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateSecretBase32(length = 20): string {
  const buf = crypto.randomBytes(length);
  return toBase32(buf);
}

export function toBase32(buf: Buffer): string {
  let out = '';
  let bits = 0;
  let value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += BASE32_ALPHABET[(value >>> bits) & 31];
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function fromBase32(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const v = BASE32_ALPHABET.indexOf(ch);
    if (v < 0) continue;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

export function generateTOTP(
  secretBase32: string,
  timestampMs: number = Date.now(),
  { period = DEFAULT_PERIOD, digits = DEFAULT_DIGITS, algorithm = DEFAULT_ALGORITHM } = {}
): string {
  const key = fromBase32(secretBase32);
  const counter = Math.floor(timestampMs / 1000 / period);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac(algorithm, key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const mod = 10 ** digits;
  const code = (binary % mod).toString().padStart(digits, '0');
  return code;
}

export function verifyTOTP(
  secretBase32: string,
  token: string,
  { window = 1, period = DEFAULT_PERIOD } = {}
): boolean {
  const cleaned = token.replace(/\D/g, '');
  if (cleaned.length !== DEFAULT_DIGITS) return false;
  const now = Date.now();
  for (let i = -window; i <= window; i++) {
    const expected = generateTOTP(secretBase32, now + i * period * 1000);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleaned))) {
      return true;
    }
  }
  return false;
}

export function buildOtpauthUrl(
  label: string,
  secretBase32: string,
  { issuer = '대라천 Admin', digits = DEFAULT_DIGITS, period = DEFAULT_PERIOD } = {}
): string {
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    digits: String(digits),
    period: String(period),
    algorithm: DEFAULT_ALGORITHM,
  });
  const encodedLabel = encodeURIComponent(`${issuer}:${label}`);
  return `otpauth://totp/${encodedLabel}?${params.toString()}`;
}
