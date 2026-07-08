import { describe, it, expect, beforeAll } from 'vitest';
import {
  encryptString,
  decryptString,
  looksEncrypted,
  isEncryptionConfigured,
} from '@/lib/backup-crypto';

// 백업 암복호화가 깨지면 오프사이트 백업이 복구 불능이 된다(데이터 안전 직결).
// 왕복·IV 무작위성·GCM 변조 탐지·키 불일치·포맷 검증을 고정한다.
const KEY_A = 'a'.repeat(64); // 64 hex = 32바이트 정식 키
const KEY_B = 'b'.repeat(64);

beforeAll(() => {
  process.env.BACKUP_ENCRYPTION_KEY = KEY_A;
});

describe('backup-crypto (AES-256-GCM)', () => {
  it('round-trips plaintext (unicode·JSON·large)', () => {
    for (const p of [
      'hello',
      '침향 沉香 데이터 🌿',
      JSON.stringify({ a: 1, b: [1, 2, 3], c: '한글', nested: { pii: 'x@y.com' } }),
      'x'.repeat(100_000),
    ]) {
      expect(decryptString(encryptString(p))).toBe(p);
    }
  });

  it('uses a fresh random IV each time (same plaintext → different cipher)', () => {
    const a = JSON.parse(encryptString('same'));
    const b = JSON.parse(encryptString('same'));
    expect(a.iv).not.toBe(b.iv);
    expect(a.cipher).not.toBe(b.cipher);
  });

  it('detects tampering with the ciphertext (GCM auth)', () => {
    const blob = JSON.parse(encryptString('secret payload'));
    const buf = Buffer.from(blob.cipher, 'base64');
    buf[0] ^= 0xff;
    blob.cipher = buf.toString('base64');
    expect(() => decryptString(JSON.stringify(blob))).toThrow();
  });

  it('detects tampering with the auth tag', () => {
    const blob = JSON.parse(encryptString('secret'));
    const tag = Buffer.from(blob.tag, 'hex');
    tag[0] ^= 0xff;
    blob.tag = tag.toString('hex');
    expect(() => decryptString(JSON.stringify(blob))).toThrow();
  });

  it('fails to decrypt with a different key', () => {
    const enc = encryptString('top secret');
    process.env.BACKUP_ENCRYPTION_KEY = KEY_B;
    expect(() => decryptString(enc)).toThrow();
    process.env.BACKUP_ENCRYPTION_KEY = KEY_A;
  });

  it('rejects unsupported format / bad envelope', () => {
    expect(() => decryptString('not json')).toThrow();
    expect(() =>
      decryptString(JSON.stringify({ alg: 'aes-128-cbc', v: 1, iv: '00', tag: '00', cipher: '' }))
    ).toThrow();
    expect(() =>
      decryptString(JSON.stringify({ alg: 'aes-256-gcm', v: 2, iv: '00', tag: '00', cipher: '' }))
    ).toThrow();
  });

  it('derives a key via scrypt for non-hex passphrases (still round-trips)', () => {
    process.env.BACKUP_ENCRYPTION_KEY = 'a human friendly passphrase';
    expect(decryptString(encryptString('via scrypt'))).toBe('via scrypt');
    process.env.BACKUP_ENCRYPTION_KEY = KEY_A;
  });

  it('looksEncrypted distinguishes blobs from plaintext/JSON', () => {
    expect(looksEncrypted(encryptString('x'))).toBe(true);
    expect(looksEncrypted('just text')).toBe(false);
    expect(looksEncrypted(JSON.stringify({ hello: 'world' }))).toBe(false);
  });

  it('isEncryptionConfigured reflects env presence', () => {
    expect(isEncryptionConfigured()).toBe(true);
    const saved = process.env.BACKUP_ENCRYPTION_KEY;
    delete process.env.BACKUP_ENCRYPTION_KEY;
    expect(isEncryptionConfigured()).toBe(false);
    process.env.BACKUP_ENCRYPTION_KEY = saved;
  });
});
