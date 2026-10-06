import { describe, expect, it } from 'vitest';
import { SNS_SAMPLE } from '@/data/sns-sample';
import {
  HOME_MAIN_DEFAULTS,
  isInstagramPermalink,
  isOwnAsset,
  isYoutubeId,
  parseEmphasis,
  resolveHomeMain,
  safeHref,
} from '../home-main';

const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

describe('resolveHomeMain — 저장값이 없을 때', () => {
  it('returns the defaults for null, undefined and garbage input', () => {
    for (const raw of [null, undefined, 'x', 42, true, [], [1, 2]]) {
      expect(resolveHomeMain(raw)).toEqual(HOME_MAIN_DEFAULTS);
    }
  });

  it('falls back per section when a section is not an object/array', () => {
    const out = resolveHomeMain({
      intro: 'x',
      news: 3,
      stats: 'y',
      marquee: {},
      tiles: [],
      closing: null,
      youtube: 1,
      instagram: 'z',
    });
    expect(out).toEqual(HOME_MAIN_DEFAULTS);
  });

  it('keeps the current hard-coded home content as the default', () => {
    const d = HOME_MAIN_DEFAULTS;
    expect(d.intro).toEqual({
      badgeChip: '25년 이상',
      badgeText: '베트남 직영 농장에서 기른 침향',
      headline: '묘목부터 증류까지,\n직접 키운 *진짜 침향*',
      subline: '식약처 고시 학명 *Aquilaria agallocha Roxburgh*.\n원산지부터 직접 책임지는 대라천 ‘참’침향입니다.',
      primary: { label: '제품 보기', href: '/products' },
      secondary: { label: '진짜 침향 구별법', href: '/about-agarwood' },
    });
    expect(d.news).toEqual({ chip: 'NEW', label: '소식', title: '새로 올라온 *대라천 소식*' });
    expect(d.stats).toEqual([
      { value: 25, unit: '년 이상', label: '연구 및 생산재배' },
      { value: 200, unit: 'ha', label: '직영 농장 합계' },
      { value: 5, unit: '개 지역', label: '베트남 직영' },
      { value: 12, unit: '건 이상', label: '인증·특허' },
    ]);
    expect(d.marquee).toHaveLength(6);
    expect(d.marquee[0]).toBe('식약처 고시 학명 Aquilaria agallocha Roxburgh');
    expect(d.marquee).toContain('베트남 직영 농장 25년 이상');
    expect(d.marquee).toContain('인증·특허 12건 이상');
    expect(d.tiles.ring.note).toBe('식약처 고시 학명 · 인증 · 산지로 가려내는 법');
    expect(d.tiles.brand.title).toBe('25년 이상, 원산지부터 직접 잇습니다');
    expect(d.tiles.hero).toEqual({
      chip: '농장 영상',
      kicker: '침향 농장 이야기',
      title: '베트남 직영 농장,\n침향 분류 작업 현장',
      sub: '묘목부터 채취·증류까지, 영상과 사진으로 전합니다',
      href: '/media',
      video: `${BLOB}/uploads/home-main/farm-loop.mp4`,
      poster: `${BLOB}/uploads/home-main/farm-poster.jpg`,
    });
    expect(d.tiles.onair.video).toBe(`${BLOB}/uploads/home-main/onair-loop.mp4`);
    expect(d.tiles.stats.kicker).toBe('숫자로 보는 대라천');
    expect(d.tiles.ring.image).toBe(`${BLOB}/uploads/pages/species-card-roxburgh.jpg`);
    expect(d.tiles.brand.image).toBe(`${BLOB}/pages/hero/company-hero-default.jpg`);
    expect(d.tiles.showroom.title).toBe('원목부터 완제품까지, 직접 보고 맡아 보세요');
    expect(d.closing).toEqual({
      line: '진짜 침향, *직접 확인해 보세요*',
      primary: { label: '문의하기', href: '/company#contact' },
      secondary: { label: '전시장 둘러보기', href: '/showroom' },
    });
    expect(d.youtube).toEqual(SNS_SAMPLE.youtube);
    expect(d.instagram).toEqual(SNS_SAMPLE.instagram);
  });

  it('returns fresh objects so callers cannot mutate the defaults', () => {
    const a = resolveHomeMain(null);
    a.marquee.push('x');
    a.youtube.videos.pop();
    a.intro.primary.label = 'changed';
    expect(HOME_MAIN_DEFAULTS.marquee).toHaveLength(6);
    expect(HOME_MAIN_DEFAULTS.youtube.videos).toHaveLength(SNS_SAMPLE.youtube.videos.length);
    expect(HOME_MAIN_DEFAULTS.intro.primary.label).toBe('제품 보기');
  });
});

