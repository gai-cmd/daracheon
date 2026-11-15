import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import type { ConsoleListItem } from '@/lib/console/types';
import ItemForm from '../ItemForm';
import { MEMBER, makeItem, renderWith, splitMore, tagOf } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-026 (정적 렌더 부분): 영어 화면은 영문 칸이 주 입력, 한국어 칸은 더 보기 안 "Korean text".
const noop = () => {};
const form = (item: ConsoleListItem | null, lang: 'ko' | 'en') =>
  renderWith(createElement(ItemForm, { item, defaultCategory: 'cat-1', onCancel: noop, onSaved: noop, onConflict: noop }), { me: MEMBER, lang });

const KO_ITEM = makeItem({
  canEdit: true,
  owners: [{ name: MEMBER.name, email: MEMBER.email }],
  title: '가나 제목',
  title_en: '',
  description: '가나 설명',
  description_en: '',
  note: '가나 메모',
  note_en: '',
  links: [{ label: '가나 링크', label_en: '', url: 'https://example.com/a' }],
});

describe('영어 화면 양식 (AC-CS2-026)', () => {
  const html = form(KO_ITEM, 'en');
  const { outside, inside } = splitMore(html);

  it('첫 화면 제목 자리는 f-title-en, placeholder 는 한국어 제목', () => {
    expect(tagOf(outside, 'f-title-en')).toContain('placeholder="가나 제목"');
    expect(tagOf(outside, 'f-title')).toBe('');
  });

  it('첫 화면 설명 자리는 f-desc-en, placeholder 는 한국어 설명', () => {
    expect(tagOf(outside, 'f-desc-en')).toContain('placeholder="가나 설명"');
    expect(tagOf(outside, 'f-desc')).toBe('');
  });

  it('제목 자리는 종류·분류 바로 다음 (한국어 화면의 f-title 자리)', () => {
    const order = [...outside.matchAll(/<(?:select|input|textarea)\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(order.slice(0, 3)).toEqual(['f-cat', 'f-title-en', 'f-url']);
  });

  it('한국어 칸은 더 보기 안 "Korean text" 묶음', () => {
    const g = inside.indexOf('Korean text');
    expect(g).toBeGreaterThan(-1);
    for (const id of ['f-title', 'f-desc', 'f-note']) {
      const at = inside.indexOf(`id="${id}"`);
      expect(at, id).toBeGreaterThan(g);
    }
    expect(tagOf(inside, 'f-title')).toContain('value="가나 제목"');
  });

  it('더 보기 안 메모와 링크 이름은 영문 칸이 먼저, 한국어 값이 placeholder', () => {
    const noteEn = inside.indexOf('id="f-note-en"');
    expect(noteEn).toBeGreaterThan(-1);
    expect(noteEn).toBeLessThan(inside.indexOf('Korean text'));
    expect(tagOf(inside, 'f-note-en')).toContain('placeholder="가나 메모"');
    // 연동 주소는 링크 종류에서 첫 화면에 있다(M2 AC-CS2-010). 그 이름 칸이 영문이고, 한국어 이름은 Korean text 묶음.
    const linkEn = html.match(/<input[^>]*data-link-label="en"[^>]*>/);
    expect(linkEn?.[0]).toContain('placeholder="가나 링크"');
    expect(html.indexOf('data-link-label="en"')).toBeLessThan(html.indexOf('Korean text'));
    expect(inside.indexOf('data-link-label="ko"')).toBeGreaterThan(inside.indexOf('Korean text'));
    expect(outside).not.toContain('data-link-label="ko"');
  });

  it('영문 값이 있으면 placeholder 대신 그 값', () => {
    const h = splitMore(form(makeItem({ ...KO_ITEM, title_en: 'Gana title' }), 'en')).outside;
    expect(tagOf(h, 'f-title-en')).toContain('value="Gana title"');
  });

  it('한국어 화면은 지금 배치 그대로: f-title·f-desc 가 첫 화면, 영문 칸은 더 보기', () => {
    const ko = splitMore(form(KO_ITEM, 'ko'));
    expect(tagOf(ko.outside, 'f-title')).toContain('value="가나 제목"');
    expect(tagOf(ko.outside, 'f-desc')).not.toBe('');
    expect(tagOf(ko.inside, 'f-title-en')).not.toBe('');
    expect(ko.inside).not.toContain('Korean text');
    expect(ko.inside).not.toContain('id="f-ko-l"');
  });
});
