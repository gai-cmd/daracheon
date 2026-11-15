// Pure view logic of the team console screen (SPEC-CONSOLE-001 REQ-CON-020/025, design.md §3.5, §6).
// Ported from the approved prototype's DOM script so the React components stay presentational and
// the rules (menu order, filters, search, home summary, pins) are unit-tested without a browser.

import { WIKI_CATEGORY, WIKI_CATEGORY_ID, groupNavCategories } from './categories';
import { localized, translate, type ConsoleLang } from './i18n';
import {
  CONSOLE_ACCESS_METHODS,
  type ConsoleAccessMethod,
  type ConsoleCategory,
  type ConsoleItemType,
  type ConsoleListItem,
  type ConsoleOwner,
  type ConsolePerson,
  type ConsoleTeam,
} from './types';

export type ConsoleView =
  | { name: 'home' }
  | { name: 'all' }
  | { name: 'shared' }
  | { name: 'mine' }
  | { name: 'search' }
  | { name: 'cat'; cat: string };

export interface ConsoleMe {
  email: string;
  name: string;
  team: ConsoleTeam;
  isAdmin: boolean;
}

export type AttentionFilter = 'owner' | 'url' | 'any';

export interface ListFilters {
  cat: string | null;
  access: ConsoleAccessMethod | null;
  /** An owner key (see ownerKey) or '__none'. */
  owner: string | null;
  team: ConsoleTeam | null;
  mine: boolean;
  attn: AttentionFilter | null;
}

export const EMPTY_FILTERS: Readonly<ListFilters> = Object.freeze({
  cat: null,
  access: null,
  owner: null,
  team: null,
  mine: false,
  attn: null,
});

export type SortKey = 'name' | 'owner' | 'updated';
export interface SortState {
  key: SortKey | null;
  dir: 1 | -1;
}

export const MAX_PINS = 8;
export const GROUP_ROWS = 8;
export const PIN_STORAGE_KEY = 'zoel-console:pins:v1';

/* ---------- addresses ---------- */

/** Only http(s) and mailto addresses may become a link. */
export function safeUrl(u: unknown): string | null {
  if (typeof u !== 'string' || !u.trim()) return null;
  try {
    const x = new URL(u.trim());
    return ['http:', 'https:', 'mailto:'].includes(x.protocol) ? x.href : null;
  } catch {
    return null;
  }
}

/** Form input to a stored address: '' for blank, https:// added to a bare host, null when not allowed. */
export function normUrl(raw: string): string | null {
  let v = (raw || '').trim();
  if (!v) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v) && /^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(v)) v = 'https://' + v;
  return safeUrl(v) ? v : null;
}

export function hostOf(u: string): string {
  try {
    const x = new URL(u);
    return /^https?:$/.test(x.protocol) ? x.hostname.replace(/^www\./, '') : '';
  } catch {
    return '';
  }
}

/** Duplicate-detection key: the host is case-insensitive, the rest is not (Drive ids are case-sensitive). */
export function urlKey(u: string): string {
  try {
    const x = new URL(u);
    return x.hostname.toLowerCase().replace(/^www\./, '') + x.pathname.replace(/\/+$/, '') + x.search + x.hash;
  } catch {
    return '';
  }
}

/* ---------- people and owners ---------- */

const lower = (s: string) => s.trim().toLowerCase();

export function ownerKey(o: ConsoleOwner): string {
  return o.email ? lower(o.email) : `name:${o.name}`;
}

export function isMine(item: Pick<ConsoleListItem, 'owners'>, email: string): boolean {
  const me = lower(email);
  return (item.owners ?? []).some((o) => !!o.email && lower(o.email) === me);
}

export const noOwner = (item: Pick<ConsoleListItem, 'owners'>) => !(item.owners ?? []).length;

function personOf(o: ConsoleOwner, people: readonly ConsolePerson[]): ConsolePerson | undefined {
  return o.email ? people.find((p) => lower(p.email) === lower(o.email!)) : undefined;
}

export function ownerName(o: ConsoleOwner, people: readonly ConsolePerson[], lang: ConsoleLang): string {
  const p = personOf(o, people);
  return lang === 'en' && p?.name_en ? p.name_en : o.name;
}

export function ownersText(owners: readonly ConsoleOwner[], people: readonly ConsolePerson[], lang: ConsoleLang): string {
  return owners.map((o) => ownerName(o, people, lang)).join(', ');
}

