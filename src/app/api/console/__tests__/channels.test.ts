import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// SPEC-CONSOLE-002 AC-CS2-031 — 채널 목록 GET·PUT /api/console/channels (관리자 전용, design.md §2.10).
// 지어낸 값만 쓴다.

vi.mock('@/lib/db', async () => (await import('./support')).dbMock);

import { GET, PUT } from '../channels/route';
import { auditActions, read, request, resetStore, restoreEnv, store } from './support';

const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  resetStore(saved);
  store.docs.set('console-items', [{ id: 'it-1', title: 'x', version: 1 }]);
  store.singles.set('console-settings', { teamPins: ['it-1'] });
});
afterEach(() => restoreEnv(saved));

type Rec = Record<string, unknown>;
const ADMIN = 'adm@try-n.com';
const YT = 'UCfake000000000000000001';
const put = (body: unknown, email: string | null = ADMIN, init: Rec = {}) =>
  request('PUT', '/api/console/channels', { email, body, ...init }).then(PUT).then(read);
const get = (email: string | null = ADMIN) => request('GET', '/api/console/channels', { email, contentType: null, origin: null }).then(GET).then(read);

const FIVE = [
  { label: '유튜브', label_en: 'YouTube', kind: 'youtube', source: YT, color: '#c4302b', enabled: true },
  { label: '네이버', label_en: '', kind: 'naver', source: 'fakeblog', color: '#03c75a', enabled: true },
  { label: 'RSS', label_en: '', kind: 'rss', source: 'https://example.com/feed.xml', color: '#335577', enabled: true },
  { label: '자사 블로그', label_en: 'Our blog', kind: 'zoellife-blog', source: '', color: '#1f6f5c', enabled: true },
  { label: '인스타그램', label_en: 'Instagram', kind: 'instagram', source: 'https://example.org/fakeprofile', color: '#d62976', enabled: false },
];
const settings = () => store.singles.get('console-settings') as Rec;

describe('PUT /api/console/channels', () => {
  it('stores five valid channels in order, keeps teamPins and records settings.update', async () => {
    const r = await put({ channels: FIVE });
    expect(r.status).toBe(200);
    const stored = settings().channels as Rec[];
    expect(stored.map((c) => [c.kind, c.label, c.source, c.order])).toEqual(FIVE.map((c, i) => [c.kind, c.label, c.source, i]));
    expect(stored.every((c) => typeof c.id === 'string' && /^ch-[a-z0-9]{8}$/.test(c.id as string))).toBe(true);
    expect(settings().teamPins).toEqual(['it-1']);
    expect(auditActions('settings.update')).toHaveLength(1);
    expect(auditActions('settings.update')[0].meta).toEqual({ channels: 5 });
    expect((r.json.channels as Rec[]).length).toBe(5);

    // 다시 저장해도 기존 id 는 그대로, 새 행에만 id 가 붙는다
    const again = await put({ channels: [...stored, { ...FIVE[0], label: '새 채널' }] });
    expect(again.status).toBe(200);
    const next = settings().channels as Rec[];
    expect(next.slice(0, 5).map((c) => c.id)).toEqual(stored.map((c) => c.id));
    expect(next[5].id).not.toBe(stored[0].id);
  });

  it('refuses members (403), no session (401) and a foreign Origin (403)', async () => {
    expect((await put({ channels: FIVE }, 'u@try-n.com')).status).toBe(403);
    expect((await get('u@try-n.com')).status).toBe(403);
    expect((await put({ channels: FIVE }, null)).status).toBe(401);
    expect((await get(null)).status).toBe(401);
    expect((await put({ channels: FIVE }, ADMIN, { origin: 'https://evil.io' })).status).toBe(403);
    expect(settings()).toEqual({ teamPins: ['it-1'] });
  });

  it.each([
    ['youtube UCshort', { ...FIVE[0], source: 'UCshort' }],
    ['naver Bad.Id', { ...FIVE[1], source: 'Bad.Id' }],
    ['rss over http', { ...FIVE[2], source: 'http://example.com/feed' }],
    ['instagram with credentials', { ...FIVE[4], source: 'https://u:p@example.org/x' }],
    ['zoellife-blog with a source', { ...FIVE[3], source: 'x' }],
    ['colour red', { ...FIVE[0], color: 'red' }],
    ['empty label', { ...FIVE[0], label: '' }],
    ['41-character label', { ...FIVE[0], label: 'a'.repeat(41) }],
  ])('answers 400 and stores nothing for %s', async (_n, bad) => {
    const r = await put({ channels: [FIVE[0], bad] });
    expect(r.status).toBe(400);
    expect(settings()).toEqual({ teamPins: ['it-1'] });
  });

  it('answers 400 for duplicate ids and for 13 channels', async () => {
    await put({ channels: FIVE.slice(0, 1) });
    const id = (settings().channels as Rec[])[0].id;
    const before = JSON.stringify(settings());
    expect((await put({ channels: [{ ...FIVE[0], id }, { ...FIVE[1], id }] })).status).toBe(400);
    expect((await put({ channels: Array.from({ length: 13 }, () => FIVE[0]) })).status).toBe(400);
    expect((await put({ channels: [{ ...FIVE[0], id: 'ch-unknown1' }] })).status).toBe(400);
    expect(JSON.stringify(settings())).toBe(before);
  });
});

describe('GET /api/console/channels', () => {
  it('returns every stored channel to an admin', async () => {
    await put({ channels: FIVE });
    const r = await get();
    expect(r.status).toBe(200);
    expect((r.json.channels as Rec[]).map((c) => c.kind)).toEqual(FIVE.map((c) => c.kind));
    expect(r.headers.get('cache-control')).toBe('no-store');
  });
});
