import { describe, expect, it } from 'vitest';
import { badgeTextColor, feedHref } from '../ui-model';

// SPEC-CONSOLE-002 AC-CS2-039 — 채널 배지 글자색의 대비 4.5:1 이상. 대비는 이 테스트 안에서 WCAG 상대 휘도 공식으로
// 따로 계산한다(구현의 계산을 믿지 않는다).

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('badgeTextColor', () => {
  it.each(['#ffffff', '#000000', '#ff0000', '#1f6f5c', '#f2c94c', '#777777', '#3b5998'])('%s → contrast ≥ 4.5', (bg) => {
    const fg = badgeTextColor(bg);
    expect(fg).toMatch(/^#[0-9a-f]{6}$/);
    expect(contrast(bg, fg)).toBeGreaterThanOrEqual(4.5);
  });

  it('accepts upper case and falls back for a malformed colour', () => {
    expect(contrast('#1F6F5C', badgeTextColor('#1F6F5C'))).toBeGreaterThanOrEqual(4.5);
    expect(badgeTextColor('red')).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('feedHref', () => {
  it('keeps http(s) and same-origin paths, refuses everything else', () => {
    expect(feedHref('https://example.com/a')).toBe('https://example.com/a');
    expect(feedHref('/blog/fake-1')).toBe('/blog/fake-1');
    for (const bad of ['javascript:alert(1)', '//evil.example/x', '/\\evil.example', 'data:text/html,x', '', 'blog/x']) expect(feedHref(bad), bad).toBeNull();
  });
});
