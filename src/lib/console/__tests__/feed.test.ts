import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// SPEC-CONSOLE-002 AC-CS2-032(모으기·실패 격리), AC-CS2-033(캐시), AC-CS2-036(자사 블로그·인스타그램),
// AC-CS2-037 마지막 항목(피드의 thumb 값). 진짜 네트워크·DNS·블로그 저장소는 쓰지 않는다.

vi.mock('node:dns/promises', () => ({ lookup: vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]) }));
vi.mock('@/lib/db', () => ({ publicBlobHost: () => 'fakeblob.public.blob.vercel-storage.com', readSingleUncached: vi.fn(async () => null) }));
vi.mock('@/lib/blog/store', () => ({ readLatestPublishedPostsSafe: vi.fn(async () => []) }));

import { buildFeed, clearFeedCache, thumbAllowed, THUMB_PATH, type FeedDeps } from '../feed';
import type { ConsoleChannel } from '../types';

const fx = (name: string) => readFileSync(path.join(__dirname, 'fixtures/feeds', name), 'utf8');
const YT = 'UCfake000000000000000001';
const BLOB = 'fakeblob.public.blob.vercel-storage.com';

let order = 0;
const ch = (id: string, kind: ConsoleChannel['kind'], source: string, over: Partial<ConsoleChannel> = {}): ConsoleChannel => ({
  id,
  label: `채널 ${id}`,
  label_en: `Channel ${id}`,
  kind,
  source,
  color: '#1f6f5c',
  enabled: true,
  order: order++,
  ...over,
});

const posts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    slug: `fake-post-${i + 1}`,
    title: `지어낸 글 ${i + 1}`,
    publishedAt: new Date(Date.UTC(2026, 10, 14, 12 - i)).toISOString(),
    createdAt: '2026-01-01T00:00:00.000Z',
    coverImage: i === 0 ? `https://${BLOB}/blog/a.jpg` : i === 1 ? '/images/local.jpg' : `https://evil.example/c.jpg`,
  }));

type FetchFn = NonNullable<FeedDeps['fetchImpl']>;
function router(routes: Record<string, () => Response | Promise<Response>>) {
  return vi.fn<FetchFn>(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    const key = Object.keys(routes).find((k) => u.startsWith(k));
    if (!key) throw new Error(`unexpected fetch ${u}`);
    const r = routes[key];
    if (r === hang) {
      return new Promise<Response>((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))));
    }
    return r();
  });
}
const hang = () => new Response('');
const xml = (body: string) => () => new Response(body, { status: 200, headers: { 'content-type': 'application/xml' } });

let clock = Date.UTC(2026, 10, 15, 0, 0, 0);
const now = () => clock;

