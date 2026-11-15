import { describe, expect, it } from 'vitest';
import { WIKI_CATEGORY } from '../categories';
import type { ConsoleCategory, ConsoleListItem, ConsolePerson } from '../types';
import {
  EMPTY_FILTERS,
  accessLabel,
  applyFilters,
  attentionCounts,
  buildNav,
  emptyStateKey,
  hashOf,
  homeSummary,
  isMine,
  itemsForView,
  normUrl,
  ownersFromText,
  ownersText,
  readPins,
  safeUrl,
  searchItems,
  sortItems,
  urlKey,
  viewFromHash,
  writePins,
} from '../ui-model';

// Fixtures use invented names and example addresses only (REQ-CON-008).
const ICONS = ['globe', 'pen', 'video', 'folder', 'chart', 'cart', 'sparkles', 'book'];
const REGULAR: ConsoleCategory[] = ICONS.map((icon, i) => ({
  id: `cat-${i + 1}`,
  kind: 'resource',
  icon,
  name: `분류 ${i + 1}`,
  name_en: `Category ${i + 1}`,
  short: `분류${i + 1}`,
  short_en: `Cat${i + 1}`,
  description: '',
  description_en: '',
}));
const CATEGORIES = [{ ...WIKI_CATEGORY }, ...REGULAR];

function item(over: Partial<ConsoleListItem> & { id: string }): ConsoleListItem {
  return {
    category: 'cat-1',
    type: 'link',
    status: 'ok',
    access_method: 'public',
    visibility: '전체',
    team: '공통',
    owners: [{ name: '테스트 담당', email: 'owner@try-n.com' }],
    url: 'https://example.com/' + over.id,
    title: over.id,
    title_en: '',
    description: '',
    description_en: '',
    tags: [],
    links: [],
    version: 1,
    updatedAt: '2026-11-01T00:00:00.000Z',
    updatedBy: '테스트 담당',
    hide_password: false,
    hasLoginId: false,
    hasPassword: false,
    canEdit: false,
    credAccess: 'ok',
    ...over,
  };
}

const ME = { email: 'me@try-n.com', name: '나', team: '한국팀' as const, isAdmin: false };

describe('accessLabel() — one label per item, none for public (AC-CON-020)', () => {
  it('maps every non-public access method to its label', () => {
    expect(accessLabel('ko', 'sso')).toBe('SSO');
    expect(accessLabel('ko', 'invite')).toBe('초대');
    expect(accessLabel('ko', 'shared-credential')).toBe('공유 계정');
    expect(accessLabel('ko', 'internal-login')).toBe('별도 로그인');
    expect(accessLabel('ko', 'public')).toBeNull();
    expect(accessLabel('en', 'shared-credential')).toBe('Team login');
    expect(accessLabel('en', 'public')).toBeNull();
  });
});

