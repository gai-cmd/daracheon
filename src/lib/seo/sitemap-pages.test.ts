import { describe, expect, it } from 'vitest';
import {
  collectRecordImages,
  pageDateModified,
  pageUpdatedAt,
  PAGE_UPDATED_AT_KEY,
  stampPageUpdatedAt,
} from './sitemap-pages';

describe('stampPageUpdatedAt / pageUpdatedAt', () => {
  const at = new Date('2026-11-12T03:00:00.000Z');

  it('키별 저장 시각을 적고, 다른 키의 시각과 데이터는 그대로 둔다', () => {
    const before = {
      aboutAgarwood: { title: 'a' },
      [PAGE_UPDATED_AT_KEY]: { brandStory: '2026-10-01T00:00:00.000Z' },
    };
    const after = stampPageUpdatedAt(before, 'aboutAgarwood', at);
    expect(after.aboutAgarwood).toEqual({ title: 'a' });
    expect(after[PAGE_UPDATED_AT_KEY]).toEqual({
      brandStory: '2026-10-01T00:00:00.000Z',
      aboutAgarwood: '2026-11-12T03:00:00.000Z',
    });
    // 원본은 바꾸지 않는다.
    expect(before[PAGE_UPDATED_AT_KEY]).toEqual({ brandStory: '2026-10-01T00:00:00.000Z' });
  });

  it('기록 자리가 없거나 깨져 있어도 새로 만든다', () => {
    expect(stampPageUpdatedAt({} as Record<string, unknown>, 'home', at)[PAGE_UPDATED_AT_KEY]).toEqual({ home: at.toISOString() });
    expect(
      stampPageUpdatedAt({ [PAGE_UPDATED_AT_KEY]: 'broken' } as Record<string, unknown>, 'home', at)[
        PAGE_UPDATED_AT_KEY
      ],
    ).toEqual({ home: at.toISOString() });
  });

  it('여러 키 중 가장 최근 시각을 돌려주고, 기록이 없으면 undefined (날짜를 지어내지 않는다)', () => {
    const pages = {
      [PAGE_UPDATED_AT_KEY]: {
        brandStory: '2026-10-01T00:00:00.000Z',
        showroom: '2026-11-02T00:00:00.000Z',
        broken: 'not a date',
      },
    };
    expect(pageUpdatedAt(pages, 'brandStory', 'showroom')?.toISOString()).toBe('2026-11-02T00:00:00.000Z');
    expect(pageUpdatedAt(pages, 'brandStory')?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(pageUpdatedAt(pages, 'aboutAgarwood')).toBeUndefined();
    expect(pageUpdatedAt(pages, 'broken')).toBeUndefined();
    expect(pageUpdatedAt({}, 'brandStory')).toBeUndefined();
    expect(pageUpdatedAt(null, 'brandStory')).toBeUndefined();
  });

  it('pageDateModified: 저장 시각이 있으면 ISO, 없으면 기존 상수 그대로', () => {
    const pages = { [PAGE_UPDATED_AT_KEY]: { brandStory: '2026-10-01T00:00:00.000Z', showroom: '2026-11-02T00:00:00.000Z' } };
    expect(pageDateModified(pages, '2026-04-17', 'brandStory', 'showroom')).toBe('2026-11-02T00:00:00.000Z');
    expect(pageDateModified(pages, '2026-04-17', 'aboutAgarwood')).toBe('2026-04-17');
    expect(pageDateModified(null, '2026-04-17', 'aboutAgarwood')).toBe('2026-04-17');
  });
});

describe('collectRecordImages', () => {
  it('중첩된 데이터에서 이미지 주소만 나온 순서대로, 중복 없이 모은다', () => {
    const record = {
      hero: { image: 'https://x.public.blob.vercel-storage.com/a.jpg', title: '제목.jpg 가 아닌 문장 입니다' },
      chapters: [
        { img: '/uploads/b.PNG?v=2', text: '본문' },
        { img: 'https://x.public.blob.vercel-storage.com/a.jpg' },
        { video: 'https://x.public.blob.vercel-storage.com/c.mp4', poster: '/images/d.webp' },
      ],
      count: 3,
      empty: null,
    };
    expect(collectRecordImages(record)).toEqual([
      'https://x.public.blob.vercel-storage.com/a.jpg',
      '/uploads/b.PNG?v=2',
      '/images/d.webp',
    ]);
  });

  it('객체가 아니거나 비어 있으면 빈 목록', () => {
    expect(collectRecordImages(undefined)).toEqual([]);
    expect(collectRecordImages('plain text')).toEqual([]);
    expect(collectRecordImages({})).toEqual([]);
  });
});
