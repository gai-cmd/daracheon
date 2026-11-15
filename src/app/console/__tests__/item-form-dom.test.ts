// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ConsoleListItem } from '@/lib/console/types';
import { AppContext, type AppValue } from '../app-context';
import ItemForm from '../ItemForm';
import { UiProvider } from '../ui-context';
import { ADMIN, MEMBER, makeApp, makeItem, sharedItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-009(종류 저장 본문·삭제 확인), AC-CS2-011(생성 버튼), AC-CS2-012(새 분류),
// AC-CS2-021(화살표 키) — 양식 동작을 jsdom 에서 확인한다.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  // jsdom 의 <dialog> 는 showModal/close 가 없을 수 있다.
  const proto = HTMLDialogElement.prototype as unknown as { showModal?: () => void; close?: () => void };
  if (!proto.showModal) proto.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  if (!proto.close) proto.close = function (this: HTMLDialogElement) { this.removeAttribute('open'); };
});

// 편집 저장은 담당자 본인이어야 통과한다(SPEC-CONSOLE-001 errOwnerSelf).
const MINE = [{ name: MEMBER.name, email: MEMBER.email }];

let host: HTMLDivElement;
let root: Root;
let app: AppValue;
let calls: { method: string; url: string; body: Record<string, unknown> }[];

function mount(item: ConsoleListItem | null, over: Partial<AppValue> = {}, me = MEMBER) {
  app = { ...makeApp(me, item ? [item] : []), toast: vi.fn(), ...over };
  act(() => {
    root.render(
      createElement(
        UiProvider,
        { lang: 'ko' },
        createElement(AppContext.Provider, { value: app }, createElement(ItemForm, { item, defaultCategory: 'cat-1', onCancel: () => {}, onSaved: vi.fn(), onConflict: () => {} }))
      )
    );
  });
}

const $ = <T extends Element>(sel: string) => host.querySelector(sel) as T;
function radio(label: string): HTMLButtonElement {
  return [...host.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent?.includes(label))!;
}
function setValue(el: HTMLInputElement | HTMLSelectElement, v: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}
async function submit() {
  await act(async () => {
    $<HTMLFormElement>('#item-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  calls = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    calls.push({ method: String(init?.method), url: String(input), body });
    return new Response(JSON.stringify({ item: makeItem({ id: 'saved' }) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

describe('종류 선택 (AC-CS2-009, AC-CS2-021)', () => {
  it('공유 계정을 눌러 저장하면 type account, access_method shared-credential', async () => {
    mount(null);
    act(() => radio('공유 계정').click());
    expect($('#f-id')).not.toBeNull();
    act(() => setValue($('#f-title'), '공유 사이트'));
    await submit();
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toMatchObject({ type: 'account', access_method: 'shared-credential', visibility: '전체', hide_password: false });
  });

  it('화살표 키로 공유 계정으로 바꾸고 초점이 따라간다', () => {
    mount(null);
    const link = radio('링크');
    link.focus();
    act(() => {
      link.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(radio('공유 계정').getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radio('공유 계정'));
  });

  it('공유 대상·숨기기 값이 저장 본문에 들어간다', async () => {
    mount(sharedItem({ canEdit: true, owners: MINE }));
    act(() => $<HTMLInputElement>('input[name="f-share"][value="본인"]').click());
    act(() => $<HTMLInputElement>('#f-hide').click());
    await submit();
    expect(calls[0].body).toMatchObject({ visibility: '본인', hide_password: true, access_method: 'shared-credential' });
  });
});

describe('저장 전 삭제 확인 (AC-CS2-009)', () => {
  it('저장된 계정 정보가 있는 항목을 링크로 저장하면 확인을 먼저 묻고, 취소하면 요청 0건', async () => {
    mount(sharedItem({ canEdit: true, owners: MINE }));
    act(() => radio('링크').click());
    await submit();
    expect(calls).toHaveLength(0);
    expect(host.querySelector('dialog')?.textContent).toContain('저장된 아이디·비밀번호가 영구히 삭제돼요');
    act(() => [...host.querySelectorAll('dialog button')].find((b) => b.textContent === '취소')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(calls).toHaveLength(0);
    expect(host.querySelector('dialog')).toBeNull();
    expect($<HTMLInputElement>('#f-title').value).toBe('예시 사이트');
  });

  it('삭제하고 저장을 누르면 PATCH 1건, 링크 값으로', async () => {
    mount(sharedItem({ canEdit: true, owners: MINE }));
    act(() => radio('링크').click());
    await submit();
    await act(async () => {
      [...host.querySelectorAll('dialog button')].find((b) => b.textContent === '삭제하고 저장')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].body).toMatchObject({ type: 'link', access_method: 'public', hide_password: false });
  });

  it('저장된 계정 정보가 없거나 새 항목이면 묻지 않는다', async () => {
    mount(sharedItem({ canEdit: true, owners: MINE, hasLoginId: false, hasPassword: false }));
    act(() => radio('링크').click());
    await submit();
    expect(calls).toHaveLength(1);
  });
});

describe('비밀번호 생성 (AC-CS2-011)', () => {
  it('생성 버튼은 20자 비밀번호를 채우고 눈 토글을 켠다', () => {
    mount(sharedItem({ canEdit: true, owners: MINE }));
    act(() => $<HTMLButtonElement>('button[aria-label="비밀번호 생성"]').click());
    const pw = $<HTMLInputElement>('#f-pw');
    expect(pw.value).toHaveLength(20);
    expect(pw.type).toBe('text');
  });
});

describe('새 분류 만들기 (AC-CS2-012)', () => {
  it('추가하면 새 분류를 고르고 다른 입력값은 그대로', async () => {
    const addCategory = vi.fn(async () => 'cat-new');
    mount(null, { addCategory }, ADMIN);
    act(() => setValue($('#f-title'), '제목 그대로'));
    await act(async () => setValue($<HTMLSelectElement>('#f-cat'), '__new_category__'));
    expect(addCategory).toHaveBeenCalledTimes(1);
    expect($<HTMLInputElement>('#f-title').value).toBe('제목 그대로');
    await submit();
    expect(calls[0].body).toMatchObject({ category: 'cat-new', title: '제목 그대로' });
  });

  it('취소하면 이전 분류가 남는다', async () => {
    mount(null, { addCategory: vi.fn(async () => null) }, ADMIN);
    act(() => setValue($('#f-title'), '제목'));
    await act(async () => setValue($<HTMLSelectElement>('#f-cat'), '__new_category__'));
    await submit();
    expect(calls[0].body).toMatchObject({ category: 'cat-1' });
  });
});