describe('buildNav() — menu order and the Wiki entry (AC-CON-026)', () => {
  it('orders home, all, divider, wiki, divider, heading, eight regular categories, divider, shared, mine', () => {
    const nav = buildNav({ categories: CATEGORIES, items: [] , me: ME });
    const shape = nav.map((e) => (e.type === 'link' ? e.key : e.type));
    expect(shape).toEqual([
      'home',
      'all',
      'sep',
      'cat:wiki',
      'sep',
      'heading',
      ...REGULAR.map((c) => `cat:${c.id}`),
      'sep',
      'shared',
      'mine',
    ]);
  });

  it('has exactly one wiki link, to #/cat/wiki, with the library icon, the nav.wiki label and count 0', () => {
    const nav = buildNav({ categories: CATEGORIES, items: [], me: ME });
    const wikiLinks = nav.filter((e) => e.type === 'link' && e.href.includes('wiki'));
    expect(wikiLinks).toHaveLength(1);
    const w = wikiLinks[0];
    expect(w).toMatchObject({ type: 'link', key: 'cat:wiki', href: '#/cat/wiki', icon: 'library', labelKey: 'nav.wiki', count: 0 });
    const regularIcons = nav.filter((e) => e.type === 'link' && e.key.startsWith('cat:') && e.key !== 'cat:wiki').map((e) => (e as { icon: string }).icon);
    expect(regularIcons).toHaveLength(8);
    expect(regularIcons).not.toContain('library');
  });

  it('counts wiki items and never lists them one by one', () => {
    const items = [item({ id: 'w1', category: 'wiki' }), item({ id: 'w2', category: 'wiki' }), item({ id: 'r1' })];
    const nav = buildNav({ categories: CATEGORIES, items, me: ME });
    expect(nav.find((e) => e.type === 'link' && e.key === 'cat:wiki')).toMatchObject({ count: 2 });
    expect(nav.filter((e) => e.type === 'link' && (e.key === 'w1' || e.href.endsWith('w1')))).toHaveLength(0);
    expect(nav.find((e) => e.type === 'link' && e.key === 'all')).toMatchObject({ count: 3 });
  });

  it('counts shared accounts and my items by email', () => {
    const items = [
      item({ id: 'a', access_method: 'shared-credential' }),
      item({ id: 'b', owners: [{ name: '나', email: 'ME@try-n.com' }] }),
    ];
    const nav = buildNav({ categories: CATEGORIES, items, me: ME });
    expect(nav.find((e) => e.type === 'link' && e.key === 'shared')).toMatchObject({ count: 1 });
    expect(nav.find((e) => e.type === 'link' && e.key === 'mine')).toMatchObject({ count: 1 });
  });

  it('ignores a stored category that pretends to be the wiki', () => {
    const nav = buildNav({ categories: [...CATEGORIES, { ...REGULAR[0], id: 'wiki' }], items: [], me: ME });
    expect(nav.filter((e) => e.type === 'link' && e.key === 'cat:wiki')).toHaveLength(1);
  });
});

describe('views and filters (AC-CON-020)', () => {
  const items = [
    item({ id: 'w1', category: 'wiki', access_method: 'sso' }),
    item({ id: 's1', category: 'cat-2', access_method: 'shared-credential', team: '한국팀' }),
    item({ id: 'm1', category: 'cat-3', owners: [{ name: '나', email: 'me@try-n.com' }], url: '' }),
    item({ id: 'n1', category: 'cat-3', owners: [], access_method: 'invite', team: '방글라데시팀' }),
  ];

  it('selects items per view', () => {
    const ids = (v: Parameters<typeof itemsForView>[0]) => itemsForView(v, items, { me: ME, searchQ: '', categories: CATEGORIES, people: [] }).map((i) => i.id);
    expect(ids({ name: 'all' })).toEqual(['w1', 's1', 'm1', 'n1']);
    expect(ids({ name: 'cat', cat: 'wiki' })).toEqual(['w1']);
    expect(ids({ name: 'cat', cat: 'cat-3' })).toEqual(['m1', 'n1']);
    expect(ids({ name: 'shared' })).toEqual(['s1']);
    expect(ids({ name: 'mine' })).toEqual(['m1']);
  });

  it('wiki view with no wiki items is empty', () => {
    const none = itemsForView({ name: 'cat', cat: 'wiki' }, items.filter((i) => i.category !== 'wiki'), { me: ME, searchQ: '', categories: CATEGORIES, people: [] });
    expect(none).toEqual([]);
  });

  it('the wiki view shows wiki.empty when it has nothing; filters show the generic message', () => {
    expect(emptyStateKey({ name: 'cat', cat: 'wiki' }, false)).toBe('wiki.empty');
    expect(emptyStateKey({ name: 'cat', cat: 'cat-1' }, false)).toBe('emptyCat');
    expect(emptyStateKey({ name: 'cat', cat: 'wiki' }, true)).toBe('emptyList');
    expect(emptyStateKey({ name: 'all' }, false)).toBe('emptyList');
    expect(emptyStateKey({ name: 'shared' }, false)).toBe('emptyShared');
    expect(emptyStateKey({ name: 'mine' }, false)).toBe('emptyMine');
    expect(emptyStateKey({ name: 'search' }, false)).toBe('noResults');
  });

  it('each filter narrows the list', () => {
    const f = (over: Partial<typeof EMPTY_FILTERS>) => applyFilters(items, { ...EMPTY_FILTERS, ...over }, ME).map((i) => i.id);
    expect(f({})).toEqual(['w1', 's1', 'm1', 'n1']);
    expect(f({ cat: 'cat-3' })).toEqual(['m1', 'n1']);
    expect(f({ access: 'sso' })).toEqual(['w1']);
    expect(f({ owner: 'me@try-n.com' })).toEqual(['m1']);
    expect(f({ owner: '__none' })).toEqual(['n1']);
    expect(f({ team: '방글라데시팀' })).toEqual(['n1']);
    expect(f({ mine: true })).toEqual(['m1']);
    expect(f({ attn: 'owner' })).toEqual(['n1']);
    expect(f({ attn: 'url' })).toEqual(['m1']);
    expect(f({ attn: 'any' })).toEqual(['m1', 'n1']);
  });

  it('isMine compares emails case-insensitively', () => {
    expect(isMine(item({ id: 'x', owners: [{ name: 'a', email: 'Me@Try-N.com' }] }), 'me@try-n.com')).toBe(true);
    expect(isMine(item({ id: 'x', owners: [{ name: '나' }] }), 'me@try-n.com')).toBe(false);
  });
});

