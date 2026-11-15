// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AppContext } from '../app-context';
import HomeView from '../HomeView';
import { UiProvider } from '../ui-context';
import { MEMBER, makeApp, makeFeed, makeItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-038(칩 거르기, 펼침), AC-CS2-039(칩 키보드). 네트워크 요청은 하지 않는다 — fetch 는 가짜.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
const ITEMS = Array.from({ length: 8 }, (_, i) => makeItem({ id: `r${i}`, title: `카드 ${i}`, updatedAt: new Date(Date.UTC(2026, 10, i + 1)).toISOString() }));

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify(makeFeed()), { status: 200 }));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

async function mount() {
  const app = makeApp(MEMBER, ITEMS);
  await act(async () => {
    root.render(createElement(UiProvider, { lang: 'ko' }, createElement(AppContext.Provider, { value: app }, createElement(HomeView))));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
}
const tiles = () => [...host.querySelectorAll<HTMLAnchorElement>('[data-tile]')];
const chip = (label: string) => [...host.querySelectorAll<HTMLButtonElement>('[role="radiogroup"][aria-label="채널"] [role="radio"]')].find((b) => b.textContent?.trim() === label)!;

describe('채널 새 소식 (jsdom)', () => {
  it('마운트할 때 피드를 한 번 부르고 전체에서 타일 12개를 그린다', async () => {
    await mount();
    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(calls.filter(([u]) => String(u) === '/api/console/feed')).toHaveLength(1);
    expect(tiles()).toHaveLength(12);
  });

  it('채널 칩을 누르면 그 채널 타일만 (6개 이하) 남는다', async () => {
    await mount();
    await act(async () => chip('지어낸 블로그').click());
    const t = tiles();
    expect(t.length).toBeGreaterThan(0);
    expect(t.length).toBeLessThanOrEqual(6);
    for (const a of t) expect(a.textContent).toContain('지어낸 블로그');
    expect(chip('지어낸 블로그').getAttribute('aria-checked')).toBe('true');
    expect(chip('전체').getAttribute('aria-checked')).toBe('false');
  });

  it('칩은 화살표·Home·End 로 고르고 선택된 칩만 탭 순서에 있다', async () => {
    await mount();
    const all = chip('전체');
    expect(all.tabIndex).toBe(0);
    expect(chip('지어낸 영상').tabIndex).toBe(-1);
    all.focus();
    await act(async () => all.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(chip('지어낸 영상').getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(chip('지어낸 영상'));
    await act(async () => chip('지어낸 영상').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })));
    expect(chip('자사 블로그').getAttribute('aria-checked')).toBe('true');
    await act(async () => chip('자사 블로그').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
    expect(chip('전체').getAttribute('aria-checked')).toBe('true');
  });

  it('"최근 수정한 카드 보기" 를 누르면 펼쳐지고 최근 수정 6개와 보기 전환이 나온다', async () => {
    await mount();
    const btn = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('최근 수정한 카드 보기'))!;
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    await act(async () => btn.click());
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelectorAll('[data-id^="r"]')).toHaveLength(6);
    expect(host.querySelector('[role="radiogroup"][aria-label="보기 방식"]')).not.toBeNull();
  });

  it('피드 요청이 실패하면 구역 안에 오류와 다시 시도', async () => {
    (globalThis.fetch as unknown as { mockImplementation: (f: () => Promise<Response>) => void }).mockImplementation(async () => new Response('{}', { status: 500 }));
    await mount();
    expect(host.querySelector('section[aria-labelledby="h-feed"]')?.textContent).toContain('다시 시도');
  });
});
