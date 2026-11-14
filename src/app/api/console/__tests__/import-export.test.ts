import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-001 M4 — POST /api/console/import and GET /api/console/export.
// AC-CON-007 (export), AC-CON-018 (replacement semantics, idempotence, atomic refusal, round trip),
// AC-CON-026 (knowledge-kind refusal leaves every document unchanged). Synthetic data only.

vi.mock('@/lib/db', async () => (await import('./support')).dbMock);

import { POST as importFile } from '../import/route';
import { GET as exportFile } from '../export/route';
import { GET as bootstrap } from '../bootstrap/route';
import { CATEGORIES, auditActions, doc, item, read, request, resetStore, restoreEnv, secretFor, store } from './support';

const saved: Record<string, string | undefined> = {};
type Rec = Record<string, unknown>;
const ADMIN = 'adm@try-n.com';

beforeEach(() => {
  resetStore(saved);
  store.docs.set('console-items', [item('X1', { access_method: 'shared-credential' }), item('X2'), item('S', { access_method: 'shared-credential' })]);
  store.docs.set('console-secrets', [secretFor('X1'), secretFor('S')]);
  store.docs.set('console-people', [{ email: 'p0@try-n.com', name: '피 영', name_en: 'P0', team: '공통' }]);
  store.singles.set('console-settings', { teamPins: ['X2'] });
});
afterEach(() => restoreEnv(saved));

const card = (id: string, overrides: Rec = {}) => ({
  id,
  category: 'sites',
  type: 'account',
  status: 'ok',
  access_method: 'public',
  visibility: '전체',
  team: '공통',
  owner: '',
  url: `https://example.com/${id}`,
  title: `카드 ${id}`,
  title_en: `Card ${id}`,
  ...overrides,
});

const protoFile = (extra: Rec = {}): Rec => ({
  app: 'zoel-console',
  version: 2,
  exportedAt: '2026-11-14T00:00:00.000Z',
  categories: CATEGORIES,
  cards: [
    card('C1', { owner: '가 나다, 라  마바', access_method: 'shared-credential', login_id: 'canary-id-91ab', password: 'canary-Pw-7f3e' }),
    card('C2', { owner: '사 아자' }),
    card('S', { access_method: 'shared-credential' }),
  ],
  people: [
    { email: 'ga@try-n.com', name: '가 나다', name_en: 'Ga', team: '한국팀' },
    { email: 'ra@try-n.com', name: '라 마바', name_en: 'Ra', team: '방글라데시팀' },
    { name: '관리 자', admin: true, team: '공통' },
    { email: 'x@try-n.com.evil.io', name: '위 장', team: '공통' },
  ],
  teamPins: ['C2', 'gone'],
  ...extra,
});

const doImport = (body: unknown, email: string | null = ADMIN, init: Rec = {}) =>
  request('POST', '/api/console/import', { email, body, ...init }).then(importFile).then(read);
const doExport = (email: string | null = ADMIN) =>
  request('GET', '/api/console/export', { email, contentType: null, origin: null }).then(exportFile).then(read);
const snapshot = () => JSON.stringify([...store.docs.entries(), ...store.singles.entries()]);