describe('homeSummary() and attentionCounts()', () => {
  const items = [
    item({ id: 'w1', category: 'wiki' }),
    item({ id: 'a', category: 'cat-1' }),
    item({ id: 'b', category: 'cat-1' }),
    item({ id: 'c', category: 'cat-1' }),
    item({ id: 'd', category: 'cat-1' }),
    item({ id: 'e', category: 'cat-2', url: '', owners: [] }),
  ];

  it('summarises the eight regular categories only, never the wiki', () => {
    const sum = homeSummary(CATEGORIES, items, []);
    expect(sum.map((s) => s.category.id)).toEqual(REGULAR.map((c) => c.id));
    expect(sum[0].count).toBe(4);
    expect(sum[0].reps.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('puts team-pinned items first among a category representatives', () => {
    const sum = homeSummary(CATEGORIES, items, ['d']);
    expect(sum[0].reps.map((i) => i.id)).toEqual(['d', 'a', 'b']);
  });

  it('counts items without an owner and without an address', () => {
    expect(attentionCounts(items)).toEqual({ noOwner: 1, noUrl: 1 });
    expect(attentionCounts(items.slice(0, 2))).toEqual({ noOwner: 0, noUrl: 0 });
  });
});

describe('search and sort', () => {
  const people: ConsolePerson[] = [{ email: 'owner@try-n.com', name: '테스트 담당', name_en: 'Test Owner', team: '한국팀' }];
  const items = [
    item({ id: 'yt', title: '팀 채널', url: 'https://www.youtube.com/@example' }),
    item({ id: 'ga', title: 'GA4 속성', tags: ['ga4'] }),
    item({ id: 'doc', title: '문서함', title_en: 'Document box' }),
  ];

  it('finds by alias, English title and owner name', () => {
    const ids = (q: string) => searchItems(q, items, { categories: CATEGORIES, people }).map((i) => i.id);
    expect(ids('유튜브')).toEqual(['yt']);
    expect(ids('애널리틱스')).toEqual(['ga']);
    expect(ids('document')).toEqual(['doc']);
    expect(ids('test owner')).toHaveLength(3);
    expect(ids('')).toEqual([]);
  });

  it('sorts by name and by update time, keeping input order for ties', () => {
    const its = [item({ id: 'b', title: '나' }), item({ id: 'a', title: '가', updatedAt: '2026-11-03T00:00:00Z' })];
    expect(sortItems(its, { key: 'name', dir: 1 }, 'ko', []).map((i) => i.id)).toEqual(['a', 'b']);
    expect(sortItems(its, { key: 'updated', dir: -1 }, 'ko', []).map((i) => i.id)).toEqual(['a', 'b']);
    expect(sortItems(its, { key: null, dir: 1 }, 'ko', []).map((i) => i.id)).toEqual(['b', 'a']);
  });
});

describe('routing', () => {
  const ids = new Set(CATEGORIES.map((c) => c.id));
  it('reads hashes, including the wiki category', () => {
    expect(viewFromHash('#/cat/wiki', ids, false)).toEqual({ name: 'cat', cat: 'wiki' });
    expect(viewFromHash('#/all', ids, false)).toEqual({ name: 'all' });
    expect(viewFromHash('#/cat/nope', ids, false)).toEqual({ name: 'home' });
    expect(viewFromHash('#/search', ids, false)).toEqual({ name: 'all' });
    expect(viewFromHash('#/search', ids, true)).toEqual({ name: 'search' });
    expect(viewFromHash('', ids, false)).toEqual({ name: 'home' });
    expect(hashOf({ name: 'cat', cat: 'wiki' })).toBe('#/cat/wiki');
    expect(hashOf({ name: 'home' })).toBe('#/');
  });
});

describe('addresses', () => {
  it('allows only http(s) and mailto, and adds https:// to a bare host', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('data:text/html,x')).toBeNull();
    expect(safeUrl('mailto:a@example.com')).toBe('mailto:a@example.com');
    expect(normUrl('example.com/a')).toBe('https://example.com/a');
    expect(normUrl('')).toBe('');
    expect(normUrl('ftp://x')).toBeNull();
    expect(urlKey('https://WWW.Example.com/a/')).toBe('example.com/a');
  });
});

describe('owners text', () => {
  const people: ConsolePerson[] = [
    { email: 'a@try-n.com', name: '가나', name_en: 'Gana', team: '한국팀' },
    { email: 'b@try-n.com', name: '다라', name_en: '', team: '공통' },
  ];

  it('turns names and emails into owner records, matching the people list', () => {
    expect(ownersFromText('가나, b@try-n.com, 외부 사람, c@try-n.com', people)).toEqual([
      { name: '가나', email: 'a@try-n.com' },
      { name: '다라', email: 'b@try-n.com' },
      { name: '외부 사람' },
      { name: 'c', email: 'c@try-n.com' },
    ]);
    expect(ownersFromText('', people)).toEqual([]);
    expect(ownersFromText('가나, 가나', people)).toEqual([{ name: '가나', email: 'a@try-n.com' }]);
  });

  it('shows English names in the English view when known', () => {
    const owners = [{ name: '가나', email: 'a@try-n.com' }, { name: '다라', email: 'b@try-n.com' }];
    expect(ownersText(owners, people, 'en')).toBe('Gana, 다라');
    expect(ownersText(owners, people, 'ko')).toBe('가나, 다라');
  });
});

describe('personal pins (browser storage, per email)', () => {
  it('keeps pins per user, drops unknown ids and caps at eight', () => {
    const live = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    let store: unknown = null;
    store = writePins(store, 'me@try-n.com', ['a', 'zz', 'b']);
    expect(readPins(store, 'me@try-n.com', live)).toEqual(['a', 'b']);
    expect(readPins(store, 'other@try-n.com', live)).toEqual([]);
    store = writePins(store, 'me@try-n.com', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    expect(readPins(store, 'me@try-n.com', live)).toHaveLength(8);
    expect(readPins('garbage', 'me@try-n.com', live)).toEqual([]);
  });
});
