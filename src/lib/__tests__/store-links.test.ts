import { describe, expect, it } from 'vitest';
import { SMARTSTORE_PRODUCT_URL, rewriteSmartstoreLinks } from '@/data/store';

describe('rewriteSmartstoreLinks', () => {
  it('replaces legacy product and store URLs in hrefs', () => {
    const html =
      '<a href="https://smartstore.naver.com/agarwooding/products/13678448200">buy</a>' +
      '<a href="https://m.smartstore.naver.com/agarwooding?NaPm=ct%3D1&amp;x=1">store</a>';
    expect(rewriteSmartstoreLinks(html)).toBe(
      `<a href="${SMARTSTORE_PRODUCT_URL}">buy</a><a href="${SMARTSTORE_PRODUCT_URL}">store</a>`,
    );
  });

  it('replaces a bare store URL in text', () => {
    expect(rewriteSmartstoreLinks('see https://smartstore.naver.com/agarwooding now')).toBe(
      `see ${SMARTSTORE_PRODUCT_URL} now`,
    );
  });

  it('leaves other stores and unrelated links alone', () => {
    const html =
      '<a href="https://smartstore.naver.com/agarwoodingshop">x</a><a href="https://zoellife.com/">y</a>';
    expect(rewriteSmartstoreLinks(html)).toBe(html);
  });
});