/** Comma-separated names or emails from the form to owner records, matched against the people list. */
export function ownersFromText(text: string, people: readonly ConsolePerson[]): ConsoleOwner[] {
  const out: ConsoleOwner[] = [];
  const seen = new Set<string>();
  for (const raw of (text || '').split(/[,，]/)) {
    const token = raw.trim();
    if (!token) continue;
    let owner: ConsoleOwner;
    if (token.includes('@')) {
      const email = lower(token);
      const p = people.find((x) => lower(x.email) === email);
      owner = p ? { name: p.name, email } : { name: email.slice(0, email.indexOf('@')) || email, email };
    } else {
      const p = people.find((x) => x.name === token || (!!x.name_en && lower(x.name_en) === lower(token)));
      owner = p ? { name: p.name, email: lower(p.email) } : { name: token };
    }
    const k = ownerKey(owner);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(owner);
  }
  return out;
}

/** Filter choices for the owner chip: people who own something first, then any other owner. */
export function ownerOptions(items: readonly ConsoleListItem[], people: readonly ConsolePerson[], lang: ConsoleLang): [string, string][] {
  const out: [string, string][] = [];
  const seen = new Set<string>();
  for (const it of items) {
    for (const o of it.owners ?? []) {
      const k = ownerKey(o);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push([k, ownerName(o, people, lang)]);
    }
  }
  const coll = new Intl.Collator(lang, { sensitivity: 'base', numeric: true });
  return out.sort((a, b) => coll.compare(a[1], b[1]));
}

/* ---------- labels ---------- */

/** One access label per item; none for public items (REQ-CON-020). */
export function accessLabel(lang: ConsoleLang, method: ConsoleAccessMethod): string | null {
  return method === 'public' ? null : translate(lang, `access.${method}`);
}

export function categoryName(lang: ConsoleLang, cat: ConsoleCategory | undefined, long = false): string {
  if (!cat) return '';
  return long ? localized(lang, cat, 'name') : localized(lang, cat, 'short') || localized(lang, cat, 'name');
}

/* ---------- navigation ---------- */

export type NavEntry =
  | {
      type: 'link';
      key: string;
      href: string;
      icon: string;
      /** i18n key for fixed entries; regular categories carry the category instead. */
      labelKey?: string;
      category?: ConsoleCategory;
      count: number | null;
    }
  | { type: 'sep' }
  | { type: 'heading'; labelKey: string };

/**
 * Left menu: home -> all -> divider -> the single Wiki link -> divider -> heading -> regular
 * categories -> divider -> shared -> mine (design.md §3.5, AC-CON-026).
 */
export function buildNav(input: { categories: readonly ConsoleCategory[]; items: readonly ConsoleListItem[]; me: ConsoleMe }): NavEntry[] {
  const { items, me } = input;
  const { regular } = groupNavCategories(input.categories);
  const countCat = (id: string) => items.filter((i) => i.category === id).length;
  return [
    { type: 'link', key: 'home', href: '#/', icon: 'home', labelKey: 'nav.home', count: null },
    { type: 'link', key: 'all', href: '#/all', icon: 'list', labelKey: 'nav.all', count: items.length },
    { type: 'sep' },
    {
      type: 'link',
      key: `cat:${WIKI_CATEGORY_ID}`,
      href: `#/cat/${WIKI_CATEGORY_ID}`,
      icon: WIKI_CATEGORY.icon,
      labelKey: 'nav.wiki',
      count: countCat(WIKI_CATEGORY_ID),
    },
    { type: 'sep' },
    { type: 'heading', labelKey: 'nav.cats' },
    ...regular.map(
      (c): NavEntry => ({ type: 'link', key: `cat:${c.id}`, href: `#/cat/${c.id}`, icon: c.icon, category: c, count: countCat(c.id) })
    ),
    { type: 'sep' },
    {
      type: 'link',
      key: 'shared',
      href: '#/shared',
      icon: 'key',
      labelKey: 'nav.shared',
      count: items.filter((i) => i.access_method === 'shared-credential').length,
    },
    { type: 'link', key: 'mine', href: '#/mine', icon: 'user', labelKey: 'nav.mine', count: items.filter((i) => isMine(i, me.email)).length },
  ];
}

