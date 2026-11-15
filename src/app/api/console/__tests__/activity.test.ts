import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-002 M1 — GET /api/console/items/:id/activity (REQ-CS2-005, AC-CS2-005).
// 이름·주소·값은 모두 지어낸 값이다(공개 저장소).

vi.mock('@/lib/db', async () => (await import('./support')).dbMock);

import { GET as activity } from '../items/[id]/activity/route';
import { NOW, PEOPLE, item, params, read, request, resetStore, restoreEnv, store } from './support';

type Rec = Record<string, unknown>;
const saved: Record<string, string | undefined> = {};

const ACTIONS = ['credential.view', 'credential.copy', 'credential.deny', 'credential.rate_limited'] as const;
const ACTORS = ['k@try-n.com', 'zz@try-n.com'];

beforeEach(() => {
  resetStore(saved);
  store.docs.set('console-people', [...PEOPLE.filter((p) => p.email !== 'k@try-n.com'), { email: 'k@try-n.com', name: '지어낸멤버', name_en: 'M', team: '한국팀' }]);
  store.docs.set('console-items', [
    item('A', { access_method: 'shared-credential', hide_password: true }),
    item('B', { access_method: 'shared-credential' }),
    item('GONE', { deletedAt: '2026-11-14T00:00:00.000Z' }),
  ]);
  const audit: Rec[] = [];
  // 항목 A: 자격증명 사건 25건(시각이 모두 다름, 오래된 것부터 저장).
  for (let i = 0; i < 25; i++) {
    const action = ACTIONS[i % ACTIONS.length];
    audit.push({
      id: `a-${i}`,
      at: new Date(NOW - (25 - i) * 60_000).toISOString(),
      actor: ACTORS[i % 2],
      actorRole: 'console-member',
      module: 'console',
      action,
      targetId: 'A',
      meta: action === 'credential.deny' ? { field: 'password', reason: 'reveal_hidden' } : { field: 'password' },
    });
  }
  for (let i = 0; i < 3; i++) {
    audit.push({ id: `b-${i}`, at: new Date(NOW - i * 1000).toISOString(), actor: 'k@try-n.com', actorRole: 'console-member', module: 'console', action: 'credential.view', targetId: 'B', meta: { field: 'password' } });
  }
  for (let i = 0; i < 2; i++) {
    audit.push({ id: `u-${i}`, at: new Date(NOW - i * 500).toISOString(), actor: 'o@try-n.com', actorRole: 'console-member', module: 'console', action: 'item.update', targetId: 'A' });
  }
  store.docs.set('console-audit-log', audit);
});
afterEach(() => restoreEnv(saved));

async function get(email: string | null, id = 'A') {
  return read(await activity(await request('GET', `/api/console/items/${id}/activity`, { email, contentType: null, origin: null }), params(id)));
}

describe('GET /api/console/items/:id/activity (AC-CS2-005)', () => {
  it('answers 401 without a session, 403 for a non-editor, 404 for unknown and deleted items', async () => {
    expect((await get(null)).status).toBe(401);
    expect((await get('k@try-n.com')).status).toBe(403);
    expect((await get('o@try-n.com', 'nope')).status).toBe(404);
    expect((await get('o@try-n.com', 'GONE')).status).toBe(404);
  });

  it('gives owner and admin the 20 newest credential events of this item only, newest first', async () => {
    for (const email of ['o@try-n.com', 'adm@try-n.com']) {
      const r = await get(email);
      expect(r.status).toBe(200);
      expect(r.headers.get('cache-control')).toContain('no-store');
      const events = r.json.events as Rec[];
      expect(events).toHaveLength(20);
      const times = events.map((e) => Date.parse(e.at as string));
      expect([...times].sort((a, b) => b - a)).toEqual(times);
      // 가장 최근 사건은 a-24, 가장 오래된 반환 사건은 a-5 다.
      expect(events[0].at).toBe(new Date(NOW - 60_000).toISOString());
      expect(events[19].at).toBe(new Date(NOW - 20 * 60_000).toISOString());
      for (const e of events) expect(['view', 'copy', 'deny', 'rate_limited']).toContain(e.action);
    }
  });

  it('names the actor from the people list, else the email, and carries the denial reason', async () => {
    const events = (await get('o@try-n.com')).json.events as Rec[];
    expect(new Set(events.map((e) => e.actor))).toEqual(new Set(['지어낸멤버', 'zz@try-n.com']));
    const denies = events.filter((e) => e.action === 'deny');
    expect(denies.length).toBeGreaterThan(0);
    for (const d of denies) expect(d).toMatchObject({ field: 'password', reason: 'reveal_hidden' });
    for (const e of events.filter((x) => x.action !== 'deny')) expect(e).not.toHaveProperty('reason');
    for (const e of events) expect(Object.keys(e).sort()).toEqual(expect.arrayContaining(['action', 'actor', 'at']));
  });

  it('never returns a value, ciphertext key or audit-only metadata', async () => {
    const r = await get('adm@try-n.com');
    expect(r.text).not.toContain('canary');
    expect(r.text).not.toMatch(/"(iv|tag|ct|targetId|actorRole|id)"/);
  });
});
