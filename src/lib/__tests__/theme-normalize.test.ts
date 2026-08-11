import { describe, it, expect } from 'vitest';
import { normalizeArticleHtmlForDarkTheme } from '@/lib/blog/theme-normalize';

// Reproduction of the 2026-08-11 report: light-surface inline styles from stored
// blog HTML made text invisible on the dark reading surface.
describe('normalizeArticleHtmlForDarkTheme', () => {
  it('drops light backgrounds (any hex, not a fixed list)', () => {
    const out = normalizeArticleHtmlForDarkTheme(
      `<tr style="background:#faf6ec"><td style="padding:8px;background:#fffdf9">x</td></tr>`
    );
    expect(out).not.toContain('#faf6ec');
    expect(out).not.toContain('#fffdf9');
    expect(out).toContain('padding:8px'); // layout declarations preserved
  });

  it('keeps dark backgrounds (gold table header stays gold with white text)', () => {
    const out = normalizeArticleHtmlForDarkTheme(
      `<th style="background:#b88c2d;color:#fff;padding:8px">선물 상황</th>`
    );
    expect(out).toContain('background:#b88c2d');
    expect(out).toContain('color:#fff');
  });

  it('drops dark text colors that vanish on the dark page', () => {
    const out = normalizeArticleHtmlForDarkTheme(
      `<p style="font-size:13px;color:#7d7570">면책 문구</p><span style="color:#4a3f26">t</span>`
    );
    expect(out).not.toContain('#7d7570');
    expect(out).not.toContain('#4a3f26');
    expect(out).toContain('font-size:13px');
  });

  it('keeps light/gold text colors', () => {
    const out = normalizeArticleHtmlForDarkTheme(`<span style="color:#d4a843">gold</span>`);
    expect(out).toContain('color:#d4a843');
  });

  it('leaves SVG charts untouched (hardcoded palette for their cream panel)', () => {
    const svg = `<svg viewBox="0 0 10 10"><rect style="background:#fffdf9"/><text fill="#332b1a">k</text></svg>`;
    const out = normalizeArticleHtmlForDarkTheme(`<div style="background:#F7F3EE">${svg}</div>`);
    expect(out).toContain('#fffdf9'); // inside svg kept
    expect(out).not.toContain('#F7F3EE'); // wrapper outside svg normalized
  });

  it('fails open on unparseable colors and handles rgb()/3-digit hex', () => {
    const out = normalizeArticleHtmlForDarkTheme(
      `<div style="background:var(--x);color:rgb(250,246,236)"><i style="background:#fff">a</i></div>`
    );
    expect(out).toContain('background:var(--x)');
    expect(out).toContain('color:rgb(250,246,236)'); // light text kept
    expect(out).not.toContain('#fff">'); // light bg dropped
  });
});
