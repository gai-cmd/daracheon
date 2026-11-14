import { readDataUncached } from '@/lib/db';
import { getConsoleAdminEmails } from '@/lib/console/config';
import { readConsoleSession } from '@/lib/console/session';
import { consoleJson, guardStateChange } from '@/lib/console/http';
import { credAccess, resolveConsoleUser } from '@/lib/console/permissions';
import { appendConsoleAudit, countRecentCredentialReveals } from '@/lib/console/audit';
import { getVaultKey, openField } from '@/lib/console/vault';
import {
  CONSOLE_CREDENTIAL_FIELDS,
  CONSOLE_DOCS,
  type ConsoleCredentialField,
  type ConsoleItem,
  type ConsolePerson,
  type ConsoleSecretRecord,
} from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Reveal cap per user (plan.md D11): 30 view/copy entries per 10 minutes. */
const REVEAL_LIMIT = 30;
const REVEAL_WINDOW_MS = 10 * 60 * 1000;

const PURPOSES = ['view', 'copy'] as const;
type Purpose = (typeof PURPOSES)[number];

// @MX:WARN: [AUTO] Returns decrypted credential values.
// @MX:REASON: the audit entry must be written before the value leaves; reordering these steps
// would reveal credentials without a trace (REQ-CON-016, AC-CON-016).
// Reveals one shared-credential field (SPEC-CONSOLE-001 REQ-CON-016, design.md §5.1):
// session + Origin -> item -> visibility check (denial audited) -> rate cap (audited) ->
// audit entry written FIRST (no entry, no value) -> decrypt -> { value }, never cached.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = guardStateChange(request);
  if (blocked) return blocked;

  const session = await readConsoleSession(request);
  if (!session) return consoleJson({ error: 'unauthorized' }, 401);

  const key = getVaultKey();
  if (!key) return consoleJson({ error: 'credentials_not_configured' }, 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return consoleJson({ error: 'invalid_body' }, 400);
  }
  const { field, purpose } = (body ?? {}) as { field?: unknown; purpose?: unknown };
  if (
    typeof field !== 'string' ||
    !(CONSOLE_CREDENTIAL_FIELDS as readonly string[]).includes(field) ||
    typeof purpose !== 'string' ||
    !(PURPOSES as readonly string[]).includes(purpose)
  ) {
    return consoleJson({ error: 'invalid_body' }, 400);
  }
  const credField = field as ConsoleCredentialField;

  const { id } = await params;
  try {
    const [items, people] = await Promise.all([
      readDataUncached<ConsoleItem>(CONSOLE_DOCS.items),
      readDataUncached<ConsolePerson>(CONSOLE_DOCS.people),
    ]);
    const item = items.find((i) => i.id === id && !i.deletedAt);
    if (!item) return consoleJson({ error: 'not_found' }, 404);

    // Admin rights are re-read from CONSOLE_ADMIN_EMAILS on every request (REQ-CON-007).
    const user = resolveConsoleUser(session, { adminEmails: getConsoleAdminEmails(), people });
    const actorRole = user.isAdmin ? 'console-admin' : 'console-member';
    const auditBase = { actor: user.email, actorRole, targetId: item.id, meta: { field: credField } } as const;

    if (credAccess(user, item) === 'denied') {
      try {
        await appendConsoleAudit({ ...auditBase, action: 'credential.deny' });
      } catch (err) {
        console.error('[console credential] deny audit failed:', err instanceof Error ? err.message : 'unknown');
      }
      return consoleJson({ error: 'forbidden' }, 403);
    }

    if ((await countRecentCredentialReveals(user.email, { windowMs: REVEAL_WINDOW_MS })) >= REVEAL_LIMIT) {
      try {
        await appendConsoleAudit({ ...auditBase, action: 'credential.rate_limited' });
      } catch (err) {
        console.error('[console credential] rate-limit audit failed:', err instanceof Error ? err.message : 'unknown');
      }
      return consoleJson({ error: 'rate_limited' }, 429);
    }

    if (item.access_method !== 'shared-credential') return consoleJson({ error: 'not_set' }, 404);
    const secrets = await readDataUncached<ConsoleSecretRecord>(CONSOLE_DOCS.secrets);
    const sealed = secrets.find((s) => s.itemId === item.id)?.[credField];
    if (!sealed) return consoleJson({ error: 'not_set' }, 404);

    try {
      await appendConsoleAudit({ ...auditBase, action: `credential.${purpose as Purpose}` });
    } catch (err) {
      console.error('[console credential] audit write failed, value withheld:', err instanceof Error ? err.message : 'unknown');
      return consoleJson({ error: 'audit_unavailable' }, 503);
    }

    let value: string;
    try {
      value = openField(key, item.id, credField, sealed);
    } catch (err) {
      // Reason code only — never key, ciphertext or value.
      console.error('[console credential] decrypt failed:', err instanceof Error ? err.message : 'unknown');
      return consoleJson({ error: 'decrypt_failed' }, 500);
    }
    return consoleJson({ value });
  } catch (err) {
    console.error('[console credential] error:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
