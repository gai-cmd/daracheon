import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getVaultKey, openField, sealField } from '../vault';

// SPEC-CONSOLE-001 REQ-CON-014 / AC-CON-008. Canary values only, never a real secret.

const PW = 'canary-Pw-7f3e';
const ID = 'canary-id-91ab';
const KEY_HEX = '0123456789abcdef'.repeat(4);
const OTHER_KEY_HEX = 'fedcba9876543210'.repeat(4);
const key = Buffer.from(KEY_HEX, 'hex');

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

function flipFirstByte(b64: string): string {
  const buf = Buffer.from(b64, 'base64url');
  buf[0] ^= 0x01;
  return buf.toString('base64url');
}

describe('sealField / openField', () => {
  it('(a) round-trips with the same key, item and field', () => {
    const sealed = sealField(key, 'item-a', 'password', PW);
    expect(sealed).toMatchObject({ v: 1, kv: 1 });
    expect(openField(key, 'item-a', 'password', sealed)).toBe(PW);
  });

  it('stores no plaintext and uses a fresh IV every time', () => {
    const one = sealField(key, 'item-a', 'login_id', ID);
    const two = sealField(key, 'item-a', 'login_id', ID);
    expect(JSON.stringify(one)).not.toContain(ID);
    expect(one.iv).not.toBe(two.iv);
    expect(one.ct).not.toBe(two.ct);
    expect(Buffer.from(one.iv, 'base64url')).toHaveLength(12);
  });

  it('(b) fails on a one-byte change of the ciphertext or the tag', () => {
    const sealed = sealField(key, 'item-a', 'password', PW);
    expect(() => openField(key, 'item-a', 'password', { ...sealed, ct: flipFirstByte(sealed.ct) })).toThrow();
    expect(() => openField(key, 'item-a', 'password', { ...sealed, tag: flipFirstByte(sealed.tag) })).toThrow();
  });

  it('(c) fails when the ciphertext is moved to another item', () => {
    const sealed = sealField(key, 'item-a', 'password', PW);
    expect(() => openField(key, 'item-b', 'password', sealed)).toThrow();
  });

  it('(d) fails when the password ciphertext is moved to the login_id slot', () => {
    const sealed = sealField(key, 'item-a', 'password', PW);
    expect(() => openField(key, 'item-a', 'login_id', sealed)).toThrow();
  });

  it('(e) fails with another key, and the error carries no key or ciphertext material', () => {
    const sealed = sealField(key, 'item-a', 'password', PW);
    let message = '';
    try {
      openField(Buffer.from(OTHER_KEY_HEX, 'hex'), 'item-a', 'password', sealed);
    } catch (err) {
      message = String(err instanceof Error ? err.message : err);
    }
    expect(message).toBeTruthy();
    for (const s of [KEY_HEX, OTHER_KEY_HEX, sealed.ct, sealed.tag, sealed.iv, PW]) expect(message).not.toContain(s);
  });

  it('rejects an unknown record version or malformed fields', () => {
    const sealed = sealField(key, 'item-a', 'password', PW);
    expect(() => openField(key, 'item-a', 'password', { ...sealed, v: 2 as 1 })).toThrow();
    expect(() => openField(key, 'item-a', 'password', { ...sealed, iv: 'short' })).toThrow();
  });

  it('refuses a key that is not 32 bytes', () => {
    expect(() => sealField(Buffer.alloc(16), 'item-a', 'password', PW)).toThrow();
  });
});

describe('getVaultKey', () => {
  it('returns a 32-byte key from a valid CONSOLE_SECRETS_KEY', () => {
    expect(getVaultKey({ CONSOLE_SECRETS_KEY: KEY_HEX })?.length).toBe(32);
  });

  it('returns null (credential feature closed) for an invalid key', () => {
    expect(getVaultKey({})).toBeNull();
    expect(getVaultKey({ CONSOLE_SECRETS_KEY: 'passphrase' })).toBeNull();
    expect(getVaultKey({ CONSOLE_SECRETS_KEY: KEY_HEX, CONSOLE_SESSION_SECRET: KEY_HEX })).toBeNull();
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(KEY_HEX);
  });
});
