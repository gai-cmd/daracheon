// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ConsoleListItem, ConsolePerson } from '@/lib/console/types';
import { AppContext, type AppValue } from '../app-context';
import ItemForm from '../ItemForm';
import { UiProvider } from '../ui-context';
import { MEMBER, makeApp, makeItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-026(영어 화면 저장 본문), AC-CS2-027(담당자 입력 영문 이름). fetch 는 가짜.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const MINE = [{ name: MEMBER.name, email: MEMBER.email }];
const PEOPLE: ConsolePerson[] = [
  { email: MEMBER.email, name: MEMBER.name, name_en: 'Member', team: '한국팀' },
  { email: 'g@try-n.com', name: '가나', name_en: 'Gana', team: '한국팀' },
];

let host: HTMLDivElement;
let root: Root;
let calls: { method: string; body: Record<string, unknown> }[];

function mount(item: ConsoleListItem | null, over: Partial<AppValue> = {}) {
  const app = { ...makeApp(MEMBER, item ? [item] : []), toast: vi.fn(), people: PEOPLE, ...over };
  act(() => {
    root.render(
      createElement(
        UiProvider,
        { lang: 'en' },
        createElement(AppContext.Provider, { value: app }, createElement(ItemForm, { item, defaultCategory: 'cat-1', onCancel: () => {}, onSaved: vi.fn(), onConflict: () => {} }))
      )
    );
  });
}
const $ = <T extends Element>(sel: string) => host.querySelector(sel) as T;
function setValue(el: HTMLInputElement | HTMLTextAreaElement, v: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
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
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
    calls.push({ method: String(init?.method), body: init?.body ? JSON.parse(String(init.body)) : {} });
    return new Response(JSON.stringify({ item: makeItem({ id: 'saved' }) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

describe('영어 화면 저장 (AC-CS2-026)', () => {
  it('새 항목에 영문 제목만 채우면 title·title_en 둘 다 "Alpha"', async () => {
    mount(null);
    act(() => setValue($('#f-title-en'), 'Alpha'));
    await submit();
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].body).toMatchObject({ title: 'Alpha', title_en: 'Alpha' });
  });

  it('두 제목이 모두 비면 요청 0건, f-title-en 에 aria-invalid 와 오류 문구', async () => {
    mount(null);
    await submit();
    expect(calls).toHaveLength(0);
    expect($('#f-title-en').getAttribute('aria-invalid')).toBe('true');
    expect($('#f-title-en-err').textContent).toBe('Enter a title.');
  });

  it('영문 설명만 고쳐 저장하면 한국어 설명은 그대로', async () => {
    const item = makeItem({ canEdit: true, owners: MINE, title: '가나 제목', description: '가나 설명', description_en: '', note: '가나 메모', note_en: '' });
    mount(item);
    act(() => setValue($('#f-desc-en'), 'Gana description'));
    await submit();
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].body).toMatchObject({ title: '가나 제목', description: '가나 설명', description_en: 'Gana description', note: '가나 메모' });
  });

  it('영문 메모·링크 이름을 고치면 그 값을 보내고 한국어 값은 지우지 않는다', async () => {
    const item = makeItem({
      canEdit: true,
      owners: MINE,
      note: '가나 메모',
      note_en: '',
      links: [{ label: '가나 링크', label_en: '', url: 'https://example.com/a' }],
    });
    mount(item);
    act(() => setValue($('#f-note-en'), 'Gana note'));
    act(() => setValue($('input[data-link-label="en"]'), 'Gana link'));
    await submit();
    expect(calls[0].body).toMatchObject({
      note: '가나 메모',
      note_en: 'Gana note',
      links: [{ label: '가나 링크', label_en: 'Gana link', url: 'https://example.com/a' }],
    });
  });
});

describe('담당자 입력 영문 이름 (AC-CS2-027)', () => {
  it('처음 값과 제안 목록이 영문 이름, "Gana" 를 넣으면 그 사람 email 로 저장', async () => {
    mount(makeItem({ canEdit: true, owners: MINE }));
    expect($<HTMLInputElement>('#f-owner').value).toBe('Member');
    const opts = [...host.querySelectorAll('#f-people option')].map((o) => o.getAttribute('value'));
    expect(opts).toEqual(['Member', 'Gana']);
    act(() => setValue($('#f-owner'), 'Member, Gana'));
    await submit();
    expect(calls[0].body.owners).toEqual([
      { name: MEMBER.name, email: MEMBER.email },
      { name: '가나', email: 'g@try-n.com' },
    ]);
  });
});
