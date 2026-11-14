import { readDataForWrite, readDataUncached, writeDataMerged } from '@/lib/db';
import { authorizeConsole, consoleJson } from '@/lib/console/http';
import { canEdit, toListItem } from '@/lib/console/permissions';
import { auditAfterWrite, presenceOf } from '@/lib/console/store';
import { CONSOLE_DOCS, type ConsoleItem, type ConsoleSecretRecord } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Undo of a soft delete (SPEC-CONSOLE-001 REQ-CON-011). Permission is judged on the item as it was
// deleted (owners do not change on delete). The secret record was never removed, so the stored
// credential comes back with the item.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeConsole(request, { stateChange: 'json' });
  if (!auth.ok) return auth.response;
  const { user, displayName, actorRole } = auth.ctx;

  const { id } = await params;
  try {
    const items = await readDataForWrite<ConsoleItem>(CONSOLE_DOCS.items);
    const current = items.find((i) => i.id === id);
    if (!current) return consoleJson({ error: 'not_found' }, 404);
    if (!current.deletedAt) return consoleJson({ error: 'not_deleted' }, 409);
    if (!canEdit(user, current)) return consoleJson({ error: 'forbidden' }, 403);

    const { deletedAt: _deletedAt, deletedBy: _deletedBy, ...rest } = current;
    const restored: ConsoleItem = {
      ...rest,
      version: current.version + 1,
      updatedAt: new Date(Date.now()).toISOString(),
      updatedBy: displayName,
    };
    await writeDataMerged(
      CONSOLE_DOCS.items,
      items.map((i) => (i.id === id ? restored : i))
    );
    await auditAfterWrite({ actor: user.email, actorRole, action: 'item.restore', targetId: id });

    const secrets = await readDataUncached<ConsoleSecretRecord>(CONSOLE_DOCS.secrets);
    return consoleJson({ item: toListItem(user, restored, presenceOf(secrets.find((s) => s.itemId === id))) });
  } catch (err) {
    console.error('[console items] restore failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
