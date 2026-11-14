// Console categories and the Wiki section (SPEC-CONSOLE-001 REQ-CON-025/026, design.md §3.5).
//
// - Every category has a kind: 'resource' (regular) or 'knowledge'. Stored or imported categories
//   without a kind are read as 'resource'.
// - The only knowledge category is the built-in `wiki`. It lives in code, is never stored, and can
//   be neither created through the category API nor imported (an imported `wiki` entry is ignored).
// - Regular categories use one of the prototype's eight icons, so none can take the wiki's
//   `library` icon (plan-audit CON-D31, option a).

import { CONSOLE_CATEGORY_KINDS, type ConsoleCategory } from './types';

export const WIKI_CATEGORY_ID = 'wiki';

// Category name and wording only: no staff name, address or internal id (REQ-CON-008 safe).
export const WIKI_CATEGORY: Readonly<ConsoleCategory> = Object.freeze({
  id: WIKI_CATEGORY_ID,
  kind: 'knowledge',
  icon: 'library',
  name: '위키',
  name_en: 'Wiki',
  short: '위키',
  short_en: 'Wiki',
  description: '팀이 함께 보는 지식 문서와 자료실',
  description_en: 'Shared knowledge pages and the team library',
});

/** Icons a regular category may use (the prototype's CAT_ICONS). */
export const REGULAR_CATEGORY_ICONS = ['globe', 'pen', 'video', 'folder', 'chart', 'cart', 'sparkles', 'book'] as const;
const DEFAULT_REGULAR_ICON = 'folder';

export const CATEGORY_ID_PATTERN = /^[a-z0-9-]{1,40}$/;
const NAME_MAX = 60;
const SHORT_MAX = 24;
const DESCRIPTION_MAX = 200;

export type CategoryCheck =
  | { status: 'ok'; category: ConsoleCategory }
  /** An import entry for the reserved `wiki` id: skipped, the built-in definition stays. */
  | { status: 'ignored' }
  | { status: 'error'; reason: 'shape' | 'id' | 'reserved_id' | 'kind' | 'knowledge_kind' | 'name' | 'icon' | 'text' };

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Optional text field: undefined -> '', non-string or too long -> null (invalid). */
function optText(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length <= max ? t : null;
}

/**
 * Validates one category coming from an admin request ('create') or an import file ('import').
 * In an import file an entry whose id is `wiki` is ignored before any other field is looked at
 * (plan-audit CON-D32), so a malformed wiki entry can neither fail nor alter the import.
 */
export function checkCategoryInput(raw: unknown, context: 'create' | 'import'): CategoryCheck {
  if (!isRecord(raw)) return { status: 'error', reason: 'shape' };
  if (context === 'import' && raw.id === WIKI_CATEGORY_ID) return { status: 'ignored' };

  if (typeof raw.id !== 'string' || !CATEGORY_ID_PATTERN.test(raw.id)) return { status: 'error', reason: 'id' };
  if (raw.id === WIKI_CATEGORY_ID) return { status: 'error', reason: 'reserved_id' };

  const kind = raw.kind === undefined ? 'resource' : raw.kind;
  if (typeof kind !== 'string' || !(CONSOLE_CATEGORY_KINDS as readonly string[]).includes(kind)) {
    return { status: 'error', reason: 'kind' };
  }
  if (kind === 'knowledge') return { status: 'error', reason: 'knowledge_kind' };

  const name = optText(raw.name, NAME_MAX);
  if (!name) return { status: 'error', reason: 'name' };

  const icon = raw.icon === undefined || raw.icon === '' ? DEFAULT_REGULAR_ICON : raw.icon;
  if (typeof icon !== 'string' || !(REGULAR_CATEGORY_ICONS as readonly string[]).includes(icon)) {
    return { status: 'error', reason: 'icon' };
  }

  const name_en = optText(raw.name_en, NAME_MAX);
  const short = optText(raw.short, SHORT_MAX);
  const short_en = optText(raw.short_en, SHORT_MAX);
  const description = optText(raw.description, DESCRIPTION_MAX);
  const description_en = optText(raw.description_en, DESCRIPTION_MAX);
  if ([name_en, short, short_en, description, description_en].some((v) => v === null)) {
    return { status: 'error', reason: 'text' };
  }

  return {
    status: 'ok',
    category: {
      id: raw.id,
      kind: 'resource',
      icon,
      name,
      name_en: name_en!,
      short: short || name,
      short_en: short_en || name_en!,
      description: description!,
      description_en: description_en!,
    },
  };
}

/**
 * Reads a stored category: fills a missing kind with 'resource'. Returns null for anything that is
 * not a valid regular category, including a stored `wiki` entry (the built-in definition wins).
 */
export function normalizeStoredCategory(raw: unknown): ConsoleCategory | null {
  const r = checkCategoryInput(raw, 'create');
  return r.status === 'ok' ? r.category : null;
}

function regularOf(categories: readonly ConsoleCategory[]): ConsoleCategory[] {
  return categories.filter((c) => c.id !== WIKI_CATEGORY_ID && c.kind !== 'knowledge');
}

/** Navigation grouping: the single Wiki entry plus the regular categories. */
export function groupNavCategories(categories: readonly ConsoleCategory[]): {
  wiki: Readonly<ConsoleCategory>;
  regular: ConsoleCategory[];
} {
  return { wiki: WIKI_CATEGORY, regular: regularOf(categories) };
}

/** Category choices of the item create/edit form: the wiki first, then the regular categories. */
export function categoryChoices(categories: readonly ConsoleCategory[]): Readonly<ConsoleCategory>[] {
  return [WIKI_CATEGORY, ...regularOf(categories)];
}

/** Category ids an item may use (always includes `wiki`). */
export function knownCategoryIds(categories: readonly ConsoleCategory[]): Set<string> {
  return new Set([WIKI_CATEGORY_ID, ...regularOf(categories).map((c) => c.id)]);
}
