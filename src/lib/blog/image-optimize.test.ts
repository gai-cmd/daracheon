import { describe, expect, it } from 'vitest';
import { isOptimizableBlobImage, optimizeBodyImages, PROJECT_BLOB_HOST } from './image-optimize';

const BLOB = `https://${PROJECT_BLOB_HOST}/blog/a.jpg`;
const OPT = `/_next/image?url=${encodeURIComponent(BLOB)}&amp;w=1080&amp;q=75`;

describe('isOptimizableBlobImage', () => {
  it('우리 Blob 호스트의 래스터 이미지만 허용', () => {
    expect(isOptimizableBlobImage(BLOB)).toBe(true);
    expect(isOptimizableBlobImage(`https://${PROJECT_BLOB_HOST}/x/logo.SVG`)).toBe(false);
    expect(isOptimizableBlobImage('https://other.public.blob.vercel-storage.com/a.jpg')).toBe(false);
    expect(isOptimizableBlobImage('https://images.unsplash.com/a.jpg')).toBe(false);
    expect(isOptimizableBlobImage(`http://${PROJECT_BLOB_HOST}/a.jpg`)).toBe(false);
    expect(isOptimizableBlobImage('/uploads/a.jpg')).toBe(false);
    expect(isOptimizableBlobImage('/_next/image?url=x')).toBe(false);
  });
});

describe('optimizeBodyImages', () => {
  it('img 가 없으면 원문 그대로', () => {
    expect(optimizeBodyImages('<p>본문</p>')).toBe('<p>본문</p>');
    expect(optimizeBodyImages('')).toBe('');
  });

  it('첫 이미지는 src 만 바꾸고 지연 로드 속성을 붙이지 않는다', () => {
    const out = optimizeBodyImages(`<img src="${BLOB}" alt="침향 원목">`);
    expect(out).toBe(`<img src="${OPT}" alt="침향 원목">`);
  });

  it('두 번째 이미지부터 loading/decoding 추가, alt 보존', () => {
    const html = `<img src="${BLOB}" alt="a"><p>x</p><img alt="절단면" src="${BLOB}" />`;
    const out = optimizeBodyImages(html);
    expect(out).toBe(
      `<img src="${OPT}" alt="a"><p>x</p><img alt="절단면" src="${OPT}" loading="lazy" decoding="async" />`,
    );
  });

  it('작은따옴표·따옴표 없는 src 도 처리', () => {
    expect(optimizeBodyImages(`<img src='${BLOB}'>`)).toBe(`<img src="${OPT}">`);
    expect(optimizeBodyImages(`<img src=${BLOB}>`)).toBe(`<img src="${OPT}">`);
  });

  it('이미 지정된 loading/decoding 은 덮어쓰지 않는다', () => {
    const html = `<img src="/a.jpg"><img src="/b.jpg" loading="eager" decoding="sync">`;
    expect(optimizeBodyImages(html)).toBe(html);
  });

  it('외부·상대·SVG·이미 최적화된 URL 은 src 를 건드리지 않는다', () => {
    const html = [
      '<img src="https://images.unsplash.com/p.jpg">',
      '<img src="/uploads/a.jpg">',
      `<img src="https://${PROJECT_BLOB_HOST}/d.svg">`,
      `<img src="${OPT}">`,
    ].join('');
    const out = optimizeBodyImages(html);
    expect(out).toContain('src="https://images.unsplash.com/p.jpg"');
    expect(out).toContain('src="/uploads/a.jpg"');
    expect(out).toContain(`src="https://${PROJECT_BLOB_HOST}/d.svg"`);
    expect(out).toContain(`src="${OPT}"`);
    expect(out.match(/\/_next\/image/g)).toHaveLength(1);
  });

  it('쿼리의 &amp; 엔티티를 풀어 원본 URL 로 인코딩', () => {
    const out = optimizeBodyImages(`<img src="${BLOB}?v=1&amp;x=2">`);
    expect(out).toBe(
      `<img src="/_next/image?url=${encodeURIComponent(`${BLOB}?v=1&x=2`)}&amp;w=1080&amp;q=75">`,
    );
  });

  it('data-src·srcset 은 src 로 오인하지 않는다', () => {
    const html = `<img data-src="${BLOB}" srcset="${BLOB} 2x">`;
    expect(optimizeBodyImages(html)).toBe(html);
  });
});
