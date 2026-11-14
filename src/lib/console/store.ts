// Read helpers and credential-record updates shared by the console API routes
// (SPEC-CONSOLE-001 design.md §3, §5). Node runtime only.

import { readDataForWrite, readDataUncached, readSingleUncached, writeDataMerged } from '@/lib/db';
import { appendConsoleAudit, type ConsoleAuditInput } from './audit';
import { WIKI_CATEGORY, normalizeStoredCategory } from './categories';
import { sealField } from './vault';
import { CONSOLE_DOCS, type ConsoleCategory, type ConsoleItem, type ConsoleSecretRecord, type ConsoleSettings } from './types';

/** Upper bounds of credential values accepted from a form (never stored in clear). */
const LOGIN_ID_MAX = 200;
const PASSWORD_MAX = 500;

/** Stored regular categories (kind filled with 'resource'; invalid or `wiki` entries dropped). */
export async function readRegularCategories(): Promise<ConsoleCategory[]> {
  const raw = await readDataUncached<unknown>(CONSOLE_DOCS.categories);
  return raw.map(normalizeStoredCategory).filter((c): c is ConsoleCategory => c !== null);
}

/** Category list sent to the browser: the built-in wiki first, then the regular categories. */
export function withWiki(regular: readonly ConsoleCategory[]): ConsoleCategory[] {
  return [{ ...WIKI_CATEGORY }, ...regular];
}

export async function readSettings(): Promise<ConsoleSettings> {
  const s = await readSingleUncached<Partial<ConsoleSettings>>(CONSOLE_DOCS.settings);
  const pins = Array.isArray(s?.teamPins) ? s!.teamPins.filter((p): p is string => typeof p === 'string') : [];
  return { teamPins: pins };
}

export function newConsoleItemId(now = Date.now()): string {
  return `item-${now.toString(36)}${crypto.randomUUID().replace(/-/g, '').slice(0, 6)}`;
}

/** Audit entry for an action that already happened: a failed write is logged, not surfaced. */
export async function auditAfterWrite(input: ConsoleAuditInput): Promise<void> {
  try {
    await appendConsoleAudit(input);
  } catch (err) {
    console.error(`[console] audit ${input.action} failed:`, err instanceof Error ? err.message : 'unknown');
  }
}

export function presenceOf(record: ConsoleSecretRecord | undefined) {
  return { hasLoginId: !!record?.login_id, hasPassword: !!record?.password };
}

export interface CredentialPatch {
  login_id?: string;
  password?: string;
  clearPassword?: boolean;
}

/**
 * Credential fields of a create/edit body. An empty field means "keep the stored value".
 * Returns null when a field has the wrong type or is too long.
 */
export function parseCredentialPatch(body: Record<string, unknown>): CredentialPatch | null {
  const out: CredentialPatch = {};
  const { login_id, password, clearPassword } = body;
  if (login_id !== undefined && login_id !== null) {
    if (typeof login_id !== 'string' || login_id.length > LOGIN_ID_MAX) return null;
    if (login_id.trim()) out.login_id = login_id.trim();
  }
  if (password !== undefined && password !== null) {
    if (typeof password !== 'string' || password.length > PASSWORD_MAX) return null;
    if (password) out.password = password;
  }
  if (clearPassword !== undefined && typeof clearPassword !== 'boolean') return null;
  if (clearPassword) out.clearPassword = true;
  return out;
}

export type SecretChange =
  | { kind: 'none' }
  | { kind: 'remove' }
  | { kind: 'upsert'; record: ConsoleSecretRecord }
  | { kind: 'no_key' };

/**
 * Decides what happens to an item's secret record after a create or edit.
 * Not a shared account -> the record is removed. New values -> sealed (needs the vault key).
 * clearPassword drops the password; a record left with no field is removed.
 */
export function planSecretChange(args: {
  item: Pick<ConsoleItem, 'id' | 'access_method'>;
  current: ConsoleSecretRecord | undefined;
  patch: CredentialPatch;
  key: Buffer | null;
  now: string;
  by: string;
}): SecretChange {
  const { item, current, patch, key } = args;
  if (item.access_method !== 'shared-credential') return current ? { kind: 'remove' } : { kind: 'none' };
  const sealsNew = !!(patch.login_id || patch.password);
  if (!sealsNew && !patch.clearPassword) return { kind: 'none' };
  if (sealsNew && !key) return { kind: 'no_key' };

  const record: ConsoleSecretRecord = { itemId: item.id, updatedAt: args.now, updatedBy: args.by };
  if (current?.login_id) record.login_id = current.login_id;
  if (current?.password) record.password = current.password;
  if (patch.login_id) record.login_id = sealField(key!, item.id, 'login_id', patch.login_id);
  if (patch.password) record.password = sealField(key!, item.id, 'password', patch.password);
  else if (patch.clearPassword) delete record.password;

  if (!record.login_id && !record.password) return current ? { kind: 'remove' } : { kind: 'none' };
  return { kind: 'upsert', record };
}

/** Writes a planned secret change. A removal passes the item id as removedIds (design §5.4). */
export async function applySecretChange(itemId: string, change: SecretChange): Promise<void> {
  if (change.kind !== 'remove' && change.kind !== 'upsert') return;
  const secrets = await readDataForWrite<ConsoleSecretRecord>(CONSOLE_DOCS.secrets);
  const others = secrets.filter((s) => s.itemId !== itemId);
  if (change.kind === 'remove') {
    await writeDataMerged(CONSOLE_DOCS.secrets, others, { removedIds: [itemId] });
  } else {
    await writeDataMerged(CONSOLE_DOCS.secrets, [...others, change.record]);
  }
}
