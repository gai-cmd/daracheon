import { describe, it, expect } from 'vitest';
import { mapImportFile, type ImportContext } from '../import-map';
import type { ConsolePerson } from '../types';

// SPEC-CONSOLE-001 design.md §5.3 — the import-file mapping (AC-CON-018, AC-CON-026 import part).
// All names, addresses and ids are synthetic test values (public repository).

const NOW = '2026-11-15T00:00:00.000Z';

const storedCategories = [
  { id: 'sites', icon: 'globe', name: '사이트', name_en: 'Sites' },
  { id: 'assets', icon: 'folder', name: '자료', name_en: 'Assets' },
];
const storedPeople: ConsolePerson[] = [{ email: 'p0@try-n.com', name: '피 영', name_en: 'P Zero', team: '공통' }];

function ctx(overrides: Partial<ImportContext> = {}): ImportContext {
  return { now: NOW, actor: '관리 자', storedCategories, storedPeople, ...overrides };
}

function card(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    category: 'sites',
    type: 'link',
    status: 'ok',
    access_method: 'public',
    visibility: '전체',
    team: '공통',
    owner: '',
    url: 'https://example.com/' + id,
    title: `카드 ${id}`,
    title_en: `Card ${id}`,
    description: '',
    description_en: '',
    tags: ['t1'],
    links: [],
    note: '',
    note_en: '',
    ...overrides,
  };
}

function protoFile(cards: unknown[], extra: Record<string, unknown> = {}) {
  return { app: 'zoel-console', version: 2, exportedAt: NOW, categories: storedCategories, cards, ...extra };
}

describe('mapImportFile — file shape', () => {
  it('treats a top-level array as { cards }', () => {
    const r = mapImportFile([card('c1')], ctx());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.items.map((i) => i.id)).toEqual(['c1']);
  });

  it('rejects a file with both cards and items', () => {
    const r = mapImportFile({ cards: [card('c1')], items: [] }, ctx());
    expect(r.ok).toBe(false);
  });

  it('rejects a file with neither cards nor items, or a non-object', () => {
    expect(mapImportFile({ categories: [] }, ctx()).ok).toBe(false);
    expect(mapImportFile('nope', ctx()).ok).toBe(false);
    expect(mapImportFile(null, ctx()).ok).toBe(false);
  });

  it('rejects duplicate ids inside the file', () => {
    const r = mapImportFile(protoFile([card('c1'), card('c1')]), ctx());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatchObject({ section: 'items', index: 1, reason: 'duplicate_id' });
  });

  it('rejects a whole file when one card has a javascript: URL (atomic)', () => {
    const r = mapImportFile(protoFile([card('c1'), card('c2', { url: 'javascript:alert(1)' })]), ctx());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toEqual(expect.arrayContaining([expect.objectContaining({ section: 'items', index: 1, field: 'url' })]));
  });

  it('rejects unknown enum values instead of defaulting them', () => {
    expect(mapImportFile(protoFile([card('c1', { access_method: 'magic' })]), ctx()).ok).toBe(false);
    expect(mapImportFile(protoFile([card('c1', { team: '미국팀' })]), ctx()).ok).toBe(false);
  });

  it('rejects an id that cannot be used in an API path', () => {
    expect(mapImportFile(protoFile([card('a/b')]), ctx()).ok).toBe(false);
  });
});

describe('mapImportFile — item fields', () => {
  it('reads whitelisted fields only, drops credential values, stamps version/updatedAt/updatedBy', () => {
    const r = mapImportFile(
      protoFile([
        card('c1', {
          access_method: 'shared-credential',
          login_id: 'canary-id-91ab',
          password: 'canary-Pw-7f3e',
          version: 9,
          updatedAt: '2020-01-01T00:00:00.000Z',
          deletedAt: '2020-01-01T00:00:00.000Z',
          hasPassword: true,
        }),
      ]),
      ctx()
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const item = r.items[0];
    expect(JSON.stringify(r)).not.toContain('canary');
    expect(item).not.toHaveProperty('login_id');
    expect(item).not.toHaveProperty('password');
    expect(item).not.toHaveProperty('deletedAt');
    expect(item).not.toHaveProperty('hasPassword');
    expect(item).toMatchObject({ id: 'c1', version: 1, updatedAt: NOW, updatedBy: '관리 자', access_method: 'shared-credential' });
  });

  it('creates an id when a card has none', () => {
    const r = mapImportFile(protoFile([card('', { id: undefined })]), ctx());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.items[0].id).toMatch(/^item-/);
  });

  it('keeps ids stable (knowledge-friendly round trip)', () => {
    const r = mapImportFile(protoFile([card('site-a'), card('site-b')]), ctx());
    expect(r.ok && r.items.map((i) => i.id)).toEqual(['site-a', 'site-b']);
  });

  it('rejects more than 3,000 records', () => {
    const many = Array.from({ length: 3001 }, (_, i) => card(`c${i}`));
    expect(mapImportFile(protoFile(many), ctx()).ok).toBe(false);
  });
});

