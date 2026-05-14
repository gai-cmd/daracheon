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

import DOMPurify from 'isomorphic-dompurify';

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

function registerHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;

  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (!(node instanceof Element)) return;

    // <img>: enforce allowed host list. Strip element otherwise.
    if (data.tagName === 'img') {
      const src = node.getAttribute('src') ?? '';
      if (!src || !isSafeImageUrl(src)) {
        node.parentNode?.removeChild(node);
      }
      return;
    }

    // <iframe>: enforce host whitelist.
    if (data.tagName === 'iframe') {
      const src = node.getAttribute('src') ?? '';
      if (!src || !isSafeIframeUrl(src)) {
        node.parentNode?.removeChild(node);
        return;
      }
      // Apply safe sandbox defaults — prevents top navigation, scripts already
      // restricted to the embedded host by browser origin policy.
      if (!node.hasAttribute('allow')) {
        node.setAttribute(
          'allow',
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        );
      }
      if (!node.hasAttribute('allowfullscreen')) {
        node.setAttribute('allowfullscreen', '');
      }
      node.setAttribute('loading', 'lazy');
      return;
    }

    // <a target="_blank"> → force rel="noopener noreferrer" to block tab-napping.
    if (data.tagName === 'a') {
      const href = node.getAttribute('href') ?? '';
      if (/^\s*javascript:/i.test(href)) {
        node.removeAttribute('href');
        return;
      }
      const target = node.getAttribute('target');
      if (target === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });
}

export function sanitizeBlogHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  registerHooks();
  const clean = DOMPurify.sanitize(dirty, PURIFY_CONFIG as unknown as Parameters<typeof DOMPurify.sanitize>[1]);
  return typeof clean === 'string' ? clean : String(clean);
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
