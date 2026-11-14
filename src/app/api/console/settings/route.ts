import { readDataUncached, readSingleForWrite, writeSingle } from '@/lib/db';
import { authorizeConsole, consoleJson, readJsonObject } from '@/lib/console/http';
import { MAX_TEAM_PINS } from '@/lib/console/import-map';
import { auditAfterWrite } from '@/lib/console/store';
import { CONSOLE_DOCS, type ConsoleItem, type ConsoleSettings } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Replaces the team-pinned item list shown on the home (SPEC-CONSOLE-001 REQ-CON-019).
// Console admins only; at most 8 pins, each the id of a live (not deleted) item.
export async function PUT(request: Request) {
  const auth = await authorizeConsole(request, { stateChange: 'json', admin: true });
  if (!auth.ok) return auth.response;
  const { user, actorRole } = auth.ctx;

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;
  const raw = parsed.body.teamPins;
  if (!Array.isArray(raw) || raw.some((p) => typeof p !== 'string')) {
    return consoleJson({ error: 'invalid', errors: [{ field: 'teamPins', reason: 'type' }] }, 400);
  }
  const teamPins = [...new Set(raw as string[])];
  if (teamPins.length > MAX_TEAM_PINS) {
    return consoleJson({ error: 'invalid', errors: [{ field: 'teamPins', reason: 'too_many' }] }, 400);
  }

  try {
    const items = await readDataUncached<ConsoleItem>(CONSOLE_DOCS.items);
    const live = new Set(items.filter((i) => !i.deletedAt).map((i) => i.id));
    if (teamPins.some((id) => !live.has(id))) {
      return consoleJson({ error: 'invalid', errors: [{ field: 'teamPins', reason: 'unknown_item' }] }, 400);
    }
    const current = (await readSingleForWrite<ConsoleSettings>(CONSOLE_DOCS.settings)) ?? {};
    const next: ConsoleSettings = { ...current, teamPins };
    await writeSingle(CONSOLE_DOCS.settings, next);
    await auditAfterWrite({ actor: user.email, actorRole, action: 'settings.update', meta: { teamPins: teamPins.length } });
    return consoleJson({ settings: { teamPins } });
  } catch (err) {
    console.error('[console settings] update failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
