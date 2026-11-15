import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseFeed } from '../feed-parse';

// SPEC-CONSOLE-002 AC-CS2-035 — 의존성 없는 피드 파서(design.md §2.13). 고정 데이터는 research.md §6 의 구조를
// 지어낸 값으로 다시 쓴 것이다.

const fx = (name: string) => readFileSync(path.join(__dirname, 'fixtures/feeds', name), 'utf8');

describe('parseFeed — fixtures', () => {
  it('reads a YouTube channel Atom feed (media:thumbnail inside media:group)', () => {
    const items = parseFeed(fx('youtube-atom.xml'))!;
    expect(items).toHaveLength(15);
    expect(items[0]).toEqual({
      title: '지어낸 영상 1 & 차 이야기',
      url: 'https://www.youtube.com/watch?v=fakevid0001',
      publishedAt: '2026-11-14T01:00:08.000Z',
      thumbSrc: 'https://i2.ytimg.com/vi/fakevid0001/hqdefault.jpg',
    });
  });

  it('reads a Naver blog RSS feed (CDATA, image inside the description, RFC 822 date)', () => {
    const items = parseFeed(fx('naver-rss.xml'))!;
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      title: '침향 차 & 우리는 법',
      url: 'https://blog.naver.com/fakeblog/224000000001?fromRss=true&trackingCode=rss',
      publishedAt: '2026-11-04T01:22:52.000Z',
      // 퍼센트 인코딩은 그대로 둔다
      thumbSrc: 'https://blogthumb.pstatic.net/MjAyNjEx%2FfakeA.png?type=s3',
    });
    expect(items[1].thumbSrc).toBeNull();
  });

  it('reads a generic RSS 2.0 feed (enclosure first, entities decoded)', () => {
    const items = parseFeed(fx('rss2-generic.xml'))!;
    expect(items[0]).toEqual({
      title: "Tea & Wood's guide",
      url: 'https://example.com/posts/tea-wood',
      publishedAt: '2026-11-10T08:00:00.000Z',
      thumbSrc: 'https://example.com/img/a.jpg',
    });
    // 설명이 엔티티로 감싼 HTML 이면 풀고 나서 첫 <img> 를 찾는다
    expect(items[1].thumbSrc).toBe('https://example.com/img/second.jpg');
  });

  it('reads a generic Atom feed (rel=alternate, updated only)', () => {
    const items = parseFeed(fx('atom-generic.xml'))!;
    expect(items[0]).toEqual({
      title: 'Spring notes',
      url: 'https://example.org/journal/spring',
      publishedAt: '2026-11-12T03:04:05.000Z',
      thumbSrc: 'https://example.org/i/spring.webp',
    });
    expect(items[1].url).toBe('https://example.org/journal/related');
  });
});

describe('parseFeed — hostile input', () => {
  const items = parseFeed(fx('hostile.xml'))!;
  const byUrl = (u: string) => items.find((i) => i.url === u);

  it('does not expand entities declared in a DOCTYPE', () => {
    expect(byUrl('https://example.com/entity')?.title).toBe('entity &x; &y; stays');
    expect(JSON.stringify(items)).not.toContain('EXPANDED');
  });

  it('strips tags from titles, drops non-http links and ignores commented-out items', () => {
    expect(byUrl('https://example.com/script')?.title).toBe('ab');
    expect(items.some((i) => i.url.startsWith('javascript:'))).toBe(false);
    expect(byUrl('https://example.com/c')).toBeUndefined();
  });

  it('keeps an undated item after the dated ones and cuts titles to 200 characters', () => {
    expect(items[items.length - 1]).toMatchObject({ url: 'https://example.com/nodate', publishedAt: null });
    expect(items.slice(0, -1).every((i) => i.publishedAt !== null)).toBe(true);
    expect(byUrl('https://example.com/long')?.title).toHaveLength(200);
  });

  it('returns null for something that is not a feed', () => {
    expect(parseFeed('<!doctype html><html><body>Not found</body></html>')).toBeNull();
    expect(parseFeed('')).toBeNull();
  });

  it('adds no dependency (package.json unchanged by this milestone)', () => {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, '../../../../package.json'), 'utf8')) as Record<string, Record<string, string>>;
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const n of ['fast-xml-parser', 'xml2js', 'sax', 'rss-parser', 'jsdom-global', 'linkedom', 'htmlparser2']) expect(names).not.toContain(n);
  });
});
