/**
 * Dark-theme color normalization for blog article HTML.
 *
 * Root cause this solves (2026-08-11): stored post HTML carries inline styles
 * written for a LIGHT (ivory) reading surface — light box backgrounds
 * (#faf7f0, #fffdf9, #F7F3EE, …) and dark earth-tone text (#7d7570, #4a3f26, …).
 * The site renders articles on a DARK surface, so light backgrounds swallow the
 * theme's cream text and dark inline text vanishes into the dark page.
 *
 * The previous approach patched specific hex values in BlogArticle.module.css
 * ([style*="#faf7f0"], [style*="#7d7570"], …) — every new hex regressed.
 * This module replaces that whack-a-mole with a LUMINANCE RULE, so any color,
 * present or future, is handled:
 *
 *   - inline background / background-color that is LIGHT  → removed
 *     (theme CSS provides the dark surface; dark backgrounds like the gold
 *     table header #b88c2d are intentional on dark and are KEPT)
 *   - inline color that is DARK → removed (would be unreadable on the dark
 *     page once light backgrounds are gone; light/gold text is KEPT)
 *
 * <svg>…</svg> regions are left untouched: chart colors are hardcoded inside
 * the SVG for its own cream panel (module CSS gives .article svg that panel).
 *
 * Non-color declarations (padding, border, radius, width, …) are preserved.
 * Unparseable colors (var(), gradients, named colors we don't know) are kept —
 * fail-open: better an occasional odd box than destroyed layout.
 */

/** Relative luminance 0..1 from a CSS color literal; null when unparseable. */
function luminance(raw: string): number | null {
  const v = raw.trim().toLowerCase();

  let r: number, g: number, b: number;

  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
    } else {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    }
  } else {
    const rgb = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgb) {
      r = Number(rgb[1]);
      g = Number(rgb[2]);
      b = Number(rgb[3]);
    } else if (v === 'white' || v === 'ivory' || v === 'snow' || v === 'beige') {
      return 1;
    } else if (v === 'black') {
      return 0;
    } else {
      return null; // var(), gradient, unknown named color → caller keeps it
    }
  }

  // sRGB relative luminance (WCAG) — good enough to classify light vs dark.
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const LIGHT_BG_THRESHOLD = 0.5; // backgrounds brighter than this fight the dark theme
const DARK_TEXT_THRESHOLD = 0.35; // text darker than this vanishes on the dark page

/** Transform one style="" value; returns the filtered declaration list. */
function filterStyleValue(style: string): string {
  const kept: string[] = [];
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) {
      if (decl.trim()) kept.push(decl.trim());
      continue;
    }
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();

    if (prop === 'background' || prop === 'background-color') {
      const lum = luminance(value);
      if (lum !== null && lum > LIGHT_BG_THRESHOLD) continue; // drop light bg
    } else if (prop === 'color') {
      const lum = luminance(value);
      if (lum !== null && lum < DARK_TEXT_THRESHOLD) continue; // drop dark text
    }
    kept.push(`${prop}:${value}`);
  }
  return kept.join(';');
}

/** Rewrite every style="…" attribute in an HTML fragment (no SVG awareness). */
function normalizeFragment(html: string): string {
  return html.replace(/style=("([^"]*)"|'([^']*)')/gi, (_m, _q, dq, sq) => {
    const filtered = filterStyleValue(dq ?? sq ?? '');
    return filtered ? `style="${filtered}"` : 'style=""';
  });
}

/**
 * Normalize article HTML for the dark reading surface.
 * SVG blocks pass through verbatim; everything else gets the luminance rule.
 */
export function normalizeArticleHtmlForDarkTheme(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const parts = html.split(/(<svg[\s\S]*?<\/svg>)/gi);
  return parts
    .map((part, i) => (i % 2 === 1 ? part : normalizeFragment(part)))
    .join('');
}
