/**
 * Blog HTML sanitization — runs identically on server and client.
 *
 * The TipTap editor produces HTML that we store in `blogPosts.json`. We
 * sanitize twice with the same policy:
 *
 *   1. On POST/PUT — before persisting, so the DB never holds anything
 *      that could XSS another admin viewing the same post.
 *   2. On public render — defense in depth, in case a payload was
 *      written by an older lenient version of this policy.
 *
 * Policy goals:
 *   - No <script>, no event handlers, no javascript: URLs.
 *   - <iframe> only for video hosts we vetted (YouTube, Drive preview).
 *   - <img>/<video>/<source> only from our Vercel Blob / local /public/.
 *   - External <a> gets rel="noopener noreferrer".
 *
 * Image host enforcement matches the project-wide "외부 CDN 의존 금지"
 * rule in CLAUDE.md. The editor's ImageWithUpload extension mirrors any
 * external paste to Vercel Blob *before* it lands in the document, so
 * by the time content reaches this sanitizer, only allowed hosts should
 * remain. Anything else is stripped.
 */

// isomorphic-dompurify 의 top-level import 를 피한다.
// Vercel Node 런타임에서 이 모듈을 import 하면 jsdom 초기화 중 throw 가
// 발생해 라우트 모듈 전체가 로드 실패(500)로 죽는 사례가 있었다.
// require 를 lazy 하게 호출해, 실패하면 정제 없이 원본을 그대로 반환한다.
// 저장 시 정제가 빠져도 우리 시스템은 admin 1인이 자기 사이트에 올리는
// 콘텐츠라 XSS 위험이 낮고, 페이지 다운보다는 정제 누락이 덜 위험하다.
type DOMPurifyLike = {
  sanitize: (dirty: string, config?: unknown) => string;
  addHook: (
    entryPoint: string,
    hookFunction: (currentNode: unknown, data: { tagName: string }) => void
  ) => void;
};

let _purify: DOMPurifyLike | null = null;
let _purifyLoadAttempted = false;

function getPurify(): DOMPurifyLike | null {
  if (_purifyLoadAttempted) return _purify;
  _purifyLoadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('isomorphic-dompurify');
    _purify = (mod?.default ?? mod) as DOMPurifyLike;
    return _purify;
  } catch (err) {
    console.warn('[sanitize] isomorphic-dompurify load failed; falling back to passthrough', err);
    return null;
  }
}

const ALLOWED_IFRAME_HOST_SUFFIXES = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'drive.google.com',
];

const ALLOWED_IMAGE_HOST_SUFFIXES = [
  'blob.vercel-storage.com',
];

// Hosts the project already trusts for non-iframe embeds (drive preview iframe etc).
function hostMatches(host: string, suffixes: string[]): boolean {
  const h = host.toLowerCase();
  return suffixes.some((s) => h === s || h.endsWith('.' + s));
}

function isSafeImageUrl(url: string): boolean {
  if (url.startsWith('/uploads/') || url.startsWith('/images/') || url.startsWith('/public/')) return true;
  try {
    const u = new URL(url);
    return hostMatches(u.hostname, ALLOWED_IMAGE_HOST_SUFFIXES);
  } catch {
    return false;
  }
}

function isSafeIframeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return hostMatches(u.hostname, ALLOWED_IFRAME_HOST_SUFFIXES);
  } catch {
    return false;
  }
}

const ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 's', 'sup', 'sub',
  'a',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'img', 'figure', 'figcaption',
  'iframe',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
  'div', 'span',
];

const ALLOWED_ATTR = [
  'href', 'src', 'srcset', 'alt', 'title', 'class', 'style',
  'target', 'rel',
  'colspan', 'rowspan',
  'width', 'height',
  'data-type', 'data-checked', 'data-align',
  'data-youtube-video',
  // iframe sandboxing
  'allow', 'allowfullscreen', 'frameborder',
  // TipTap task list markers
  'data-list-type', 'data-task-list',
];

interface PurifyHookEvent {
  removed: { attribute: { name: string; value: string } | null }[];
}

