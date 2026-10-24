import { describe, it, expect } from 'vitest';
import {
  SITEMAP_BLOB_HOST,
  toSitemapImageUrl,
  collectSitemapImages,
  extractBodyBlobImages,
} from './sitemap-images';

const BASE = 'https://zoellife.com';
const BLOB = `https://${SITEMAP_BLOB_HOST}`;

describe('toSitemapImageUrl', () => {
  it('/public 상대경로는 절대 URL 로', () => {
    expect(toSitemapImageUrl('/uploads/a.jpg', BASE)).toBe('https://zoellife.com/uploads/a.jpg');
  });
  it('Blob https URL 은 그대로', () => {
    expect(toSitemapImageUrl(`${BLOB}/blog/x.png`, BASE)).toBe(`${BLOB}/blog/x.png`);
  });
  it('/_next/image·외부 CDN·프로토콜 상대·http 는 제외', () => {
    expect(toSitemapImageUrl('/_next/image?url=x&w=1080', BASE)).toBeUndefined();
    expect(toSitemapImageUrl('https://res.cloudinary.com/ddsu7fl1o/a.png', BASE)).toBeUndefined();
    expect(toSitemapImageUrl('https://lh3.googleusercontent.com/d/abc=w1280', BASE)).toBeUndefined();
    expect(toSitemapImageUrl('//evil.example/a.jpg', BASE)).toBeUndefined();
    expect(toSitemapImageUrl(`http://${SITEMAP_BLOB_HOST}/a.jpg`, BASE)).toBeUndefined();
    expect(toSitemapImageUrl('data:image/png;base64,AAA', BASE)).toBeUndefined();
    expect(toSitemapImageUrl('', BASE)).toBeUndefined();
    expect(toSitemapImageUrl(undefined, BASE)).toBeUndefined();
  });
  it('& 는 XML 용으로 이스케이프, 한글은 퍼센트 인코딩', () => {
    expect(toSitemapImageUrl(`${BLOB}/a.jpg?v=1&x=2`, BASE)).toBe(`${BLOB}/a.jpg?v=1&amp;x=2`);
    expect(toSitemapImageUrl('/uploads/침향.jpg', BASE)).toBe(
      'https://zoellife.com/uploads/%EC%B9%A8%ED%96%A5.jpg',
    );
  });
});

describe('collectSitemapImages', () => {
  it('중복 제거·필터·상한 20', () => {
    const many = Array.from({ length: 30 }, (_, i) => `${BLOB}/p/${i}.jpg`);
    const out = collectSitemapImages(['/a.jpg', '/a.jpg', 'https://cdn.example/x.jpg', ...many], BASE);
    expect(out).toHaveLength(20);
    expect(out[0]).toBe('https://zoellife.com/a.jpg');
    expect(out.filter((u) => u === 'https://zoellife.com/a.jpg')).toHaveLength(1);
    expect(out.some((u) => u.includes('cdn.example'))).toBe(false);
  });
});

describe('extractBodyBlobImages', () => {
  it('본문 <img> 중 Blob 원본만 최대 5개', () => {
    const imgs = Array.from({ length: 7 }, (_, i) => `<img alt="a" src="${BLOB}/b/${i}.jpg">`).join('');
    const html = `<p>x</p><img src="/_next/image?url=y&amp;w=1080"><img src='https://res.cloudinary.com/a.png'>${imgs}`;
    const out = extractBodyBlobImages(html);
    expect(out).toEqual([0, 1, 2, 3, 4].map((i) => `${BLOB}/b/${i}.jpg`));
  });
  it('작은따옴표·따옴표 없는 src 도 읽고 중복은 한 번만', () => {
    const html = `<img src='${BLOB}/q.jpg'><img src=${BLOB}/r.jpg /><img src="${BLOB}/q.jpg">`;
    expect(extractBodyBlobImages(html)).toEqual([`${BLOB}/q.jpg`, `${BLOB}/r.jpg`]);
  });
  it('이미지 없음·비문자열은 빈 배열', () => {
    expect(extractBodyBlobImages('<p>글</p>')).toEqual([]);
    expect(extractBodyBlobImages(undefined)).toEqual([]);
  });
});
