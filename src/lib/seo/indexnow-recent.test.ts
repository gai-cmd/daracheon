import { describe, expect, it } from 'vitest';
import { RECENT_WINDOW_MS, recentlyModifiedUrls } from './indexnow';

const NOW = Date.parse('2026-11-27T22:40:00Z');

describe('recentlyModifiedUrls', () => {
  it('최근 창 안에 lastmod 가 있는 URL 만 고른다 (날짜만·ISO·Date 모두)', () => {
    const urls = recentlyModifiedUrls(
      [
        { url: 'https://zoellife.com/naver-live', lastModified: '2026-11-27' },
        { url: 'https://zoellife.com/blog/a', lastModified: '2026-11-27T10:00:00+09:00' },
        { url: 'https://zoellife.com/products/x', lastModified: new Date('2026-11-27T05:00:00Z') },
        { url: 'https://zoellife.com/old', lastModified: '2026-11-20' },
        { url: 'https://zoellife.com/no-date' },
      ],
      NOW,
    );
    expect(urls).toEqual([
      'https://zoellife.com/naver-live',
      'https://zoellife.com/blog/a',
      'https://zoellife.com/products/x',
    ]);
  });

  it('미래 날짜·잘못된 날짜는 보내지 않는다', () => {
    expect(
      recentlyModifiedUrls(
        [
          { url: 'https://zoellife.com/future', lastModified: '2026-11-28T12:00:00Z' },
          { url: 'https://zoellife.com/bad', lastModified: 'not-a-date' },
        ],
        NOW,
      ),
    ).toEqual([]);
  });

  it('창 경계 — 창보다 오래된 항목은 빠진다', () => {
    const edge = new Date(NOW - RECENT_WINDOW_MS - 1000).toISOString();
    expect(recentlyModifiedUrls([{ url: 'https://zoellife.com/edge', lastModified: edge }], NOW)).toEqual([]);
  });
});