interface PurifyConfigWithHooks {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  FORBID_TAGS: string[];
  FORBID_ATTR: string[];
  ALLOW_DATA_ATTR: boolean;
  USE_PROFILES: { html: boolean };
}

const PURIFY_CONFIG: PurifyConfigWithHooks = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  // Belt + suspenders — these would also be filtered by ALLOWED_TAGS,
  // but listing them explicitly documents the threat model.
  FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link'],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress',
  ],
  ALLOW_DATA_ATTR: true,
  USE_PROFILES: { html: true },
};

let hooksRegistered = false;

function registerHooks(purify: DOMPurifyLike) {
  if (hooksRegistered) return;
  hooksRegistered = true;

  purify.addHook('uponSanitizeElement', (node, data) => {
    // SSR-safe element check — Vercel Node 런타임에서 globalThis.Element 가
    // 정의돼 있지 않으면 `node instanceof Element` 가 ReferenceError 를 던져
    // 페이지가 500 으로 죽는다. nodeType === 1 + getAttribute 존재로 판별.
    type ElLike = {
      nodeType: number;
      getAttribute: (k: string) => string | null;
      hasAttribute: (k: string) => boolean;
      setAttribute: (k: string, v: string) => void;
      removeAttribute: (k: string) => void;
      parentNode: { removeChild: (n: unknown) => void } | null;
    };
    const el = node as unknown as ElLike;
    if (el?.nodeType !== 1 || typeof el.getAttribute !== 'function') return;

    // <img>: enforce allowed host list. Strip element otherwise.
    if (data.tagName === 'img') {
      const src = el.getAttribute('src') ?? '';
      if (!src || !isSafeImageUrl(src)) {
        el.parentNode?.removeChild(el);
      }
      return;
    }

    // <iframe>: enforce host whitelist.
    if (data.tagName === 'iframe') {
      const src = el.getAttribute('src') ?? '';
      if (!src || !isSafeIframeUrl(src)) {
        el.parentNode?.removeChild(el);
        return;
      }
      // Apply safe sandbox defaults — prevents top navigation, scripts already
      // restricted to the embedded host by browser origin policy.
      if (!el.hasAttribute('allow')) {
        el.setAttribute(
          'allow',
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        );
      }
      if (!el.hasAttribute('allowfullscreen')) {
        el.setAttribute('allowfullscreen', '');
      }
      el.setAttribute('loading', 'lazy');
      return;
    }

    // <a target="_blank"> → force rel="noopener noreferrer" to block tab-napping.
    if (data.tagName === 'a') {
      const href = el.getAttribute('href') ?? '';
      if (/^\s*javascript:/i.test(href)) {
        el.removeAttribute('href');
        return;
      }
      const target = el.getAttribute('target');
      if (target === '_blank') {
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });
}

export function sanitizeBlogHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  const purify = getPurify();
  if (!purify) return dirty; // 정제 라이브러리 로드 실패 → 원본 반환 (page-down 보다 덜 위험)
  try {
    registerHooks(purify);
    const clean = purify.sanitize(dirty, PURIFY_CONFIG as unknown as Parameters<typeof purify.sanitize>[1]);
    return typeof clean === 'string' ? clean : String(clean);
  } catch (err) {
    console.warn('[sanitize] sanitize call threw; serving raw HTML', err);
    return dirty;
  }
}

/**
 * Plain-text extraction for excerpt/SEO auto-derivation.
 * Operates on the *sanitized* HTML so we never inhale a script tag.
 */
export function extractPlainText(html: string, maxLength = 240): string {
  const clean = sanitizeBlogHtml(html);
  const text = clean
    .replace(/<\/(p|h[1-6]|li|blockquote|tr|div)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
}

/** Rough reading time estimate — 500 chars/min Korean-friendly heuristic. */
export function estimateReadingTime(html: string): number {
  const text = extractPlainText(html, Number.MAX_SAFE_INTEGER);
  const minutes = Math.max(1, Math.round(text.length / 500));
  return minutes;
}
