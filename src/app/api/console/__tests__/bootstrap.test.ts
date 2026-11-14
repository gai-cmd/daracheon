import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-001 M4 — GET /api/console/bootstrap. AC-CON-004 (route 503), AC-CON-005/006 (401),
// AC-CON-007 (no credential value), AC-CON-011 (note and canEdit), AC-CON-026 (wiki first, kind).

vi.mock('@/lib/db', async () => (await import('./support')).dbMock);

import { GET as bootstrap } from '../bootstrap/route';
import { item, read, request, resetStore, restoreEnv, secretFor, store } from './support';

const saved: Record<string, string | undefined> = {};
beforeEach(() => resetStore(saved));
afterEach(() => restoreEnv(saved));

async function get(email: string | null, init: Record<string, unknown> = {}) {
  return read(await bootstrap(await request('GET', '/api/console/bootstrap', { email, contentType: null, origin: null, ...init })));
}
type Rec = Record<string, unknown>;
const itemsOf = (r: { json: Rec }) => r.json.items as Rec[];

describe('GET /api/console/bootstrap', () => {
  it('answers 401 without a valid session and 503 when the console is not configured', async () => {
    expect((await get(null)).status).toBe(401);
    expect((await get(null, { cookie: 'zoel_console_session=not.a-token' })).status).toBe(401);
    process.env.CONSOLE_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
    expect((await get('o@try-n.com')).status).toBe(503);
  });

  it('returns me, categories with the wiki first, people, settings and items, no-store', async () => {
    const r = await get('k@try-n.com');
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(r.json.me).toEqual({ email: 'k@try-n.com', name: '케이', team: '한국팀', isAdmin: false });
    const cats = r.json.categories as Rec[];
    expect(cats.map((c) => [c.id, c.kind])).toEqual([
      ['wiki', 'knowledge'],
      ['sites', 'resource'],
      ['assets', 'resource'],
    ]);
    expect(r.json.settings).toEqual({ teamPins: [] });
    expect(itemsOf(r).map((i) => i.id)).toEqual(['B']);
  });

  it('gives people email to everyone but the role memo to admins only (design §3.4)', async () => {
    const member = await get('k@try-n.com');
    const p = (member.json.people as Rec[]).find((x) => x.email === 'o@try-n.com')!;
    expect(p).toEqual({ email: 'o@try-n.com', name: '담당 오', name_en: 'O', team: '한국팀' });
    const admin = await get('adm@try-n.com');
    expect((admin.json.people as Rec[]).find((x) => x.email === 'o@try-n.com')).toMatchObject({ role: '직무 메모' });
    expect(admin.json.me).toMatchObject({ isAdmin: true, team: '공통' });
  });

  it('hides the private note from non-editors and shows it to the owner (AC-CON-011)', async () => {
    const u = itemsOf(await get('u@try-n.com'))[0];
    expect(u).not.toHaveProperty('note');
    expect(u.canEdit).toBe(false);
    const o = itemsOf(await get('o@try-n.com'))[0];
    expect(o.note).toBe('확인할 일 메모');
    expect(o.canEdit).toBe(true);
  });

  it('drops soft-deleted items and exposes only credential presence (AC-CON-007)', async () => {
    store.docs.set('console-items', [
      item('S', { access_method: 'shared-credential' }),
      item('X', { deletedAt: '2026-11-14T00:00:00.000Z' }),
    ]);
    store.docs.set('console-secrets', [secretFor('S')]);
    for (const email of ['u@try-n.com', 'adm@try-n.com']) {
      const r = await get(email);
      expect(r.text).not.toContain('canary');
      expect(r.text).not.toContain('"ct"');
      expect(itemsOf(r).map((i) => i.id)).toEqual(['S']);
      expect(itemsOf(r)[0]).toMatchObject({ hasLoginId: true, hasPassword: true });
    }
  });

  it('keeps team pins that point at live items only', async () => {
    store.docs.set('console-items', [item('A1'), item('A2', { deletedAt: '2026-11-14T00:00:00.000Z' })]);
    store.singles.set('console-settings', { teamPins: ['A1', 'A2', 'gone'] });
    expect((await get('k@try-n.com')).json.settings).toEqual({ teamPins: ['A1'] });
  });

  it('serves the wiki even when no category is stored (AC-CON-026)', async () => {
    store.docs.set('console-categories', [{ id: 'wiki', kind: 'resource', name: '가짜', icon: 'globe' }]);
    const cats = (await get('k@try-n.com')).json.categories as Rec[];
    expect(cats).toHaveLength(1);
    expect(cats[0]).toMatchObject({ id: 'wiki', kind: 'knowledge', icon: 'library' });
  });
});