describe('mapImportFile — owners (cards format)', () => {
  const people = [
    { email: 'ga@try-n.com', name: '가 나다', name_en: 'Ga', team: '한국팀' },
    { email: 'ra@try-n.com', name: '라 마바', name_en: 'Ra', team: '방글라데시팀' },
  ];

  it('splits on commas (incl. full-width), normalizes spaces and matches people by name', () => {
    const r = mapImportFile(
      protoFile([card('c1', { owner: '가 나다, 라  마바' }), card('c2', { owner: '가 나다，라 마바' })], { people }),
      ctx()
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].owners).toEqual([
      { name: '가 나다', email: 'ga@try-n.com' },
      { name: '라 마바', email: 'ra@try-n.com' },
    ]);
    expect(r.items[1].owners).toHaveLength(2);
    expect(r.report.unmatchedOwners).toEqual([]);
  });

  it('keeps an unmatched name without email and reports it once', () => {
    const r = mapImportFile(
      protoFile([card('c1', { owner: '사 아자' }), card('c2', { owner: '사 아자' })], { people }),
      ctx()
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].owners).toEqual([{ name: '사 아자' }]);
    expect(r.report.unmatchedOwners).toEqual(['사 아자']);
  });

  it('treats a name matching two people as unmatched', () => {
    const twins = [
      { email: 't1@try-n.com', name: '쌍 둥이', name_en: 'T1', team: '공통' },
      { email: 't2@try-n.com', name: '쌍 둥이', name_en: 'T2', team: '공통' },
    ];
    const r = mapImportFile(protoFile([card('c1', { owner: '쌍 둥이' })], { people: twins }), ctx());
    expect(r.ok && r.items[0].owners).toEqual([{ name: '쌍 둥이' }]);
  });

  it('matches against the stored people when the file has no people key', () => {
    const r = mapImportFile(protoFile([card('c1', { owner: '피 영' })]), ctx());
    expect(r.ok && r.items[0].owners).toEqual([{ name: '피 영', email: 'p0@try-n.com' }]);
  });

  it('maps an empty owner string to no owners', () => {
    const r = mapImportFile(protoFile([card('c1', { owner: ' , ' })]), ctx());
    expect(r.ok && r.items[0].owners).toEqual([]);
  });

  it('refuses more than 10 owners on one item', () => {
    const owner = Array.from({ length: 11 }, (_, i) => `이름 ${i}`).join(',');
    expect(mapImportFile(protoFile([card('c1', { owner })]), ctx()).ok).toBe(false);
  });
});

describe('mapImportFile — owners (items format)', () => {
  it('lower-cases emails and strips a non-try-n.com email into unmatchedOwners', () => {
    const items = [
      { ...card('i1'), owner: undefined, owners: [{ name: '오 너', email: 'O@TRY-N.COM' }, { name: '위 장', email: 'w@try-n.com.evil.io' }] },
    ];
    const r = mapImportFile({ items }, ctx());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items[0].owners).toEqual([{ name: '오 너', email: 'o@try-n.com' }, { name: '위 장' }]);
    expect(r.report.unmatchedOwners).toEqual(['위 장']);
  });
});