describe('POST /api/console/import (AC-CON-018)', () => {
  it('replaces items, removes absent items/secrets/people, ignores file credentials', async () => {
    const r = await doImport(protoFile());
    expect(r.status).toBe(200);
    expect(r.text).not.toContain('canary');
    expect(doc('console-items').map((i) => i.id).sort()).toEqual(['C1', 'C2', 'S']);
    expect(doc('console-secrets').map((s) => s.itemId)).toEqual(['S']);
    expect(JSON.stringify(doc('console-secrets'))).not.toContain('canary');
    expect(doc('console-people').map((p) => p.email).sort()).toEqual(['ga@try-n.com', 'ra@try-n.com']);
    expect(store.singles.get('console-settings')).toEqual({ teamPins: ['C2'] });

    const report = r.json.report as Rec;
    expect(report).toMatchObject({ items: 3, people: 2, teamPins: 1, categories: 2, unmatchedOwners: ['사 아자'], peopleSkipped: ['관리 자', '위 장'] });
    expect(report.removed).toEqual({ items: 2, people: 1, categories: 0 });

    const c1 = doc('console-items').find((i) => i.id === 'C1')!;
    expect(c1.owners).toEqual([
      { name: '가 나다', email: 'ga@try-n.com' },
      { name: '라 마바', email: 'ra@try-n.com' },
    ]);
    expect(auditActions('import')).toHaveLength(1);
  });

  it('keeps the stored secret of a surviving shared account (same id, same method)', async () => {
    const before = JSON.stringify(doc('console-secrets').find((s) => s.itemId === 'S'));
    await doImport(protoFile());
    expect(JSON.stringify(doc('console-secrets').find((s) => s.itemId === 'S'))).toBe(before);
  });

  it('shows imported shared accounts without credentials in bootstrap', async () => {
    await doImport(protoFile());
    const b = await read(await bootstrap(await request('GET', '/api/console/bootstrap', { email: ADMIN, contentType: null, origin: null })));
    const c1 = (b.json.items as Rec[]).find((i) => i.id === 'C1')!;
    expect(c1).toMatchObject({ hasLoginId: false, hasPassword: false });
  });

  it('keeps stored people, categories and pins when the file lacks those keys', async () => {
    const { people: _p, categories: _c, teamPins: _t, ...rest } = protoFile();
    const r = await doImport(rest);
    expect(r.status).toBe(200);
    expect(doc('console-people').map((p) => p.email)).toEqual(['p0@try-n.com']);
    expect(doc('console-categories').map((c) => c.id)).toEqual(['sites', 'assets']);
    expect(store.singles.get('console-settings')).toEqual({ teamPins: ['X2'] });
    expect(doc('console-items').map((i) => i.id).sort()).toEqual(['C1', 'C2', 'S']);
  });

  it('is idempotent, and re-admits a previously removed id (no tombstone)', async () => {
    await doImport(protoFile());
    const first = doc('console-items').map((i) => i.id).sort();
    await doImport(protoFile());
    expect(doc('console-items').map((i) => i.id).sort()).toEqual(first);
    const r = await doImport(protoFile({ cards: [card('X1')] }));
    expect(r.status).toBe(200);
    expect(doc('console-items').map((i) => i.id)).toEqual(['X1']);
  });

  it.each([
    ['both cards and items', { items: [] }],
    ['a javascript: URL', { cards: [card('C1'), card('C2', { url: 'javascript:alert(1)' })] }],
    ['duplicate ids', { cards: [card('C1'), card('C1')] }],
    ['a knowledge category other than wiki', { categories: [...CATEGORIES, { id: 'kb', kind: 'knowledge', name: '지식' }] }],
    ['an unknown category kind', { categories: [...CATEGORIES, { id: 'ar', kind: 'article', name: '글' }] }],
  ])('refuses a file with %s with 400 and changes no document', async (_label, extra) => {
    const before = snapshot();
    const r = await doImport(protoFile(extra));
    expect(r.status).toBe(400);
    expect(Array.isArray(r.json.errors)).toBe(true);
    expect(snapshot()).toBe(before);
  });

  it('accepts a wiki entry in categories and keeps the built-in wiki (AC-CON-026)', async () => {
    const r = await doImport(protoFile({ categories: [...CATEGORIES, { id: 'wiki', kind: 'resource', name: '가짜' }], cards: [card('W1', { category: 'wiki', access_method: 'sso' })] }));
    expect(r.status).toBe(200);
    expect(doc('console-categories').map((c) => c.id)).toEqual(['sites', 'assets']);
  });

  it('refuses a member (403), a foreign Origin (403) and an oversized file (413)', async () => {
    const before = snapshot();
    expect((await doImport(protoFile(), 'o@try-n.com')).status).toBe(403);
    expect((await doImport(protoFile(), ADMIN, { origin: 'https://evil.io' })).status).toBe(403);
    const big = protoFile({ padding: 'x'.repeat(2 * 1024 * 1024) });
    expect((await doImport(big)).status).toBe(413);
    expect(snapshot()).toBe(before);
  });

  it('reports the failing stage with 500 when a write fails', async () => {
    store.failWrites.add('console-people');
    const r = await doImport(protoFile());
    expect(r.status).toBe(500);
    expect(r.json).toMatchObject({ error: 'write_failed', stage: 'people' });
  });
});

describe('GET /api/console/export', () => {
  it('exports live items and categories without any credential key or value (AC-CON-007)', async () => {
    store.docs.set('console-items', [...doc('console-items'), item('DEL', { deletedAt: '2026-11-14T00:00:00.000Z' })]);
    const r = await doExport();
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(r.headers.get('content-disposition')).toMatch(/attachment/);
    expect(r.text).not.toContain('canary');
    expect(r.text).not.toMatch(/"(password|login_id|hasPassword|hasLoginId|ct)"/);
    const items = r.json.items as Rec[];
    expect(items.map((i) => i.id)).toEqual(['X1', 'X2', 'S']);
    expect(items[0]).toMatchObject({ owners: [{ name: '담당 오', email: 'o@try-n.com' }], updatedAt: '2026-11-14T00:00:00.000Z', note: '확인할 일 메모' });
    const cats = r.json.categories as Rec[];
    expect(cats.map((c) => [c.id, c.kind])).toEqual([
      ['sites', 'resource'],
      ['assets', 'resource'],
    ]);
  });

  it('round-trips: importing the export as items yields the same item set', async () => {
    const exported = (await doExport()).json;
    const before = doc('console-items').map((i) => i.id).sort();
    const r = await doImport({ items: exported.items, categories: exported.categories });
    expect(r.status).toBe(200);
    expect(doc('console-items').map((i) => i.id).sort()).toEqual(before);
    const x1 = doc('console-items').find((i) => i.id === 'X1')!;
    expect(x1.owners).toEqual([{ name: '담당 오', email: 'o@try-n.com' }]);
  });

  it('refuses a member with 403', async () => {
    expect((await doExport('o@try-n.com')).status).toBe(403);
  });
});
