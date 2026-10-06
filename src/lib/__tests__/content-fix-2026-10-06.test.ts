import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fixDataFile, fixPost } from '@/lib/content-fix/apply-2026-10-06';

// 기준 커밋(ca398af)의 시드 = 이번 정정 전 운영 데이터와 같은 상태.
const BASE = 'ca398af';
const before = (f: string) =>
  JSON.parse(execSync(`git show ${BASE}:data/db/${f}.json`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const after = (f: string) => JSON.parse(readFileSync(`data/db/${f}.json`, 'utf8'));

describe('2026-10-06 data fixes — 운영 엔진(TS) = 로컬 적용 결과(시드)', () => {
  for (const f of ['pages', 'products', 'faq', 'company']) {
    it(`${f}.json: 엔진 결과가 커밋된 시드와 같다`, () => {
      const { data } = fixDataFile(before(f));
      expect(data).toEqual(after(f));
    });
    it(`${f}.json: 두 번째 실행은 변화 없음(멱등)`, () => {
      expect(fixDataFile(after(f)).counts).toEqual({});
    });
  }

  it('잘못된 표기가 시드에서 사라졌다', () => {
    const all = ['pages', 'products', 'faq'].map((f) => JSON.stringify(after(f))).join('');
    for (const bad of ['참향나무', 'Thymeleaceae', '푸꼬옥', 'Aquilaria Agallocha', '1일 1회 1회', '유통기한', '항암차', '광택 때까지', 'daerachoen-cham']) {
      expect(all).not.toContain(bad);
    }
  });
});

describe('2026-10-06 blog fixes', () => {
  const base = { title: '', excerpt: '', tags: [] as string[] };

  it('자리표시 문구 — HTML 본문은 링크, 에디터 JSON 은 평문', () => {
    const post = {
      ...base,
      slug: 'agarwood-sesquiterpene-guide',
      content: '<p>자세한 내용은 [내부링크: 좋은 침향 구별하는 3가지 방법]을 참고하세요.</p>',
      contentJson: { type: 'doc', content: [{ type: 'text', text: '자세한 내용은 [내부링크: 좋은 침향 구별하는 3가지 방법]을' }] },
    };
    const { post: out } = fixPost(post);
    expect(out.content).toContain('<a href="/about-agarwood#tab-1">좋은 침향 구별하는 3가지 방법</a>');
    expect(JSON.stringify(out.contentJson)).toContain('좋은 침향 구별하는 3가지 방법을');
    expect(JSON.stringify(out.contentJson)).not.toContain('<a ');
  });

  it('AI 파일명 alt 만 바꾸고 이미지 주소는 그대로', () => {
    const file = 'u6993731395_Extreme_macro_of_a_wounded_Aquilaria_trunk_abc.png';
    const post = {
      ...base,
      slug: 'agarwood-sesquiterpene-guide',
      content: `<img src="https://x.public.blob.vercel-storage.com/blog/${file}" alt="${file}">`,
      contentJson: { type: 'image', attrs: { src: `https://x.public.blob.vercel-storage.com/blog/${file}`, alt: file } },
    };
    const { post: out } = fixPost(post);
    expect(out.content).toContain(`src="https://x.public.blob.vercel-storage.com/blog/${file}"`);
    expect(out.content).not.toContain(`alt="${file}"`);
    const attrs = (out.contentJson as { attrs: { src: string; alt: string } }).attrs;
    expect(attrs.src).toContain(file);
    expect(attrs.alt).not.toContain('u6993731395');
  });

  it('특정 글 전용 규칙은 다른 글에 적용되지 않는다', () => {
    const text = '<p>원목 500kg에서 추출합니다.</p>';
    expect(fixPost({ ...base, slug: 'why-is-agarwood-so-expensive', content: text }).post.content).toContain('400kg');
    expect(fixPost({ ...base, slug: 'other-post', content: text }).post.content).toContain('500kg');
  });

  it('제목·요약·태그의 공통 오타를 고치고, 재실행은 변화 없음', () => {
    const post = {
      slug: 'x', title: '현재인의 정신건강 문제의 침향오일의 재조명', excerpt: '전통 약재의 과학적 재발', tags: ['천향곡'],
      content: '<p>과학적 재발견은 그대로, 밝혔니다다.</p>',
    };
    const once = fixPost(post).post;
    expect(once.title).toBe('현대인의 정신건강 문제와 침향 오일의 재조명');
    expect(once.excerpt).toBe('전통 약재의 과학적 재발견');
    expect(once.tags).toEqual(['침향곡']);
    expect(once.content).toBe('<p>과학적 재발견은 그대로, 밝혔습니다.</p>');
    expect(fixPost(once).counts).toEqual({});
  });
});
