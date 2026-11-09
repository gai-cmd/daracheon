import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  INDEXNOW_MAX_URLS,
  blogPostPaths,
  buildIndexNowUrls,
  notifyIndexNow,
} from './indexnow';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('buildIndexNowUrls', () => {
  it('경로를 zoellife.com 절대 URL 로 만들고 중복을 제거한다', () => {
    expect(buildIndexNowUrls(['/blog/a', '/blog', '/blog/a', 'blog'])).toEqual([
      'https://zoellife.com/blog/a',
      'https://zoellife.com/blog',
    ]);
  });

  it('루트 경로와 한글 slug 를 처리한다', () => {
    expect(buildIndexNowUrls(['/', '/blog/침향'])).toEqual([
      'https://zoellife.com/',
      'https://zoellife.com/blog/%EC%B9%A8%ED%96%A5',
    ]);
  });

  it('다른 호스트·www·http·빈 값은 버린다', () => {
    expect(
      buildIndexNowUrls([
        'https://evil.example.com/x',
        'https://www.zoellife.com/x',
        'http://zoellife.com/x',
        '//evil.example.com/y',
        '',
        '   ',
        'https://zoellife.com/ok',
      ]),
    ).toEqual(['https://zoellife.com/ok']);
  });

  it('최대 100개까지만 담는다', () => {
    const paths = Array.from({ length: 150 }, (_, i) => `/p/${i}`);
    const urls = buildIndexNowUrls(paths);
    expect(urls).toHaveLength(INDEXNOW_MAX_URLS);
    expect(INDEXNOW_MAX_URLS).toBe(100);
    expect(urls[99]).toBe('https://zoellife.com/p/99');
  });
});

describe('blogPostPaths', () => {
  it('글·목록·카테고리 경로를 돌려준다', () => {
    expect(blogPostPaths('a', 'news')).toEqual(['/blog/a', '/blog', '/blog/category/news']);
    expect(blogPostPaths('a')).toEqual(['/blog/a', '/blog']);
  });
});

describe('키 파일', () => {
  it('public/<key>.txt 내용이 키와 정확히 같다', () => {
    expect(INDEXNOW_KEY).toMatch(/^[0-9a-f]{32}$/);
    const file = readFileSync(path.resolve(__dirname, `../../../public/${INDEXNOW_KEY}.txt`), 'utf8');
    expect(file).toBe(INDEXNOW_KEY);
  });
});

describe('notifyIndexNow', () => {
  it('production 이 아니면 전송하지 않는다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VERCEL_ENV', 'preview');
    await notifyIndexNow(['/blog/a']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('INDEXNOW_DISABLED=1 이면 production 이어도 전송하지 않는다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('INDEXNOW_DISABLED', '1');
    await notifyIndexNow(['/blog/a']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('보낼 URL 이 없으면 전송하지 않는다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VERCEL_ENV', 'production');
    await notifyIndexNow(['https://evil.example.com/x']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('production 에서는 네이버 엔드포인트로 JSON 을 POST 한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubEnv('VERCEL_ENV', 'production');
    await notifyIndexNow(['/blog/a', '/blog']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(INDEXNOW_ENDPOINT);
    expect(INDEXNOW_ENDPOINT).toBe('https://searchadvisor.naver.com/indexnow');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json; charset=utf-8');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body)).toEqual({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://zoellife.com/${INDEXNOW_KEY}.txt`,
      urlList: ['https://zoellife.com/blog/a', 'https://zoellife.com/blog'],
    });
  });

  it('fetch 가 실패해도 예외를 던지지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('VERCEL_ENV', 'production');
    await expect(notifyIndexNow(['/blog/a'])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('4xx 응답에도 예외를 던지지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('VERCEL_ENV', 'production');
    await expect(notifyIndexNow(['/blog/a'])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
