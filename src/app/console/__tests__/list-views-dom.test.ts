// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EMPTY_FILTERS, VIEW_STORAGE_KEY } from '@/lib/console/ui-model';
import ConsoleApp from '../ConsoleApp';
import { AppContext } from '../app-context';
import ListView, { type ListState } from '../ListView';
import { UiProvider } from '../ui-context';
import { CATS, MEMBER, makeApp, makeItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-023(화살표·Home·End), AC-CS2-024(카드 제목 → 상세), AC-CS2-025(저장·기본값·첫 렌더).
// 네트워크 요청은 하지 않는다 — fetch 를 가짜로 바꾼다.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  const proto = HTMLDialogElement.prototype as unknown as { showModal?: () => void; close?: () => void };
  if (!proto.showModal) proto.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  if (!proto.close) proto.close = function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
});

const ITEMS = [makeItem({ id: 'x1', title: '하나' }), makeItem({ id: 'x2', title: '둘', category: 'cat-1' })];

let host: HTMLDivElement;
let root: Root;
const setWidth = (w: number) => Object.defineProperty(window, 'innerWidth', { value: w, configurable: true, writable: true });

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.location.hash = '#/all';
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    const boot = { me: MEMBER, categories: CATS, people: [], settings: { teamPins: [] }, items: ITEMS, prefs: { autofillGuideAck: true } };
    return new Response(JSON.stringify(boot), { status: 200 });
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  setWidth(1024);
});

async function boot() {
  await act(async () => {
    root.render(createElement(ConsoleApp));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
}
const radio = (label: string) => [...host.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent?.trim() === label)!;
const mode = () => host.querySelector('[data-view]')?.getAttribute('data-view');
const key = async (el: Element, k: string) => {
  await act(async () => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  });
};

describe('보기 방식 키보드 (AC-CS2-023)', () => {
  it('오른쪽 화살표 → 카드, 초점 이동 / Home → 목록 / End → 카드', async () => {
    setWidth(375);
    await boot();
    expect(mode()).toBe('list');
    const list = radio('목록');
    list.focus();
    await key(list, 'ArrowRight');
    expect(mode()).toBe('cards');
    expect(radio('카드').getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radio('카드'));
    await key(radio('카드'), 'Home');
    expect(mode()).toBe('list');
    expect(document.activeElement).toBe(radio('목록'));
    await key(radio('목록'), 'End');
    expect(mode()).toBe('cards');
    expect(document.activeElement).toBe(radio('카드'));
  });
});

describe('보기 방식 저장과 처음 값 (AC-CS2-025)', () => {
  it('localStorage 가 예외를 던져도 기본 방식으로 그려지고 오류가 없다', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    setWidth(1280);
    await boot();
    expect(mode()).toBe('cards');
    await act(async () => {
      radio('목록').click();
    });
    expect(mode()).toBe('list');
  });

  it('저장값 목록 + 넓은 화면: 첫 렌더부터 행, 카드가 한 번도 생기지 않는다', async () => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify('list'));
    setWidth(1280);
    let sawCards = false;
    const mo = new MutationObserver(() => {
      if (host.querySelector('[data-view="cards"]')) sawCards = true;
    });
    mo.observe(host, { childList: true, subtree: true, attributes: true });
    await boot();
    mo.disconnect();
    expect(mode()).toBe('list');
    expect(sawCards).toBe(false);
  });

  it('카드로 바꾼 뒤 분류 보기로 옮겨도 카드이고, 저장소에 값이 남는다', async () => {
    setWidth(375);
    await boot();
    expect(mode()).toBe('list');
    await act(async () => {
      radio('카드').click();
    });
    expect(mode()).toBe('cards');
    expect(JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY)!)).toBe('cards');
    await act(async () => {
      window.location.hash = '#/cat/cat-1';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(host.querySelector('h1')?.textContent).toBe('홈페이지');
    expect(mode()).toBe('cards');
  });
});

describe('카드 제목 → 상세 (AC-CS2-024)', () => {
  it('행 제목과 카드 제목이 같은 항목으로 상세 열기를 부른다', async () => {
    const LIST: ListState = {
      filters: { ...EMPTY_FILTERS },
      setFilter: () => {},
      clearFilters: () => {},
      sort: { key: null, dir: 1 },
      setSort: () => {},
      expanded: new Set(),
      toggleExpanded: () => {},
      collapsed: new Set(),
      toggleCollapsed: () => {},
    };
    const opened: string[] = [];
    for (const viewMode of ['list', 'cards'] as const) {
      const app = { ...makeApp(MEMBER, ITEMS), viewMode, openDetail: (id: string) => opened.push(id) };
      act(() => {
        root.render(
          createElement(
            UiProvider,
            { lang: 'ko' },
            createElement(AppContext.Provider, { value: app }, createElement(ListView, { view: { name: 'all' }, title: 't', items: ITEMS, showCat: true, grouped: false, list: LIST, searchQ: '' }))
          )
        );
      });
      expect(mode()).toBe(viewMode);
      await act(async () => {
        host.querySelector<HTMLButtonElement>('[data-open="x2"]')!.click();
      });
    }
    expect(opened).toEqual(['x2', 'x2']);
  });
});
