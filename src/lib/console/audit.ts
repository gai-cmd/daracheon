// Console audit log (SPEC-CONSOLE-001 REQ-CON-018, design.md §5.2).
// A document of its own (console-audit-log, up to 5,000 entries) so credential views never push
// entries out of the site audit-log's 2,000-entry window. Entries hold field names and reason codes
// only — never a credential value, ciphertext, session token or OAuth code.

import { readDataForWrite, readDataUncached, writeDataMerged } from '@/lib/db';
import { CONSOLE_DOCS, type ConsoleAuditEntry } from './types';

export const CONSOLE_AUDIT_MAX_ENTRIES = 5000;

export type ConsoleAuditInput = Omit<ConsoleAuditEntry, 'id' | 'at' | 'module'>;

function newAuditId(now: number): string {
  return `ca-${now.toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Appends one entry: fresh read -> push -> trim the oldest beyond the cap -> merged write with the
 * trimmed ids as removedIds (otherwise writeDataMerged would revive them). Throws on failure so the
 * caller can fail closed (a credential is never revealed without its audit entry).
 */
export async function appendConsoleAudit(input: ConsoleAuditInput): Promise<ConsoleAuditEntry> {
  const now = Date.now();
  const entry: ConsoleAuditEntry = {
    id: newAuditId(now),
    at: new Date(now).toISOString(),
    actor: input.actor,
    actorRole: input.actorRole,
    module: 'console',
    action: input.action,
    ...(input.targetId ? { targetId: input.targetId } : {}),
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.meta ? { meta: input.meta } : {}),
  };
  const entries = await readDataForWrite<ConsoleAuditEntry>(CONSOLE_DOCS.audit);
  entries.push(entry);
  const trimmed =
    entries.length > CONSOLE_AUDIT_MAX_ENTRIES ? entries.splice(0, entries.length - CONSOLE_AUDIT_MAX_ENTRIES) : [];
  await writeDataMerged(CONSOLE_DOCS.audit, entries, { removedIds: trimmed.map((e) => e.id) });
  return entry;
}

/** Number of credential.view / credential.copy entries by this user within the window. */
export async function countRecentCredentialReveals(email: string, opts: { windowMs: number }): Promise<number> {
  const since = Date.now() - opts.windowMs;
  const me = email.trim().toLowerCase();
  const entries = await readDataForWrite<ConsoleAuditEntry>(CONSOLE_DOCS.audit);
  return entries.filter(
    (e) =>
      (e.action === 'credential.view' || e.action === 'credential.copy') &&
      typeof e.actor === 'string' &&
      e.actor.toLowerCase() === me &&
      Date.parse(e.at) > since
  ).length;
}

/** Most recent entries first. */
export async function readRecentConsoleAudit(limit = 200): Promise<ConsoleAuditEntry[]> {
  const entries = await readDataUncached<ConsoleAuditEntry>(CONSOLE_DOCS.audit);
  return entries.slice(-limit).reverse();
}
