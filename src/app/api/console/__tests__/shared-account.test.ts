import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-002 M1 — hide_password 저장·목록·내보내기·가져오기와 자격증명 숨김 판정.
// AC-CS2-001(저장·bootstrap), AC-CS2-002(내보내기·가져오기), AC-CS2-003(view·copy 기존 규칙 보존),
// AC-CS2-004(reveal_hidden). 이름·주소·값은 모두 지어낸 값이다(공개 저장소).

vi.mock('@/lib/db', async () => (await import('./support')).dbMock);

import { POST as createItem } from '../items/route';
import { PATCH as patchItem } from '../items/[id]/route';
import { POST as reveal } from '../items/[id]/credential/route';
import { GET as bootstrap } from '../bootstrap/route';
import { GET as exportFile } from '../export/route';
import { POST as importFile } from '../import/route';
import { CANARY_ID, CANARY_PW, NOW, auditActions, doc, item, params, read, request, resetStore, restoreEnv, secretFor, store } from './support';

type Rec = Record<string, unknown>;
const saved: Record<string, string | undefined> = {};
beforeEach(() => resetStore(saved));
afterEach(() => restoreEnv(saved));

const OWNER = 'o@try-n.com';
const MEMBER = 'k@try-n.com';
const ADMIN = 'adm@try-n.com';

const body = (overrides: Rec = {}) => ({
  category: 'sites',
  type: 'account',
  status: 'ok',
  access_method: 'shared-credential',
  visibility: '전체',
  team: '공통',
  owners: [],
  url: 'https://example.com/login',
  title: '공유 계정',
  ...overrides,
});

async function create(b: unknown) {
  return read(await createItem(await request('POST', '/api/console/items', { email: OWNER, body: b })));
}
async function patch(id: string, b: unknown) {
  return read(await patchItem(await request('PATCH', `/api/console/items/${id}`, { email: OWNER, body: b }), params(id)));
}
async function boot(email = OWNER) {
  return read(await bootstrap(await request('GET', '/api/console/bootstrap', { email, contentType: null, origin: null })));
}
async function cred(email: string, id: string, field: string, purpose: string, init: Rec = {}) {
  return read(await reveal(await request('POST', `/api/console/items/${id}/credential`, { email, body: { field, purpose }, ...init }), params(id)));
}
const stored = (id: string) => doc('console-items').find((i) => i.id === id)!;
const bootItem = async (id: string, email = OWNER) => ((await boot(email)).json.items as Rec[]).find((i) => i.id === id)!;
const snapshot = () => JSON.stringify([...store.docs.entries(), ...store.singles.entries()]);

/** 이 사용자의 view·copy 감사 기록 n건을 열람 상한 창 안에 미리 넣는다. */
function seedReveals(email: string, n: number) {
  const rows = Array.from({ length: n }, (_, i) => ({
    id: `seed-${i}`,
    at: new Date(NOW - 60_000).toISOString(),
    actor: email,
    actorRole: 'console-member',
    module: 'console',
    action: i % 2 ? 'credential.copy' : 'credential.view',
    targetId: 'other',
  }));
  store.docs.set('console-audit-log', rows);
}

describe('hide_password on create, update and bootstrap (AC-CS2-001)', () => {
  it('(a) refuses a non-boolean with 400 and leaves console-items unchanged', async () => {
    const before = JSON.stringify(doc('console-items'));
    const r = await create(body({ hide_password: 'yes' }));
    expect(r.status).toBe(400);
    expect(r.json.errors).toContainEqual({ field: 'hide_password', reason: 'type' });
    expect(JSON.stringify(doc('console-items'))).toBe(before);
  });

  it('(b) stores true for a shared-credential item and (c) false for a public one', async () => {
    const b = await create(body({ hide_password: true }));
    expect(b.status).toBe(201);
    const bid = (b.json.item as Rec).id as string;
    expect((b.json.item as Rec).hide_password).toBe(true);
    expect(stored(bid).hide_password).toBe(true);
    expect((await bootItem(bid)).hide_password).toBe(true);

    const c = await create(body({ access_method: 'public', type: 'link', hide_password: true }));
    const cid = (c.json.item as Rec).id as string;
    expect(stored(cid).hide_password).toBe(false);
    expect((await bootItem(cid)).hide_password).toBe(false);

    // PATCH 로 접속 방식을 public 으로 바꾸면 false 가 된다.
    const { id: _i, version, updatedAt: _u, updatedBy: _b, ...rest } = stored(bid);
    const p = await patch(bid, { ...rest, version, access_method: 'public', hide_password: true });
    expect(p.status).toBe(200);
    expect(stored(bid).hide_password).toBe(false);
  });

  it('(d) every bootstrap item carries a boolean; an item stored without the field reads false', async () => {
    store.docs.set('console-items', [item('OLD'), item('ON', { access_method: 'shared-credential', hide_password: true })]);
    const items = (await boot(MEMBER)).json.items as Rec[];
    expect(items.map((i) => [i.id, i.hide_password])).toEqual([
      ['OLD', false],
      ['ON', true],
    ]);
  });
});

