import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CONSOLE_DOMAIN,
  getConsoleAdminEmails,
  getConsoleSecretsKeyHex,
  getConsoleSessionMaxAgeSeconds,
  getConsoleSessionSecret,
  isConsoleAdminEmail,
  isConsoleConfigured,
  isConsoleDomainEmail,
} from '../config';

// SPEC-CONSOLE-001 REQ-CON-005 / REQ-CON-007 / AC-CON-004. All secrets below are synthetic.

const PEERS = {
  ADMIN_SESSION_SECRET: 'unit-admin-session-secret-aaaaaaaaaaaaaaaa',
  WORKSHOP_SSO_SECRET: 'unit-workshop-sso-secret-bbbbbbbbbbbbbbbbbb',
  PARTNER_SESSION_SECRET: 'unit-partner-session-secret-cccccccccccccc',
  SERIAL_SCAN_SECRET: 'unit-serial-scan-secret-dddddddddddddddddd',
  QR_TRACK_SECRET: 'unit-qr-track-secret-eeeeeeeeeeeeeeeeeeeeeee',
  BACKUP_ENCRYPTION_KEY: 'unit-backup-encryption-key-ffffffffffffff',
  CONSOLE_SECRETS_KEY: 'a'.repeat(64),
};
const GOOD_SESSION_SECRET = 'unit-console-session-secret-0123456789abcdef';

function envWith(overrides: Record<string, string | undefined>): Record<string, string | undefined> {
  return { ...PEERS, CONSOLE_SESSION_SECRET: GOOD_SESSION_SECRET, ...overrides };
}

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

function loggedText(): string {
  return errorSpy.mock.calls.map((c: unknown[]) => c.map(String).join(' ')).join('\n');
}

describe('getConsoleSessionSecret (fail closed)', () => {
  it('returns the trimmed secret when it is long enough and unique', () => {
    expect(getConsoleSessionSecret(envWith({ CONSOLE_SESSION_SECRET: `  ${GOOD_SESSION_SECRET}\n` }))).toBe(
      GOOD_SESSION_SECRET
    );
    expect(isConsoleConfigured(envWith({}))).toBe(true);
  });

  it.each([
    ['(a) unset', undefined],
    ['(b) blank', '      '],
    ['(c) 31 characters', 'x'.repeat(31)],
    ['(d) equal to ADMIN_SESSION_SECRET', PEERS.ADMIN_SESSION_SECRET],
    ['(e) equal to WORKSHOP_SSO_SECRET', PEERS.WORKSHOP_SSO_SECRET],
    ['(f) equal to CONSOLE_SECRETS_KEY', PEERS.CONSOLE_SECRETS_KEY],
    ['(g) equal to PARTNER_SESSION_SECRET', PEERS.PARTNER_SESSION_SECRET],
    ['(h) equal to BACKUP_ENCRYPTION_KEY', PEERS.BACKUP_ENCRYPTION_KEY],
    ['(i) equal to SERIAL_SCAN_SECRET', PEERS.SERIAL_SCAN_SECRET],
    ['(j) equal to QR_TRACK_SECRET', PEERS.QR_TRACK_SECRET],
    ['equal to a peer apart from surrounding whitespace', `\t${PEERS.ADMIN_SESSION_SECRET} \n`],
  ])('%s -> null, never a fallback', (_label, value) => {
    const env = envWith({ CONSOLE_SESSION_SECRET: value });
    expect(getConsoleSessionSecret(env)).toBeNull();
    expect(isConsoleConfigured(env)).toBe(false);
    // Reasons may be logged, values never.
    for (const v of Object.values(PEERS)) expect(loggedText()).not.toContain(v);
    if (value && value.trim()) expect(loggedText()).not.toContain(value.trim());
  });

  it('ignores unset peers in the comparison', () => {
    expect(getConsoleSessionSecret({ CONSOLE_SESSION_SECRET: GOOD_SESSION_SECRET })).toBe(GOOD_SESSION_SECRET);
  });
});

describe('getConsoleSecretsKeyHex', () => {
  it('accepts exactly 64 hex characters (trimmed, lower-cased)', () => {
    const key = 'AbCdEf0123456789'.repeat(4);
    expect(getConsoleSecretsKeyHex(envWith({ CONSOLE_SECRETS_KEY: ` ${key} ` }))).toBe(key.toLowerCase());
  });

  it.each([
    ['unset', undefined],
    ['63 hex characters', 'a'.repeat(63)],
    ['65 hex characters', 'a'.repeat(65)],
    ['not hex', 'g'.repeat(64)],
    ['a passphrase', 'correct horse battery staple correct horse battery staple 0000'],
  ])('%s -> null', (_label, value) => {
    expect(getConsoleSecretsKeyHex(envWith({ CONSOLE_SECRETS_KEY: value }))).toBeNull();
  });

  it('refuses a key equal to the console session secret or a peer secret', () => {
    const hex = 'b'.repeat(64);
    expect(getConsoleSecretsKeyHex(envWith({ CONSOLE_SECRETS_KEY: hex, CONSOLE_SESSION_SECRET: hex }))).toBeNull();
    expect(getConsoleSecretsKeyHex(envWith({ CONSOLE_SECRETS_KEY: hex, BACKUP_ENCRYPTION_KEY: hex }))).toBeNull();
    expect(getConsoleSecretsKeyHex(envWith({ CONSOLE_SECRETS_KEY: hex, ADMIN_SESSION_SECRET: hex }))).toBeNull();
    expect(loggedText()).not.toContain(hex);
  });
});

describe('console admin allow-list (REQ-CON-007)', () => {
  it('keeps only exact try-n.com addresses, trimmed and lower-cased', () => {
    const env = {
      CONSOLE_ADMIN_EMAILS: ' Adm@Try-N.com , other@try-n.com,x@try-n.com.evil.io, y@mail.try-n.com,, bad , a@b@try-n.com',
    };
    expect(getConsoleAdminEmails(env)).toEqual(['adm@try-n.com', 'other@try-n.com']);
    expect(isConsoleAdminEmail('ADM@try-n.com', env)).toBe(true);
    expect(isConsoleAdminEmail('x@try-n.com.evil.io', env)).toBe(false);
  });

  it('has no admins when unset', () => {
    expect(getConsoleAdminEmails({})).toEqual([]);
    expect(isConsoleAdminEmail('adm@try-n.com', {})).toBe(false);
  });
});

describe('isConsoleDomainEmail', () => {
  it.each([
    ['x@try-n.com', true],
    ['X@TRY-N.COM', true],
    ['x@try-n.com.evil.io', false],
    ['x@mail.try-n.com', false],
    ['x@evil-try-n.com', false],
    ['x@try-n.co', false],
    ['a@b@try-n.com', false],
    ['@try-n.com', false],
    ['x y@try-n.com', false],
    ['', false],
  ])('%s -> %s', (email, ok) => {
    expect(isConsoleDomainEmail(email)).toBe(ok);
  });

  it('pins the console domain to try-n.com', () => {
    expect(CONSOLE_DOMAIN).toBe('try-n.com');
  });
});

describe('getConsoleSessionMaxAgeSeconds', () => {
  it.each([
    [undefined, 12],
    ['1', 1],
    ['168', 168],
    ['24', 24],
    ['0', 12],
    ['169', 12],
    ['2.5', 12],
    ['abc', 12],
    ['', 12],
  ])('CONSOLE_SESSION_MAX_AGE_HOURS=%s -> %s hours', (value, hours) => {
    expect(getConsoleSessionMaxAgeSeconds({ CONSOLE_SESSION_MAX_AGE_HOURS: value })).toBe(hours * 3600);
  });
});
