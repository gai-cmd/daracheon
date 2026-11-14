import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-001 M4 — item routes: POST /api/console/items, PATCH/DELETE /api/console/items/:id,
// POST /api/console/items/:id/restore. AC-CON-007 (PATCH response), AC-CON-011, AC-CON-012,
// AC-CON-013 (server part), AC-CON-014, AC-CON-015 and the boundary rows of acceptance.md §10.

vi.mock('@/lib/db', async () => (await import('./support')).dbMock);

import { POST as createItem } from '../items/route';
import { PATCH as patchItem, DELETE as deleteItem } from '../items/[id]/route';
import { POST as restoreItem } from '../items/[id]/restore/route';
import { POST as reveal } from '../items/[id]/credential/route';
import {
  CANARY_ID,
  CANARY_PW,
  auditActions,
  doc,
  item,
  params,
  read,
  request,
  resetStore,
  restoreEnv,
  secretFor,
  store,
} from './support';

const saved: Record<string, string | undefined> = {};
beforeEach(() => resetStore(saved));
afterEach(() => restoreEnv(saved));

const newItemBody = (overrides: Record<string, unknown> = {}) => ({
  category: 'sites',
  type: 'link',
  status: 'ok',
  access_method: 'public',
  visibility: '전체',
  team: '공통',
  owners: [],
  url: 'https://example.com/new',
  title: '새 항목',
  ...overrides,
});

async function create(email: string | null, body: unknown, init: Record<string, unknown> = {}) {
  return read(await createItem(await request('POST', '/api/console/items', { email, body, ...init })));
}
async function patch(email: string | null, id: string, body: unknown, init: Record<string, unknown> = {}) {
  return read(await patchItem(await request('PATCH', `/api/console/items/${id}`, { email, body, ...init }), params(id)));
}
async function del(email: string | null, id: string, init: Record<string, unknown> = {}) {
  return read(await deleteItem(await request('DELETE', `/api/console/items/${id}`, { email, ...init }), params(id)));
}
async function restore(email: string | null, id: string, init: Record<string, unknown> = {}) {
  return read(await restoreItem(await request('POST', `/api/console/items/${id}/restore`, { email, body: {}, ...init }), params(id)));
}
const stored = (id: string) => doc('console-items').find((i) => i.id === id)!;
const editBody = (id: string, overrides: Record<string, unknown> = {}) => {
  const { id: _id, version, updatedAt: _u, updatedBy: _b, ...fields } = stored(id);
  return { ...fields, version, ...overrides };
};

describe('POST /api/console/items', () => {
  it('lets any signed-in user create an item and records them as owner (AC-CON-011)', async () => {
    const r = await create('u@try-n.com', newItemBody());
    expect(r.status).toBe(201);
    expect(r.headers.get('cache-control')).toBe('no-store');
    const created = r.json.item as Record<string, unknown>;
    expect(created.owners).toEqual([{ name: '유저', email: 'u@try-n.com' }]);
    expect(created).toMatchObject({ version: 1, canEdit: true, updatedBy: '유저' });
    expect(String(created.id)).toMatch(/^item-/);
    expect(doc('console-items')).toHaveLength(2);
    expect(auditActions('item.create')).toHaveLength(1);
  });

  it('accepts the built-in wiki category for a non-admin (REQ-CON-026)', async () => {
    const r = await create('u@try-n.com', newItemBody({ category: 'wiki', access_method: 'sso' }));
    expect(r.status).toBe(201);
    expect((r.json.item as Record<string, unknown>).category).toBe('wiki');
  });

  it('seals shared credentials into console-secrets and never echoes them (AC-CON-007)', async () => {
    const r = await create('u@try-n.com', newItemBody({ access_method: 'shared-credential', login_id: CANARY_ID, password: CANARY_PW }));
    expect(r.status).toBe(201);
    expect(r.text).not.toContain('canary');
    expect(r.json.item).toMatchObject({ hasLoginId: true, hasPassword: true });
    expect(JSON.stringify(doc('console-items'))).not.toContain('canary');
    expect(JSON.stringify(doc('console-secrets'))).not.toContain('canary');
    expect(doc('console-secrets')).toHaveLength(1);
  });

  it('ignores credential values on an item that is not a shared account', async () => {
    const r = await create('u@try-n.com', newItemBody({ login_id: CANARY_ID, password: CANARY_PW }));
    expect(r.status).toBe(201);
    expect(doc('console-secrets')).toHaveLength(0);
  });

  it('answers 503 for credential values when CONSOLE_SECRETS_KEY is invalid, and still creates plain items', async () => {
    process.env.CONSOLE_SECRETS_KEY = 'not-hex';
    const withCred = await create('u@try-n.com', newItemBody({ access_method: 'shared-credential', password: CANARY_PW }));
    expect(withCred.status).toBe(503);
    expect(doc('console-items')).toHaveLength(1);
    expect((await create('u@try-n.com', newItemBody())).status).toBe(201);
  });

  it.each([
    ['javascript URL', { url: 'javascript:alert(1)' }],
    ['data URL', { url: 'data:text/html,x' }],
    ['ftp URL', { url: 'ftp://x' }],
    ['unknown category', { category: 'nope' }],
    ['201-char title', { title: 'x'.repeat(201) }],
    ['21 links', { links: Array.from({ length: 21 }, (_, i) => ({ label: `l${i}`, label_en: '', url: `https://e.com/${i}` })) }],
  ])('rejects %s with 400 and stores nothing (AC-CON-015)', async (_label, overrides) => {
    const r = await create('o@try-n.com', newItemBody(overrides));
    expect(r.status).toBe(400);
    expect(doc('console-items')).toHaveLength(1);
  });

  it('accepts mailto: and an empty address (AC-CON-015)', async () => {
    expect((await create('o@try-n.com', newItemBody({ url: 'mailto:team@example.com' }))).status).toBe(201);
    expect((await create('o@try-n.com', newItemBody({ url: '', status: 'needs-url' }))).status).toBe(201);
  });

  it('refuses a foreign Origin and a non-JSON body with 403 (AC-CON-015)', async () => {
    expect((await create('o@try-n.com', newItemBody(), { origin: 'https://evil.io' })).status).toBe(403);
    expect((await create('o@try-n.com', JSON.stringify(newItemBody()), { contentType: 'text/plain' })).status).toBe(403);
    expect(doc('console-items')).toHaveLength(1);
  });

  it('answers 401 without a session and 503 when the console is not configured', async () => {
    expect((await create(null, newItemBody())).status).toBe(401);
    process.env.CONSOLE_SESSION_SECRET = 'short';
    expect((await create('o@try-n.com', newItemBody())).status).toBe(503);
  });
});

