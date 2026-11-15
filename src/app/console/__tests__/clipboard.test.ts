// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeClipboard } from '../clipboard';

// SPEC-CONSOLE-002 AC-CS2-020: 복사 대체 경로의 임시 요소는 aria-hidden·투명이고 복사 직후 사라진다.
// 값이 보이는 요소에 들어가지 않는다.
const SECRET = 'canary-clip-9';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('writeClipboard', () => {
  it('보안 컨텍스트의 클립보드 API 를 먼저 쓴다 (임시 요소 없음)', async () => {
    const writeText = vi.fn(async () => {});
    const ok = await writeClipboard(SECRET, { clipboard: { writeText }, secure: true, doc: document });
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(SECRET);
    expect(document.querySelectorAll('textarea').length).toBe(0);
  });

  it('클립보드 API 가 없으면 보이지 않는 임시 textarea 로 복사하고 바로 지운다', async () => {
    const host = document.createElement('div');
    host.setAttribute('data-admin-root', 'console');
    document.body.append(host);
    let seen: HTMLTextAreaElement | null = null;
    const exec = vi.fn(() => {
      seen = document.querySelector('textarea');
      return true;
    });
    (document as unknown as { execCommand: typeof exec }).execCommand = exec;
    const ok = await writeClipboard(SECRET, { clipboard: undefined, secure: false, doc: document });
    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(seen).not.toBeNull();
    const ta = seen as unknown as HTMLTextAreaElement;
    expect(ta.getAttribute('aria-hidden')).toBe('true');
    expect(ta.style.opacity).toBe('0');
    expect(document.querySelectorAll('textarea[aria-hidden="true"]').length).toBe(0);
    expect(document.body.textContent).not.toContain(SECRET);
  });

  it('클립보드 API 가 거절하면 대체 경로로 넘어간다', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('denied');
    });
    const exec = vi.fn(() => false);
    (document as unknown as { execCommand: typeof exec }).execCommand = exec;
    const ok = await writeClipboard(SECRET, { clipboard: { writeText }, secure: true, doc: document });
    expect(ok).toBe(false);
    expect(exec).toHaveBeenCalled();
    expect(document.querySelectorAll('textarea').length).toBe(0);
  });
});
