/**
 * Slug generation for blog posts.
 *
 * Strategy: ASCII-only slugs — lowercase Latin, digits, hyphens. Korean and
 * other non-ASCII characters are stripped (percent-encoded Hangul URLs broke
 * sharing/preview flows, so slugs are now English-only by policy). If the
 * source text yields nothing (e.g. a pure-Korean title with no manual slug),
 * `uniqueSlug` falls back to `post`, `post-2`, … — admins should supply an
 * English slug in the form for SEO-meaningful URLs.
 *
 * Caller must pass `existingSlugs` so we can disambiguate by appending
 * `-2`, `-3`, … when the natural slug collides.
 */

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
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
