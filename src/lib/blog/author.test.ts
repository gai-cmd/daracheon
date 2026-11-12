import { describe, expect, it } from 'vitest';
import { authorDisplayName, isBrandAuthor } from '@/lib/blog/post-seo';

/** 작성자 표시명 — 화면 바이라인·article:author·JSON-LD 가 같은 이름을 쓴다. */

describe('authorDisplayName / isBrandAuthor', () => {
  const admins = [
    { email: 'jay@example.com', displayName: ' 홍길동 ' },
    { email: 'noname@example.com' },
  ];

  it('귀속 이메일이 어드민 계정과 맞으면 그 표시 이름(로그인 아이디 대신)', () => {
    expect(authorDisplayName({ author: 'jay', authorEmail: 'jay@example.com' }, admins)).toBe('홍길동');
  });

  it('이메일이 없거나 계정·표시 이름이 없으면 저장된 author 그대로', () => {
    expect(authorDisplayName({ author: '대라천' }, admins)).toBe('대라천');
    expect(authorDisplayName({ author: 'pjh', authorEmail: 'gone@example.com' }, admins)).toBe('pjh');
    expect(authorDisplayName({ author: 'x', authorEmail: 'noname@example.com' }, admins)).toBe('x');
  });

  it('브랜드·법인명과 빈 이름은 조직으로 본다', () => {
    for (const name of ['대라천', '조엘라이프(주)', 'ZOEL LIFE', 'zoel', '', undefined]) {
      expect(isBrandAuthor(name)).toBe(true);
    }
    expect(isBrandAuthor('홍길동')).toBe(false);
    expect(isBrandAuthor('jay')).toBe(false);
  });
});
