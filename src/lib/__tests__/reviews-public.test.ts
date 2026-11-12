import { describe, expect, it } from 'vitest';
import type { Review } from '@/data/reviews';
import { isSourceUrl, publicReviews } from '../reviews-public';

const base: Review = {
  id: 'x',
  author: 'a',
  age: '블로그 후기',
  product: 'p',
  rating: 5,
  title: 't',
  content: 'c',
  date: '2026-03-20',
  verified: true,
};

describe('publicReviews', () => {
  it('승인됐고 원문 주소가 있는 후기만 남긴다', () => {
    const out = publicReviews([
      { ...base, id: 'r1', source: 'https://blog.naver.com/foxtory/223557653133' },
      { ...base, id: 'r10' },
      { ...base, id: 'r11', source: '' },
      { ...base, id: 'r12', source: 'javascript:alert(1)' },
      { ...base, id: 'r13', source: 'https://vn-hanoi.tistory.com/9', verified: false },
      { ...base, id: 'r4', source: ' https://vn-hanoi.tistory.com/9 ' },
    ]);
    expect(out.map((r) => r.id)).toEqual(['r1', 'r4']);
    expect(out[1].source).toBe('https://vn-hanoi.tistory.com/9');
  });

  it('isSourceUrl 은 http(s) 절대 주소만 받는다', () => {
    expect(isSourceUrl('https://blog.naver.com/a/1')).toBe(true);
    expect(isSourceUrl('/reviews')).toBe(false);
    expect(isSourceUrl(undefined)).toBe(false);
  });
});
