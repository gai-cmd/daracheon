import { readDataForWrite, readSingleForWrite, writeDataMerged, writeSingle } from '@/lib/db';
import { authorizeConsole, consoleJson } from '@/lib/console/http';
import { MAX_IMPORT_BYTES, mapImportFile } from '@/lib/console/import-map';
import { auditAfterWrite } from '@/lib/console/store';
import {
  CONSOLE_DOCS,
  type ConsoleItem,
  type ConsolePerson,
  type ConsoleSecretRecord,
  type ConsoleSettings,
} from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Stage = 'items' | 'categories' | 'people' | 'secrets' | 'settings';

const minus = (stored: readonly unknown[], kept: ReadonlySet<string>) =>
  stored.filter((k): k is string => typeof k === 'string' && !kept.has(k));

// @MX:WARN: [AUTO] Replaces whole console documents.
// @MX:REASON: writeDataMerged keeps any stored record missing from the new array unless its key is in
// removedIds (design.md §5.4); dropping a removedIds list here silently keeps deleted items, people,
// categories or ciphertexts.
// Replaces the console data from an uploaded file (SPEC-CONSOLE-001 REQ-CON-019, design.md §5.3-5.4).
// Console admins only. Mapping is validated first (one error -> 400, nothing written). Credential
// values in the file are never read. Writes run items -> categories -> people -> secrets -> settings;
// a failure answers 500 with the stage, and importing the same file again converges (idempotent).
export async function POST(request: Request) {
  const auth = await authorizeConsole(request, { stateChange: 'json', admin: true });
  if (!auth.ok) return auth.response;
  const { user, displayName, actorRole } = auth.ctx;

  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_IMPORT_BYTES) return consoleJson({ error: 'too_large' }, 413);
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch {
    return consoleJson({ error: 'invalid_body' }, 400);
  }

  let stage: Stage = 'items';
  try {
    const [storedItems, storedCategories, storedPeople, storedSecrets] = await Promise.all([
      readDataForWrite<ConsoleItem>(CONSOLE_DOCS.items),
      readDataForWrite<{ id?: unknown }>(CONSOLE_DOCS.categories),
      readDataForWrite<ConsolePerson>(CONSOLE_DOCS.people),
      readDataForWrite<ConsoleSecretRecord>(CONSOLE_DOCS.secrets),
    ]);

    const mapped = mapImportFile(file, {
      now: new Date(Date.now()).toISOString(),
      actor: displayName,
      storedCategories,
      storedPeople,
    });
    if (!mapped.ok) return consoleJson({ error: 'invalid_import', errors: mapped.errors }, 400);

    // Items: every stored id (soft-deleted included) that the file does not carry is removed.
    const newIds = new Set(mapped.items.map((i) => i.id));
    const removedItems = minus(storedItems.map((i) => i.id), newIds);
    await writeDataMerged(CONSOLE_DOCS.items, mapped.items, { removedIds: removedItems });

    let removedCategories: string[] = [];
    if (mapped.categories) {
      stage = 'categories';
      removedCategories = minus(storedCategories.map((c) => c?.id), new Set(mapped.categories.map((c) => c.id)));
      await writeDataMerged(CONSOLE_DOCS.categories, mapped.categories, { removedIds: removedCategories });
    }

    let removedPeople: string[] = [];
    if (mapped.people) {
      stage = 'people';
      removedPeople = minus(storedPeople.map((p) => p.email), new Set(mapped.people.map((p) => p.email)));
      await writeDataMerged(CONSOLE_DOCS.people, mapped.people, { removedIds: removedPeople });
    }

    // Secrets survive only for an item kept under the same id that is still a shared account.
    stage = 'secrets';
    const sharedIds = new Set(mapped.items.filter((i) => i.access_method === 'shared-credential').map((i) => i.id));
    const removedSecrets = minus(storedSecrets.map((s) => s.itemId), sharedIds);
    if (removedSecrets.length) {
      await writeDataMerged(
        CONSOLE_DOCS.secrets,
        storedSecrets.filter((s) => sharedIds.has(s.itemId)),
        { removedIds: removedSecrets }
      );
    }

    if (mapped.teamPins) {
      stage = 'settings';
      const current = (await readSingleForWrite<ConsoleSettings>(CONSOLE_DOCS.settings)) ?? {};
      await writeSingle(CONSOLE_DOCS.settings, { ...current, teamPins: mapped.teamPins });
    }

    const report = {
      ...mapped.report,
      removed: { items: removedItems.length, people: removedPeople.length, categories: removedCategories.length },
    };
    await auditAfterWrite({
      actor: user.email,
      actorRole,
      action: 'import',
      meta: { items: report.items, removedItems: removedItems.length, people: report.people ?? -1 },
    });
    return consoleJson({ report });
  } catch (err) {
    console.error(`[console import] ${stage} write failed:`, err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'write_failed', stage }, 500);
  }
}
