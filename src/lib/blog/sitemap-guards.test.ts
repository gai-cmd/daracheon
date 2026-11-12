import { describe, expect, it } from 'vitest';
import { isBlogReadSuspect, validDateString } from '@/lib/blog/sitemap-dates';

/** sitemap 가드 — 블로그 읽기 실패 판정, 코드에 적힌 날짜 문자열. */

describe('sitemap 가드', () => {
  it('블로그 DB 가 켜져 있는데 발행 글이 0편이면 읽기 실패로 본다', () => {
    expect(isBlogReadSuspect(true, 0)).toBe(true);
    expect(isBlogReadSuspect(true, 33)).toBe(false);
    // Blob 폴백(DB 미설정)에서는 판정하지 않는다.
    expect(isBlogReadSuspect(false, 0)).toBe(false);
  });

  it('코드에 적힌 날짜 문자열은 유효할 때만 그대로 쓴다', () => {
    expect(validDateString('2026-10-24')).toBe('2026-10-24');
    expect(validDateString('2026-11-12T09:00:00+09:00')).toBe('2026-11-12T09:00:00+09:00');
    expect(validDateString('')).toBeUndefined();
    expect(validDateString(undefined)).toBeUndefined();
    expect(validDateString('soon')).toBeUndefined();
  });
});
