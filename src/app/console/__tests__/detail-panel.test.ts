import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import type { ConsoleListItem } from '@/lib/console/types';
import DetailPanel from '../DetailPanel';
import { ADMIN, MEMBER, renderWith, sharedItem } from './render-helpers';

// SPEC-CONSOLE-002 AC-CS2-013 / 015 / 016 / 018 (자격증명 카드 정적 렌더).
const noop = () => {};
const panel = (item: ConsoleListItem, admin = false, lang: 'ko' | 'en' = 'ko') =>
  renderWith(createElement(DetailPanel, { item, onClose: noop }), { me: admin ? ADMIN : MEMBER, lang, items: [item] });

const HIDDEN = sharedItem({ hide_password: true });
const asMember = HIDDEN;
const asOwner = { ...HIDDEN, canEdit: true };

/** 자격증명 카드(공유 계정 섹션) html. */
function card(html: string): string {
  const start = html.indexOf('data-cred-card="true"');
  expect(start, 'credential card').toBeGreaterThan(-1);
  return html.slice(html.lastIndexOf('<section', start), html.indexOf('</section>', start));
}

describe('공유 계정 자격증명 카드 (AC-CS2-013)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('멤버와 담당자 모두 로그인 주소·아이디·비밀번호 행과 복사 버튼이 있다', () => {
    for (const it of [asMember, asOwner]) {
      const c = card(panel(it));
      const labels = [...c.matchAll(/class="[^"]*vlabel[^"]*">([^<]+)</g)].map((m) => m[1]);
      expect(labels.slice(0, 3)).toEqual(['로그인 주소', '아이디', '비밀번호']);
      expect(c).toMatch(/aria-label="아이디 복사"/);
      expect(c).toMatch(/aria-label="비밀번호 복사"/);
    }
  });

  it('숨기기 켠 항목: 멤버에게는 비밀번호 보기가 없고 담당자에게는 있다. 아이디 보기는 둘 다', () => {
    const m = card(panel(asMember));
    const o = card(panel(asOwner));
    expect(m).not.toMatch(/aria-label="비밀번호 보기"/);
    expect(o).toMatch(/aria-label="비밀번호 보기"/);
    expect(m).toMatch(/aria-label="아이디 보기"/);
    expect(o).toMatch(/aria-label="아이디 보기"/);
  });

  it('숨기기를 끈 항목은 멤버도 비밀번호 보기가 있다', () => {
    expect(card(panel(sharedItem({ hide_password: false })))).toMatch(/aria-label="비밀번호 보기"/);
  });

  it('값은 렌더하지 않는다 (가림 표시만)', () => {
    const c = card(panel(asOwner));
    expect(c).toContain('••••••••');
  });

  it('로그인 열기 버튼과 자동 입력 끄기 안내가 카드에 있다 (AC-CS2-014, AC-CS2-018)', () => {
    const c = card(panel(asMember));
    expect(c).toMatch(/>로그인 열기</);
    expect(c).toContain('자동 입력 끄기 안내');
    expect(card(panel(asMember, false, 'en'))).toContain('Turn off autofill');
  });

  it('로그인 주소가 없으면 로그인 열기를 보이지 않는다', () => {
    expect(card(panel(sharedItem({ url: '' })))).not.toMatch(/>로그인 열기</);
  });
});

describe('빈 상태 (AC-CS2-015)', () => {
  const empty = sharedItem({ hasLoginId: false, hasPassword: false });
  it('둘 다 "아직 계정 정보가 없어요", 아이디·비밀번호 행 없음, 담당자만 계정 정보 입력', () => {
    const m = card(panel(empty));
    const o = card(panel({ ...empty, canEdit: true }));
    for (const c of [m, o]) {
      expect(c).toContain('아직 계정 정보가 없어요');
      expect(c).not.toMatch(/vlabel[^"]*">아이디</);
      expect(c).not.toMatch(/vlabel[^"]*">비밀번호</);
      expect(c).not.toMatch(/>로그인 열기</);
    }
    expect(o).toMatch(/>계정 정보 입력</);
    expect(m).not.toMatch(/>계정 정보 입력</);
  });

  it('아이디만 있으면 빈 상태가 아니라 행을 보인다', () => {
    const c = card(panel(sharedItem({ hasPassword: false })));
    expect(c).not.toContain('아직 계정 정보가 없어요');
    expect(c).toMatch(/vlabel[^"]*">아이디</);
  });
});

describe('사용 기록 (AC-CS2-016)', () => {
  afterEach(() => vi.restoreAllMocks());
  it('담당자와 관리자에게만 있고, 렌더만으로는 요청하지 않는다', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const owner = panel(asOwner);
    const admin = panel({ ...HIDDEN, canEdit: true }, true);
    const member = panel(asMember);
    expect(owner).toMatch(/<details[^>]*>[\s\S]*?사용 기록/);
    expect(admin).toMatch(/<details[^>]*>[\s\S]*?사용 기록/);
    expect(member).not.toContain('사용 기록');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
