// 콘솔 화면 정적 렌더 테스트 도우미 (SPEC-CONSOLE-002 M2). 지어낸 이름·주소만 쓴다.
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WIKI_CATEGORY } from '@/lib/console/categories';
import type { ConsoleLang } from '@/lib/console/i18n';
import type { ConsoleCategory, ConsoleListItem, FeedResponse } from '@/lib/console/types';
import type { ConsoleMe } from '@/lib/console/ui-model';
import { AppContext, type AppValue } from '../app-context';
import { UiProvider } from '../ui-context';

export const CATS: ConsoleCategory[] = [
  { ...WIKI_CATEGORY },
  {
    id: 'cat-1',
    kind: 'resource',
    icon: 'globe',
    name: '홈페이지',
    name_en: 'Websites',
    short: '홈페이지',
    short_en: 'Sites',
    description: '',
    description_en: '',
  },
];

export const MEMBER: ConsoleMe = { email: 'a@try-n.com', name: '멤버', team: '한국팀', isAdmin: false };
export const ADMIN: ConsoleMe = { email: 'admin@try-n.com', name: '관리자', team: '공통', isAdmin: true };

export function makeItem(over: Partial<ConsoleListItem> = {}): ConsoleListItem {
  return {
    id: 'it-1',
    category: 'cat-1',
    type: 'link',
    status: 'ok',
    access_method: 'public',
    visibility: '전체',
    team: '공통',
    owners: [{ name: '담당', email: 'owner@try-n.com' }],
    url: 'https://example.com/login',
    title: '예시 사이트',
    title_en: '',
    description: '',
    description_en: '',
    tags: [],
    links: [],
    version: 1,
    updatedAt: '2026-11-01T00:00:00.000Z',
    updatedBy: '담당',
    hide_password: false,
    hasLoginId: false,
    hasPassword: false,
    canEdit: false,
    credAccess: 'ok',
    ...over,
  };
}

export function sharedItem(over: Partial<ConsoleListItem> = {}): ConsoleListItem {
  return makeItem({ type: 'account', access_method: 'shared-credential', hasLoginId: true, hasPassword: true, ...over });
}

export function makeApp(me: ConsoleMe, items: ConsoleListItem[] = []): AppValue {
  const noop = () => {};
  return {
    me,
    categories: CATS,
    people: [],
    items,
    teamPins: [],
    pins: [],
    panelId: null,
    togglePin: noop,
    setPins: noop,
    openDetail: noop,
    requestEdit: noop,
    startAdd: noop,
    deleteItem: async () => {},
    go: noop,
    toast: noop,
    copyText: noop,
    openMenu: noop,
    openAutofillGuide: noop,
    addCategory: async () => null,
    writeClipboard: async () => true,
    // 보기 방식 (M3). 기존 정적 렌더 테스트는 행을 보므로 목록이 기본이다.
    viewMode: 'list',
    setViewMode: noop,
  };
}

export function renderWith(el: ReactElement, opts: { me?: ConsoleMe; items?: ConsoleListItem[]; lang?: ConsoleLang; app?: AppValue } = {}): string {
  const app = opts.app ?? makeApp(opts.me ?? MEMBER, opts.items ?? []);
  return renderToStaticMarkup(createElement(UiProvider, { lang: opts.lang ?? 'ko' }, createElement(AppContext.Provider, { value: app }, el)));
}

/** `id="..."` 를 가진 요소의 여는 태그. */
export function tagOf(html: string, id: string): string {
  const m = html.match(new RegExp(`<[a-z]+[^>]*\\bid="${id}"[^>]*>`));
  return m ? m[0] : '';
}

/** `#f-more` 영역(그 안의 html)과 바깥 html 로 나눈다. */
export function splitMore(html: string): { outside: string; inside: string } {
  const start = html.indexOf('id="f-more"');
  if (start < 0) return { outside: html, inside: '' };
  const open = html.lastIndexOf('<', start);
  // f-more 는 form 의 마지막 div — 닫는 </form> 직전까지가 안쪽이다.
  const end = html.indexOf('</form>', start);
  return { outside: html.slice(0, open) + html.slice(end), inside: html.slice(open, end) };
}

/** 채널 새 소식 고정 데이터 (SPEC-CONSOLE-002 M4): 채널 3개, 글 20건, 네 번째마다 썸네일 없음. 지어낸 값만. */
export function makeFeed(): FeedResponse {
  const channels: FeedResponse['channels'] = [
    { id: 'ch-a', label: '지어낸 영상', label_en: 'Made-up videos', color: '#c4302b', kind: 'youtube', home: 'https://www.youtube.com/channel/UCfake000000000000000001', ok: true },
    { id: 'ch-b', label: '지어낸 블로그', label_en: 'Made-up blog', color: '#f2c94c', kind: 'naver', home: 'https://blog.naver.com/fakeblog', ok: true },
    { id: 'ch-c', label: '자사 블로그', label_en: '', color: '#1f6f5c', kind: 'zoellife-blog', home: '/blog', ok: true },
  ];
  const items: FeedResponse['items'] = [];
  for (let i = 0; i < 20; i++) {
    const c = channels[i % 3];
    items.push({
      channelId: c.id,
      title: `글 ${String(i + 1).padStart(2, '0')}`,
      url: c.kind === 'zoellife-blog' ? `/blog/fake-${i}` : `https://example.com/p/${i}`,
      publishedAt: new Date(Date.UTC(2026, 10, 14, 23 - i)).toISOString(),
      thumb: i % 4 === 3 ? null : `/api/console/feed/thumb?u=${encodeURIComponent(`https://i2.ytimg.com/vi/fake${i}/hqdefault.jpg`)}`,
    });
  }
  return { channels, items };
}
