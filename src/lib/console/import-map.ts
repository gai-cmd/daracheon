// Import-file mapping for the console (SPEC-CONSOLE-001 REQ-CON-019/026, design.md §5.3).
// A pure function: it reads a parsed JSON file and returns the documents to store, or the list of
// errors. Nothing is written here; one error anywhere means the route writes nothing (atomic).
//
// Accepted shapes: the prototype "JSON export" ({ app, version, exportedAt, categories, cards[] },
// or a bare cards array) and the console export ({ items[] }). Only whitelisted fields are read, so
// credential values (login_id, password) and record metadata in the file never pass through.

import { checkCategoryInput, knownCategoryIds, normalizeStoredCategory } from './categories';
import { isConsoleDomainEmail } from './config';
import { CONSOLE_LIMITS, validateItemFields, validatePersonFields } from './validate';
import type { ConsoleCategory, ConsoleItem, ConsoleOwner, ConsolePerson } from './types';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_TEAM_PINS = 8;
/** Item ids travel in API paths (/api/console/items/:id), so they stay path-safe. */
export const ITEM_ID_PATTERN = /^[A-Za-z0-9_.:-]{1,80}$/;

export interface ImportContext {
  /** ISO timestamp stamped as updatedAt on every imported item. */
  now: string;
  /** Display name of the importing admin (updatedBy). */
  actor: string;
  /** Stored categories (raw), used when the file has no categories key. */
  storedCategories: readonly unknown[];
  /** Stored people, used for owner matching when the file has no people key. */
  storedPeople: readonly ConsolePerson[];
}

export interface ImportError {
  section: 'file' | 'items' | 'categories' | 'people' | 'teamPins';
  /** Zero-based record index inside the section, when the error belongs to one record. */
  index?: number;
  field: string;
  reason: string;
}

export interface ImportReport {
  items: number;
  categories: number | null;
  people: number | null;
  teamPins: number | null;
  unmatchedOwners: string[];
  peopleSkipped: string[];
}

export type ImportResult =
  | {
      ok: true;
      items: ConsoleItem[];
      /** Present only when the file carries a categories key (replace); absent = keep stored. */
      categories?: ConsoleCategory[];
      /** Present only when the file carries a people key (replace); absent = keep stored. */
      people?: ConsolePerson[];
      /** Present only when the file carries a teamPins key (replace); absent = keep stored. */
      teamPins?: string[];
      report: ImportReport;
    }
  | { ok: false; errors: ImportError[] };

/** Fields read from a card or an item; everything else in the record is dropped. */
const ITEM_FIELDS = [
  'category',
  'type',
  'status',
  'access_method',
  'visibility',
  'team',
  'url',
  'title',
  'title_en',
  'description',
  'description_en',
  'tags',
  'links',
  'note',
  'note_en',
] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Name normalization used on both sides of owner matching: trim, NFC, single spaces. */
export function normalizeName(name: string): string {
  return name.normalize('NFC').replace(/\s+/g, ' ').trim();
}

function newItemId(now: string): string {
  const t = Date.parse(now);
  return `item-${(Number.isFinite(t) ? t : 0).toString(36)}${crypto.randomUUID().replace(/-/g, '').slice(0, 6)}`;
}

function mapCategories(raw: unknown, errors: ImportError[]): ConsoleCategory[] {
  if (!Array.isArray(raw)) {
    errors.push({ section: 'categories', field: 'categories', reason: 'type' });
    return [];
  }
  const out: ConsoleCategory[] = [];
  const seen = new Set<string>();
  raw.forEach((c, index) => {
    const r = checkCategoryInput(c, 'import');
    if (r.status === 'ignored') return;
    if (r.status === 'error') {
      errors.push({ section: 'categories', index, field: 'category', reason: r.reason });
      return;
    }
    if (seen.has(r.category.id)) {
      errors.push({ section: 'categories', index, field: 'id', reason: 'duplicate_id' });
      return;
    }
    seen.add(r.category.id);
    out.push(r.category);
  });
  return out;
}

function mapPeople(raw: unknown, errors: ImportError[], skipped: string[]): ConsolePerson[] {
  if (!Array.isArray(raw)) {
    errors.push({ section: 'people', field: 'people', reason: 'type' });
    return [];
  }
  const out: ConsolePerson[] = [];
  const seen = new Set<string>();
  raw.forEach((p, index) => {
    if (!isRecord(p)) {
      errors.push({ section: 'people', index, field: 'person', reason: 'shape' });
      return;
    }
    const email = typeof p.email === 'string' ? p.email.trim().toLowerCase() : '';
    if (!isConsoleDomainEmail(email)) {
      // Not stored: no address, or not exactly @try-n.com. email_hint is never used as an email.
      skipped.push(typeof p.name === 'string' && p.name.trim() ? normalizeName(p.name) : `#${index + 1}`);
      return;
    }
    // validatePersonFields reads a whitelist; an `admin` flag has no effect (admins come from env).
    const v = validatePersonFields({ email, name: p.name, name_en: p.name_en, team: p.team, role: p.role });
    if (!v.ok) {
      for (const e of v.errors) errors.push({ section: 'people', index, field: e.field, reason: e.reason });
      return;
    }
    if (seen.has(email)) {
      errors.push({ section: 'people', index, field: 'email', reason: 'duplicate_email' });
      return;
    }
    seen.add(email);
    out.push(v.value);
  });
  return out;
}

