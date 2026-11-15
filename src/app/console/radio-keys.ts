import type { KeyboardEvent } from 'react';

// 두세 개짜리 radiogroup 버튼 묶음의 키 처리 (종류 선택, 보기 방식 — SPEC-CONSOLE-002 REQ-CS2-021/022).
// 화살표는 다음·이전으로 돌고, Home·End 는 처음·끝. 그 밖의 키는 null (기본 동작 그대로).
export function nextInGroup<T>(e: KeyboardEvent, current: T, options: readonly T[]): T | null {
  const i = options.indexOf(current);
  const n = options.length;
  let next: T;
  if (e.key === 'Home') next = options[0];
  else if (e.key === 'End') next = options[n - 1];
  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = options[(i + 1) % n];
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = options[(i - 1 + n) % n];
  else return null;
  e.preventDefault();
  return next;
}
