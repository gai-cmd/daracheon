import { readDataForWrite, writeDataMerged } from '@/lib/db';
import { checkCategoryInput } from '@/lib/console/categories';
import { authorizeConsole, consoleJson, readJsonObject } from '@/lib/console/http';
import { auditAfterWrite } from '@/lib/console/store';
import { CONSOLE_DOCS } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Adds a regular category (SPEC-CONSOLE-001 REQ-CON-019/026). Console admins only. The id `wiki`
// and the kind `knowledge` are refused: the built-in wiki is the only knowledge category.
export async function POST(request: Request) {
  const auth = await authorizeConsole(request, { stateChange: 'json', admin: true });
  if (!auth.ok) return auth.response;
  const { user, actorRole } = auth.ctx;

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const check = checkCategoryInput(parsed.body, 'create');
  if (check.status !== 'ok') {
    return consoleJson({ error: 'invalid', errors: [{ field: 'category', reason: check.status === 'error' ? check.reason : 'reserved_id' }] }, 400);
  }

  try {
    const stored = await readDataForWrite<{ id?: unknown }>(CONSOLE_DOCS.categories);
    if (stored.some((c) => c?.id === check.category.id)) return consoleJson({ error: 'exists' }, 409);
    await writeDataMerged(CONSOLE_DOCS.categories, [...stored, check.category]);
    await auditAfterWrite({ actor: user.email, actorRole, action: 'category.create', targetId: check.category.id });
    return consoleJson({ category: check.category }, 201);
  } catch (err) {
    console.error('[console categories] create failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
