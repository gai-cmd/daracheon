import { describe, expect, it } from 'vitest';
import { ICONS, LETTERS, MARKS, brandOf, firstChar } from '../brand-marks';
import { REGULAR_CATEGORY_ICONS, WIKI_CATEGORY } from '../categories';

// SPEC-CONSOLE-001 AC-CON-023 (service marks picked from the address, bundled markup only) and
// AC-CON-026 (the wiki's `library` icon differs from every regular category icon).
describe('brandOf()', () => {
  it.each([
    ['https://www.youtube.com/@example', 'youtube'],
    ['https://youtu.be/abc', 'youtube'],
    ['https://www.instagram.com/example', 'instagram'],
    ['https://drive.google.com/file/d/abc/view', 'drive'],
    ['https://docs.google.com/spreadsheets/u/0/', 'sheets'],
    ['https://docs.google.com/document/u/0/', 'docs'],
    ['https://docs.google.com/presentation/u/0/', 'slides'],
    ['https://analytics.google.com/analytics/web/', 'ga'],
    ['https://search.google.com/search-console', 'gsc'],
    ['https://admin.google.com/', 'gadmin'],
    ['https://mail.google.com/', 'google'],
    ['https://blog.naver.com/example', 'nblog'],
    ['https://smartstore.naver.com/example', 'nstore'],
    ['https://searchadvisor.naver.com/', 'nsearch'],
    ['https://searchad.naver.com/', 'nsearch'],
    ['https://www.naver.com/', 'naver'],
    ['https://app.slack.com/client', 'slack'],
    ['https://github.com/example/repo', 'github'],
    ['https://vercel.com/dashboard', 'vercel'],
    ['https://claude.ai/', 'claude'],
    ['https://chatgpt.com/', 'openai'],
    ['https://www.capcut.com/', 'capcut'],
    ['https://www.midjourney.com/', 'midjourney'],
    ['https://www.bing.com/webmasters', 'bing'],
    ['https://example.app.n8n.cloud/', 'n8n'],
    ['https://zoellife.com/admin', 'zoel'],
    ['https://agarwooding.com/', 'agar'],
    ['https://runwayml.com/', 'runway'],
    ['https://www.d-id.com/', 'did'],
    ['https://klingai.com/', 'kling'],
    ['https://higgsfield.ai/', 'higgsfield'],
  ])('%s -> %s', (url, key) => {
    expect(brandOf(url, '')).toBe(key);
  });

  it('does not match look-alike hosts', () => {
    expect(brandOf('https://notyoutube.com/', '')).toBeNull();
    expect(brandOf('https://youtube.com.evil.io/', '')).toBeNull();
    expect(brandOf('https://example.com/', '')).toBeNull();
  });

  it('ignores non-web schemes and falls back to the title when there is no address', () => {
    expect(brandOf('javascript:alert(1)', '')).toBeNull();
    expect(brandOf('mailto:a@example.com', '')).toBeNull();
    expect(brandOf('', '유튜브 채널')).toBe('youtube');
    expect(brandOf('', 'Kling 계정')).toBe('kling');
    expect(brandOf('', '아무 이름')).toBeNull();
  });

  it('every brand key resolves to a bundled mark or a letter tile', () => {
    for (const k of ['youtube', 'instagram', 'google', 'drive', 'sheets', 'docs', 'slides', 'ga', 'gsc', 'gadmin', 'naver', 'nblog', 'nstore', 'nsearch', 'slack', 'github', 'vercel', 'claude', 'openai', 'capcut', 'midjourney', 'bing', 'n8n']) {
      expect(MARKS[k], k).toBeTruthy();
    }
    for (const k of ['zoel', 'agar', 'runway', 'did', 'kling', 'higgsfield']) expect(LETTERS[k], k).toBeTruthy();
  });
});

describe('bundled markup', () => {
  it('contains no external reference (no URL, no protocol-relative link)', () => {
    for (const [name, markup] of [...Object.entries(ICONS), ...Object.entries(MARKS)]) {
      expect(markup, name).not.toMatch(/https?:|\/\/|xlink:href|<image|<script|on[a-z]+=/i);
    }
  });

  it('has a library icon for the wiki that no regular category uses', () => {
    expect(WIKI_CATEGORY.icon).toBe('library');
    expect(ICONS.library).toBeTruthy();
    for (const icon of REGULAR_CATEGORY_ICONS) {
      expect(ICONS[icon], icon).toBeTruthy();
      expect(ICONS[icon]).not.toBe(ICONS.library);
    }
    expect(REGULAR_CATEGORY_ICONS).not.toContain('library');
  });
});

describe('firstChar()', () => {
  it('takes the first letter or digit, upper-cased, with a dot fallback', () => {
    expect(firstChar('  abc')).toBe('A');
    expect(firstChar('(한글)')).toBe('한');
    expect(firstChar('')).toBe('·');
  });
});
