import { readDataForWrite, writeDataMerged } from '@/lib/db';
import { authorizeConsole, consoleJson, readJsonObject } from '@/lib/console/http';
import { auditAfterWrite } from '@/lib/console/store';
import { validatePersonFields } from '@/lib/console/validate';
import { CONSOLE_DOCS, type ConsolePerson } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PEOPLE = 500;

// Replaces the people directory (SPEC-CONSOLE-001 REQ-CON-019, design.md §3.4, §5.4). Console admins
// only. People absent from the new list are removed — their emails go to removedIds, otherwise the
// merged write would keep them. An `admin` flag in the body has no effect.
export async function PUT(request: Request) {
  const auth = await authorizeConsole(request, { stateChange: 'json', admin: true });
  if (!auth.ok) return auth.response;
  const { user, actorRole } = auth.ctx;

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const raw = parsed.body.people;
  if (!Array.isArray(raw) || raw.length > MAX_PEOPLE) {
    return consoleJson({ error: 'invalid', errors: [{ field: 'people', reason: 'type' }] }, 400);
  }

  const errors: { index: number; field: string; reason: string }[] = [];
  const next: ConsolePerson[] = [];
  const seen = new Set<string>();
  raw.forEach((p, index) => {
    const v = validatePersonFields(p);
    if (!v.ok) {
      for (const e of v.errors) errors.push({ index, field: e.field, reason: e.reason });
      return;
    }
    if (seen.has(v.value.email)) {
      errors.push({ index, field: 'email', reason: 'duplicate_email' });
      return;
    }
    seen.add(v.value.email);
    next.push(v.value);
  });
  if (errors.length) return consoleJson({ error: 'invalid', errors }, 400);

  try {
    const stored = await readDataForWrite<ConsolePerson>(CONSOLE_DOCS.people);
    const removedIds = stored.map((p) => p.email).filter((e) => typeof e === 'string' && !seen.has(e.toLowerCase()));
    await writeDataMerged(CONSOLE_DOCS.people, next, { removedIds });
    await auditAfterWrite({ actor: user.email, actorRole, action: 'people.update', meta: { count: next.length, removed: removedIds.length } });
    return consoleJson({ people: next });
  } catch (err) {
    console.error('[console people] update failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