describe('resolveHomeMain — 부분 저장', () => {
  it('overrides only the saved fields and keeps every other default', () => {
    const out = resolveHomeMain({ intro: { headline: '  새 제목\n*강조*  ' } });
    expect(out.intro.headline).toBe('새 제목\n*강조*');
    expect(out.intro.badgeChip).toBe('25년 이상');
    expect(out.intro.primary).toEqual({ label: '제품 보기', href: '/products' });
    expect(out.news).toEqual(HOME_MAIN_DEFAULTS.news);
    expect(out.tiles).toEqual(HOME_MAIN_DEFAULTS.tiles);
  });

  it('treats empty or whitespace strings as "use the default"', () => {
    const out = resolveHomeMain({ news: { chip: '   ', label: '', title: '새 소식' } });
    expect(out.news).toEqual({ chip: 'NEW', label: '소식', title: '새 소식' });
  });

  it('overrides one tile field without touching its media or the other tiles', () => {
    const out = resolveHomeMain({ tiles: { hero: { title: '새 농장 영상' } } });
    expect(out.tiles.hero.title).toBe('새 농장 영상');
    expect(out.tiles.hero.video).toBe(HOME_MAIN_DEFAULTS.tiles.hero.video);
    expect(out.tiles.brand).toEqual(HOME_MAIN_DEFAULTS.tiles.brand);
  });

  it('keeps a cta label default when only the href is saved', () => {
    const out = resolveHomeMain({ closing: { primary: { href: '/company' } } });
    expect(out.closing.primary).toEqual({ label: '문의하기', href: '/company' });
  });
});

describe('resolveHomeMain — 외부 자산·링크 차단', () => {
  it('accepts own Blob assets and local paths for tile media', () => {
    const out = resolveHomeMain({
      tiles: {
        hero: { video: `${BLOB}/uploads/videos/new.mp4`, poster: '/images/farm.jpg' },
      },
    });
    expect(out.tiles.hero.video).toBe(`${BLOB}/uploads/videos/new.mp4`);
    expect(out.tiles.hero.poster).toBe('/images/farm.jpg');
  });

  it('falls back to the default when a video or image is on an external host', () => {
    const out = resolveHomeMain({
      tiles: {
        hero: { video: 'https://cdn.example.com/farm.mp4', poster: '//evil.example/p.jpg' },
        ring: { image: 'https://i.ytimg.com/vi/abc/maxresdefault.jpg' },
        brand: { image: `${BLOB}.evil.example/x.jpg`, video: 'javascript:alert(1)' },
      },
    });
    expect(out.tiles.hero.video).toBe(HOME_MAIN_DEFAULTS.tiles.hero.video);
    expect(out.tiles.hero.poster).toBe(HOME_MAIN_DEFAULTS.tiles.hero.poster);
    expect(out.tiles.ring.image).toBe(HOME_MAIN_DEFAULTS.tiles.ring.image);
    expect(out.tiles.brand.image).toBe(HOME_MAIN_DEFAULTS.tiles.brand.image);
    expect(out.tiles.brand.video).toBe(HOME_MAIN_DEFAULTS.tiles.brand.video);
  });

  it('keeps only the first of duplicate YouTube ids and Instagram permalinks', () => {
    const video = { id: 'AAAAAAAAAAA', title: '영상', publishedAt: '', thumbnail: '/images/sns/youtube/a.jpg' };
    const post = { permalink: 'https://www.instagram.com/reel/AAA/', image: '/images/sns/instagram/a.jpg' };
    const out = resolveHomeMain({
      youtube: { videos: [video, { ...video, title: '중복' }] },
      instagram: { posts: [post, { ...post, caption: '중복' }] },
    });
    expect(out.youtube.videos.map((v) => v.title)).toEqual(['영상']);
    expect(out.instagram.posts).toHaveLength(1);
  });

  it('rejects javascript:, protocol-relative and backslash hrefs', () => {
    const out = resolveHomeMain({
      intro: {
        primary: { href: 'javascript:alert(1)' },
        secondary: { href: '//evil.example' },
      },
      closing: { primary: { href: '/\\evil.example' }, secondary: { href: 'https://example.com/x' } },
      tiles: { onair: { href: 'data:text/html,hi' } },
    });
    expect(out.intro.primary.href).toBe('/products');
    expect(out.intro.secondary.href).toBe('/about-agarwood');
    expect(out.closing.primary.href).toBe('/company#contact');
    expect(out.closing.secondary.href).toBe('https://example.com/x');
    expect(out.tiles.onair.href).toBe('/home-shopping');
  });

  it('exposes the asset and href guards for the page', () => {
    expect(isOwnAsset(`${BLOB}/a.jpg`)).toBe(true);
    expect(isOwnAsset('/a.jpg')).toBe(true);
    expect(isOwnAsset('//a.example/a.jpg')).toBe(false);
    expect(isOwnAsset(`${BLOB}.evil.example/a.jpg`)).toBe(false);
    expect(isOwnAsset(undefined)).toBe(false);
    expect(safeHref(' /blog ')).toBe('/blog');
    expect(safeHref('http://example.com')).toBe('http://example.com');
    expect(safeHref('mailto:a@b.c')).toBeNull();
    expect(safeHref(undefined)).toBeNull();
  });

  it('exposes the channel item guards for the admin form', () => {
    expect(isYoutubeId('-nmj_zZwIS0')).toBe(true);
    expect(isYoutubeId('7ZOtzYmMvcM')).toBe(true);
    expect(isYoutubeId('https://youtu.be/7ZOtzYmMvcM')).toBe(false);
    expect(isYoutubeId('short')).toBe(false);
    expect(isInstagramPermalink('https://www.instagram.com/reel/DdkZiWmRCeu/')).toBe(true);
    expect(isInstagramPermalink('https://www.instagram.com.evil.example/reel/X/')).toBe(false);
    expect(isInstagramPermalink('https://www.instagram.com/reel/a b/')).toBe(false);
    expect(isInstagramPermalink('http://www.instagram.com/reel/X/')).toBe(false);
  });
});