export function viewKey(v: ConsoleView): string {
  return v.name === 'cat' ? `cat:${v.cat}` : v.name;
}

/* ---------- routing ---------- */

export function viewFromHash(hash: string, categoryIds: ReadonlySet<string>, hasSearch: boolean): ConsoleView {
  let s = '';
  try {
    s = decodeURIComponent((hash || '').replace(/^#/, ''));
  } catch {
    // malformed
  }
  if (s === '/all' || s === '/shared' || s === '/mine') return { name: s.slice(1) as 'all' | 'shared' | 'mine' };
  if (s === '/search') return hasSearch ? { name: 'search' } : { name: 'all' };
  const m = s.match(/^\/cat\/([a-z0-9-]{1,40})$/);
  if (m && categoryIds.has(m[1])) return { name: 'cat', cat: m[1] };
  return { name: 'home' };
}

export function hashOf(v: ConsoleView): string {
  return v.name === 'home' ? '#/' : v.name === 'cat' ? `#/cat/${v.cat}` : `#/${v.name}`;
}

/* ---------- search ---------- */

/** Search synonyms: typing any one finds items labelled with the others. */
const ALIASES: readonly string[][] = [
  ['ga', 'ga4', '애널리틱스', '구글애널리틱스', 'analytics', 'googleanalytics'],
  ['스마트스토어', 'smartstore', '판매자센터', 'sellercenter'],
  ['서치콘솔', 'searchconsole', 'gsc', '구글서치콘솔'],
  ['서치어드바이저', 'searchadvisor', '웹마스터', 'webmaster'],
  ['인스타', '인스타그램', 'instagram', 'insta', 'ig'],
  ['유튜브', 'youtube', 'yt'],
  ['드라이브', 'drive', '구글드라이브', '공유드라이브', 'shareddrive'],
  ['시트', '스프레드시트', 'sheet', 'sheets', 'spreadsheet'],
  ['슬랙', 'slack'],
  ['클로드', 'claude'],
  ['챗gpt', '챗지피티', 'chatgpt', 'openai'],
  ['버셀', 'vercel'],
  ['캡컷', 'capcut'],
  ['미드저니', 'midjourney'],
  ['네이버', 'naver'],
  ['홈쇼핑', 'homeshopping', 'ns홈쇼핑', 'nsmall'],
  ['워크숍', '워크샵', 'workshop', '스튜디오', 'studio'],
  ['깃허브', 'github', '저장소', 'repository', 'repo'],
  ['논문', 'paper', 'papers', 'thesis'],
  ['위키', 'wiki', '자료실', 'library'],
];

const norm = (s: string) => String(s || '').toLowerCase().replace(/\s+/g, '');
const wordsOf = (s: string) => new Set(String(s || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));

interface SearchCtx {
  categories: readonly ConsoleCategory[];
  people: readonly ConsolePerson[];
}

function hayRaw(c: ConsoleListItem, ctx: SearchCtx): string {
  const cat = ctx.categories.find((x) => x.id === c.category);
  const owners = (c.owners ?? []).flatMap((o) => [o.name, personOf(o, ctx.people)?.name_en ?? '']);
  return [
    c.title,
    c.title_en,
    hostOf(c.url),
    cat?.name,
    cat?.name_en,
    cat?.short,
    cat?.short_en,
    ...owners,
    c.team,
    translate('en', `teams.${c.team}`),
    ...(c.tags ?? []),
    ...(c.links ?? []).flatMap((l) => [l.label, l.label_en, hostOf(l.url)]),
  ]
    .filter(Boolean)
    .join(' | ');
}

function targetsOf(term: string): [string, boolean][] {
  const g = ALIASES.find((a) => a.includes(term));
  // Short synonyms (ga, gsc, yt) must match a whole word.
  return g ? g.map((x) => [x, x.length <= 3]) : [[term, false]];
}

/** Items matching every search term, best match first (title prefix > title > anywhere). */
export function searchItems(q: string, items: readonly ConsoleListItem[], ctx: SearchCtx): ConsoleListItem[] {
  const qn = norm(q);
  if (!qn) return [];
  const whole = ALIASES.some((a) => a.includes(qn));
  const terms = whole ? [targetsOf(qn)] : q.toLowerCase().split(/\s+/).filter(Boolean).map((x) => targetsOf(x));
  const out: { c: ConsoleListItem; score: number; i: number }[] = [];
  items.forEach((c, i) => {
    const raw = hayRaw(c, ctx);
    const hs = norm(raw);
    const hw = wordsOf(raw);
    const tl = norm(`${c.title}|${c.title_en || ''}`);
    const hit = ([x, word]: [string, boolean]) => (word ? hw.has(x) : hs.includes(x));
    let score = 0;
    for (const tg of terms) {
      if (!tg.some(hit)) return;
      score += tg.some(([x, w]) => !w && tl.startsWith(x)) ? 4 : tg.some(([x, w]) => !w && tl.includes(x)) ? 3 : 1;
    }
    out.push({ c, score, i });
  });
  return out.sort((a, b) => b.score - a.score || a.i - b.i).map((r) => r.c);
}

/* ---------- lists ---------- */

export function itemsForView(
  view: ConsoleView,
  items: readonly ConsoleListItem[],
  ctx: { me: ConsoleMe; searchQ: string; categories: readonly ConsoleCategory[]; people: readonly ConsolePerson[] }
): ConsoleListItem[] {
  switch (view.name) {
    case 'cat':
      return items.filter((c) => c.category === view.cat);
    case 'shared':
      return items.filter((c) => c.access_method === 'shared-credential');
    case 'mine':
      return items.filter((c) => isMine(c, ctx.me.email));
    case 'search':
      return searchItems(ctx.searchQ, items, ctx);
    default:
      return items.slice();
  }
}

export function hasActiveFilter(f: ListFilters): boolean {
  return !!(f.cat || f.access || f.owner || f.team || f.mine || f.attn);
}

export function applyFilters(items: readonly ConsoleListItem[], f: ListFilters, me: ConsoleMe): ConsoleListItem[] {
  return items.filter(
    (c) =>
      (!f.cat || c.category === f.cat) &&
      (!f.access || c.access_method === f.access) &&
      (!f.owner || (f.owner === '__none' ? noOwner(c) : (c.owners ?? []).some((o) => ownerKey(o) === f.owner))) &&
      (!f.team || c.team === f.team) &&
      (!f.mine || isMine(c, me.email)) &&
      (!f.attn || (f.attn === 'owner' ? noOwner(c) : f.attn === 'url' ? !c.url : noOwner(c) || !c.url))
  );
}

export function sortItems(
  items: readonly ConsoleListItem[],
  sort: SortState,
  lang: ConsoleLang,
  people: readonly ConsolePerson[]
): ConsoleListItem[] {
  const { key, dir } = sort;
  if (!key) return items.slice();
  const order = new Map(items.map((c, i) => [c.id, i]));
  const coll = new Intl.Collator(lang, { sensitivity: 'base', numeric: true });
  return items.slice().sort((a, b) => {
    let r: number;
    if (key === 'updated') r = (Date.parse(a.updatedAt) || 0) - (Date.parse(b.updatedAt) || 0);
    else if (key === 'owner') {
      const x = ownersText(a.owners ?? [], people, lang);
      const y = ownersText(b.owners ?? [], people, lang);
      if (!x !== !y) return x ? -1 : 1;
      r = coll.compare(x, y);
    } else r = coll.compare(localized(lang, a, 'title'), localized(lang, b, 'title'));
    return r * dir || order.get(a.id)! - order.get(b.id)!;
  });
}

/** Empty-state message key of a list view. */
export function emptyStateKey(view: ConsoleView, filtered: boolean): string {
  if (filtered) return 'emptyList';
  switch (view.name) {
    case 'cat':
      return view.cat === WIKI_CATEGORY_ID ? 'wiki.empty' : 'emptyCat';
    case 'shared':
      return 'emptyShared';
    case 'mine':
      return 'emptyMine';
    case 'search':
      return 'noResults';
    default:
      return 'emptyList';
  }
}

/* ---------- home ---------- */

export function recentItems(items: readonly ConsoleListItem[]): ConsoleListItem[] {
  return items
    .map((c, i) => [c, i] as const)
    .sort((a, b) => (Date.parse(b[0].updatedAt) || 0) - (Date.parse(a[0].updatedAt) || 0) || a[1] - b[1])
    .map((x) => x[0]);
}

export interface HomeSummaryCell {
  category: ConsoleCategory;
  count: number;
  reps: ConsoleListItem[];
}

/** Per-category summary of the regular categories only (the wiki is never counted here). */
export function homeSummary(
  categories: readonly ConsoleCategory[],
  items: readonly ConsoleListItem[],
  teamPins: readonly string[]
): HomeSummaryCell[] {
  const rank = (id: string) => {
    const i = teamPins.indexOf(id);
    return i < 0 ? 99 : i;
  };
  return groupNavCategories(categories).regular.map((category) => {
    const its = items.filter((c) => c.category === category.id);
    const reps = its
      .map((c, i) => [c, i] as const)
      .sort((a, b) => rank(a[0].id) - rank(b[0].id) || a[1] - b[1])
      .slice(0, 3)
      .map((x) => x[0]);
    return { category, count: its.length, reps };
  });
}

export function attentionCounts(items: readonly ConsoleListItem[]): { noOwner: number; noUrl: number } {
  return { noOwner: items.filter(noOwner).length, noUrl: items.filter((c) => !c.url).length };
}

/* ---------- personal pins (browser storage keyed by email, design.md §6.3) ---------- */

export function readPins(store: unknown, email: string, live: ReadonlySet<string>): string[] {
  if (!store || typeof store !== 'object' || Array.isArray(store)) return [];
  const a = (store as Record<string, unknown>)[lower(email)];
  return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && live.has(x)).slice(0, MAX_PINS) : [];
}

export function writePins(store: unknown, email: string, ids: readonly string[]): Record<string, string[]> {
  const base = store && typeof store === 'object' && !Array.isArray(store) ? (store as Record<string, string[]>) : {};
  return { ...base, [lower(email)]: ids.slice(0, MAX_PINS) };
}

/* ---------- time ---------- */

export function relTime(lang: ConsoleLang, iso: string, short = false, now = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Math.min(0, (d.getTime() - now) / 1000); // a clock behind the data reads as "now"
  const a = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: short ? 'short' : 'long' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [u, s] of units) if (a >= s) return rtf.format(Math.round(diff / s), u);
  return rtf.format(0, 'second');
}

