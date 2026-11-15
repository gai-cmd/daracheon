import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import type { ConsoleListItem } from '@/lib/console/types';
import ItemForm from '../ItemForm';
import { ADMIN, MEMBER, makeItem, renderWith, sharedItem, splitMore, tagOf } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-009 / 010 / 012 / 020 / 021 (정적 렌더 부분).
const noop = () => {};
function form(item: ConsoleListItem | null, opts: { admin?: boolean; lang?: 'ko' | 'en' } = {}) {
  return renderWith(createElement(ItemForm, { item, defaultCategory: 'cat-1', onCancel: noop, onSaved: noop, onConflict: noop }), {
    me: opts.admin ? ADMIN : MEMBER,
    lang: opts.lang,
  });
}
const OWNED_SHARED = sharedItem({ canEdit: true, owners: [{ name: '멤버', email: MEMBER.email }] });

/** 양식 안의 컨트롤(radiogroup, select, input, textarea) 순서. */
function controls(html: string): string[] {
  const body = html.slice(html.indexOf('<form'));
  return [...body.matchAll(/<(select|textarea|input)\b[^>]*>|role="radiogroup"/g)].map((m) => (m[0].startsWith('role') ? 'radiogroup' : m[0]));
}

describe('<ItemForm> 종류 선택 (AC-CS2-009)', () => {
  it('첫 컨트롤은 radio 2개를 가진 radiogroup, 바로 다음이 분류 select', () => {
    for (const html of [form(null), form(OWNED_SHARED)]) {
      const c = controls(html);
      expect(c[0]).toBe('radiogroup');
      expect(c[1]).toMatch(/^<select[^>]*id="f-cat"/);
      const group = html.slice(html.indexOf('role="radiogroup"'), html.indexOf('</div>', html.indexOf('role="radiogroup"')));
      expect(group.match(/role="radio"/g)).toHaveLength(2);
    }
  });

  it('새 양식은 링크, 공유 계정 항목의 편집 양식은 공유 계정이 선택돼 있다', () => {
    const checked = (html: string) => {
      const m = [...html.matchAll(/<button[^>]*role="radio"[^>]*>(?:<[^>]+>)*([^<]+)/g)];
      return m.filter((x) => x[0].includes('aria-checked="true"')).map((x) => x[1]);
    };
    expect(checked(form(null))).toEqual(['링크']);
    expect(checked(form(OWNED_SHARED))).toEqual(['공유 계정']);
    expect(checked(form(null, { lang: 'en' }))).toEqual(['Link']);
    expect(checked(form(OWNED_SHARED, { lang: 'en' }))).toEqual(['Shared account']);
  });
});