describe('PATCH /api/console/items/:id', () => {
  it('lets the owner and an admin edit, bumps version (AC-CON-011)', async () => {
    const r1 = await patch('o@try-n.com', 'B', editBody('B', { title: '고친 제목' }));
    expect(r1.status).toBe(200);
    expect(stored('B')).toMatchObject({ title: '고친 제목', version: 2 });
    const r2 = await patch('adm@try-n.com', 'B', editBody('B', { title: '관리자 수정' }));
    expect(r2.status).toBe(200);
    expect(stored('B')).toMatchObject({ title: '관리자 수정', version: 3 });
    expect(auditActions('item.update')).toHaveLength(2);
  });

  it('refuses a non-owner with 403 and leaves the item unchanged (AC-CON-011)', async () => {
    const r = await patch('u@try-n.com', 'B', editBody('B', { title: '남의 수정' }));
    expect(r.status).toBe(403);
    expect(stored('B')).toMatchObject({ title: '항목 B', version: 1 });
  });

  it('rejects a stale version with 409 and keeps the newer content (AC-CON-014)', async () => {
    store.docs.set('console-items', [item('D', { version: 3 })]);
    const base = editBody('D');
    expect((await patch('o@try-n.com', 'D', { ...base, title: '사용자 1' })).status).toBe(200);
    const r = await patch('o@try-n.com', 'D', { ...base, title: '사용자 2' });
    expect(r.status).toBe(409);
    expect(r.json.error).toBe('conflict');
    expect(stored('D')).toMatchObject({ title: '사용자 1', version: 4 });
  });

  it('requires a numeric version', async () => {
    const { version: _v, ...noVersion } = editBody('B');
    expect((await patch('o@try-n.com', 'B', noVersion)).status).toBe(400);
  });

  it('refuses a non-admin removing themselves from the owners with 400 (AC-CON-011)', async () => {
    const r = await patch('o@try-n.com', 'B', editBody('B', { owners: [{ name: '케이', email: 'k@try-n.com' }] }));
    expect(r.status).toBe(400);
    expect(stored('B').owners).toEqual([{ name: '담당 오', email: 'o@try-n.com' }]);
  });

  it('lets an admin save an owner list without themselves', async () => {
    const r = await patch('adm@try-n.com', 'B', editBody('B', { owners: [{ name: '케이', email: 'k@try-n.com' }] }));
    expect(r.status).toBe(200);
  });

  it('keeps the stored password on an empty field, and clears it on clearPassword', async () => {
    store.docs.set('console-items', [item('S', { access_method: 'shared-credential' })]);
    store.docs.set('console-secrets', [secretFor('S')]);
    const before = JSON.stringify(doc('console-secrets'));
    const r1 = await patch('o@try-n.com', 'S', editBody('S', { password: '', title: '바뀐 제목' }));
    expect(r1.status).toBe(200);
    expect(r1.text).not.toContain('canary');
    expect(JSON.stringify(doc('console-secrets'))).toBe(before);
    expect(r1.json.item).toMatchObject({ hasLoginId: true, hasPassword: true });

    const r2 = await patch('o@try-n.com', 'S', editBody('S', { clearPassword: true }));
    expect(r2.status).toBe(200);
    expect(r2.json.item).toMatchObject({ hasLoginId: true, hasPassword: false });
    expect(doc('console-secrets')[0]).not.toHaveProperty('password');
  });

  it('replaces a password with a newly sealed value', async () => {
    store.docs.set('console-items', [item('S', { access_method: 'shared-credential' })]);
    store.docs.set('console-secrets', [secretFor('S')]);
    const oldCt = (doc('console-secrets')[0].password as Record<string, string>).ct;
    const r = await patch('o@try-n.com', 'S', editBody('S', { password: 'canary-new-pw' }));
    expect(r.status).toBe(200);
    expect(r.text).not.toContain('canary');
    expect((doc('console-secrets')[0].password as Record<string, string>).ct).not.toBe(oldCt);
    expect(JSON.stringify(doc('console-secrets'))).not.toContain('canary');
  });

  it('removes the secret record when the access method stops being a shared account (§10)', async () => {
    store.docs.set('console-items', [item('S', { access_method: 'shared-credential' })]);
    store.docs.set('console-secrets', [secretFor('S')]);
    const r = await patch('o@try-n.com', 'S', editBody('S', { access_method: 'invite' }));
    expect(r.status).toBe(200);
    expect(doc('console-secrets')).toHaveLength(0);
    const v = await read(
      await reveal(await request('POST', '/api/console/items/S/credential', { email: 'o@try-n.com', body: { field: 'password', purpose: 'view' } }), params('S'))
    );
    expect(v.status).toBe(404);
  });

  it('returns the private note to the editor', async () => {
    const r = await patch('o@try-n.com', 'B', editBody('B'));
    expect((r.json.item as Record<string, unknown>).note).toBe('확인할 일 메모');
  });

  it('re-reads admin rights from CONSOLE_ADMIN_EMAILS on every request (AC-CON-012)', async () => {
    expect((await patch('adm@try-n.com', 'B', editBody('B', { title: '첫 수정' }))).status).toBe(200);
    process.env.CONSOLE_ADMIN_EMAILS = '';
    expect((await patch('adm@try-n.com', 'B', editBody('B', { title: '두 번째' }))).status).toBe(403);
  });

  it('answers 404 for an unknown or deleted item', async () => {
    expect((await patch('adm@try-n.com', 'nope', editBody('B'))).status).toBe(404);
    store.docs.set('console-items', [item('B', { deletedAt: '2026-11-14T00:00:00.000Z' })]);
    expect((await patch('adm@try-n.com', 'B', { ...editBody('B') })).status).toBe(404);
  });

  it('refuses a foreign Origin with 403', async () => {
    expect((await patch('o@try-n.com', 'B', editBody('B'), { origin: 'https://evil.io' })).status).toBe(403);
  });
});

