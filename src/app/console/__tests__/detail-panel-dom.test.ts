// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ConsoleListItem } from '@/lib/console/types';
import { AppContext, type AppValue } from '../app-context';
import DetailPanel from '../DetailPanel';
import { UiProvider } from '../ui-context';
import { MEMBER, makeApp, sharedItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-013(복사 흐름), AC-CS2-014(로그인 열기), AC-CS2-015(계정 정보 입력),
// AC-CS2-016(사용 기록 펼침) — 클릭 동작을 jsdom 에서 확인한다. 카나리 값은 지어낸 문자열이다.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CANARY_PW = 'canary-pw-7Q2x';
const CANARY_ID = 'canary-id-k3';

let host: HTMLDivElement;
let root: Root;
let app: AppValue;

function mount(item: ConsoleListItem) {
  app = { ...makeApp(MEMBER, [item]), toast: vi.fn(), writeClipboard: vi.fn(async () => true), requestEdit: vi.fn() };
  act(() => {
    root.render(createElement(UiProvider, { lang: 'ko' }, createElement(AppContext.Provider, { value: app }, createElement(DetailPanel, { item, onClose: () => {} }))));
  });
}

function button(label: string): HTMLButtonElement {
  const b = [...host.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === label || x.textContent?.trim() === label);
  if (!b) throw new Error(`button ${label} not found`);
  return b as HTMLButtonElement;
}

function mockFetch(handler: (url: string, body: Record<string, unknown> | null) => unknown) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
    return new Response(JSON.stringify(handler(url, body)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
}

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

describe('비밀번호 복사 (AC-CS2-013)', () => {
  it('purpose copy 로 요청하고 클립보드에 쓰며 화면·입력 칸에 값을 남기지 않는다', async () => {
    const f = mockFetch(() => ({ value: CANARY_PW }));
    mount(sharedItem({ hide_password: true }));
    await act(async () => {
      button('비밀번호 복사').click();
    });
    expect(f).toHaveBeenCalledTimes(1);
    expect(String(f.mock.calls[0][0])).toBe('/api/console/items/it-1/credential');
    expect(JSON.parse(String(f.mock.calls[0][1]?.body))).toEqual({ field: 'password', purpose: 'copy' });
    expect(app.writeClipboard).toHaveBeenCalledWith(CANARY_PW);
    expect(document.body.textContent).not.toContain(CANARY_PW);
    for (const el of document.querySelectorAll('input, textarea')) expect((el as HTMLInputElement).value).not.toContain(CANARY_PW);
  });
});

describe('로그인 열기 (AC-CS2-014)', () => {
  it('아이디를 copy 로 받아 클립보드에 쓰고, 빈 탭을 열어 opener 를 끊은 뒤 로그인 주소로 보낸다', async () => {
    const f = mockFetch(() => ({ value: CANARY_ID }));
    const tab = { opener: {} as unknown, location: { replace: vi.fn() } };
    const open = vi.spyOn(window, 'open').mockImplementation(() => tab as unknown as Window);
    mount(sharedItem());
    await act(async () => {
      button('로그인 열기').click();
    });
    expect(JSON.parse(String(f.mock.calls[0][1]?.body))).toEqual({ field: 'login_id', purpose: 'copy' });
    expect(app.writeClipboard).toHaveBeenCalledWith(CANARY_ID);
    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(tab.opener).toBeNull();
    expect(tab.location.replace).toHaveBeenCalledWith('https://example.com/login');
    expect(app.toast).toHaveBeenCalledWith('아이디를 복사했어요 — 비밀번호 복사 후 붙여넣으세요', undefined);
  });

  it('새 탭이 막히면 토스트에 로그인 주소 링크를 보인다', async () => {
    mockFetch(() => ({ value: CANARY_ID }));
    vi.spyOn(window, 'open').mockImplementation(() => null);
    mount(sharedItem());
    await act(async () => {
      button('로그인 열기').click();
    });
    expect(app.toast).toHaveBeenCalledWith('아이디를 복사했어요 — 비밀번호 복사 후 붙여넣으세요', expect.objectContaining({ href: 'https://example.com/login' }));
  });

  it('아이디가 없으면 요청 없이 주소만 연다', async () => {
    const f = mockFetch(() => ({}));
    const tab = { opener: {} as unknown, location: { replace: vi.fn() } };
    vi.spyOn(window, 'open').mockImplementation(() => tab as unknown as Window);
    mount(sharedItem({ hasLoginId: false }));
    await act(async () => {
      button('로그인 열기').click();
    });
    expect(f).not.toHaveBeenCalled();
    expect(tab.location.replace).toHaveBeenCalledWith('https://example.com/login');
  });
});

describe('계정 정보 입력 (AC-CS2-015)', () => {
  it('편집 양식을 아이디 칸 초점으로 연다', () => {
    mount(sharedItem({ hasLoginId: false, hasPassword: false, canEdit: true }));
    act(() => button('계정 정보 입력').click());
    expect(app.requestEdit).toHaveBeenCalledWith('it-1', 'id');
  });
});

describe('사용 기록 펼침 (AC-CS2-016)', () => {
  it('패널을 열 때는 요청이 없고, 펼치면 /activity 를 한 번 불러 누가·무엇을 보인다', async () => {
    const f = mockFetch(() => ({
      events: [{ at: '2026-11-15T09:12:00.000Z', actor: '멤버', action: 'copy', field: 'password' }],
    }));
    mount(sharedItem({ canEdit: true }));
    expect(f).not.toHaveBeenCalled();
    const det = host.querySelector('details')!;
    await act(async () => {
      det.open = true;
      det.dispatchEvent(new Event('toggle'));
    });
    expect(f).toHaveBeenCalledTimes(1);
    expect(String(f.mock.calls[0][0])).toBe('/api/console/items/it-1/activity');
    expect(det.textContent).toContain('멤버');
    expect(det.textContent).toContain('복사');
    await act(async () => {
      det.open = false;
      det.dispatchEvent(new Event('toggle'));
      det.open = true;
      det.dispatchEvent(new Event('toggle'));
    });
    expect(f).toHaveBeenCalledTimes(1);
  });
});
