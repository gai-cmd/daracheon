// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GUIDE_LATER_KEY } from '@/lib/console/browser-guide';
import ConsoleApp from '../ConsoleApp';
import { CATS, MEMBER, sharedItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-018: 확인하지 않은 사람에게 첫 화면 뒤 한 번 → 나중에(이번 세션 다시 안 뜸)
// → 세션을 비우면 다시 뜸 → 확인했어요(서버 기록) → 다시 안 뜸 → 계정 메뉴로 다시 연다.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  const proto = HTMLDialogElement.prototype as unknown as { showModal?: () => void; close?: () => void };
  if (!proto.showModal) proto.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  if (!proto.close) proto.close = function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
});

let host: HTMLDivElement;
let root: Root;
let ack: boolean;
let posts: { url: string; body: unknown }[];

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  posts = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (init?.method === 'POST') {
      posts.push({ url, body: JSON.parse(String(init.body)) });
      if (url === '/api/console/me/autofill-guide') ack = true;
      return new Response(JSON.stringify({ autofillGuideAck: true }), { status: 200 });
    }
    const boot = { me: MEMBER, categories: CATS, people: [], settings: { teamPins: [] }, items: [sharedItem()], prefs: { autofillGuideAck: ack } };
    return new Response(JSON.stringify(boot), { status: 200 });
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

async function boot() {
  await act(async () => {
    root.render(createElement(ConsoleApp));
  });
  // 자동 표시는 첫 화면 다음 프레임
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });
}
const guideOpen = () => !!host.querySelector('dialog')?.textContent?.includes('이 사이트는 브라우저 설정을 직접 바꿀 수 없어요');
const press = async (label: string) => {
  await act(async () => {
    [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};
async function remount() {
  act(() => root.unmount());
  root = createRoot(host);
  await boot();
}

describe('자동 입력 끄기 안내 자동 표시 (AC-CS2-018)', () => {
  it('처음 → 나중에 → 같은 세션 안 뜸 → 세션 비우면 뜸 → 확인했어요 → 안 뜸 → 계정 메뉴로 연다', async () => {
    ack = false;
    window.sessionStorage.clear();
    await boot();
    expect(guideOpen()).toBe(true);

    await press('나중에');
    expect(guideOpen()).toBe(false);
    expect(window.sessionStorage.getItem(GUIDE_LATER_KEY)).toBe('1');
    expect(posts).toHaveLength(0);

    await remount();
    expect(guideOpen()).toBe(false);

    window.sessionStorage.clear();
    await remount();
    expect(guideOpen()).toBe(true);

    await press('확인했어요');
    expect(posts).toEqual([{ url: '/api/console/me/autofill-guide', body: { version: 1 } }]);
    expect(guideOpen()).toBe(false);

    window.sessionStorage.clear();
    await remount();
    expect(guideOpen()).toBe(false);

    await act(async () => {
      host.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await press('자동 입력 끄기 안내');
    expect(guideOpen()).toBe(true);
  });
});
