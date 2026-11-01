import { describe, it, expect } from 'vitest';
import { buildVideoObjects, toOwnedThumbnailUrl, toUploadDateTime } from '@/lib/seo/video';

const SITE = 'https://zoellife.com';
const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

describe('buildVideoObjects', () => {
  it('Blob 영상 + Blob 썸네일 + 저장된 날짜면 VideoObject 를 만든다', () => {
    const [v] = buildVideoObjects(
      [{ title: '농장 영상', url: `${BLOB}/uploads/media/a.mp4`, thumbnail: `${BLOB}/uploads/media/a.jpg`, date: '2024-05-01' }],
      SITE,
    );
    expect(v).toMatchObject({
      '@type': 'VideoObject',
      name: '농장 영상',
      description: '농장 영상',
      contentUrl: `${BLOB}/uploads/media/a.mp4`,
      thumbnailUrl: `${BLOB}/uploads/media/a.jpg`,
      // 날짜만 내보내면 Search Console 이 '시간대 누락'·'datetime 값이 잘못됨' 경고를 낸다.
      uploadDate: '2024-05-01T00:00:00+09:00',
      publisher: { '@id': `${SITE}/#organization` },
    });
  });

  it('/public 썸네일은 절대 URL 로, YouTube 는 embedUrl 로 바꾼다', () => {
    const [v] = buildVideoObjects(
      [{ title: 'yt', url: 'https://www.youtube.com/watch?v=LwKK8t6AyQA', thumbnail: '/uploads/t.jpg', date: '2024-10-01' }],
      SITE,
    );
    expect(v.thumbnailUrl).toBe(`${SITE}/uploads/t.jpg`);
    expect(v.embedUrl).toBe('https://www.youtube.com/embed/LwKK8t6AyQA');
    expect(v.contentUrl).toBeUndefined();
  });

  it('날짜·썸네일이 없거나 외부 CDN 썸네일·외부 영상이면 제외한다', () => {
    const out = buildVideoObjects(
      [
        { title: '날짜 없음', url: `${BLOB}/a.mp4`, thumbnail: `${BLOB}/a.jpg` },
        { title: '썸네일 없음', url: `${BLOB}/a.mp4`, date: '2024-01-01' },
        { title: '유튜브 썸네일', url: 'https://youtu.be/LwKK8t6AyQA', thumbnail: 'https://img.youtube.com/vi/LwKK8t6AyQA/hqdefault.jpg', date: '2024-01-01' },
        { title: '프로토콜 상대', url: `${BLOB}/a.mp4`, thumbnail: '//evil.example/a.jpg', date: '2024-01-01' },
        { title: 'Drive 영상', url: 'https://drive.google.com/file/d/x/preview', thumbnail: `${BLOB}/a.jpg`, date: '2024-01-01' },
        { title: '날짜 형식 오류', url: `${BLOB}/a.mp4`, thumbnail: `${BLOB}/a.jpg`, date: '어제' },
        { title: '달력에 없는 날짜', url: `${BLOB}/a.mp4`, thumbnail: `${BLOB}/a.jpg`, date: '2024-02-30' },
        { title: '시간대 없는 시각', url: `${BLOB}/a.mp4`, thumbnail: `${BLOB}/a.jpg`, date: '2024-05-01T10:00:00' },
      ],
      SITE,
    );
    expect(out).toEqual([]);
  });
});

describe('toUploadDateTime', () => {
  it('날짜만 있으면 한국 시간 자정의 DateTime 으로 바꾼다', () => {
    expect(toUploadDateTime('2026-04-11')).toBe('2026-04-11T00:00:00+09:00');
    expect(toUploadDateTime(' 2024-02-29 ')).toBe('2024-02-29T00:00:00+09:00');
  });

  it('시간대가 붙은 DateTime 은 그대로 둔다', () => {
    expect(toUploadDateTime('2024-05-01T10:30:00+09:00')).toBe('2024-05-01T10:30:00+09:00');
    expect(toUploadDateTime('2024-05-01T01:30:00.000Z')).toBe('2024-05-01T01:30:00.000Z');
  });

  it('시간대 없는 시각·다른 형식·달력에 없는 날짜·비문자열은 버린다', () => {
    expect(toUploadDateTime('2024-05-01T10:00:00')).toBeUndefined();
    expect(toUploadDateTime('2024.05.01')).toBeUndefined();
    expect(toUploadDateTime('2024-13-01')).toBeUndefined();
    expect(toUploadDateTime('2023-02-29')).toBeUndefined();
    expect(toUploadDateTime('2024-02-30T10:00:00+09:00')).toBeUndefined();
    expect(toUploadDateTime('어제')).toBeUndefined();
    expect(toUploadDateTime('')).toBeUndefined();
    expect(toUploadDateTime(undefined)).toBeUndefined();
  });
});

describe('toOwnedThumbnailUrl', () => {
  it('Blob URL 은 그대로, /public 경로는 절대 URL 로 바꾼다', () => {
    expect(toOwnedThumbnailUrl(`${BLOB}/thumbs/a.jpg`, SITE)).toBe(`${BLOB}/thumbs/a.jpg`);
    expect(toOwnedThumbnailUrl('  /images/a.jpg ', SITE)).toBe(`${SITE}/images/a.jpg`);
  });

  it('외부 CDN·프로토콜 상대·빈 값·비문자열은 버린다', () => {
    expect(toOwnedThumbnailUrl('https://lh3.googleusercontent.com/d/abc=w1280', SITE)).toBeUndefined();
    expect(toOwnedThumbnailUrl('//cdn.example.com/a.jpg', SITE)).toBeUndefined();
    expect(toOwnedThumbnailUrl('', SITE)).toBeUndefined();
    expect(toOwnedThumbnailUrl(undefined, SITE)).toBeUndefined();
  });
});
