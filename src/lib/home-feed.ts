/**
 * Home "new posts" feed — blog posts and YouTube videos (two channels) merged into one
 * newest-first list. Pure and dependency-free so both the server page and the client tabs use it.
 */

export type FeedKind = 'blog' | 'video';

export interface FeedItem {
  kind: FeedKind;
  /** Stable React key — blog slug or YouTube id. */
  key: string;
  title: string;
  /** Display date, YYYY.MM.DD. */
  date: string;
  /** Sort key, YYYYMMDD as a number (0 when the date is missing). */
  sortKey: number;
  image: string;
  /** Short source label shown under the date (블로그 / channel handle). */
  source: string;
  /** Blog link. */
  href?: string;
  /** Index into the shared video list (opens the YouTube modal). */
  videoIndex?: number;
}

export type FeedFilter = 'all' | FeedKind;

/** YYYY-MM-DD… / YYYY.MM.DD → YYYYMMDD number (0 if unparsable). */
export function feedDateKey(raw?: string): number {
  const m = (raw ?? '').trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  return m ? Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]) : 0;
}

/** YYYYMMDD number → YYYY.MM.DD. */
export function feedDateLabel(key: number): string {
  if (!key) return '';
  const s = String(key);
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

function newestFirst(a: FeedItem, b: FeedItem): number {
  return b.sortKey - a.sortKey;
}

/**
 * Pick the items to show for a filter.
 * - 'blog' / 'video': the newest `limit` of that kind.
 * - 'all': the newest `limit` overall, but at least `minBlog` blog posts (when that many exist),
 *   so a burst of new videos never pushes every blog post off the home page.
 */
export function pickFeed(items: FeedItem[], filter: FeedFilter, limit = 5, minBlog = 2): FeedItem[] {
  const sorted = [...items].sort(newestFirst);
  if (filter !== 'all') return sorted.filter((i) => i.kind === filter).slice(0, limit);

  const picked = sorted.slice(0, limit);
  const blogs = sorted.filter((i) => i.kind === 'blog');
  const need = Math.min(minBlog, blogs.length) - picked.filter((i) => i.kind === 'blog').length;
  for (let n = 0; n < need; n++) {
    const add = blogs.find((b) => !picked.includes(b));
    // Drop the oldest video in the selection to make room.
    const dropAt = picked.map((i) => i.kind).lastIndexOf('video');
    if (!add || dropAt < 0) break;
    picked.splice(dropAt, 1);
    picked.push(add);
  }
  return picked.sort(newestFirst);
}
