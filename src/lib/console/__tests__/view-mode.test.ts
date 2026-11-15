import { describe, expect, it } from 'vitest';
import type { ConsolePerson } from '../types';
import { VIEW_STORAGE_KEY, enFormTitles, nameLabel, personName, resolveViewMode } from '../ui-model';

// SPEC-CONSOLE-002 AC-CS2-025(보기 방식 처음 값), AC-CS2-026(영어 화면 제목 저장 규칙), AC-CS2-027(영문 이름).
describe('resolveViewMode (AC-CS2-025)', () => {
  it('저장값이 맞으면 그 값, 아니면 폭 480px 을 경계로 기본값', () => {
    expect(resolveViewMode('list', 1280)).toBe('list');
    expect(resolveViewMode('cards', 375)).toBe('cards');
    expect(resolveViewMode(null, 1280)).toBe('cards');
    expect(resolveViewMode(null, 481)).toBe('cards');
    expect(resolveViewMode(null, 480)).toBe('list');
    expect(resolveViewMode('grid', 1280)).toBe('cards');
    expect(resolveViewMode(undefined, 375)).toBe('list');
    expect(resolveViewMode(42, 375)).toBe('list');
  });

  it('저장 키는 zoel-console:view', () => {
    expect(VIEW_STORAGE_KEY).toBe('zoel-console:view');
  });
});

const PEOPLE: ConsolePerson[] = [
  { email: 'a@try-n.com', name: '가나', name_en: 'Gana', team: '한국팀' },
  { email: 'b@try-n.com', name: '다라', name_en: '', team: '한국팀' },
];

describe('personName (AC-CS2-027)', () => {
  it('영어 화면: name_en → 한국어 이름 → email 순', () => {
    expect(personName('a@try-n.com', '가나', PEOPLE, 'en')).toBe('Gana');
    expect(personName('A@TRY-N.COM', '가나', PEOPLE, 'en')).toBe('Gana');
    expect(personName('b@try-n.com', '다라', PEOPLE, 'en')).toBe('다라');
    expect(personName('c@try-n.com', '', PEOPLE, 'en')).toBe('c@try-n.com');
  });

  it('한국어 화면: 한국어 이름 → email', () => {
    expect(personName('a@try-n.com', '가나', PEOPLE, 'ko')).toBe('가나');
    expect(personName('c@try-n.com', '', PEOPLE, 'ko')).toBe('c@try-n.com');
  });
});

describe('nameLabel — 이름만 저장된 표시(마지막 수정한 사람 등)', () => {
  it('영어 화면에서 사람 목록의 한국어 이름과 정확히 같으면 영문 이름', () => {
    expect(nameLabel('가나', PEOPLE, 'en')).toBe('Gana');
    expect(nameLabel('다라', PEOPLE, 'en')).toBe('다라');
    expect(nameLabel('모름', PEOPLE, 'en')).toBe('모름');
    expect(nameLabel('가나', PEOPLE, 'ko')).toBe('가나');
    expect(nameLabel('', PEOPLE, 'en')).toBe('');
  });
});

describe('enFormTitles — 영어 화면 저장 제목 (AC-CS2-026)', () => {
  it('한국어 제목이 비면 영문 제목을 한국어 제목으로도 보낸다', () => {
    expect(enFormTitles('', 'Alpha')).toEqual({ title: 'Alpha', title_en: 'Alpha' });
    expect(enFormTitles('  ', ' Alpha ')).toEqual({ title: 'Alpha', title_en: 'Alpha' });
  });

  it('한국어 제목이 있으면 그대로 둔다', () => {
    expect(enFormTitles('가나 제목', 'Alpha')).toEqual({ title: '가나 제목', title_en: 'Alpha' });
    expect(enFormTitles('가나 제목', '')).toEqual({ title: '가나 제목', title_en: '' });
  });

  it('둘 다 비면 null (요청하지 않는다)', () => {
    expect(enFormTitles('', ' ')).toBeNull();
  });
});