describe('<ItemForm> 공유 계정 칸 (AC-CS2-010)', () => {
  it('로그인 주소·아이디·비밀번호·생성·메모·공유 대상 3개·숨기기 체크가 모두 더 보기 밖에 있다', () => {
    const { outside, inside } = splitMore(form(OWNED_SHARED));
    expect(outside).toMatch(/<label for="f-url">로그인 주소<\/label>/);
    expect(tagOf(outside, 'f-id')).not.toBe('');
    expect(tagOf(outside, 'f-pw')).not.toBe('');
    expect(outside).toMatch(/aria-label="비밀번호 생성"/);
    expect(outside).toMatch(/<label for="f-desc">메모<\/label>/);
    expect(outside).toContain('비밀번호는 적지 마세요');
    for (const [v, label] of [
      ['전체', '전체 멤버'],
      ['팀', '우리 팀'],
      ['본인', '나만(비공개)'],
    ]) {
      expect(outside).toMatch(new RegExp(`<input[^>]*type="radio"[^>]*value="${v}"`));
      expect(outside).toContain(label);
    }
    expect(outside).toMatch(/<input[^>]*type="checkbox"[^>]*id="f-hide"/);
    expect(outside).toMatch(/<label for="f-hide">멤버에게 비밀번호 숨기기 \(복사만 허용\)<\/label>/);
    // 숨기기·공유 대상이 더 보기 안에 중복되지 않는다
    expect(inside).not.toContain('f-hide');
    expect(inside).not.toMatch(/id="f-vis"/);
  });

  it('우리 팀 옆에 양식의 팀 이름이 보인다', () => {
    const html = form(sharedItem({ canEdit: true, team: '한국팀' }));
    expect(html).toContain('우리 팀 (한국팀)');
  });

  it('메모 안내 영어판', () => {
    expect(form(OWNED_SHARED, { lang: 'en' })).toContain('never put a password here');
  });

  it('링크 양식: 아이디·비밀번호 칸이 없고, 더 보기의 접속 방식에 공유 계정이 없다', () => {
    const html = form(makeItem({ canEdit: true }));
    expect(tagOf(html, 'f-id')).toBe('');
    expect(tagOf(html, 'f-pw')).toBe('');
    const { outside, inside } = splitMore(html);
    expect(inside).toMatch(/id="f-access"/);
    expect(inside).not.toContain('value="shared-credential"');
    // 첫 화면: 종류·분류 다음은 제목·주소·한 줄 설명·연동 주소 (SPEC-CONSOLE-001 양식과 같음)
    const ids = [...outside.matchAll(/<(?:input|textarea|select)[^>]*id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(['f-cat', 'f-title', 'f-url', 'f-desc']);
    expect(outside).toMatch(/id="f-links-l"/);
    expect(outside).toMatch(/<label for="f-url">주소\(URL\)<\/label>/);
  });
});

describe('<ItemForm> 새 분류 만들기 (AC-CS2-012)', () => {
  it('관리자 양식의 분류 select 마지막 선택지가 + 새 분류 만들기…', () => {
    const html = form(null, { admin: true });
    const sel = html.slice(html.indexOf('id="f-cat"'), html.indexOf('</select>', html.indexOf('id="f-cat"')));
    const opts = [...sel.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((m) => m[1]);
    expect(opts.at(-1)).toBe('+ 새 분류 만들기…');
  });

  it('일반 멤버에게는 없다', () => {
    expect(form(null)).not.toContain('새 분류 만들기');
  });
});

describe('<ItemForm> 입력 칸 속성 (AC-CS2-020)', () => {
  it('아이디 칸 autocomplete=off, 비밀번호 칸 new-password, 두 칸 모두 비밀번호 관리자 무시 표식', () => {
    const html = form(OWNED_SHARED);
    const id = tagOf(html, 'f-id');
    const pw = tagOf(html, 'f-pw');
    expect(id).toMatch(/autocomplete="off"/i);
    expect(pw).toMatch(/autocomplete="new-password"/i);
    expect(pw).not.toMatch(/autocomplete="off"/i);
    for (const tag of [id, pw]) {
      expect(tag).toMatch(/data-1p-ignore=/);
      expect(tag).toMatch(/data-lpignore="true"/);
    }
  });
});

describe('<ItemForm> 접근성 (AC-CS2-021)', () => {
  it('두 radiogroup 에 이름이 있고 체크박스는 label 과 연결되며 아이콘 버튼에 aria-label', () => {
    const html = form(OWNED_SHARED);
    const groups = [...html.matchAll(/<div[^>]*role="radiogroup"[^>]*>/g)].map((m) => m[0]);
    expect(groups).toHaveLength(2);
    for (const g of groups) {
      const by = g.match(/aria-labelledby="([^"]+)"/)?.[1];
      expect(by, g).toBeTruthy();
      expect(html).toMatch(new RegExp(`id="${by}"[^>]*>[^<]+<`));
    }
    expect(html).toMatch(/<label for="f-hide">/);
    expect(html).toMatch(/aria-label="비밀번호 생성"/);
    expect(html).toMatch(/aria-label="비밀번호 보기"/);
  });

  it('종류 버튼은 선택된 쪽만 탭 순서에 들어간다', () => {
    const radios = [...form(null).matchAll(/<button[^>]*role="radio"[^>]*>/g)].map((m) => m[0]);
    expect(radios.filter((r) => r.includes('tabindex="0"'))).toHaveLength(1);
    expect(radios.filter((r) => r.includes('tabindex="-1"'))).toHaveLength(1);
  });
});
