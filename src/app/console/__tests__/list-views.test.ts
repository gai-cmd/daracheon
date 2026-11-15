import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { EMPTY_FILTERS, type ConsoleView, type ViewMode } from '@/lib/console/ui-model';
import type { ConsoleListItem } from '@/lib/console/types';
import HomeView from '../HomeView';
import ListView, { type ListState } from '../ListView';
import { MEMBER, makeApp, makeItem, renderWith, sharedItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-023(보기 방식 컨트롤), AC-CS2-024(목록·카드 내용) — 정적 렌더.
const noop = () => {};
const LIST: ListState = {
  filters: { ...EMPTY_FILTERS },
  setFilter: noop,
  clearFilters: noop,
  sort: { key: null, dir: 1 },
  setSort: noop,
  expanded: new Set(),
  toggleExpanded: noop,
  collapsed: new Set(),
  toggleCollapsed: noop,
};

function list(view: ConsoleView, items: ConsoleListItem[], mode: ViewMode, lang: 'ko' | 'en' = 'ko'): string {
  const app = { ...makeApp(MEMBER, items), viewMode: mode };
  return renderWith(
    createElement(ListView, { view, title: 't', items, showCat: view.name !== 'cat', grouped: false, list: LIST, searchQ: 'q' }),
    { app, lang }
  );
}

/** 보기 방식 radiogroup 의 여는 태그부터 닫는 </div> 까지. */
function toggleOf(html: string): string {
  const i = html.search(/<div[^>]*role="radiogroup"[^>]*aria-label="(보기 방식|View)"/);
  return i < 0 ? '' : html.slice(i, html.indexOf('</div>', i));
}

const ITEMS = [
  makeItem({ id: 'd1', title: '설명 있음', description: '한 줄 설명', url: 'https://www.alpha.example/x' }),
  makeItem({ id: 'd2', title: '주소만', description: '', url: 'https://beta.example/login', access_method: 'sso' }),
  makeItem({ id: 'd3', title: '주소 없음', description: '', url: '', status: 'needs-url' }),
];

describe('보기 방식 컨트롤 (AC-CS2-023)', () => {
  it('radiogroup 하나, 이름 "보기 방식"/"View", radio 두 개, 선택된 쪽만 tabindex 0', () => {
    for (const [lang, name, a, b] of [
      ['ko', '보기 방식', '목록', '카드'],
      ['en', 'View', 'List', 'Cards'],
    ] as const) {
      for (const mode of ['list', 'cards'] as const) {
        const html = list({ name: 'all' }, ITEMS, mode, lang);
        expect(html.match(/role="radiogroup"[^>]*aria-label="(보기 방식|View)"/g)).toHaveLength(1);
        const g = toggleOf(html);
        expect(g).toContain(`aria-label="${name}"`);
        const radios = [...g.matchAll(/<button[^>]*role="radio"[^>]*>(?:<[^>]+>)*([^<]+)/g)];
        expect(radios.map((r) => r[1])).toEqual([a, b]);
        for (const r of radios) {
          const checked = r[0].includes('aria-checked="true"');
          expect(r[0]).toContain(checked ? 'tabindex="0"' : 'tabindex="-1"');
        }
        expect(radios.filter((r) => r[0].includes('aria-checked="true"'))).toHaveLength(1);
        expect(radios[mode === 'list' ? 0 : 1][0]).toContain('aria-checked="true"');
      }
    }
  });

  it('위키, 분류, 공유 계정, 내 항목, 검색 결과에도 같은 컨트롤', () => {
    const views: ConsoleView[] = [{ name: 'cat', cat: 'wiki' }, { name: 'cat', cat: 'cat-1' }, { name: 'shared' }, { name: 'mine' }, { name: 'search' }];
    for (const v of views) expect(toggleOf(list(v, ITEMS, 'cards')), JSON.stringify(v)).not.toBe('');
  });

  it('빈 목록에서도 컨트롤 자리가 있다 (목록 머리 고정)', () => {
    expect(toggleOf(list({ name: 'all' }, [], 'cards'))).not.toBe('');
  });

  it('홈: 최근 수정한 카드 펼침 안에만 있고, 고정 칩·분류별 요약에는 없다', () => {
    const items = [makeItem({ id: 'h1' }), makeItem({ id: 'h2', title: '둘째' })];
    const app = { ...makeApp(MEMBER, items), viewMode: 'cards' as ViewMode, teamPins: ['h1'] };
    const open = renderWith(createElement(HomeView, { recentOpen: true }), { app });
    const closed = renderWith(createElement(HomeView), { app });
    expect(toggleOf(closed)).toBe('');
    expect(closed).toContain('최근 수정한 카드 보기');
    const g = open.search(/role="radiogroup"[^>]*aria-label="보기 방식"/);
    expect(g).toBeGreaterThan(open.indexOf('id="h-recent"'));
    expect(g).toBeLessThan(open.indexOf('id="h-sum"'));
    expect(open.match(/aria-label="보기 방식"/g)).toHaveLength(1);
    expect(open).toMatch(/aria-expanded="true"[^>]*>(?:<[^>]+>)*최근 수정한 카드 보기/);
  });
});

describe('목록 방식 (AC-CS2-024)', () => {
  const html = list({ name: 'all' }, ITEMS, 'list');
  const row = (id: string) => {
    const i = html.indexOf(`data-id="${id}"`);
    return html.slice(i, html.indexOf('</li>', i));
  };

  it('목록 영역은 data-view="list", 카드가 없다', () => {
    expect(html).toContain('data-view="list"');
    expect(html).not.toContain('data-view="cards"');
  });

  it('둘째 줄은 설명, 없으면 호스트, 주소도 없으면 주소 없음', () => {
    expect(row('d1')).toMatch(/rL2[^>]*>(?:<[^>]+>)*한 줄 설명/);
    // 둘째 줄(rL2)에는 호스트가 없다 (주소 링크의 href 는 제목 옆 아이콘·열기 버튼에 그대로 있다)
    const l2 = row('d1').slice(row('d1').indexOf('rL2'));
    expect(l2.slice(0, l2.indexOf('</span></span>'))).not.toContain('alpha.example');
    expect(row('d2')).toMatch(/rL2[^>]*>(?:<[^>]+>)*beta\.example/);
    expect(row('d3')).toContain('주소 미확인');
  });

  it('행마다 브랜드 아이콘·제목·담당자, 직접 버튼은 열기·편집 두 개 이하 + 더 보기', () => {
    for (const id of ['d1', 'd2', 'd3']) {
      const r = row(id);
      expect(r).toContain('bmark');
      expect(r).toContain(`data-open="${id}"`);
      expect(r).toContain('담당');
      // 동작 칸(별표 고정 칸·제목 옆 바깥 링크 아이콘은 SPEC-CONSOLE-001 그대로)
      const act = r.slice(r.indexOf('cAct'));
      const controls = [...act.matchAll(/<(a|button)\b[^>]*aria-label="([^"]*)"/g)].map((m) => m[2]);
      const direct = controls.filter((l) => !l.includes('더 보기'));
      expect(direct.length).toBeLessThanOrEqual(2);
      expect(direct.every((l) => /열기|편집/.test(l))).toBe(true);
      expect(controls.filter((l) => l.includes('더 보기'))).toHaveLength(1);
    }
  });
});

describe('카드 방식 (AC-CS2-024)', () => {
  const html = list({ name: 'all' }, ITEMS, 'cards');
  const card = (id: string) => {
    const i = html.indexOf(`data-id="${id}"`);
    return html.slice(i, html.indexOf('</li>', i));
  };

  it('목록 영역은 data-view="cards"', () => {
    expect(html).toContain('data-view="cards"');
    expect(html).not.toContain('data-view="list"');
  });

  it('카드마다 아이콘·제목 버튼·설명·분류·담당자·더 보기, 주소 있는 카드에만 열기', () => {
    for (const id of ['d1', 'd2', 'd3']) {
      const c = card(id);
      expect(c).toContain('bmark');
      expect(c).toContain(`data-open="${id}"`);
      expect(c).toContain('cardDesc');
      expect(c).toContain('홈페이지');
      expect(c).toContain('담당');
      expect(c).toMatch(/aria-label="[^"]*더 보기[^"]*"/);
    }
    expect(card('d1')).toContain('한 줄 설명');
    expect(card('d1')).toMatch(/<a[^>]*href="https:\/\/www\.alpha\.example\/x"/);
    expect(card('d3')).not.toMatch(/<a[^>]*target="_blank"/);
  });

  it('공개가 아닌 접속 방식에만 접속 방식 표시 하나', () => {
    expect(card('d2').match(/>SSO</g)).toHaveLength(1);
    expect(card('d1')).not.toContain('>공개<');
  });

  it('두 방식의 data-id 순서가 같다', () => {
    const ids = (h: string) => [...h.matchAll(/<li[^>]*data-id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids(html)).toEqual(['d1', 'd2', 'd3']);
    expect(ids(list({ name: 'all' }, ITEMS, 'list'))).toEqual(ids(html));
  });

  it('공유 계정 보기: 두 방식 모두 계정 정보 있음 / 없음', () => {
    const items = [sharedItem({ id: 's1', title: '있음' }), sharedItem({ id: 's2', title: '없음', hasLoginId: false, hasPassword: false })];
    for (const mode of ['list', 'cards'] as const) {
      const h = list({ name: 'shared' }, items, mode);
      expect(h).toContain('계정 정보 있음');
      expect(h).toContain('계정 정보 없음');
    }
  });
});
