import { describe, expect, it } from 'vitest';
import { feedDateKey, feedDateLabel, pickFeed, type FeedItem } from '../home-feed';

const item = (kind: FeedItem['kind'], key: string, date: string): FeedItem => ({
  kind,
  key,
  title: key,
  date,
  sortKey: feedDateKey(date),
  image: '/x.jpg',
  source: kind,
});

const blogs = [item('blog', 'b1', '2026-11-09'), item('blog', 'b2', '2026-10-28'), item('blog', 'b3', '2026-10-21')];
const videos = [
  item('video', 'v1', '2026-11-11'),
  item('video', 'v2', '2026-11-10'),
  item('video', 'v3', '2026-11-10'),
  item('video', 'v4', '2026-11-10'),
  item('video', 'v5', '2026-08-24'),
];

describe('pickFeed', () => {
  it('keeps at least two blog posts in the all view even when videos are newer', () => {
    const out = pickFeed([...blogs, ...videos], 'all', 5, 2);
    expect(out).toHaveLength(5);
    expect(out.filter((i) => i.kind === 'blog').map((i) => i.key)).toEqual(['b1', 'b2']);
    // newest-first after the swap
    expect(out.map((i) => i.sortKey)).toEqual([...out.map((i) => i.sortKey)].sort((a, b) => b - a));
    expect(out.map((i) => i.key)).not.toContain('v4');
  });

  it('uses plain newest-first when enough blog posts are already in the top', () => {
    const out = pickFeed([...blogs, item('video', 'old', '2026-01-01')], 'all', 3, 2);
    expect(out.map((i) => i.key)).toEqual(['b1', 'b2', 'b3']);
  });

  it('filters by kind', () => {
    expect(pickFeed([...blogs, ...videos], 'blog', 5).map((i) => i.key)).toEqual(['b1', 'b2', 'b3']);
    expect(pickFeed([...blogs, ...videos], 'video', 2).map((i) => i.key)).toEqual(['v1', 'v2']);
  });

  it('works when there are no blog posts', () => {
    expect(pickFeed(videos, 'all', 3, 2).map((i) => i.key)).toEqual(['v1', 'v2', 'v3']);
  });
});

describe('feed dates', () => {
  it('round-trips a date key to a dotted label', () => {
    expect(feedDateLabel(feedDateKey('2026-11-09T01:00:00Z'))).toBe('2026.11.09');
    expect(feedDateLabel(0)).toBe('');
  });
});
