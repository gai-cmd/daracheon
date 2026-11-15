import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { EMPTY_FILTERS, initials, type ConsoleMe, type ViewMode } from '@/lib/console/ui-model';
import type { ConsoleCategory, ConsolePerson } from '@/lib/console/types';
import AccountMenu, { AccountMenuBody } from '../AccountMenu';
import DetailPanel from '../DetailPanel';
import ItemForm from '../ItemForm';
import ListView, { type ListState } from '../ListView';
import { CATS, makeApp, makeItem, renderWith } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-027: 영어 화면은 사람을 영문 이름(없으면 한국어 이름, 그다음 email)으로 보인다.
const noop = () => {};
const PEOPLE: ConsolePerson[] = [
  { email: 'a@try-n.com', name: '가나', name_en: 'Gana', team: '한국팀' },
  { email: 'b@try-n.com', name: '다라', name_en: '', team: '한국팀' },
];
const ME: ConsoleMe = { email: 'a@try-n.com', name: '가나', team: '한국팀', isAdmin: false };
const NO_EN_CAT: ConsoleCategory = { ...CATS[1], id: 'cat-2', name: '빈 영문 분류', name_en: '', short: '빈 영문', short_en: '' };
const ITEM = makeItem({
  id: 'n1',
  category: 'cat-2',
  title: '한국어 제목만',
  title_en: '',
  owners: [
    { name: '가나', email: 'a@try-n.com' },
    { name: '다라', email: 'b@try-n.com' },
  ],
  updatedBy: '가나',
  canEdit: true,
});
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
const app = (viewMode: ViewMode = 'list') => ({ ...makeApp(ME, [ITEM]), people: PEOPLE, categories: [...CATS, NO_EN_CAT], viewMode });
const en = (el: Parameters<typeof renderWith>[0], viewMode?: ViewMode) => renderWith(el, { app: app(viewMode), lang: 'en' });

describe('영문 이름 (AC-CS2-027)', () => {
  it('계정 칩 이름 "Gana", 아바타 글자는 initials("Gana")', () => {
    for (const html of [en(createElement(AccountMenu, { onLang: noop, onAdmin: noop, onSignOut: noop })), en(createElement(AccountMenuBody, { onLang: noop, onAdmin: noop, onSignOut: noop, close: noop }))]) {
      expect(html).toContain('>Gana<');
      expect(html).toContain(`>${initials('Gana')}<`);
      expect(html).not.toContain('가나');
    }
  });

  it('한국어 화면 계정 칩은 한국어 이름 그대로', () => {
    const html = renderWith(createElement(AccountMenu, { onLang: noop, onAdmin: noop, onSignOut: noop }), { app: app(), lang: 'ko' });
    expect(html).toContain('>가나<');
  });

  it('목록 행·카드·상세 패널의 담당자: a 는 Gana, b 는 다라', () => {
    const lv = (m: ViewMode) => en(createElement(ListView, { view: { name: 'all' }, title: 't', items: [ITEM], showCat: true, grouped: false, list: LIST, searchQ: '' }), m);
    for (const html of [lv('list'), lv('cards'), en(createElement(DetailPanel, { item: ITEM, onClose: noop }))]) {
      expect(html).toContain('Gana, 다라');
      expect(html).not.toContain('가나, 다라');
    }
  });

  it('상세 패널의 마지막 수정한 사람도 영문 이름', () => {
    const html = en(createElement(DetailPanel, { item: ITEM, onClose: noop }));
    expect(html).toContain('· Gana');
    expect(html).not.toContain('· 가나');
  });

  it('영문 값이 빈 항목·분류는 한국어로 보인다', () => {
    const html = en(createElement(ListView, { view: { name: 'all' }, title: 't', items: [ITEM], showCat: true, grouped: false, list: LIST, searchQ: '' }), 'cards');
    expect(html).toContain('한국어 제목만');
    expect(html).toContain('빈 영문');
  });

  it('편집 양식의 담당자 제안 목록에 "Gana"', () => {
    const html = en(createElement(ItemForm, { item: ITEM, defaultCategory: 'cat-1', onCancel: noop, onSaved: noop, onConflict: noop }));
    const dl = html.slice(html.indexOf('id="f-people"'), html.indexOf('</datalist>'));
    expect(dl).toContain('value="Gana"');
    expect(dl).toContain('value="다라"');
    expect(html).toMatch(/id="f-owner"[^>]*value="Gana, 다라"/);
  });
});