/** Owner string of a prototype card -> owners[], matched by normalized name against the people. */
function ownersFromString(raw: unknown, people: readonly ConsolePerson[], unmatched: Set<string>): ConsoleOwner[] {
  if (typeof raw !== 'string') return [];
  const names = raw
    .split(/[,，]/)
    .map(normalizeName)
    .filter(Boolean);
  return names.map((name) => {
    const hits = people.filter((p) => normalizeName(p.name) === name);
    if (hits.length === 1) return { name: hits[0].name, email: hits[0].email.toLowerCase() };
    unmatched.add(name);
    return { name };
  });
}

/** owners[] of a console export: e-mails lower-cased; a non-console e-mail is stripped. */
function ownersFromArray(raw: unknown, unmatched: Set<string>): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((o) => {
    if (!isRecord(o) || typeof o.name !== 'string') return o;
    const name = normalizeName(o.name);
    const email = typeof o.email === 'string' ? o.email.trim().toLowerCase() : '';
    if (email && isConsoleDomainEmail(email)) return { name, email };
    unmatched.add(name);
    return { name };
  });
}

// @MX:ANCHOR: [AUTO] Single mapping point from an import file to stored console documents.
// @MX:REASON: the import route, its tests and the export round trip depend on this whitelist; adding
// a field here can let credential values or record metadata from a file reach storage (REQ-CON-015).
export function mapImportFile(file: unknown, ctx: ImportContext): ImportResult {
  const errors: ImportError[] = [];
  const doc: Record<string, unknown> | null = Array.isArray(file) ? { cards: file } : isRecord(file) ? file : null;
  if (!doc) return { ok: false, errors: [{ section: 'file', field: 'file', reason: 'shape' }] };

  const hasCards = 'cards' in doc;
  const hasItems = 'items' in doc;
  if (hasCards === hasItems) {
    return { ok: false, errors: [{ section: 'file', field: 'cards|items', reason: 'exactly_one_required' }] };
  }
  const records = hasCards ? doc.cards : doc.items;
  if (!Array.isArray(records)) return { ok: false, errors: [{ section: 'file', field: hasCards ? 'cards' : 'items', reason: 'type' }] };
  if (records.length > CONSOLE_LIMITS.items) {
    return { ok: false, errors: [{ section: 'file', field: hasCards ? 'cards' : 'items', reason: 'too_many' }] };
  }

  const categories = 'categories' in doc ? mapCategories(doc.categories, errors) : undefined;
  const peopleSkipped: string[] = [];
  const people = 'people' in doc ? mapPeople(doc.people, errors, peopleSkipped) : undefined;

  const finalCategories =
    categories ?? ctx.storedCategories.map(normalizeStoredCategory).filter((c): c is ConsoleCategory => c !== null);
  const categoryIds = knownCategoryIds(finalCategories);
  const peopleForOwners = people ?? ctx.storedPeople;

  const unmatched = new Set<string>();
  const ids = new Set<string>();
  const items: ConsoleItem[] = [];
  records.forEach((r, index) => {
    if (!isRecord(r)) {
      errors.push({ section: 'items', index, field: 'item', reason: 'shape' });
      return;
    }
    let id: string;
    if (r.id === undefined || r.id === null || r.id === '') id = newItemId(ctx.now);
    else if (typeof r.id === 'string' && ITEM_ID_PATTERN.test(r.id.trim())) id = r.id.trim();
    else {
      errors.push({ section: 'items', index, field: 'id', reason: 'format' });
      return;
    }
    if (ids.has(id)) {
      errors.push({ section: 'items', index, field: 'id', reason: 'duplicate_id' });
      return;
    }
    ids.add(id);

    const picked: Record<string, unknown> = {};
    for (const f of ITEM_FIELDS) picked[f] = r[f];
    picked.owners = hasCards ? ownersFromString(r.owner, peopleForOwners, unmatched) : ownersFromArray(r.owners, unmatched);

    const v = validateItemFields(picked, { categoryIds });
    if (!v.ok) {
      for (const e of v.errors) errors.push({ section: 'items', index, field: e.field, reason: e.reason });
      return;
    }
    items.push({ id, ...v.value, version: 1, updatedAt: ctx.now, updatedBy: ctx.actor });
  });

  let teamPins: string[] | undefined;
  if ('teamPins' in doc) {
    if (!Array.isArray(doc.teamPins) || doc.teamPins.some((p) => typeof p !== 'string')) {
      errors.push({ section: 'teamPins', field: 'teamPins', reason: 'type' });
    } else {
      teamPins = [...new Set(doc.teamPins as string[])].filter((p) => ids.has(p));
      if (teamPins.length > MAX_TEAM_PINS) errors.push({ section: 'teamPins', field: 'teamPins', reason: 'too_many' });
    }
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    items,
    ...(categories ? { categories } : {}),
    ...(people ? { people } : {}),
    ...(teamPins ? { teamPins } : {}),
    report: {
      items: items.length,
      categories: categories ? categories.length : null,
      people: people ? people.length : null,
      teamPins: teamPins ? teamPins.length : null,
      unmatchedOwners: [...unmatched],
      peopleSkipped,
    },
  };
}
