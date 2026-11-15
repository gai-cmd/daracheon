import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EMPTY_FILTERS, buildNav } from '@/lib/console/ui-model';
import { AccountMenuBody } from '../AccountMenu';
import AutofillGuideDialog from '../AutofillGuideDialog';
import ListView, { type ListState } from '../ListView';
import Sidebar from '../Sidebar';
import { UiProvider } from '../ui-context';
import { ADMIN, CATS, MEMBER, renderWith, sharedItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-012(사이드바 +), AC-CS2-017(공유 계정 보기 표시), AC-CS2-018(계정 메뉴),
// AC-CS2-019(안내 팝업 정적 렌더).
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

describe('공유 계정 보기 (AC-CS2-017)', () => {
  it('각 행에 계정 정보 있음 / 없음을 보인다', () => {
    const items = [
      sharedItem({ id: 'a', title: '가', hasLoginId: false, hasPassword: true }),
      sharedItem({ id: 'b', title: '나', hasLoginId: false, hasPassword: false }),
    ];
    for (const [lang, yes, no] of [
      ['ko', '계정 정보 있음', '계정 정보 없음'],
      ['en', 'Login saved', 'No login yet'],
    ] as const) {
      const html = renderWith(
        createElement(ListView, { view: { name: 'shared' }, title: 't', items, showCat: true, grouped: false, list: LIST, searchQ: '' }),
        { items, lang }
      );
      const rowA = html.slice(html.indexOf('data-id="a"'), html.indexOf('</li>', html.indexOf('data-id="a"')));
      const rowB = html.slice(html.indexOf('data-id="b"'), html.indexOf('</li>', html.indexOf('data-id="b"')));
      expect(rowA).toContain(yes);
      expect(rowB).toContain(no);
    }
  });

  it('다른 보기에는 표시가 없다', () => {
    const items = [sharedItem({ id: 'a' })];
    const html = renderWith(createElement(ListView, { view: { name: 'all' }, title: 't', items, showCat: true, grouped: false, list: LIST, searchQ: '' }), { items });
    expect(html).not.toContain('계정 정보 있음');
  });
});

describe('사이드바 분류 + (AC-CS2-012)', () => {
  const render = (onAddCategory?: () => void) =>
    renderToStaticMarkup(
      createElement(
        UiProvider,
        { lang: 'ko' },
        createElement(Sidebar, { nav: buildNav({ categories: CATS, items: [], me: MEMBER }), current: 'home', onClose: noop, onLang: noop, onAddCategory })
      )
    );
  it('관리자(onAddCategory 있음)에게만 이름 있는 + 버튼', () => {
    expect(render(noop)).toMatch(/<button[^>]*aria-label="분류 추가"/);
    expect(render()).not.toContain('분류 추가');
  });
});

describe('계정 메뉴 (AC-CS2-018)', () => {
  it('자동 입력 끄기 안내 항목이 있다 (멤버·관리자 모두)', () => {
    for (const me of [MEMBER, ADMIN]) {
      const html = renderWith(createElement(AccountMenuBody, { onLang: noop, onAdmin: noop, onSignOut: noop, close: noop }), { me });
      expect(html).toContain('자동 입력 끄기 안내');
    }
  });
});

describe('<AutofillGuideDialog> (AC-CS2-019)', () => {
  const dlg = (browser: 'chrome' | 'safari' | 'other' | 'firefox', mobile = false, lang: 'ko' | 'en' = 'ko') =>
    renderToStaticMarkup(
      createElement(UiProvider, { lang }, createElement(AutofillGuideDialog, { info: { browser, mobile }, onAck: noop, onLater: noop, onCopyAddress: noop }))
    );

  it('설정 주소가 있는 데스크톱은 설정 화면 열기 버튼과 주소가 있다', () => {
    const html = dlg('chrome');
    expect(html).toMatch(/>설정 화면 열기</);
    expect(html).toContain('chrome://password-manager/settings');
    expect(html).toMatch(/<ol[^>]*>[\s\S]*<li/);
  });

  it('Safari·모바일·기타는 버튼 없이 메뉴 경로 단계만', () => {
    for (const [b, m] of [
      ['safari', false],
      ['chrome', true],
      ['other', false],
    ] as const) {
      const html = dlg(b, m);
      expect(html, `${b}/${m}`).not.toContain('설정 화면 열기');
      expect(html, `${b}/${m}`).toMatch(/<ol[^>]*>[\s\S]*<li/);
    }
    expect(dlg('safari')).toContain('자동 완성');
  });

  it('모든 경우에 사이트가 브라우저 설정을 바꿀 수 없다고 적는다', () => {
    for (const b of ['chrome', 'safari', 'other', 'firefox'] as const) {
      expect(dlg(b)).toContain('이 사이트는 브라우저 설정을 직접 바꿀 수 없어요');
      expect(dlg(b, false, 'en')).toContain('This site cannot change your browser settings');
    }
  });

  it('확인했어요와 나중에 버튼', () => {
    const html = dlg('chrome');
    expect(html).toMatch(/>확인했어요</);
    expect(html).toMatch(/>나중에</);
  });
});
