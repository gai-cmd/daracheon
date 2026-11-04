/**
 * 상세페이지 시안 편집기 — 서버 측 HTML 정제.
 *
 * 편집된 텍스트 블록의 `html` 은 공개 시안 페이지(시안 오리진)에서 innerHTML 로 적용되므로,
 * 저장 직전에 반드시 이 정제를 거친다. 클라이언트 코어(public/detail-edit/apply.js)가 같은 허용 목록을
 * 구현하며, 두 구현은 공유 벡터(src/lib/detail-edits-core/__tests__/sanitize-vectors.json)로 함께 검증한다.
 *
 * 허용 (계약 §1):
 *   태그    b strong i em u s small mark sup sub br span a code abbr
 *   속성    class(^[\w\- ]{1,80}$), style(허용 속성만·값 제한), a: href(http/https/mailto/tel)·target·rel(강제)
 *   (계약 §1 보정: style 허용 속성에 색 전용 `background` 단축 속성을 더했다 — 실제 시안 동일성 때문)
 * 그 밖은 전부 제거한다(허용되지 않는 태그는 풀어서 글자만 남긴다 — script 등은 내용째 제거).
 *
 * 설계:
 *   1) DOMPurify 로 파싱·태그/속성 1차 필터 (RETURN_DOM — 문자열 왕복 없이 정제된 DOM 을 받는다)
 *   2) 정제된 DOM 에서 속성 "값"만 다시 다듬는다 (속성 제거/값 축소만 — 새 마크업을 만들지 않으므로 mXSS 경로가 없다)
 *   3) 고정점(재정제해도 같은 결과)이 될 때까지 반복하고, 수렴하지 않으면 거절한다
 *
 * 전역 DOMPurify 싱글턴을 공유하므로 훅(addHook)은 쓰지 않는다 — 블로그 정제기와 서로 간섭하지 않게 하려는 것이다.
 * 라이브러리 로드에 실패하면 원문을 통과시키지 않고 SanitizerUnavailableError 를 던진다(fail-closed).
 */

export class SanitizerUnavailableError extends Error {
  constructor(message = 'HTML 정제기를 사용할 수 없습니다.') {
    super(message);
    this.name = 'SanitizerUnavailableError';
  }
}

interface PurifyLike {
  sanitize: (dirty: string, config: Record<string, unknown>) => unknown;
}

let purifyCache: PurifyLike | null = null;

// 라이브러리 로더 — 기본은 호출 시점의 require. 테스트가 로드 실패 경로를 재현할 수 있도록 교체 가능하게 둔다.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultLoader = (): unknown => (typeof require === 'function' ? require('isomorphic-dompurify') : null);
let loader: () => unknown = defaultLoader;

/** 테스트 전용: 로더를 교체/복원하고 캐시를 비운다. */
export function __setPurifyLoaderForTests(next: (() => unknown) | null): void {
  loader = next ?? defaultLoader;
  purifyCache = null;
}

function getPurify(): PurifyLike {
  if (purifyCache) return purifyCache;
  try {
    // 블로그 정제기와 같은 방식: top-level import 를 피하고 호출 시점에 로드한다
    // (Vercel Node 런타임에서 jsdom 초기화 실패가 라우트 모듈 전체를 죽인 전례가 있다).
    const mod = loader() as { default?: PurifyLike } | PurifyLike | null;
    const purify = ((mod as { default?: PurifyLike } | null)?.default ?? mod) as PurifyLike | null;
    if (!purify || typeof purify.sanitize !== 'function') throw new Error('sanitize() 가 없습니다.');
    purifyCache = purify;
    return purify;
  } catch (err) {
    console.error('[detail-edits] isomorphic-dompurify 로드 실패', err);
    throw new SanitizerUnavailableError();
  }
}

export const ALLOWED_TAGS: readonly string[] = [
  'b', 'strong', 'i', 'em', 'u', 's', 'small', 'mark', 'sup', 'sub', 'br', 'span', 'a', 'code', 'abbr', 'q',
];

const PURIFY_CONFIG: Record<string, unknown> = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: ['class', 'style', 'href', 'target', 'rel'],
  // DOMPurify 는 URI 안전 목록 밖 속성의 "값"에도 ALLOWED_URI_REGEXP 를 적용한다.
  // target·rel 의 값이 그 검사(http/https/mailto/tel)에 걸려 지워지지 않도록 목록에 올리고, 값은 아래에서 직접 검사한다.
  ADD_URI_SAFE_ATTR: ['target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i,
  RETURN_DOM: true,
};

/* ── 속성 값 규칙 ───────────────────────────────────────────── */

