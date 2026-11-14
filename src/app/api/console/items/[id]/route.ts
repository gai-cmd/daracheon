import { readDataForWrite, readDataUncached, writeDataMerged } from '@/lib/db';
import { knownCategoryIds } from '@/lib/console/categories';
import { authorizeConsole, consoleJson, readJsonObject } from '@/lib/console/http';
import { canEdit, ownerChangeAllowed, toListItem } from '@/lib/console/permissions';
import {
  applySecretChange,
  auditAfterWrite,
  parseCredentialPatch,
  planSecretChange,
  presenceOf,
  readRegularCategories,
} from '@/lib/console/store';
import { validateItemFields } from '@/lib/console/validate';
import { getVaultKey } from '@/lib/console/vault';
import { CONSOLE_DOCS, type ConsoleItem, type ConsoleSecretRecord } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// Edits an item (SPEC-CONSOLE-001 REQ-CON-010/012/013/014). Owners and console admins only.
// `version` is required; a stale version answers 409 instead of overwriting newer content.
// An empty password field keeps the stored one; `clearPassword: true` removes it; switching away
// from a shared account removes the secret record.
export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorizeConsole(request, { stateChange: 'json' });
  if (!auth.ok) return auth.response;
  const { user, displayName, actorRole } = auth.ctx;

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  if (typeof body.version !== 'number' || !Number.isInteger(body.version)) {
    return consoleJson({ error: 'invalid', errors: [{ field: 'version', reason: 'required' }] }, 400);
  }

  const { id } = await params;
  try {
    const items = await readDataForWrite<ConsoleItem>(CONSOLE_DOCS.items);
    const current = items.find((i) => i.id === id && !i.deletedAt);
    if (!current) return consoleJson({ error: 'not_found' }, 404);
    if (!canEdit(user, current)) return consoleJson({ error: 'forbidden' }, 403);

    const secrets = await readDataUncached<ConsoleSecretRecord>(CONSOLE_DOCS.secrets);
    const currentSecret = secrets.find((s) => s.itemId === id);
    if (body.version !== current.version) {
      return consoleJson({ error: 'conflict', item: toListItem(user, current, presenceOf(currentSecret)) }, 409);
    }

    const categories = await readRegularCategories();
    const v = validateItemFields(body, { categoryIds: knownCategoryIds(categories) });
    if (!v.ok) return consoleJson({ error: 'invalid', errors: v.errors }, 400);
    // Self-lockout guard: a non-admin cannot save an owner list without themselves.
    if (!ownerChangeAllowed(user, v.value.owners)) {
      return consoleJson({ error: 'invalid', errors: [{ field: 'owners', reason: 'self_removal' }] }, 400);
    }
    const cred = parseCredentialPatch(body);
    if (!cred) return consoleJson({ error: 'invalid', errors: [{ field: 'credential', reason: 'format' }] }, 400);

    const now = new Date(Date.now()).toISOString();
    // Spread the stored record first so db record metadata survives for the merged write.
    const updated: ConsoleItem = { ...current, ...v.value, id, version: current.version + 1, updatedAt: now, updatedBy: displayName };
    const change = planSecretChange({ item: updated, current: currentSecret, patch: cred, key: getVaultKey(), now, by: displayName });
    if (change.kind === 'no_key') return consoleJson({ error: 'credentials_not_configured' }, 503);

    await writeDataMerged(
      CONSOLE_DOCS.items,
      items.map((i) => (i.id === id ? updated : i))
    );
    await applySecretChange(id, change);

    await auditAfterWrite({
      actor: user.email,
      actorRole,
      action: 'item.update',
      targetId: id,
      meta: { version: updated.version, credential: change.kind },
    });
    const after = change.kind === 'upsert' ? change.record : change.kind === 'remove' ? undefined : currentSecret;
    return consoleJson({ item: toListItem(user, updated, presenceOf(after)) });
  } catch (err) {
    console.error('[console items] update failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}

// Soft-deletes an item (REQ-CON-011). The item stays stored with deletedAt so undo can restore it;
// its secret record is kept for the same reason.
export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await authorizeConsole(request, { stateChange: 'origin' });
  if (!auth.ok) return auth.response;
  const { user, actorRole } = auth.ctx;

  const { id } = await params;
  try {
    const items = await readDataForWrite<ConsoleItem>(CONSOLE_DOCS.items);
    const current = items.find((i) => i.id === id && !i.deletedAt);
    if (!current) return consoleJson({ error: 'not_found' }, 404);
    if (!canEdit(user, current)) return consoleJson({ error: 'forbidden' }, 403);

    const deleted: ConsoleItem = {
      ...current,
      version: current.version + 1,
      deletedAt: new Date(Date.now()).toISOString(),
      deletedBy: user.email,
    };
    await writeDataMerged(
      CONSOLE_DOCS.items,
      items.map((i) => (i.id === id ? deleted : i))
    );
    await auditAfterWrite({ actor: user.email, actorRole, action: 'item.delete', targetId: id });
    return consoleJson({ ok: true, id });
  } catch (err) {
    console.error('[console items] delete failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