export function absTime(lang: ConsoleLang, iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function initials(name: string): string {
  const s = (name || '').replace(/\s+/g, '');
  if (/[가-힣]/.test(s)) return s.length > 2 ? s.slice(-2) : s;
  const w = (name || '').split(/[\s._-]+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : s.slice(0, 2)).toUpperCase();
}

/* ---------- 보기 방식 (SPEC-CONSOLE-002 REQ-CS2-022~024, design.md §2.8) ---------- */

/** 항목 목록을 그리는 두 방식. 브라우저 하나에 하나만 기억한다. */
export type ViewMode = 'list' | 'cards';
export const VIEW_STORAGE_KEY = 'zoel-console:view';

/** 저장값이 'list'·'cards' 면 그 값, 아니면 폭 480px 이하에서 목록, 그보다 넓으면 카드. */
export function resolveViewMode(stored: unknown, width: number): ViewMode {
  if (stored === 'list' || stored === 'cards') return stored;
  return width > 480 ? 'cards' : 'list';
}

/* ---------- 영어 화면의 이름과 양식 (SPEC-CONSOLE-002 REQ-CS2-025/026, design.md §2.9) ---------- */

/** 사람 한 명의 화면 이름. 영어 화면이면 사람 목록의 name_en, 없으면 한국어 이름, 그다음 email. */
export function personName(email: string, fallbackName: string, people: readonly ConsolePerson[], lang: ConsoleLang): string {
  if (lang === 'en') {
    const p = people.find((x) => lower(x.email) === lower(email));
    if (p?.name_en) return p.name_en;
  }
  return fallbackName || email;
}

/** 이름만 저장된 표시(마지막 수정한 사람 등). 영어 화면에서 사람 목록의 한국어 이름과 정확히 같으면 영문 이름. */
export function nameLabel(label: string, people: readonly ConsolePerson[], lang: ConsoleLang): string {
  if (lang !== 'en' || !label) return label;
  return people.find((x) => x.name === label)?.name_en || label;
}

/** 영어 화면 저장 제목. 한국어 제목이 비면 영문 제목을 한국어 제목으로도 보낸다. 둘 다 비면 null (CS2-D16). */
export function enFormTitles(title: string, titleEn: string): { title: string; title_en: string } | null {
  const ko = title.trim();
  const en = titleEn.trim();
  if (!ko && !en) return null;
  return { title: ko || en, title_en: en };
}

/* ---------- 추가·편집 양식의 종류 선택 (SPEC-CONSOLE-002 REQ-CS2-009, design.md §2.3) ---------- */

/** 양식 맨 위 두 갈래: 링크 / 공유 계정. 저장 칸은 기존 type·access_method 다. */
export type ItemKind = 'link' | 'shared';

/** 형식과 접속 방식 한 쌍. 종류를 바꿀 때 함께 바뀌는 저장 칸. */
export interface KindFields {
  type: ConsoleItemType;
  access_method: ConsoleAccessMethod;
}

/** 링크일 때 고를 수 있는 접속 방식(공유 계정 제외, REQ-CS2-010). */
export const LINK_ACCESS_METHODS: readonly ConsoleAccessMethod[] = CONSOLE_ACCESS_METHODS.filter((m) => m !== 'shared-credential');

export function kindOf(item: Pick<ConsoleListItem, 'access_method'> | null): ItemKind {
  return item?.access_method === 'shared-credential' ? 'shared' : 'link';
}

/** 양식이 기억하는 "링크일 때의 형식·접속 방식" 처음 값. 링크였던 적이 없으면 link·public (CS2-D12). */
export function linkMemoryFor(item: KindFields | null): KindFields {
  return item && item.access_method !== 'shared-credential' ? { type: item.type, access_method: item.access_method } : { type: 'link', access_method: 'public' };
}

/**
 * 종류를 바꾼 결과. 공유 계정으로 갈 때 지금의 링크 값을 기억하고 account·shared-credential 로,
 * 링크로 돌아올 때 기억해 둔 값을 되살린다. 같은 종류를 다시 고르면 그대로.
 */
export function applyKind(cur: KindFields, kind: ItemKind, memory: KindFields): { state: KindFields; memory: KindFields } {
  const isShared = cur.access_method === 'shared-credential';
  if (kind === 'shared') {
    if (isShared) return { state: cur, memory };
    return { state: { type: 'account', access_method: 'shared-credential' }, memory: { type: cur.type, access_method: cur.access_method } };
  }
  return isShared ? { state: { ...memory }, memory } : { state: cur, memory };
}

/** 저장된 아이디·비밀번호가 있는 항목을 링크로 저장하려 할 때만 삭제 확인을 받는다 (CS2-D11). */
export function needsCredDeleteConfirm(item: Pick<ConsoleListItem, 'hasLoginId' | 'hasPassword'> | null, kind: ItemKind): boolean {
  return !!item && kind === 'link' && (item.hasLoginId || item.hasPassword);
}

/** 공유 계정 항목에 아이디나 비밀번호가 저장돼 있는지 (REQ-CS2-015/017). */
export function hasCredential(item: Pick<ConsoleListItem, 'hasLoginId' | 'hasPassword'>): boolean {
  return item.hasLoginId || item.hasPassword;
}

/* ---------- 채널 새 소식 (SPEC-CONSOLE-002 REQ-CS2-037·038, design.md §2.15) ---------- */

function relLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** WCAG 대비 (두 '#rrggbb' 색). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const BADGE_INK = '#1c1b18';

/**
 * 채널 배지 글자색: 콘솔 잉크색과 흰색 중 채널 색과 대비가 큰 쪽. 그래도 4.5:1 에 못 미치는 중간 밝기 색에서는
 * 순수 검정(어떤 배경에서도 흰색과 검정 중 하나는 4.58:1 이상)을 쓴다. 형식이 틀린 색은 회색으로 본다.
 */
export function badgeTextColor(bg: string): string {
  const color = /^#[0-9a-fA-F]{6}$/.test(bg) ? bg.toLowerCase() : '#777777';
  const best = contrastRatio(color, '#ffffff') >= contrastRatio(color, BADGE_INK) ? '#ffffff' : BADGE_INK;
  return contrastRatio(color, best) >= 4.5 ? best : '#000000';
}

/** 피드 항목 주소: http(s) 또는 같은 출처 경로('/…', '//'·'/\' 제외)만. 통과하면 받은 값을 그대로 돌려준다. */
export function feedHref(u: unknown): string | null {
  if (typeof u !== 'string' || !u) return null;
  if (u.startsWith('/')) return /^\/[^/\\]/.test(u) ? u : null;
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:' ? u : null;
  } catch {
    return null;
  }
}