beforeEach(() => {
  clearFeedCache();
  clock = Date.UTC(2026, 10, 15, 0, 0, 0);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('buildFeed — aggregation and failure isolation (AC-CS2-032)', () => {
  it('returns enabled channels in order, isolates failing sources and sorts items newest first', async () => {
    const channels = [
      ch('yt', 'youtube', YT),
      ch('nv', 'naver', 'fakeslow'),
      ch('rs', 'rss', 'https://example.com/feed.xml'),
      ch('zb', 'zoellife-blog', ''),
      ch('off', 'naver', 'fakeoff', { enabled: false }),
    ];
    const fetchImpl = router({
      'https://www.youtube.com/feeds/videos.xml': xml(fx('youtube-atom.xml')),
      'https://rss.blog.naver.com/fakeslow.xml': hang,
      'https://example.com/feed.xml': () => new Response('err', { status: 500 }),
    });
    const r = await buildFeed(channels, { fetchImpl, now, timeoutMs: 20, readBlog: async () => posts(3) });
    expect(r.channels.map((c) => [c.id, c.ok, c.error])).toEqual([
      ['yt', true, undefined],
      ['nv', false, 'timeout'],
      ['rs', false, 'http_status'],
      ['zb', true, undefined],
    ]);
    expect(r.channels[0]).toMatchObject({ label: '채널 yt', label_en: 'Channel yt', color: '#1f6f5c', kind: 'youtube', home: `https://www.youtube.com/channel/${YT}` });
    expect(r.items.filter((i) => i.channelId === 'yt')).toHaveLength(6);
    expect(r.items.filter((i) => i.channelId === 'zb')).toHaveLength(3);
    expect(r.items).toHaveLength(9);
    const times = r.items.map((i) => Date.parse(i.publishedAt!));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    for (const i of r.items) expect(Object.keys(i).sort()).toEqual(['channelId', 'publishedAt', 'thumb', 'title', 'url']);
    expect(fetchImpl.mock.calls.some(([u]) => String(u).includes('fakeoff'))).toBe(false);
  });

  it('marks unparseable content as parse_error and a non-https feed source as not_allowed', async () => {
    const fetchImpl = router({ 'https://example.com/page': () => new Response('<html>nope</html>', { status: 200 }) });
    const r = await buildFeed([ch('a', 'rss', 'https://example.com/page'), ch('b', 'rss', 'http://example.com/feed')], { fetchImpl, now });
    expect(r.channels.map((c) => c.error)).toEqual(['parse_error', 'not_allowed']);
  });

  it('fetches a source shared by two channels only once', async () => {
    const fetchImpl = router({ 'https://www.youtube.com/feeds/videos.xml': xml(fx('youtube-atom.xml')) });
    const r = await buildFeed([ch('a', 'youtube', YT), ch('b', 'youtube', YT)], { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(r.items.filter((i) => i.channelId === 'b')).toHaveLength(6);
  });
});

describe('buildFeed — cache (AC-CS2-033)', () => {
  it('fetches once within 30 minutes of a success and again after', async () => {
    const fetchImpl = router({ 'https://www.youtube.com/feeds/videos.xml': xml(fx('youtube-atom.xml')) });
    const channels = [ch('yt', 'youtube', YT)];
    await buildFeed(channels, { fetchImpl, now });
    await buildFeed(channels, { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    clock += 29 * 60_000;
    await buildFeed(channels, { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    clock += 2 * 60_000;
    await buildFeed(channels, { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('keeps a failure for 5 minutes', async () => {
    const fetchImpl = router({ 'https://example.com/feed.xml': () => new Response('x', { status: 503 }) });
    const channels = [ch('rs', 'rss', 'https://example.com/feed.xml')];
    await buildFeed(channels, { fetchImpl, now });
    clock += 4 * 60_000;
    const again = await buildFeed(channels, { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(again.channels[0]).toMatchObject({ ok: false, error: 'http_status' });
    clock += 2 * 60_000;
    await buildFeed(channels, { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('refetches only the channel whose source changed', async () => {
    const fetchImpl = router({
      'https://www.youtube.com/feeds/videos.xml': xml(fx('youtube-atom.xml')),
      'https://rss.blog.naver.com/': xml(fx('naver-rss.xml')),
    });
    await buildFeed([ch('yt', 'youtube', YT), ch('nv', 'naver', 'fakeone')], { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    await buildFeed([ch('yt', 'youtube', YT), ch('nv', 'naver', 'faketwo')], { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(String(fetchImpl.mock.calls[2][0])).toBe('https://rss.blog.naver.com/faketwo.xml');
  });
});

describe('buildFeed — own blog and Instagram (AC-CS2-036)', () => {
  it('reads the 6 newest published posts as same-origin /blog/<slug> without any request', async () => {
    const fetchImpl = vi.fn<FetchFn>();
    const readBlog = vi.fn(async () => posts(7).slice(0, 6));
    const r = await buildFeed([ch('zb', 'zoellife-blog', '')], { fetchImpl, now, readBlog });
    expect(readBlog).toHaveBeenCalledWith(6);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(r.items).toHaveLength(6);
    expect(r.items.map((i) => i.url)).toEqual(posts(6).map((p) => `/blog/${p.slug}`));
    expect(r.channels[0]).toMatchObject({ ok: true, home: '/blog' });
  });

  it('makes no request for Instagram and returns the profile as home', async () => {
    const fetchImpl = vi.fn<FetchFn>();
    const r = await buildFeed([ch('ig', 'instagram', 'https://example.org/fakeprofile')], { fetchImpl, now });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(r.channels[0]).toMatchObject({ ok: true, home: 'https://example.org/fakeprofile' });
    expect(r.items).toEqual([]);
  });
});

describe('thumbnail addresses in the feed (AC-CS2-037)', () => {
  it('emits only thumb-route paths, and null for images off the allowlist', async () => {
    const offList = `<rss version="2.0"><channel><item><title>x</title><link>https://blog.naver.com/fakeblog/1</link>
      <description><![CDATA[<img src="https://evil.example/x.png">]]></description><pubDate>Wed, 04 Nov 2026 10:22:52 +0900</pubDate></item></channel></rss>`;
    const fetchImpl = router({
      'https://www.youtube.com/feeds/videos.xml': xml(fx('youtube-atom.xml')),
      'https://rss.blog.naver.com/fakeoff.xml': xml(offList),
      'https://example.org/feed': xml(fx('atom-generic.xml')),
    });
    const r = await buildFeed(
      [ch('yt', 'youtube', YT), ch('nv', 'naver', 'fakeoff'), ch('rs', 'rss', 'https://example.org/feed'), ch('zb', 'zoellife-blog', '')],
      { fetchImpl, now, readBlog: async () => posts(3) }
    );
    for (const i of r.items) expect(i.thumb === null || i.thumb.startsWith(`${THUMB_PATH}?u=`)).toBe(true);
    expect(r.items.find((i) => i.channelId === 'nv')!.thumb).toBeNull();
    expect(r.items.find((i) => i.url.endsWith('fakevid0001'))!.thumb).toBe(`${THUMB_PATH}?u=${encodeURIComponent('https://i2.ytimg.com/vi/fakevid0001/hqdefault.jpg')}`);
    expect(r.items.find((i) => i.url === 'https://example.org/journal/spring')!.thumb).toContain(encodeURIComponent('https://example.org/i/spring.webp'));
    const blog = r.items.filter((i) => i.channelId === 'zb');
    expect(blog[0].thumb).toBe(`${THUMB_PATH}?u=${encodeURIComponent(`https://${BLOB}/blog/a.jpg`)}`);
    expect(blog[1].thumb).toBeNull(); // 상대 경로 그림도 타일에 직접 쓰지 않는다 (CS2-D24)
    expect(blog[2].thumb).toBeNull();
  });

  it('thumbAllowed: exact hosts, numbered ytimg, pstatic.net subdomains, blob host and enabled rss hosts only', () => {
    const chans = [ch('rs', 'rss', 'https://example.com/feed.xml'), ch('off', 'rss', 'https://example.net/feed.xml', { enabled: false })];
    for (const h of ['i.ytimg.com', 'i2.ytimg.com', 'i9.ytimg.com', 'img.youtube.com', 'pstatic.net', 'blogthumb.pstatic.net', BLOB, 'example.com']) {
      expect(thumbAllowed(h, chans, BLOB), h).toBe(true);
    }
    for (const h of ['ytimg.com', 'i10.ytimg.com', 'ytimg.com.evil.example', 'i.ytimg.com.evil.example', 'evilpstatic.net', 'pstatic.net.evil.example', 'example.net', 'evil.example']) {
      expect(thumbAllowed(h, chans, BLOB), h).toBe(false);
    }
  });
});
