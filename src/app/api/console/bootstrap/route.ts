import { readDataUncached } from '@/lib/db';
import { authorizeConsole, consoleJson } from '@/lib/console/http';
import { toListItems } from '@/lib/console/permissions';
import { readRegularCategories, readSettings, withWiki } from '@/lib/console/store';
import {
  AUTOFILL_GUIDE_VERSION,
  CONSOLE_DOCS,
  type ConsoleItem,
  type ConsoleSecretRecord,
  type ConsoleUserPrefs,
} from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 이 사람이 현재 버전의 자동 입력 끄기 안내를 확인했는지 (SPEC-CONSOLE-002 REQ-CS2-006, CS2-D10).
 * 읽기가 실패하면 true — 안내 팝업 때문에 콘솔 전체가 막히지 않게 한다(계정 메뉴로 다시 열 수 있음).
 */
async function autofillGuideAck(email: string): Promise<boolean> {
  try {
    const prefs = await readDataUncached<ConsoleUserPrefs>(CONSOLE_DOCS.userPrefs);
    const mine = prefs.find((p) => typeof p?.email === 'string' && p.email.toLowerCase() === email);
    const version = mine?.autofillGuide?.version;
    return typeof version === 'number' && version >= AUTOFILL_GUIDE_VERSION;
  } catch (err) {
    console.error('[console bootstrap] prefs read failed:', err instanceof Error ? err.message : 'unknown');
    return true;
  }
}

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
    const [items, secrets, categories, settings, guideAck] = await Promise.all([
      readDataUncached<ConsoleItem>(CONSOLE_DOCS.items),
      readDataUncached<ConsoleSecretRecord>(CONSOLE_DOCS.secrets),
      readRegularCategories(),
      readSettings(),
      autofillGuideAck(user.email),
    ]);
    const list = toListItems(user, items, secrets);
    const live = new Set(list.map((i) => i.id));
    return consoleJson({
      me: { email: user.email, name: displayName, team: user.team, isAdmin: user.isAdmin },
      // me 의 모양은 그대로 두고 최상위에 둔다 (CS2-D10).
      prefs: { autofillGuideAck: guideAck },
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
