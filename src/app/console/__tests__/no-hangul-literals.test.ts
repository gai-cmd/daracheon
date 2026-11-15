import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { CONSOLE_TEAMS, CONSOLE_VISIBILITIES } from '@/lib/console/types';
import { findHangulLiterals, type HangulFinding } from './hangul-scan';

// SPEC-CONSOLE-002 AC-CS2-028 (REQ-CS2-027): 콘솔 화면 .tsx 에는 한글 문자열을 두지 않는다. 화면 문구는
// i18n.ts 에서만 가져온다. 아래 허용 목록은 저장 데이터 값·자국어 이름·페이지 메타데이터만 담는다.
const ROOT = path.resolve(__dirname, '..');

interface Allow {
  file: string;
  text: string;
  reason: string;
}

const ALLOW: Allow[] = [
  { file: 'Sidebar.tsx', text: '한국어', reason: '언어 고르기의 자국어 이름(어느 화면 언어에서도 한국어로 적는다)' },
  { file: 'Sidebar.tsx', text: '한', reason: '좁은 화면 언어 고르기의 자국어 한 글자 이름' },
  { file: 'layout.tsx', text: '조엘라이프 팀 콘솔', reason: '페이지 메타데이터 제목(서버 메타데이터라 화면 언어를 모른다)' },
];

/** 팀·공개 범위 저장값과 정확히 같은 문자열은 데이터 값이다. */
const DATA_VALUES = new Set<string>([...CONSOLE_TEAMS, ...CONSOLE_VISIBILITIES]);

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) return n === '__tests__' ? [] : tsxFiles(p);
    return n.endsWith('.tsx') ? [p] : [];
  });
}

const findings: (HangulFinding & { file: string })[] = tsxFiles(ROOT).flatMap((f) =>
  findHangulLiterals(readFileSync(f, 'utf8'), f).map((x) => ({ ...x, file: path.relative(ROOT, f) }))
);

describe('콘솔 화면에 한글 문자열 없음 (AC-CS2-028)', () => {
  it('허용 목록·데이터 값 밖의 한글 문자열이 없다', () => {
    const bad = findings.filter((x) => !DATA_VALUES.has(x.text) && !ALLOW.some((a) => a.file === x.file && a.text === x.text));
    expect(bad.map((x) => `${x.file}:${x.line} ${JSON.stringify(x.text)}`)).toEqual([]);
  });

  it('허용 목록의 모든 항목에 이유가 있고, 소스에 실제로 있다(낡지 않음)', () => {
    for (const a of ALLOW) {
      expect(a.reason.length, a.text).toBeGreaterThan(5);
      expect(findings.some((x) => x.file === a.file && x.text === a.text), `${a.file} ${a.text}`).toBe(true);
    }
  });

  it('검사 대상 파일이 실제로 읽힌다', () => {
    expect(tsxFiles(ROOT).length).toBeGreaterThan(10);
    expect(tsxFiles(ROOT).some((f) => f.includes(`${path.sep}login${path.sep}`))).toBe(true);
  });
});

describe('findHangulLiterals 검사 함수', () => {
  const count = (src: string) => findHangulLiterals(src, 'x.tsx').length;

  it('JSX 글자, 속성 문자열, 템플릿 문자열을 각각 1건으로 본다', () => {
    expect(count('const a = <span>안녕</span>;')).toBe(1);
    expect(count('const a = <i title="안녕" />;')).toBe(1);
    expect(count('const a = `안녕 ${x}`;')).toBe(1);
    expect(count("const a = '안녕';")).toBe(1);
    expect(count('const a = `${x} 안녕`;')).toBe(1);
  });

  it('주석만 있으면 0건', () => {
    expect(count('// 안녕\nconst a = 1;')).toBe(0);
    expect(count('/* 안녕 */ const a = 1;')).toBe(0);
    expect(count('const a = <div>{/* 안녕 */}</div>;')).toBe(0);
    expect(count("const u = 'https://example.com'; // 안녕")).toBe(0);
  });

  it('찾은 글자와 줄 번호를 돌려준다', () => {
    expect(findHangulLiterals('const a = 1;\nconst b = "가나";', 'x.tsx')).toEqual([{ line: 2, text: '가나' }]);
  });

  it('허용 목록에 소스에 없는 항목을 더하면 낡은 항목으로 걸린다', () => {
    const stale: Allow = { file: 'Sidebar.tsx', text: '없는 글자', reason: '테스트용 가짜 항목입니다' };
    expect(findings.some((x) => x.file === stale.file && x.text === stale.text)).toBe(false);
  });
});
