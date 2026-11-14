import { describe, it, expect } from 'vitest';
import {
  REGULAR_CATEGORY_ICONS,
  WIKI_CATEGORY,
  categoryChoices,
  checkCategoryInput,
  groupNavCategories,
  knownCategoryIds,
  normalizeStoredCategory,
} from '../categories';
import type { ConsoleCategory } from '../types';

// SPEC-CONSOLE-001 REQ-CON-026 / AC-CON-026 (unit part). Category names are generic fixtures.

function legacyCategory(id: string, icon: string) {
  // Prototype export shape: no `kind` field.
  return {
    id,
    icon,
    name: `분류 ${id}`,
    name_en: `Category ${id}`,
    short: id,
    short_en: id,
    description: '',
    description_en: '',
  };
}

const EIGHT = REGULAR_CATEGORY_ICONS.map((icon, i) => legacyCategory(`cat-${i + 1}`, icon));

describe('built-in wiki category', () => {
  it('is the only knowledge category, with the library icon', () => {
    expect(WIKI_CATEGORY).toMatchObject({ id: 'wiki', kind: 'knowledge', icon: 'library', name: '위키', name_en: 'Wiki' });
  });

  it('has an icon distinct from every allowed regular icon', () => {
    expect(REGULAR_CATEGORY_ICONS).toHaveLength(8);
    expect(REGULAR_CATEGORY_ICONS).not.toContain(WIKI_CATEGORY.icon);
  });

  it('carries no staff name, address or internal id', () => {
    expect(JSON.stringify(WIKI_CATEGORY)).not.toMatch(/https?:|@|drive|docs\.google/);
  });
});

describe('normalizeStoredCategory', () => {
  it('reads a category without kind as resource', () => {
    expect(normalizeStoredCategory(legacyCategory('sites', 'globe'))).toMatchObject({ id: 'sites', kind: 'resource' });
  });

  it('drops a stored wiki entry (the built-in definition wins) and malformed records', () => {
    expect(normalizeStoredCategory({ ...legacyCategory('wiki', 'globe'), kind: 'resource' })).toBeNull();
    expect(normalizeStoredCategory(null)).toBeNull();
    expect(normalizeStoredCategory({ id: 'Bad Id' })).toBeNull();
  });
});

describe('groupNavCategories', () => {
  it('returns { wiki, regular } with the built-in wiki and the eight regular categories', () => {
    const stored = EIGHT.map((c) => normalizeStoredCategory(c)!) as ConsoleCategory[];
    const { wiki, regular } = groupNavCategories(stored);
    expect(wiki).toBe(WIKI_CATEGORY);
    expect(regular.map((c) => c.id)).toEqual(EIGHT.map((c) => c.id));
    expect(regular.every((c) => c.kind === 'resource')).toBe(true);
    expect(regular.map((c) => c.icon)).not.toContain('library');
  });

  it('never lists a wiki or knowledge entry among the regular categories', () => {
    const odd = [
      { ...legacyCategory('wiki', 'globe'), kind: 'resource' },
      { ...legacyCategory('kb', 'book'), kind: 'knowledge' },
      legacyCategory('sites', 'globe'),
    ] as ConsoleCategory[];
    expect(groupNavCategories(odd).regular.map((c) => c.id)).toEqual(['sites']);
  });

  it('puts the wiki first in the item form choices, then the regular categories', () => {
    const stored = EIGHT.slice(0, 2).map((c) => normalizeStoredCategory(c)!) as ConsoleCategory[];
    expect(categoryChoices(stored).map((c) => c.id)).toEqual(['wiki', 'cat-1', 'cat-2']);
  });

  it('counts wiki among the known category ids for item validation', () => {
    const stored = EIGHT.slice(0, 1).map((c) => normalizeStoredCategory(c)!) as ConsoleCategory[];
    expect([...knownCategoryIds(stored)].sort()).toEqual(['cat-1', 'wiki']);
  });
});

describe('checkCategoryInput — admin create (POST /api/console/categories)', () => {
  it('creates a resource category and fills defaults', () => {
    const r = checkCategoryInput({ id: 'new-cat', name: '새 분류' }, 'create');
    expect(r).toEqual({
      status: 'ok',
      category: {
        id: 'new-cat',
        kind: 'resource',
        icon: 'folder',
        name: '새 분류',
        name_en: '',
        short: '새 분류',
        short_en: '',
        description: '',
        description_en: '',
      },
    });
  });

  it.each([
    ['id wiki', { id: 'wiki', name: 'x' }, 'reserved_id'],
    ['kind knowledge', { id: 'kb', kind: 'knowledge', name: 'x' }, 'knowledge_kind'],
    ['unknown kind', { id: 'kb', kind: 'article', name: 'x' }, 'kind'],
    ['bad id', { id: 'Not OK', name: 'x' }, 'id'],
    ['missing name', { id: 'ok' }, 'name'],
    ['too long name', { id: 'ok', name: 'n'.repeat(61) }, 'name'],
    ['library icon (reserved for the wiki)', { id: 'ok', name: 'x', icon: 'library' }, 'icon'],
    ['unknown icon', { id: 'ok', name: 'x', icon: 'rocket' }, 'icon'],
    ['not an object', 'sites', 'shape'],
  ])('rejects %s', (_label, raw, reason) => {
    expect(checkCategoryInput(raw, 'create')).toEqual({ status: 'error', reason });
  });
});

describe('checkCategoryInput — import file entries', () => {
  it('ignores an entry with id wiki without checking its other fields (CON-D32)', () => {
    expect(checkCategoryInput({ id: 'wiki', kind: 'resource' }, 'import')).toEqual({ status: 'ignored' });
    expect(checkCategoryInput({ id: 'wiki', kind: 'article', icon: 'rocket' }, 'import')).toEqual({ status: 'ignored' });
  });

  it('rejects a knowledge category whose id is not wiki', () => {
    expect(checkCategoryInput({ id: 'kb', kind: 'knowledge', name: 'KB' }, 'import')).toEqual({
      status: 'error',
      reason: 'knowledge_kind',
    });
  });

  it('rejects an unknown kind', () => {
    expect(checkCategoryInput({ ...legacyCategory('sites', 'globe'), kind: 'article' }, 'import')).toEqual({
      status: 'error',
      reason: 'kind',
    });
  });

  it('accepts a prototype export category and reads it as resource', () => {
    const r = checkCategoryInput(legacyCategory('sites', 'globe'), 'import');
    expect(r.status).toBe('ok');
    expect(r.status === 'ok' && r.category.kind).toBe('resource');
  });
});