describe('mapImportFile — people', () => {
  it('replaces people only when the key exists; skips missing/foreign emails; ignores admin flags', () => {
    const people = [
      { email: 'ga@try-n.com', name: '가 나다', name_en: 'Ga', team: '한국팀', admin: true },
      { email: 'RA@try-n.com', name: '라 마바', name_en: 'Ra', team: '방글라데시팀', email_hint: 'other@try-n.com' },
      { name: '관리 자', admin: true, team: '공통' },
      { email: 'x@try-n.com.evil.io', name: '위 장', team: '공통' },
    ];
    const r = mapImportFile(protoFile([card('c1')], { people }), ctx());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.people).toEqual([
      { email: 'ga@try-n.com', name: '가 나다', name_en: 'Ga', team: '한국팀' },
      { email: 'ra@try-n.com', name: '라 마바', name_en: 'Ra', team: '방글라데시팀' },
    ]);
    expect(r.report.peopleSkipped).toEqual(['관리 자', '위 장']);
    expect(r.report.people).toBe(2);
    expect(JSON.stringify(r.people)).not.toContain('admin');
  });

  it('leaves people untouched when the file has no people key', () => {
    const r = mapImportFile(protoFile([card('c1')]), ctx());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.people).toBeUndefined();
      expect(r.report.people).toBeNull();
    }
  });

  it('rejects duplicate emails and unknown teams', () => {
    const dup = [
      { email: 'ga@try-n.com', name: '가', team: '공통' },
      { email: 'GA@try-n.com', name: '나', team: '공통' },
    ];
    expect(mapImportFile(protoFile([card('c1')], { people: dup }), ctx()).ok).toBe(false);
    expect(mapImportFile(protoFile([card('c1')], { people: [{ email: 'ga@try-n.com', name: '가', team: '화성팀' }] }), ctx()).ok).toBe(false);
  });
});

describe('mapImportFile — categories and the wiki', () => {
  it('fills a missing kind with resource and replaces the stored categories', () => {
    const r = mapImportFile(protoFile([card('c1')], { categories: [{ id: 'sites', icon: 'globe', name: '사이트' }] }), ctx());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.categories?.map((c) => [c.id, c.kind])).toEqual([['sites', 'resource']]);
      expect(r.report.categories).toBe(1);
    }
  });

  it('keeps the stored categories when the file has no categories key', () => {
    const file = { cards: [card('c1', { category: 'assets' })] };
    const r = mapImportFile(file, ctx());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.categories).toBeUndefined();
      expect(r.report.categories).toBeNull();
    }
  });

  it('ignores a wiki entry and still accepts wiki items', () => {
    const r = mapImportFile(
      protoFile([card('w1', { category: 'wiki', access_method: 'sso' })], {
        categories: [...storedCategories, { id: 'wiki', kind: 'resource', name: '가짜', icon: 'globe' }],
      }),
      ctx()
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.categories?.map((c) => c.id)).toEqual(['sites', 'assets']);
      expect(r.items[0].category).toBe('wiki');
    }
  });

  it('rejects a non-wiki knowledge category and an unknown kind', () => {
    expect(mapImportFile(protoFile([card('c1')], { categories: [...storedCategories, { id: 'kb', kind: 'knowledge', name: '지식' }] }), ctx()).ok).toBe(false);
    expect(mapImportFile(protoFile([card('c1')], { categories: [...storedCategories, { id: 'ar', kind: 'article', name: '글' }] }), ctx()).ok).toBe(false);
  });

  it('rejects an item whose category is not in the final list', () => {
    const r = mapImportFile(protoFile([card('c1', { category: 'assets' })], { categories: [storedCategories[0]] }), ctx());
    expect(r.ok).toBe(false);
  });

  it('rejects duplicate category ids', () => {
    expect(mapImportFile(protoFile([card('c1')], { categories: [storedCategories[0], storedCategories[0]] }), ctx()).ok).toBe(false);
  });
});

describe('mapImportFile — teamPins', () => {
  it('keeps only ids of imported items when the key exists', () => {
    const r = mapImportFile(protoFile([card('c1'), card('c2')], { teamPins: ['c2', 'gone', 'c2'] }), ctx());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.teamPins).toEqual(['c2']);
      expect(r.report.teamPins).toBe(1);
    }
  });

  it('leaves teamPins unset when the key is absent', () => {
    const r = mapImportFile(protoFile([card('c1')]), ctx());
    expect(r.ok && r.teamPins).toBeUndefined();
  });

  it('rejects a non-array teamPins or more than 8 kept pins', () => {
    expect(mapImportFile(protoFile([card('c1')], { teamPins: 'c1' }), ctx()).ok).toBe(false);
    const cards = Array.from({ length: 9 }, (_, i) => card(`c${i}`));
    expect(mapImportFile(protoFile(cards, { teamPins: cards.map((c) => c.id) }), ctx()).ok).toBe(false);
  });
});
