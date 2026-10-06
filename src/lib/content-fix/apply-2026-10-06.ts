/**
 * 2026-10-06 표기·맞춤법 점검 반영 엔진 — replacements-2026-10-06.json 의 규칙을
 * 운영 Blob(JSON 파일)과 블로그 글에 적용한다. 같은 표를 코드·시드에는 로컬에서 미리 적용했다.
 *
 * 규칙은 모두 "틀린 표기 → 바른 표기" 라서 멱등이다(두 번째 실행부터 변화 0).
 * 실행 주체: /api/cron/content-fix. 반영 확인 후 이 파일·JSON·라우트를 함께 제거한다.
 */
import table from './replacements-2026-10-06.json';

interface TextRule {
  id: string;
  from: string;
  to: string;
  /** HTML 이 아닌 곳(에디터 JSON)에 쓸 대체값 — 링크 삽입 규칙용 */
  toPlain?: string;
  regex?: boolean;
  scope: Array<'code' | 'data' | 'blog'>;
  blogSlug?: string;
  /** JSON 객체의 키(항목 이름)에도 적용 — 예: specs 의 '유통기한' 키 */
  keys?: boolean;
  kind?: undefined;
}
interface AltRule {
  id: string;
  kind: 'altFilename';
  match: string;
  to: string;
  scope: Array<'blog'>;
  blogSlug?: string;
}
type Rule = TextRule | AltRule;

export const RULES = (table as { rules: Rule[] }).rules;

export type Counts = Record<string, number>;

function bump(counts: Counts, id: string, n: number) {
  if (n > 0) counts[id] = (counts[id] ?? 0) + n;
}

function applyRule(s: string, r: TextRule, to: string, counts: Counts): string {
  if (r.regex) {
    const re = new RegExp(r.from, 'gm');
    let n = 0;
    const out = s.replace(re, (...args) => {
      n++;
      // $1.. 치환 — 콜백에서는 자동 치환이 안 되므로 직접 채운다.
      return to.replace(/\$(\d)/g, (_, d) => String(args[Number(d)] ?? ''));
    });
    bump(counts, r.id, n);
    return out;
  }
  const n = s.split(r.from).length - 1;
  if (!n) return s;
  bump(counts, r.id, n);
  return s.split(r.from).join(to);
}

function rulesFor(scope: 'data' | 'blog', slug?: string): Rule[] {
  return RULES.filter((r) => r.scope.includes(scope as never) && (!r.blogSlug || r.blogSlug === slug));
}

/** 문자열 하나에 규칙 적용. mode=html 이면 링크·alt 규칙의 HTML 형태를, plain 이면 평문 형태를 쓴다. */
export function fixText(s: string, rules: Rule[], mode: 'html' | 'plain', counts: Counts): string {
  let out = s;
  for (const r of rules) {
    if (r.kind === 'altFilename') {
      const re = new RegExp(r.match);
      if (mode === 'plain') {
        // 에디터 JSON 의 attrs.alt 처럼 값 전체가 파일명인 경우만 바꾼다 (src URL 은 https:// 로 시작해 불일치).
        if (re.test(out)) { bump(counts, r.id, 1); out = r.to; }
      } else {
        const inner = r.match.replace(/^\^/, '').replace(/\$$/, '');
        const attr = new RegExp(`alt="${inner.replace(/\.\*/g, '[^"]*')}"`, 'g');
        let n = 0;
        out = out.replace(attr, () => { n++; return `alt="${r.to}"`; });
        bump(counts, r.id, n);
      }
      continue;
    }
    out = applyRule(out, r, mode === 'plain' && r.toPlain ? r.toPlain : r.to, counts);
  }
  return out;
}

const SKIP_KEYS = new Set(['_rev', '_mt']);

/** JSON 값 전체(객체·배열)의 문자열 잎에 규칙을 적용한 새 값을 돌려준다. */
export function fixDeep<T>(v: T, rules: Rule[], mode: 'html' | 'plain', counts: Counts): T {
  if (typeof v === 'string') return fixText(v, rules, mode, counts) as T;
  if (Array.isArray(v)) return v.map((x) => fixDeep(x, rules, mode, counts)) as T;
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      let nk = k;
      for (const r of rules) {
        if (r.kind !== 'altFilename' && r.keys && nk.includes(r.from)) {
          nk = nk.split(r.from).join(r.to);
          bump(counts, r.id, 1);
        }
      }
      o[nk] = SKIP_KEYS.has(k) ? x : fixDeep(x, rules, mode, counts);
    }
    return o as T;
  }
  return v;
}

/** 운영 Blob JSON 파일(pages·products·faq·product-guides) 하나를 고친다. */
export function fixDataFile<T>(data: T): { data: T; counts: Counts } {
  const counts: Counts = {};
  return { data: fixDeep(data, rulesFor('data'), 'plain', counts), counts };
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

/** 블로그 글 하나를 고친다 — 본문(content)은 HTML, 에디터 JSON 은 평문 규칙으로. */
export function fixPost<P extends FixablePost>(post: P): { post: P; counts: Counts } {
  const counts: Counts = {};
  const rules = rulesFor('blog', post.slug);
  const next = { ...post };
  for (const k of ['title', 'excerpt', 'seoTitle', 'seoDescription'] as const) {
    if (typeof next[k] === 'string') next[k] = fixText(next[k] as string, rules, 'plain', counts) as P[typeof k];
  }
  if (typeof next.content === 'string') next.content = fixText(next.content, rules, 'html', counts);
  if (next.contentJson !== undefined) next.contentJson = fixDeep(next.contentJson, rules, 'plain', counts);
  if (Array.isArray(next.tags)) next.tags = fixDeep(next.tags, rules, 'plain', counts);
  if (Array.isArray(next.seoKeywords)) next.seoKeywords = fixDeep(next.seoKeywords, rules, 'plain', counts);
  return { post: next, counts };
}