describe('DELETE and restore', () => {
  it('soft-deletes, keeps the credential, and restores it with the item (AC-CON-013)', async () => {
    store.docs.set('console-items', [item('C', { access_method: 'shared-credential' })]);
    store.docs.set('console-secrets', [secretFor('C')]);

    const d = await del('o@try-n.com', 'C');
    expect(d.status).toBe(200);
    expect(stored('C')).toMatchObject({ deletedBy: 'o@try-n.com' });
    expect(stored('C').deletedAt).toBeTruthy();
    expect(doc('console-secrets')).toHaveLength(1);
    expect(auditActions('item.delete')).toHaveLength(1);

    const r = await restore('o@try-n.com', 'C');
    expect(r.status).toBe(200);
    expect(stored('C')).not.toHaveProperty('deletedAt');
    expect(stored('C').category).toBe('sites');
    expect(auditActions('item.restore')).toHaveLength(1);
    expect(r.json.item).toMatchObject({ hasPassword: true });

    const v = await read(
      await reveal(await request('POST', '/api/console/items/C/credential', { email: 'o@try-n.com', body: { field: 'password', purpose: 'view' } }), params('C'))
    );
    expect(v.json).toEqual({ value: CANARY_PW });
  });

  it('refuses a non-owner delete with 403 (AC-CON-011)', async () => {
    expect((await del('u@try-n.com', 'B')).status).toBe(403);
    expect(stored('B')).not.toHaveProperty('deletedAt');
  });

  it('lets an admin delete and restore someone else\'s item', async () => {
    expect((await del('adm@try-n.com', 'B')).status).toBe(200);
    expect((await restore('adm@try-n.com', 'B')).status).toBe(200);
  });

  it('refuses restore by a non-owner, and restore of a live item', async () => {
    expect((await restore('o@try-n.com', 'B')).status).toBe(409);
    await del('o@try-n.com', 'B');
    expect((await restore('u@try-n.com', 'B')).status).toBe(403);
  });

  it('answers 404 when deleting an already deleted or unknown item', async () => {
    await del('o@try-n.com', 'B');
    expect((await del('o@try-n.com', 'B')).status).toBe(404);
    expect((await del('o@try-n.com', 'nope')).status).toBe(404);
  });

  it('refuses a foreign Origin on DELETE (no JSON body required)', async () => {
    expect((await del('o@try-n.com', 'B', { origin: 'https://evil.io' })).status).toBe(403);
    expect((await del('o@try-n.com', 'B', { contentType: null })).status).toBe(200);
  });
});
