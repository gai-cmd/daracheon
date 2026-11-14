// Console environment checks (SPEC-CONSOLE-001 design.md §4.1). Edge-runtime safe: the
// middleware imports this module, so it must not use Node built-ins.
//
//   CONSOLE_SESSION_SECRET          signs console session cookies. Invalid -> the whole console
//                                   is closed (fail closed, never a fallback secret).
//   CONSOLE_SECRETS_KEY             64 hex chars, the AES-256-GCM key of the credential vault.
//                                   Invalid -> only the credential feature is closed.
//   CONSOLE_ADMIN_EMAILS            comma separated @try-n.com addresses with console-admin rights.
//   CONSOLE_SESSION_MAX_AGE_HOURS   optional integer 1..168, default 12.
//
// Peer secrets are read only to make sure the console never shares a key with them.

type Env = Record<string, string | undefined>;

/** The only Workspace domain admitted to the console (not read from WORKSHOP_OPEN_DOMAINS). */
export const CONSOLE_DOMAIN = 'try-n.com';
export const MIN_CONSOLE_SESSION_SECRET_LENGTH = 32;
export const DEFAULT_CONSOLE_SESSION_HOURS = 12;
export const MAX_CONSOLE_SESSION_HOURS = 168;

/** Secrets the console keys must differ from (compared only when set). */
const PEER_SECRET_VARS = [
  'ADMIN_SESSION_SECRET',
  'WORKSHOP_SSO_SECRET',
  'PARTNER_SESSION_SECRET',
  'SERIAL_SCAN_SECRET',
  'QR_TRACK_SECRET',
  'BACKUP_ENCRYPTION_KEY',
] as const;

/** Length-independent comparison of two strings (no early exit on the first difference). */
function sameSecret(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function equalsAnySet(value: string, env: Env, names: readonly string[]): string | null {
  for (const name of names) {
    const other = env[name]?.trim();
    if (other && sameSecret(value, other)) return name;
  }
  return null;
}

// @MX:ANCHOR: [AUTO] Fail-closed source of the console signing secret.
// @MX:REASON: session minting/verification, the middleware gate, the start route and the callback
// all depend on it; a fallback here would let console tokens be signed with a shared secret.
/** Signing secret for console sessions (trimmed), or null when the console must stay closed. */
export function getConsoleSessionSecret(env: Env = process.env): string | null {
  const value = env.CONSOLE_SESSION_SECRET?.trim();
  let problem: string | null = null;
  if (!value) problem = 'is unset or blank';
  else if (value.length < MIN_CONSOLE_SESSION_SECRET_LENGTH)
    problem = `is shorter than ${MIN_CONSOLE_SESSION_SECRET_LENGTH} characters`;
  else {
    const clash = equalsAnySet(value, env, [...PEER_SECRET_VARS, 'CONSOLE_SECRETS_KEY']);
    if (clash) problem = `equals ${clash}`;
  }
  if (problem) {
    // Only a set-but-refused value is worth logging; the reason is logged, the value never.
    if (env.CONSOLE_SESSION_SECRET !== undefined) {
      console.error(`[console] CONSOLE_SESSION_SECRET ${problem}; the console is closed`);
    }
    return null;
  }
  return value!;
}

export function isConsoleConfigured(env: Env = process.env): boolean {
  return getConsoleSessionSecret(env) !== null;
}

/** The vault key as 64 lower-case hex characters, or null when the credential feature is closed. */
export function getConsoleSecretsKeyHex(env: Env = process.env): string | null {
  const value = env.CONSOLE_SECRETS_KEY?.trim().toLowerCase();
  let problem: string | null = null;
  if (!value) problem = 'is unset or blank';
  else if (!/^[0-9a-f]{64}$/.test(value)) problem = 'is not 64 hex characters';
  else {
    const clash = equalsAnySet(value, env, [...PEER_SECRET_VARS, 'CONSOLE_SESSION_SECRET']);
    if (clash) problem = `equals ${clash}`;
  }
  if (problem) {
    if (env.CONSOLE_SECRETS_KEY !== undefined) {
      console.error(`[console] CONSOLE_SECRETS_KEY ${problem}; shared credentials are disabled`);
    }
    return null;
  }
  return value!;
}

/** True for an address of exactly the console domain: one "@", non-empty local part, no spaces. */
export function isConsoleDomainEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const lower = email.toLowerCase();
  const at = lower.indexOf('@');
  if (at <= 0 || at !== lower.lastIndexOf('@') || /\s/.test(lower)) return false;
  return lower.slice(at + 1) === CONSOLE_DOMAIN;
}

/** Console admins from CONSOLE_ADMIN_EMAILS, re-read on every call (never cached or stored). */
export function getConsoleAdminEmails(env: Env = process.env): string[] {
  const raw = env.CONSOLE_ADMIN_EMAILS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && isConsoleDomainEmail(s));
}

export function isConsoleAdminEmail(email: string, env: Env = process.env): boolean {
  return getConsoleAdminEmails(env).includes(email.trim().toLowerCase());
}

export function getConsoleSessionMaxAgeSeconds(env: Env = process.env): number {
  const raw = env.CONSOLE_SESSION_MAX_AGE_HOURS?.trim();
  const hours = raw && /^\d+$/.test(raw) ? Number(raw) : NaN;
  const valid = Number.isInteger(hours) && hours >= 1 && hours <= MAX_CONSOLE_SESSION_HOURS;
  return (valid ? hours : DEFAULT_CONSOLE_SESSION_HOURS) * 3600;
}
