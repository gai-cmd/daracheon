import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-001 M4 — admin routes: POST /api/console/categories, PUT /api/console/people,
// PUT /api/console/settings, GET /api/console/audit. AC-CON-012, AC-CON-017, AC-CON-018 (people,
// categories, team pins), AC-CON-026 (category API refusals).

vi.mock('@/lib/db', async () => (await import('./support')).dbMock);

import { POST as addCategory } from '../categories/route';
import { PUT as putPeople } from '../people/route';
import { PUT as putSettings } from '../settings/route';
import { GET as getAudit } from '../audit/route';
import { auditActions, doc, item, read, request, resetStore, restoreEnv, store } from './support';

const saved: Record<string, string | undefined> = {};
beforeEach(() => resetStore(saved));
afterEach(() => restoreEnv(saved));

type Rec = Record<string, unknown>;
const ADMIN = 'adm@try-n.com';

const category = (body: unknown, email: string | null = ADMIN, init: Rec = {}) =>
  request('POST', '/api/console/categories', { email, body, ...init }).then(addCategory).then(read);
const people = (body: unknown, email: string | null = ADMIN, init: Rec = {}) =>
  request('PUT', '/api/console/people', { email, body, ...init }).then(putPeople).then(read);
const settings = (body: unknown, email: string | null = ADMIN, init: Rec = {}) =>
  request('PUT', '/api/console/settings', { email, body, ...init }).then(putSettings).then(read);
const audit = (email: string | null = ADMIN) =>
  request('GET', '/api/console/audit', { email, contentType: null, origin: null }).then(getAudit).then(read);

describe('admin-only gate (AC-CON-012)', () => {
  it('refuses members with 403 even when they claim admin in the body or people list', async () => {
    store.docs.set('console-people', [{ email: 'u@try-n.com', name: '유저', name_en: 'U', team: '공통', admin: true }]);
    expect((await category({ id: 'new', name: '새 분류', admin: true }, 'u@try-n.com')).status).toBe(403);
    expect((await people({ people: [], admin: true }, 'u@try-n.com')).status).toBe(403);
    expect((await settings({ teamPins: [] }, 'u@try-n.com')).status).toBe(403);
    expect((await audit('u@try-n.com')).status).toBe(403);
  });

  it('answers 401 without a session and 403 for a foreign Origin', async () => {
    expect((await category({ id: 'new', name: '새' }, null)).status).toBe(401);
    expect((await people({ people: [] }, ADMIN, { origin: 'https://evil.io' })).status).toBe(403);
  });
});

describe('POST /api/console/categories', () => {
  it('adds a resource category and records category.create', async () => {
    const r = await category({ id: 'newcat', name: '새 분류', name_en: 'New', icon: 'chart' });
    expect(r.status).toBe(201);
    expect(r.json.category).toMatchObject({ id: 'newcat', kind: 'resource', icon: 'chart' });
    expect(doc('console-categories').map((c) => c.id)).toEqual(['sites', 'assets', 'newcat']);
    expect(auditActions('category.create')).toHaveLength(1);
  });

  it('refuses the wiki id, the knowledge kind and bad icons with 400 (AC-CON-026)', async () => {
    expect((await category({ id: 'wiki', name: '위키' })).status).toBe(400);
    expect((await category({ id: 'kb', kind: 'knowledge', name: '지식' })).status).toBe(400);
    expect((await category({ id: 'lib', name: '책', icon: 'library' })).status).toBe(400);
    expect((await category({ id: 'Bad Id', name: '나쁜' })).status).toBe(400);
    expect(doc('console-categories')).toHaveLength(2);
  });

  it('refuses an id that already exists with 409', async () => {
    expect((await category({ id: 'sites', name: '중복' })).status).toBe(409);
  });
});

describe('PUT /api/console/people', () => {
  it('replaces the list and removes people absent from it (AC-CON-018)', async () => {
    const next = [
      { email: 'o@try-n.com', name: '담당 오', name_en: 'O', team: '한국팀' },
      { email: 'K@TRY-N.COM', name: '케이', name_en: 'K', team: '방글라데시팀', admin: true },
    ];
    const r = await people({ people: next });
    expect(r.status).toBe(200);
    expect(doc('console-people').map((p) => p.email).sort()).toEqual(['k@try-n.com', 'o@try-n.com']);
    expect(JSON.stringify(doc('console-people'))).not.toContain('admin');
    expect(auditActions('people.update')).toHaveLength(1);
  });

  it('rejects invalid entries and duplicate emails with 400, changing nothing', async () => {
    const before = JSON.stringify(doc('console-people'));
    expect((await people({ people: [{ email: 'x@evil.io', name: '외부', team: '공통' }] })).status).toBe(400);
    expect((await people({ people: [{ email: 'a@try-n.com', name: '가', team: '화성팀' }] })).status).toBe(400);
    expect(
      (await people({ people: [{ email: 'a@try-n.com', name: '가', team: '공통' }, { email: 'A@try-n.com', name: '나', team: '공통' }] })).status
    ).toBe(400);
    expect((await people({ notPeople: [] })).status).toBe(400);
    expect(JSON.stringify(doc('console-people'))).toBe(before);
  });
});

describe('PUT /api/console/settings', () => {
  it('replaces team pins with live item ids and records settings.update (AC-CON-018)', async () => {
    store.docs.set('console-items', [item('P1'), item('P2')]);
    const r = await settings({ teamPins: ['P2', 'P1', 'P2'] });
    expect(r.status).toBe(200);
    expect(store.singles.get('console-settings')).toEqual({ teamPins: ['P2', 'P1'] });
    expect(auditActions('settings.update')).toHaveLength(1);
  });

  it('rejects unknown or deleted ids, more than 8 pins, and a non-array with 400', async () => {
    store.docs.set('console-items', [
      ...Array.from({ length: 9 }, (_, i) => item(`P${i}`)),
      item('D', { deletedAt: '2026-11-14T00:00:00.000Z' }),
    ]);
    expect((await settings({ teamPins: ['nope'] })).status).toBe(400);
    expect((await settings({ teamPins: ['D'] })).status).toBe(400);
    expect((await settings({ teamPins: Array.from({ length: 9 }, (_, i) => `P${i}`) })).status).toBe(400);
    expect((await settings({ teamPins: 'P1' })).status).toBe(400);
    expect(store.singles.get('console-settings')).toBeUndefined();
  });
});

describe('GET /api/console/audit (AC-CON-017)', () => {
  it('returns the most recent entries first to an admin, no-store', async () => {
    store.docs.set('console-audit-log', [
      { id: 'a1', at: '2026-11-14T00:00:00.000Z', actor: 'o@try-n.com', actorRole: 'console-member', module: 'console', action: 'item.create' },
      { id: 'a2', at: '2026-11-14T01:00:00.000Z', actor: 'o@try-n.com', actorRole: 'console-member', module: 'console', action: 'item.update' },
    ]);
    const r = await audit();
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect((r.json.entries as Rec[]).map((e) => e.id)).toEqual(['a2', 'a1']);
  });
});
