import { readDataUncached } from '@/lib/db';
import { authorizeConsole, consoleJson } from '@/lib/console/http';
import { hidesPassword } from '@/lib/console/permissions';
import { readRegularCategories } from '@/lib/console/store';
import { CONSOLE_DOCS, type ConsoleItem } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Export shape of one item, built field by field: no credential, no record metadata. */
function toExportItem(i: ConsoleItem) {
  return {
    id: i.id,
    category: i.category,
    type: i.type,
    status: i.status,
    access_method: i.access_method,
    visibility: i.visibility,
    team: i.team,
    owners: (i.owners ?? []).map((o) => (o.email ? { name: o.name, email: o.email } : { name: o.name })),
    url: i.url,
    title: i.title,
    title_en: i.title_en,
    description: i.description,
    description_en: i.description_en,
    tags: [...(i.tags ?? [])],
    links: (i.links ?? []).map((l) => ({ label: l.label, label_en: l.label_en, url: l.url })),
    note: i.note,
    note_en: i.note_en,
    // 표식만 내보낸다. 자격증명 값은 없다 (SPEC-CONSOLE-002 REQ-CS2-002).
    hide_password: hidesPassword(i),
    updatedAt: i.updatedAt,
    updatedBy: i.updatedBy,
  };
}

// Credential-free export (SPEC-CONSOLE-001 REQ-CON-015/019, spec §4 knowledge-friendly model).
// Console admins only. Live items keep their stable ids, ko/en pairs, owners and updatedAt; the
// regular categories carry their kind; the built-in wiki is not exported (it lives in code).
export async function GET(request: Request) {
  const auth = await authorizeConsole(request, { admin: true });
  if (!auth.ok) return auth.response;
  try {
    const [items, categories] = await Promise.all([
      readDataUncached<ConsoleItem>(CONSOLE_DOCS.items),
      readRegularCategories(),
    ]);
    const exportedAt = new Date(Date.now()).toISOString();
    return consoleJson(
      {
        app: 'zoel-console',
        exportedAt,
        categories,
        items: items.filter((i) => !i.deletedAt).map(toExportItem),
      },
      200,
      { 'Content-Disposition': `attachment; filename="zoel-console-export-${exportedAt.slice(0, 10)}.json"` }
    );
  } catch (err) {
    console.error('[console export] failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
