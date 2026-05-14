/**
 * Slug generation for blog posts.
 *
 * Strategy: keep Hangul as-is, lowercase Latin, swap whitespace/punctuation
 * for hyphens. Korean is the primary language of this site, so we don't
 * romanize — `/blog/침향-원목` is a perfectly good URL on modern browsers
 * and Naver indexes percent-encoded Korean slugs without penalty.
 *
 * Caller must pass `existingSlugs` so we can disambiguate by appending
 * `-2`, `-3`, … when the natural slug collides.
 */

export function slugify(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    // Keep word chars, Hangul (U+AC00-U+D7A3), Hangul jamo, hyphens.
    .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function uniqueSlug(base: string, existingSlugs: Iterable<string>): string {
  const taken = new Set(existingSlugs);
  const root = slugify(base) || 'post';
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Short, URL-safe ID — equivalent to nanoid(12) without the dep. */
export function generateBlogId(): string {
  let out = '';
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < bytes.length; i++) {
    out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  }
  return out;
}
