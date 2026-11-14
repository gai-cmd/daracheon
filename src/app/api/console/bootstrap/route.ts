import { readDataUncached } from '@/lib/db';
import { authorizeConsole, consoleJson } from '@/lib/console/http';
import { toListItems } from '@/lib/console/permissions';
import { readRegularCategories, readSettings, withWiki } from '@/lib/console/store';
import { CONSOLE_DOCS, type ConsoleItem, type ConsoleSecretRecord } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Everything the console screen needs after sign-in (SPEC-CONSOLE-001 REQ-CON-009, design.md §5).
// Data reaches the browser only through this authenticated, non-cacheable response:
// list-shaped items (no credential values, no deleted items, private note to editors only),
// categories with the built-in wiki first, the people directory (role memo to admins only), and
// team pins that point at live items.
export async function GET(request: Request) {
  const auth = await authorizeConsole(request);
  if (!auth.ok) return auth.response;
  const { user, displayName, people } = auth.ctx;

  try {
    const [items, secrets, categories, settings] = await Promise.all([
      readDataUncached<ConsoleItem>(CONSOLE_DOCS.items),
      readDataUncached<ConsoleSecretRecord>(CONSOLE_DOCS.secrets),
      readRegularCategories(),
      readSettings(),
    ]);
    const list = toListItems(user, items, secrets);
    const live = new Set(list.map((i) => i.id));
    return consoleJson({
      me: { email: user.email, name: displayName, team: user.team, isAdmin: user.isAdmin },
      categories: withWiki(categories),
      people: people
        .filter((p) => typeof p?.email === 'string')
        .map((p) => ({
          email: p.email,
          name: p.name,
          name_en: p.name_en,
          team: p.team,
          ...(user.isAdmin && p.role ? { role: p.role } : {}),
        })),
      settings: { teamPins: settings.teamPins.filter((id) => live.has(id)) },
      items: list,
    });
  } catch (err) {
    console.error('[console bootstrap] failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
