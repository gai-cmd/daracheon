/**
 * 2026-10-07 표기·맞춤법 2차 점검 반영 엔진 — replacements-2026-10-07.json 의 규칙을
 * 운영 Blob(JSON 파일)과 블로그 글에 적용한다. 같은 표를 코드·시드에는 로컬에서 미리 적용했다.
 *
 * 1차(10-06)와 다른 점: 블로그 본문(TinyMCE HTML)은 공백이 &nbsp; 나 NBSP 로 저장된 곳이 있어
 * 리터럴 비교가 빗나갔다. 이제 리터럴 규칙의 공백은 공백·NBSP·&nbsp; 어느 것과도 맞고,
 * 정규식 규칙은 {S}(1개 이상)·{S?}(0개 이상) 자리표시로 같은 공백 집합을 쓴다.
 *
 * 규칙은 모두 "틀린 표기 → 바른 표기" 라서 멱등이다(두 번째 실행부터 변화 0).
 * 실행 주체: /api/cron/content-fix. 반영 확인 후 이 파일·JSON·라우트를 함께 제거한다.
 */
import table from './replacements-2026-10-07.json';

interface Rule {
  id: string;
  from: string;
  to: string;
  regex?: boolean;
  scope: Array<'code' | 'data' | 'blog'>;
}

export const RULES = (table as { rules: Rule[] }).rules;

export type Counts = Record<string, number>;

const SPACE = '(?:\\s|&nbsp;)';

/** 규칙 → 전역 정규식. 리터럴은 이스케이프하고 공백 덩어리를 SPACE+ 로 바꾼다. */
export function patternOf(r: Rule): RegExp {
  const src = r.regex
    ? r.from.replace(/\{S\?\}/g, `${SPACE}*`).replace(/\{S\}/g, `${SPACE}+`)
    : r.from
        .split(/\s+/)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join(`${SPACE}+`);
  return new RegExp(src, 'g');
}

const COMPILED = new Map<string, RegExp>();
function compiled(r: Rule): RegExp {
  let re = COMPILED.get(r.id);
  if (!re) {
    re = patternOf(r);
    COMPILED.set(r.id, re);
  }
  re.lastIndex = 0;
  return re;
}

function bump(counts: Counts, id: string, n: number) {
  if (n > 0) counts[id] = (counts[id] ?? 0) + n;
}

export function fixText(s: string, rules: Rule[], counts: Counts): string {
  let out = s;
  for (const r of rules) {
    let n = 0;
    out = out.replace(compiled(r), (...args) => {
      n++;
      if (!r.regex) return r.to;
      // $1.. 치환 — 콜백에서는 자동 치환이 안 되므로 직접 채운다. 없는 그룹은 빈 문자열.
      return r.to.replace(/\$(\d)/g, (_, d) => {
        const g = args[Number(d)];
        return typeof g === 'string' ? g : '';
      });
    });
    bump(counts, r.id, n);
  }
  return out;
}

function rulesFor(scope: 'data' | 'blog'): Rule[] {
  return RULES.filter((r) => r.scope.includes(scope));
}

const SKIP_KEYS = new Set(['_rev', '_mt']);

/** JSON 값 전체(객체·배열)의 문자열 잎에 규칙을 적용한 새 값을 돌려준다. 키는 건드리지 않는다. */
export function fixDeep<T>(v: T, rules: Rule[], counts: Counts): T {
  if (typeof v === 'string') return fixText(v, rules, counts) as T;
  if (Array.isArray(v)) return v.map((x) => fixDeep(x, rules, counts)) as T;
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      o[k] = SKIP_KEYS.has(k) ? x : fixDeep(x, rules, counts);
    }
    return o as T;
  }
  return v;
}

/** 운영 Blob JSON 파일(pages·products·faq·product-guides·company) 하나를 고친다. */
export function fixDataFile<T>(data: T): { data: T; counts: Counts } {
  const counts: Counts = {};
  return { data: fixDeep(data, rulesFor('data'), counts), counts };
}

export interface FixablePost {
  slug: string;
  title?: string;
  excerpt?: string;
  content?: string;
  contentJson?: unknown;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

/** 블로그 글 하나를 고친다 — 본문 HTML, 에디터 JSON, 제목·요약·태그·SEO 필드. */
export function fixPost<P extends FixablePost>(post: P): { post: P; counts: Counts } {
  const counts: Counts = {};
  const rules = rulesFor('blog');
  const next = { ...post };
  for (const k of ['title', 'excerpt', 'seoTitle', 'seoDescription', 'content'] as const) {
    if (typeof next[k] === 'string') next[k] = fixText(next[k] as string, rules, counts) as P[typeof k];
  }
  if (next.contentJson !== undefined) next.contentJson = fixDeep(next.contentJson, rules, counts);
  if (Array.isArray(next.tags)) next.tags = fixDeep(next.tags, rules, counts);
  if (Array.isArray(next.seoKeywords)) next.seoKeywords = fixDeep(next.seoKeywords, rules, counts);
  return { post: next, counts };
}
