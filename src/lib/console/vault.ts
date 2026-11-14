// Shared-credential vault (SPEC-CONSOLE-001 REQ-CON-014, design.md §3.3). Node runtime only.
//
// AES-256-GCM with a fresh 12-byte IV per field. The additional authenticated data binds every
// ciphertext to its item and field ("console:v1:<itemId>:<field>"), so moving a ciphertext to
// another item or into the other field makes decryption fail. Errors never carry key, IV, tag,
// ciphertext or plaintext.

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getConsoleSecretsKeyHex } from './config';
import type { ConsoleCredentialField, SealedField } from './types';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_VERSION = 1;

export class VaultError extends Error {
  constructor(reason: 'bad_key' | 'bad_record' | 'decrypt_failed') {
    super(`console vault: ${reason}`);
    this.name = 'VaultError';
  }
}

/** The vault key from CONSOLE_SECRETS_KEY, or null when the credential feature must stay closed. */
export function getVaultKey(env: Record<string, string | undefined> = process.env): Buffer | null {
  const hex = getConsoleSecretsKeyHex(env);
  return hex ? Buffer.from(hex, 'hex') : null;
}

function aad(itemId: string, field: ConsoleCredentialField): Buffer {
  return Buffer.from(`console:v1:${itemId}:${field}`, 'utf8');
}

function checkKey(key: Buffer) {
  if (!Buffer.isBuffer(key) || key.length !== KEY_BYTES) throw new VaultError('bad_key');
}

export function sealField(key: Buffer, itemId: string, field: ConsoleCredentialField, plaintext: string): SealedField {
  checkKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(aad(itemId, field));
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    v: 1,
    kv: KEY_VERSION,
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url'),
    ct: ct.toString('base64url'),
  };
}

export function openField(key: Buffer, itemId: string, field: ConsoleCredentialField, sealed: SealedField): string {
  checkKey(key);
  if (!sealed || sealed.v !== 1 || sealed.kv !== KEY_VERSION) throw new VaultError('bad_record');
  const iv = Buffer.from(String(sealed.iv), 'base64url');
  const tag = Buffer.from(String(sealed.tag), 'base64url');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new VaultError('bad_record');
  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(aad(itemId, field));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.from(String(sealed.ct), 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    throw new VaultError('decrypt_failed');
  }
}
