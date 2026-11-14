import { readDataForWrite, writeDataMerged } from '@/lib/db';
import { knownCategoryIds } from '@/lib/console/categories';
import { authorizeConsole, consoleJson, readJsonObject } from '@/lib/console/http';
import { toListItem } from '@/lib/console/permissions';
import {
  applySecretChange,
  auditAfterWrite,
  newConsoleItemId,
  parseCredentialPatch,
  planSecretChange,
  presenceOf,
  readRegularCategories,
} from '@/lib/console/store';
import { CONSOLE_LIMITS, validateItemFields } from '@/lib/console/validate';
import { getVaultKey } from '@/lib/console/vault';
import { CONSOLE_DOCS, type ConsoleItem } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Creates an item (SPEC-CONSOLE-001 REQ-CON-010/013/014, design.md §5). Any signed-in user may
// create one; the creator is always among the owners. Credential values of a shared account are
// sealed into console-secrets and never echoed back.
export async function POST(request: Request) {
  const auth = await authorizeConsole(request, { stateChange: 'json' });
  if (!auth.ok) return auth.response;
  const { user, displayName, actorRole } = auth.ctx;

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  try {
    const categories = await readRegularCategories();
    const v = validateItemFields(body, { categoryIds: knownCategoryIds(categories) });
    if (!v.ok) return consoleJson({ error: 'invalid', errors: v.errors }, 400);
    const cred = parseCredentialPatch(body);
    if (!cred) return consoleJson({ error: 'invalid', errors: [{ field: 'credential', reason: 'format' }] }, 400);

    const owners = v.value.owners.some((o) => o.email === user.email)
      ? v.value.owners
      : [{ name: displayName, email: user.email }, ...v.value.owners];
    if (owners.length > CONSOLE_LIMITS.owners) {
      return consoleJson({ error: 'invalid', errors: [{ field: 'owners', reason: 'too_many' }] }, 400);
    }

    const now = new Date(Date.now()).toISOString();
    const created: ConsoleItem = {
      id: newConsoleItemId(),
      ...v.value,
      owners,
      version: 1,
      updatedAt: now,
      updatedBy: displayName,
    };

    const change = planSecretChange({ item: created, current: undefined, patch: cred, key: getVaultKey(), now, by: displayName });
    if (change.kind === 'no_key') return consoleJson({ error: 'credentials_not_configured' }, 503);

    const items = await readDataForWrite<ConsoleItem>(CONSOLE_DOCS.items);
    if (items.length >= CONSOLE_LIMITS.items) return consoleJson({ error: 'too_many_items' }, 400);
    await writeDataMerged(CONSOLE_DOCS.items, [...items, created]);
    await applySecretChange(created.id, change);

    await auditAfterWrite({
      actor: user.email,
      actorRole,
      action: 'item.create',
      targetId: created.id,
      meta: { category: created.category, credential: change.kind === 'upsert' },
    });
    const presence = presenceOf(change.kind === 'upsert' ? change.record : undefined);
    return consoleJson({ item: toListItem(user, created, presence) }, 201);
  } catch (err) {
    console.error('[console items] create failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