describe('resolveHomeMain — 통계', () => {
  it('coerces numeric strings and keeps zero', () => {
    const out = resolveHomeMain({
      stats: [
        { value: '30', unit: '년', label: '재배' },
        { value: 0, unit: '', label: '영' },
      ],
    });
    expect(out.stats).toEqual([
      { value: 30, unit: '년', label: '재배' },
      { value: 0, unit: '', label: '영' },
    ]);
  });

  it('drops negative, non-numeric, non-finite and label-less rows', () => {
    const out = resolveHomeMain({
      stats: [
        { value: -1, unit: '년', label: '음수' },
        { value: 'abc', unit: '년', label: '문자' },
        { value: '', unit: '년', label: '빈 값' },
        { value: Infinity, unit: '년', label: '무한' },
        { value: 7, unit: '곳', label: '   ' },
        { value: 9, unit: '곳', label: '남는 행' },
        'garbage',
      ],
    });
    expect(out.stats).toEqual([{ value: 9, unit: '곳', label: '남는 행' }]);
  });

  it('keeps at most 4 rows', () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({ value: i, unit: '', label: `행${i}` }));
    expect(resolveHomeMain({ stats: rows }).stats.map((s) => s.label)).toEqual(['행0', '행1', '행2', '행3']);
  });

  it('falls back to the default rows when nothing valid remains', () => {
    expect(resolveHomeMain({ stats: [{ value: -5, label: 'x' }] }).stats).toEqual(HOME_MAIN_DEFAULTS.stats);
    expect(resolveHomeMain({ stats: [] }).stats).toEqual(HOME_MAIN_DEFAULTS.stats);
  });
});

describe('resolveHomeMain — 흐르는 띠', () => {
  it('trims, drops empty or non-string items and keeps at most 12', () => {
    const items = [' 하나 ', '', '   ', 3, ...Array.from({ length: 14 }, (_, i) => `문구${i}`)];
    const out = resolveHomeMain({ marquee: items }).marquee;
    expect(out).toHaveLength(12);
    expect(out[0]).toBe('하나');
    expect(out[1]).toBe('문구0');
  });

  it('falls back to the default phrases when empty', () => {
    expect(resolveHomeMain({ marquee: ['', '  '] }).marquee).toEqual(HOME_MAIN_DEFAULTS.marquee);
  });
});