const CLASS_RE = /^[\w\- ]{1,80}$/;
const HREF_RE = /^(?:https?:|mailto:|tel:)/i;
const STYLE_PROPS: ReadonlySet<string> = new Set([
  'color',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'line-height',
  'text-decoration',
  'background-color',
  // 단축 속성 `background` 는 색 하나일 때만 허용한다(아래 BACKGROUND_COLOR_RE). 실제 시안(s2_check 표의 O/X 표시)이
  // `style="background:#85858C"` 를 쓰므로, 빼면 "정제해도 원본과 같다"는 동일성(계약 §1)이 깨진다.
  'background',
  'opacity',
  'white-space',
  'word-break',
]);
const STYLE_VALUE_RE = /^[\w\s#%.,()\-'"/]+$/;
// `background` 단축 속성의 값: 색 하나(#hex · 색 이름/키워드 · rgb()/hsl()). 이미지 함수(url·image-set 등)는 통과하지 못한다.
const BACKGROUND_COLOR_RE = /^(?:#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,24}|(?:rgb|hsl)a?\(\s*[\d.%\s,/-]+\))$/;
const STYLE_DANGER_RE = /url\s*\(|expression|javascript:|@import|\\/i;

/** `;` 로 선언을 나눈다 (괄호·따옴표 안의 `;` 는 구분자가 아니다). */
function splitDeclarations(style: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < style.length; i++) {
    const ch = style[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth = Math.max(0, depth - 1);
    } else if (ch === ';' && depth === 0) {
      out.push(style.slice(start, i));
      start = i + 1;
    }
  }
  out.push(style.slice(start));
  return out;
}

function declarationAllowed(decl: string): boolean {
  const idx = decl.indexOf(':');
  if (idx < 0) return false;
  const prop = decl.slice(0, idx).trim().toLowerCase();
  const value = decl.slice(idx + 1).trim();
  if (!STYLE_PROPS.has(prop)) return false;
  if (!value || !STYLE_VALUE_RE.test(value) || STYLE_DANGER_RE.test(value)) return false;
  if (prop === 'background' && !BACKGROUND_COLOR_RE.test(value)) return false;
  return true;
}

/**
 * style 속성값에서 허용된 선언만 남긴다. 전부 허용이면 원문을 그대로 돌려준다
 * (원문 보존 — 시안 원본 인라인 스타일이 정제 때문에 달라지면 동일성 검사가 깨진다).
 */
export function filterStyle(value: string): string {
  const decls = splitDeclarations(value).filter((d) => d.trim() !== '');
  if (decls.every(declarationAllowed)) return value;
  return decls
    .filter(declarationAllowed)
    .map((d) => d.trim())
    .join('; ');
}

/* ── DOM 후처리 ─────────────────────────────────────────────── */

interface ElementLike {
  tagName: string;
  innerHTML: string;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  readonly attributes: ArrayLike<{ name: string }>;
  querySelectorAll(selector: string): ArrayLike<ElementLike>;
}

function tidyAttributes(root: ElementLike): void {
  const elements = Array.from(root.querySelectorAll('*'));
  for (const el of elements) {
    const isAnchor = el.tagName.toLowerCase() === 'a';
    for (const name of Array.from(el.attributes, (a) => a.name)) {
      const value = el.getAttribute(name) ?? '';
      switch (name) {
        case 'class':
          if (!CLASS_RE.test(value)) el.removeAttribute(name);
          break;
        case 'style': {
          const next = filterStyle(value);
          if (next === '') el.removeAttribute(name);
          else if (next !== value) el.setAttribute(name, next);
          break;
        }
        case 'href':
          if (!isAnchor || !HREF_RE.test(value.trim())) el.removeAttribute(name);
          break;
        case 'target':
          if (!isAnchor || (value !== '_blank' && value !== '_self')) el.removeAttribute(name);
          break;
        case 'rel':
          // 값은 아래에서 강제로 덮어쓴다. 앵커가 아니면 제거.
          if (!isAnchor) el.removeAttribute(name);
          break;
        default:
          el.removeAttribute(name);
      }
    }
    if (isAnchor && el.getAttribute('rel') !== 'noopener noreferrer') {
      el.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

function sanitizeOnce(html: string): string {
  const purify = getPurify();
  const body = purify.sanitize(html, PURIFY_CONFIG) as ElementLike | null;
  if (!body || typeof body.innerHTML !== 'string') {
    throw new SanitizerUnavailableError('HTML 정제 결과를 해석할 수 없습니다.');
  }
  tidyAttributes(body);
  return body.innerHTML;
}

const MAX_PASSES = 4;

/**
 * 편집 텍스트의 html 을 정제해 돌려준다. 입력이 문자열이 아니면 빈 문자열.
 * 결과는 재정제해도 변하지 않는 고정점이며, 수렴하지 않으면 SanitizerUnavailableError.
 */
export function sanitizeDetailHtml(html: string): string {
  if (typeof html !== 'string' || html === '') return '';
  let current = sanitizeOnce(html);
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const next = sanitizeOnce(current);
    if (next === current) return current;
    current = next;
  }
  throw new SanitizerUnavailableError('HTML 정제 결과가 수렴하지 않습니다.');
}
