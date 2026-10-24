import { describe, expect, it } from 'vitest';
import { productImageAlt } from '@/lib/seo/product-image-alt';

/** 제품 갤러리 alt — 제품명 + 카테고리 라벨 + 순번, 라벨 중복·누락 처리. */
describe('productImageAlt', () => {
  it('제품명·라벨·순번으로 조합한다', () => {
    expect(productImageAlt('침향단 (沈香丹)', '침향환', 1)).toBe('침향단 (沈香丹) 침향환 제품 사진 1');
  });

  it('제품명에 라벨이 이미 있으면(공백 무시) 반복하지 않는다', () => {
    expect(productImageAlt('침향수 (沈香水)', '침향수', 2)).toBe('침향수 (沈香水) 제품 사진 2');
    expect(productImageAlt('침향스틱 (沈香片)', '침향 스틱', 3)).toBe('침향스틱 (沈香片) 제품 사진 3');
  });

  it('라벨이 없거나 비었거나 "전체"면 제품명만', () => {
    expect(productImageAlt(' 기보단 ', undefined, 4)).toBe('기보단 제품 사진 4');
    expect(productImageAlt('기보단', '  ', 1)).toBe('기보단 제품 사진 1');
    expect(productImageAlt('기보단', '전체', 1)).toBe('기보단 제품 사진 1');
  });
});