describe('resolveHomeMain — 공식 채널', () => {
  const video = (id: string, thumbnail: string, title = '침향 영상') => ({
    id,
    title,
    publishedAt: '2026-09-01',
    thumbnail,
  });

  it('drops a YouTube item whose thumbnail is on an external CDN (i.ytimg.com)', () => {
    const out = resolveHomeMain({
      youtube: {
        videos: [
          video('abcdefghijk', 'https://i.ytimg.com/vi/abcdefghijk/maxresdefault.jpg'),
          video('-nmj_zZwIS0', `${BLOB}/uploads/home-main/yt.jpg`),
        ],
      },
    });
    expect(out.youtube.videos.map((v) => v.id)).toEqual(['-nmj_zZwIS0']);
    expect(out.youtube.name).toBe(SNS_SAMPLE.youtube.name);
  });

  it('drops YouTube items with an invalid id and keeps at most 6', () => {
    const many = Array.from({ length: 8 }, (_, i) => video(`abcdefghij${i}`, `/images/sns/youtube/${i}.jpg`));
    const out = resolveHomeMain({
      youtube: { videos: [video('short', '/a.jpg'), video('has space x', '/a.jpg'), ...many] },
    });
    expect(out.youtube.videos).toHaveLength(6);
    expect(out.youtube.videos[0].id).toBe('abcdefghij0');
  });

  it('falls back to the default video list when nothing valid remains', () => {
    const out = resolveHomeMain({ youtube: { handle: '@new', videos: [video('bad', 'https://i.ytimg.com/x.jpg')] } });
    expect(out.youtube.videos).toEqual(SNS_SAMPLE.youtube.videos);
    expect(out.youtube.handle).toBe('@new');
  });

  it('rejects a non-http channel url', () => {
    const out = resolveHomeMain({ youtube: { url: 'javascript:alert(1)' }, instagram: { url: '/relative-is-ok' } });
    expect(out.youtube.url).toBe(SNS_SAMPLE.youtube.url);
    expect(out.instagram.url).toBe('/relative-is-ok');
  });

  it('keeps Instagram posts only with an instagram.com permalink and an own-asset cover', () => {
    const out = resolveHomeMain({
      instagram: {
        posts: [
          { permalink: 'https://www.instagram.com/reel/ABC123/', image: `${BLOB}/uploads/home-main/a.jpg`, caption: ' 캡션 ' },
          { permalink: 'https://www.instagram.com.evil.example/reel/X/', image: '/a.jpg' },
          { permalink: 'https://example.com/reel/Y/', image: '/a.jpg' },
          { permalink: 'https://www.instagram.com/reel/Z/', image: 'https://scontent.cdninstagram.com/z.jpg' },
        ],
      },
    });
    expect(out.instagram.posts).toEqual([
      {
        id: 'ABC123',
        permalink: 'https://www.instagram.com/reel/ABC123/',
        image: `${BLOB}/uploads/home-main/a.jpg`,
        caption: '캡션',
      },
    ]);
  });

  it('keeps at most 12 Instagram posts and falls back to defaults when empty', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      permalink: `https://www.instagram.com/reel/P${i}/`,
      image: `/images/sns/instagram/P${i}.jpg`,
    }));
    expect(resolveHomeMain({ instagram: { posts: many } }).instagram.posts).toHaveLength(12);
    expect(resolveHomeMain({ instagram: { posts: [] } }).instagram.posts).toEqual(SNS_SAMPLE.instagram.posts);
  });
});

describe('parseEmphasis', () => {
  it('returns one text token for plain text', () => {
    expect(parseEmphasis('침향')).toEqual([{ type: 'text', value: '침향' }]);
  });

  it('turns a newline into a line-break token', () => {
    expect(parseEmphasis('묘목부터 증류까지,\n직접 키운 *진짜 침향*')).toEqual([
      { type: 'text', value: '묘목부터 증류까지,' },
      { type: 'br' },
      { type: 'text', value: '직접 키운 ' },
      { type: 'em', value: '진짜 침향' },
    ]);
  });

  it('parses several emphasis spans on one line', () => {
    expect(parseEmphasis('*a* 그리고 *b*.')).toEqual([
      { type: 'em', value: 'a' },
      { type: 'text', value: ' 그리고 ' },
      { type: 'em', value: 'b' },
      { type: 'text', value: '.' },
    ]);
  });

  it('keeps an unmatched or empty asterisk pair as literal text', () => {
    expect(parseEmphasis('별표 * 하나')).toEqual([{ type: 'text', value: '별표 * 하나' }]);
    expect(parseEmphasis('빈 ** 쌍')).toEqual([{ type: 'text', value: '빈 ** 쌍' }]);
  });

  it('does not let emphasis cross a line break', () => {
    expect(parseEmphasis('*첫\n둘*')).toEqual([
      { type: 'text', value: '*첫' },
      { type: 'br' },
      { type: 'text', value: '둘*' },
    ]);
  });

  it('accepts CRLF and keeps consecutive breaks', () => {
    expect(parseEmphasis('a\r\n\r\nb')).toEqual([
      { type: 'text', value: 'a' },
      { type: 'br' },
      { type: 'br' },
      { type: 'text', value: 'b' },
    ]);
  });

  it('returns no tokens for an empty string', () => {
    expect(parseEmphasis('')).toEqual([]);
  });
});
