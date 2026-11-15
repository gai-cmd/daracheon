import { describe, expect, it } from 'vitest';
import { CONSOLE_DICT, dictKeys, localized, resolveLang, translate } from '../i18n';

// SPEC-CONSOLE-001 AC-CON-019 (ko/en key sets, English fallback, default language) and
// AC-CON-026 (nav.wiki / wiki.empty under the same keys in both languages).
describe('console i18n dictionaries', () => {
  it('ko and en define exactly the same key set, nested keys included', () => {
    const ko = dictKeys(CONSOLE_DICT.ko);
    const en = dictKeys(CONSOLE_DICT.en);
    expect(ko.length).toBeGreaterThan(100);
    expect(en).toEqual(ko);
  });

  it('every leaf is a non-empty string in both languages', () => {
    for (const lang of ['ko', 'en'] as const) {
      for (const key of dictKeys(CONSOLE_DICT[lang])) {
        const v = translate(lang, key);
        expect(typeof v, `${lang}:${key}`).toBe('string');
        expect(v.length, `${lang}:${key}`).toBeGreaterThan(0);
        expect(v, `${lang}:${key}`).not.toBe(key);
      }
    }
  });

  it('nav.wiki reads 위키 / Wiki', () => {
    expect(translate('ko', 'nav.wiki')).toBe('위키');
    expect(translate('en', 'nav.wiki')).toBe('Wiki');
  });

  it('wiki.empty exists in both languages and never says admin or import', () => {
    for (const lang of ['ko', 'en'] as const) {
      const msg = translate(lang, 'wiki.empty');
      expect(msg.length).toBeGreaterThan(10);
      expect(msg.toLowerCase()).not.toMatch(/관리자|가져오기|admin|import/);
    }
    expect(translate('ko', 'wiki.empty')).toContain('위키');
    expect(translate('en', 'wiki.empty')).toContain('Wiki');
  });

  it('access labels map to SSO / 초대 / 공유 계정 / 별도 로그인', () => {
    expect(translate('ko', 'access.sso')).toBe('SSO');
    expect(translate('ko', 'access.invite')).toBe('초대');
    expect(translate('ko', 'access.shared-credential')).toBe('공유 계정');
    expect(translate('ko', 'access.internal-login')).toBe('별도 로그인');
  });

  it('drops the prototype-only wording', () => {
    for (const lang of ['ko', 'en'] as const) {
      const all = dictKeys(CONSOLE_DICT[lang]).map((k) => translate(lang, k)).join('\n');
      expect(all).not.toMatch(/프로토타입|prototype|모의|mock/i);
    }
    const keys = dictKeys(CONSOLE_DICT.ko);
    for (const gone of ['protoNote', 'siProto', 'pwProto', 'mTheme', 'mReset']) expect(keys).not.toContain(gone);
  });

  it('substitutes {vars} and falls back to the key for unknown keys', () => {
    expect(translate('ko', 'itemsN', { n: 3 })).toBe('3개');
    expect(translate('en', 'itemsN', { n: 3 })).toBe('3 items');
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });
});

describe('localized()', () => {
  const item = { title: '한국어 제목', title_en: '', description: '설명', description_en: 'Description' };

  it('shows the Korean text in the English view when the English field is empty', () => {
    expect(localized('en', item, 'title')).toBe('한국어 제목');
    expect(localized('en', item, 'description')).toBe('Description');
  });

  it('always shows Korean in the Korean view', () => {
    expect(localized('ko', item, 'description')).toBe('설명');
  });
});

describe('resolveLang()', () => {
  it('defaults to Korean on a first visit and keeps a remembered English choice', () => {
    expect(resolveLang(null)).toBe('ko');
    expect(resolveLang(undefined)).toBe('ko');
    expect(resolveLang('fr')).toBe('ko');
    expect(resolveLang('en')).toBe('en');
    expect(resolveLang('ko')).toBe('ko');
  });
});

// SPEC-CONSOLE-002 AC-CS2-021: 이번 화면에서 새로 쓰는 문구가 한·영 같은 키로 있고, 오너가 정한 한국어 문구와 같다.
describe('SPEC-CONSOLE-002 strings', () => {
  const KO: Record<string, string> = {
    'kind.label': '종류',
    'kind.link': '링크',
    'kind.shared': '공유 계정',
    'share.all': '전체 멤버',
    'share.team': '우리 팀',
    'share.self': '나만(비공개)',
    hidePwLabel: '멤버에게 비밀번호 숨기기 (복사만 허용)',
    newCategory: '+ 새 분류 만들기…',
    'card.openLogin': '로그인 열기',
    'card.idCopiedOpen': '아이디를 복사했어요 — 비밀번호 복사 후 붙여넣으세요',
    'card.empty': '아직 계정 정보가 없어요',
    'card.enterCred': '계정 정보 입력',
    'card.activity': '사용 기록',
    'guide.menu': '자동 입력 끄기 안내',
    'guide.open': '설정 화면 열기',
    'guide.ack': '확인했어요',
    'guide.later': '나중에',
  };
  it('new keys exist in both languages', () => {
    const en = dictKeys(CONSOLE_DICT.en);
    for (const k of Object.keys(KO)) expect(en, k).toContain(k);
  });
  it('Korean wording matches the owner-facing text', () => {
    for (const [k, v] of Object.entries(KO)) expect(translate('ko', k), k).toBe(v);
  });
});