describe('export flag and import whitelist (AC-CS2-002)', () => {
  beforeEach(() => {
    store.docs.set('console-items', [item('H', { access_method: 'shared-credential', hide_password: true }), item('N')]);
    store.docs.set('console-secrets', [secretFor('H')]);
  });

  it('exports hide_password as a boolean and no credential value', async () => {
    const res = await read(await exportFile(await request('GET', '/api/console/export', { email: ADMIN, contentType: null, origin: null })));
    expect(res.status).toBe(200);
    expect((res.json.items as Rec[]).map((i) => [i.id, i.hide_password])).toEqual([
      ['H', true],
      ['N', false],
    ]);
    expect(res.text).not.toContain(CANARY_PW);
    expect(res.text).not.toContain(CANARY_ID);
  });

  it('refuses a string flag with 400 and changes no document; otherwise maps absence to false', async () => {
    const before = snapshot();
    const exported = { items: [item('H', { access_method: 'shared-credential', hide_password: 'true' }), item('N')] };
    const bad = await read(await importFile(await request('POST', '/api/console/import', { email: ADMIN, body: exported })));
    expect(bad.status).toBe(400);
    expect(snapshot()).toBe(before);

    const good = { items: [item('H', { access_method: 'shared-credential', hide_password: true }), item('N')] };
    const ok = await read(await importFile(await request('POST', '/api/console/import', { email: ADMIN, body: good })));
    expect(ok.status).toBe(200);
    expect(stored('H').hide_password).toBe(true);
    expect(stored('N').hide_password).toBe(false);
  });
});

describe('credential purposes view and copy (AC-CS2-003)', () => {
  beforeEach(() => {
    store.docs.set('console-items', [item('S', { access_method: 'shared-credential', hide_password: false })]);
    store.docs.set('console-secrets', [secretFor('S')]);
  });

  it('serves both purposes no-store and audits them as distinct actions', async () => {
    const c = await cred(MEMBER, 'S', 'password', 'copy');
    const v = await cred(MEMBER, 'S', 'password', 'view');
    for (const r of [c, v]) {
      expect(r.status).toBe(200);
      expect(r.json).toEqual({ value: CANARY_PW });
      expect(r.headers.get('cache-control')).toContain('no-store');
    }
    expect(auditActions('credential.copy')).toHaveLength(1);
    expect(auditActions('credential.view')).toHaveLength(1);
  });

  it('caps copy with view at 30 per 10 minutes and audits the refusal', async () => {
    seedReveals(MEMBER, 30);
    const r = await cred(MEMBER, 'S', 'password', 'copy');
    expect(r.status).toBe(429);
    expect(auditActions('credential.rate_limited')).toHaveLength(1);
  });

  it('withholds a copy when the audit write fails (503) and refuses a foreign Origin (403)', async () => {
    store.failWrites.add('console-audit-log');
    const r = await cred(MEMBER, 'S', 'password', 'copy');
    expect(r.status).toBe(503);
    expect(r.json).toEqual({ error: 'audit_unavailable' });
    expect(r.text).not.toContain(CANARY_PW);
    store.failWrites.clear();
    expect((await cred(MEMBER, 'S', 'password', 'copy', { origin: 'https://evil.io' })).status).toBe(403);
  });
});

describe('hide_password reveal gate (AC-CS2-004)', () => {
  beforeEach(() => {
    store.docs.set('console-items', [item('H', { access_method: 'shared-credential', hide_password: true })]);
    store.docs.set('console-secrets', [secretFor('H')]);
  });

  it('refuses a member password view with reveal_hidden and audits the denial only', async () => {
    const r = await cred(MEMBER, 'H', 'password', 'view');
    expect(r.status).toBe(403);
    expect(r.json).toEqual({ error: 'reveal_hidden' });
    expect(r.text).not.toContain('canary');
    const denies = auditActions('credential.deny');
    expect(denies).toHaveLength(1);
    expect(denies[0].meta).toEqual({ field: 'password', reason: 'reveal_hidden' });
    expect(auditActions('credential.view')).toHaveLength(0);
  });

  it('lets a member copy the password and view the login id; owner and admin may view', async () => {
    const copy = await cred(MEMBER, 'H', 'password', 'copy');
    expect(copy.status).toBe(200);
    expect(copy.json).toEqual({ value: CANARY_PW });
    expect(auditActions('credential.copy')).toHaveLength(1);
    expect((await cred(MEMBER, 'H', 'login_id', 'view')).json).toEqual({ value: CANARY_ID });
    expect((await cred(OWNER, 'H', 'password', 'view')).status).toBe(200);
    expect((await cred(ADMIN, 'H', 'password', 'view')).status).toBe(200);
  });

  it('allows the member view again once hide_password is false', async () => {
    store.docs.set('console-items', [item('H', { access_method: 'shared-credential', hide_password: false })]);
    expect((await cred(MEMBER, 'H', 'password', 'view')).status).toBe(200);
  });

  it('decides visibility first: a private item answers forbidden, not reveal_hidden', async () => {
    store.docs.set('console-items', [item('H', { access_method: 'shared-credential', hide_password: true, visibility: '본인' })]);
    const r = await cred(MEMBER, 'H', 'password', 'view');
    expect(r.status).toBe(403);
    expect(r.json).toEqual({ error: 'forbidden' });
  });

  it('does not count reveal_hidden refusals towards the reveal cap', async () => {
    seedReveals(MEMBER, 29);
    for (let i = 0; i < 3; i++) expect((await cred(MEMBER, 'H', 'password', 'view')).json).toEqual({ error: 'reveal_hidden' });
    expect((await cred(MEMBER, 'H', 'password', 'copy')).status).toBe(200);
    expect((await cred(MEMBER, 'H', 'password', 'copy')).status).toBe(429);
  });
});
