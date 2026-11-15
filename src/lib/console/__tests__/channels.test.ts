import { describe, expect, it } from 'vitest';
import { channelHome, normalizeStoredChannels, validateChannels } from '../channels';
import { MAX_CHANNELS, type ConsoleChannel } from '../types';

// SPEC-CONSOLE-002 AC-CS2-031 (검사 규칙), design.md §2.10, CS2-D25(채널 공개 주소).
// 지어낸 값만 쓴다: UCfake… 유튜브 id, fake… 블로그 id, example.com·example.org 주소.

const YT = 'UCfake000000000000000001';
const row = (over: Record<string, unknown> = {}) => ({ label: '지어낸 채널', label_en: 'Made-up', kind: 'youtube', source: YT, color: '#C4302B', enabled: true, ...over });
let seq = 0;
const newId = () => `ch-new${String(++seq).padStart(5, '0')}`;

describe('validateChannels', () => {
  it('accepts one row of every kind, keeps the order and assigns ids only to new rows', () => {
    const r = validateChannels(
      [
        row(),
        row({ id: 'ch-keep0001', kind: 'naver', source: 'fake_blog-1', label: '블로그' }),
        row({ kind: 'rss', source: 'https://example.com/feed.xml', label: 'RSS' }),
        row({ kind: 'zoellife-blog', source: '', label: '자사 블로그' }),
        row({ kind: 'instagram', source: 'https://example.org/fakeprofile', label: '인스타', enabled: false }),
      ],
      new Set(['ch-keep0001']),
      newId
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.channels.map((c) => c.kind)).toEqual(['youtube', 'naver', 'rss', 'zoellife-blog', 'instagram']);
    expect(r.channels.map((c) => c.order)).toEqual([0, 1, 2, 3, 4]);
    expect(r.channels[1].id).toBe('ch-keep0001');
    expect(r.channels[0].id).toMatch(/^ch-/);
    expect(r.channels[0].id).not.toBe('ch-keep0001');
    expect(r.channels[0].color).toBe('#c4302b');
    expect(r.channels[4].enabled).toBe(false);
  });

  it.each([
    ['youtube UCshort', row({ source: 'UCshort' }), 'source'],
    ['naver Bad.Id', row({ kind: 'naver', source: 'Bad.Id' }), 'source'],
    ['rss over http', row({ kind: 'rss', source: 'http://example.com/feed' }), 'source'],
    ['instagram with credentials', row({ kind: 'instagram', source: 'https://u:p@example.org/x' }), 'source'],
    ['zoellife-blog with a source', row({ kind: 'zoellife-blog', source: 'x' }), 'source'],
    ['colour name', row({ color: 'red' }), 'color'],
    ['empty label', row({ label: '  ' }), 'label'],
    ['41-character label', row({ label: 'a'.repeat(41) }), 'label'],
    ['41-character English label', row({ label_en: 'a'.repeat(41) }), 'label_en'],
    ['unknown kind', row({ kind: 'tiktok' }), 'kind'],
  ])('rejects %s', (_name, bad, field) => {
    const r = validateChannels([row(), bad], new Set(), newId);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]).toMatchObject({ index: 1, field });
  });

  it('rejects duplicate ids, unknown ids, a non-array and more than 12 rows', () => {
    const dup = validateChannels([row({ id: 'ch-a0000001' }), row({ id: 'ch-a0000001' })], new Set(['ch-a0000001']), newId);
    expect(dup.ok).toBe(false);
    const unknown = validateChannels([row({ id: 'ch-zzzzzzzz' })], new Set(), newId);
    expect(unknown.ok === false && unknown.errors[0].reason).toBe('unknown_id');
    expect(validateChannels('nope', new Set(), newId).ok).toBe(false);
    const many = validateChannels(Array.from({ length: MAX_CHANNELS + 1 }, () => row()), new Set(), newId);
    expect(many.ok === false && many.errors[0].reason).toBe('too_many');
    expect(validateChannels(Array.from({ length: MAX_CHANNELS }, () => row()), new Set(), newId).ok).toBe(true);
  });
});

describe('channelHome (CS2-D25)', () => {
  const ch = (kind: ConsoleChannel['kind'], source: string): ConsoleChannel => ({ id: 'ch-1', label: 'x', label_en: '', kind, source, color: '#000000', enabled: true, order: 0 });
  it('derives the public address from the kind', () => {
    expect(channelHome(ch('youtube', YT))).toBe(`https://www.youtube.com/channel/${YT}`);
    expect(channelHome(ch('naver', 'fakeblog'))).toBe('https://blog.naver.com/fakeblog');
    expect(channelHome(ch('rss', 'https://example.com/a/feed.xml'))).toBe('https://example.com');
    expect(channelHome(ch('instagram', 'https://example.org/fakeprofile'))).toBe('https://example.org/fakeprofile');
    expect(channelHome(ch('zoellife-blog', ''))).toBe('/blog');
  });
});

describe('normalizeStoredChannels', () => {
  it('drops malformed stored rows and returns the rest in order', () => {
    const stored = [
      { id: 'ch-b', label: 'B', label_en: '', kind: 'naver', source: 'fakeb', color: '#111111', enabled: true, order: 1 },
      { id: 'ch-a', label: 'A', label_en: '', kind: 'youtube', source: YT, color: '#222222', enabled: true, order: 0 },
      { id: 'ch-x', label: 'X', kind: 'naver', source: 'Bad.Id', color: '#111111', enabled: true, order: 2 },
      'junk',
    ];
    expect(normalizeStoredChannels(stored).map((c) => c.id)).toEqual(['ch-a', 'ch-b']);
    expect(normalizeStoredChannels(undefined)).toEqual([]);
  });
});
