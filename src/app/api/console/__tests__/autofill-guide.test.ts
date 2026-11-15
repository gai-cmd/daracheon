import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-002 M1 — 자동 입력 끄기 안내 확인 기록 (REQ-CS2-006, AC-CS2-006).
// POST /api/console/me/autofill-guide 와 bootstrap 최상위 prefs. 주소는 모두 지어낸 값이다.

vi.mock('@/lib/db', async () => (await import('./support')).dbMock);

import { POST as ack } from '../me/autofill-guide/route';
import { GET as bootstrap } from '../bootstrap/route';
import { doc, read, request, resetStore, restoreEnv, store } from './support';

type Rec = Record<string, unknown>;
const saved: Record<string, string | undefined> = {};
beforeEach(() => resetStore(saved));
afterEach(() => restoreEnv(saved));

const A = 'a@try-n.com';
const B = 'b@try-n.com';

async function boot(email: string) {
  return read(await bootstrap(await request('GET', '/api/console/bootstrap', { email, contentType: null, origin: null })));
}
async function post(email: string | null, body: unknown = { version: 1 }, init: Rec = {}) {
  return read(await ack(await request('POST', '/api/console/me/autofill-guide', { email, body, ...init })));
}
const prefs = () => doc('console-user-prefs');

describe('autofill-guide acknowledgement (AC-CS2-006)', () => {
  it('flips bootstrap prefs.autofillGuideAck after the POST, leaving me unchanged', async () => {
    const first = await boot(A);
    expect(first.json.prefs).toEqual({ autofillGuideAck: false });
    expect(Object.keys(first.json.me as Rec).sort()).toEqual(['email', 'isAdmin', 'name', 'team']);

    const r = await post(A);
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toContain('no-store');
    expect(r.json).toEqual({ autofillGuideAck: true });
    expect((await boot(A)).json.prefs).toEqual({ autofillGuideAck: true });
  });

  it('is idempotent and keeps one record per person, holding only email and the guide', async () => {
    await post(A);
    expect((await post(A)).status).toBe(200);
    expect(prefs().filter((p) => p.email === A)).toHaveLength(1);

    expect((await boot(B)).json.prefs).toEqual({ autofillGuideAck: false });
    await post(B);
    expect(prefs().map((p) => p.email).sort()).toEqual([A, B]);
    for (const rec of prefs()) {
      expect(Object.keys(rec).sort()).toEqual(['autofillGuide', 'email']);
      expect(Object.keys(rec.autofillGuide as Rec).sort()).toEqual(['at', 'version']);
      expect((rec.autofillGuide as Rec).version).toBe(1);
    }
  });

  it('refuses no session (401), a foreign Origin (403) and an unknown version (400)', async () => {
    expect((await post(null)).status).toBe(401);
    expect((await post(A, { version: 1 }, { origin: 'https://evil.io' })).status).toBe(403);
    expect((await post(A, { version: 2 })).status).toBe(400);
    expect((await post(A, { version: '1' })).status).toBe(400);
    expect(prefs()).toHaveLength(0);
  });

  it('keeps bootstrap alive when console-user-prefs cannot be read (ack reported true)', async () => {
    store.failReads.add('console-user-prefs');
    const r = await boot(A);
    expect(r.status).toBe(200);
    expect(r.json.prefs).toEqual({ autofillGuideAck: true });
  });
});
