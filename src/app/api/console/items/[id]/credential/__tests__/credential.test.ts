import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// SPEC-CONSOLE-001 POST /api/console/items/:id/credential — AC-CON-008 (route part),
// AC-CON-009 (server part), AC-CON-010, AC-CON-016 (fail closed), AC-CON-024 and the
// boundary rows of acceptance.md §10. All names, addresses and values are synthetic.

const db = vi.hoisted(() => ({
  docs: new Map<string, Array<Record<string, unknown>>>(),
  failAuditWrite: false,
}));

vi.mock('@/lib/db', () => ({
  readDataForWrite: vi.fn(async (name: string) => [...(db.docs.get(name) ?? [])]),
  readDataUncached: vi.fn(async (name: string) => [...(db.docs.get(name) ?? [])]),
  readData: vi.fn(async (name: string) => [...(db.docs.get(name) ?? [])]),
  writeDataMerged: vi.fn(async (name: string, next: Array<Record<string, unknown>>, opts: { removedIds?: string[] } = {}) => {
    if (db.failAuditWrite && name === 'console-audit-log') throw new Error('blob write failed');
    const removed = new Set(opts.removedIds ?? []);
    db.docs.set(name, next.filter((r) => !removed.has(r.id as string)));
  }),
}));

import { POST } from '../route';
import { CONSOLE_SESSION_COOKIE, createConsoleSessionToken } from '@/lib/console/session';
import { sealField } from '@/lib/console/vault';

const NOW = Date.UTC(2026, 10, 15, 0, 0, 0);
const PW = 'canary-Pw-7f3e';
const LOGIN = 'canary-id-91ab';
const KEY_HEX = '0123456789abcdef'.repeat(4);
const KEY = Buffer.from(KEY_HEX, 'hex');
const ENV: Record<string, string> = {
  ADMIN_SESSION_SECRET: 'unit-admin-session-secret-aaaaaaaaaaaaaaaa',
  CONSOLE_SESSION_SECRET: 'unit-console-session-secret-0123456789abcdef',
  CONSOLE_SECRETS_KEY: KEY_HEX,
  CONSOLE_ADMIN_EMAILS: 'adm@try-n.com',
};
const savedEnv: Record<string, string | undefined> = {};

function item(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    category: 'sites',
    type: 'account',
    status: 'run',
    access_method: 'shared-credential',
    visibility: '전체',
    team: '한국팀',
    owners: [{ name: '담당 오', email: 'o@try-n.com' }],
    url: 'https://example.com',
    title: `항목 ${id}`,
    title_en: '',
    description: '',
    description_en: '',
    tags: [],
    links: [],
    note: '',
    note_en: '',
    version: 1,
    updatedAt: '2026-11-15T00:00:00.000Z',
    updatedBy: '담당 오',
    ...overrides,
  };
}

function secretFor(itemId: string, sealedFor = itemId) {
  return {
    itemId,
    login_id: sealField(KEY, sealedFor, 'login_id', LOGIN),
    password: sealField(KEY, sealedFor, 'password', PW),
    updatedAt: '2026-11-15T00:00:00.000Z',
    updatedBy: '담당 오',
  };
}

async function call(
  email: string,
  itemId: string,
  body: unknown = { field: 'password', purpose: 'view' },
  init: { origin?: string | null; contentType?: string; noSession?: boolean } = {}
) {
  const headers: Record<string, string> = { 'content-type': init.contentType ?? 'application/json' };
  if (init.origin !== null) headers.origin = init.origin ?? 'https://zoellife.com';
  if (!init.noSession) {
    const token = await createConsoleSessionToken({ email, name: email.split('@')[0] });
    headers.cookie = `${CONSOLE_SESSION_COOKIE}=${token}`;
  }
  const res = await POST(
    new Request(`https://zoellife.com/api/console/items/${encodeURIComponent(itemId)}/credential`, {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: itemId }) }
  );
  const text = await res.text();
  return { res, text, json: text ? (JSON.parse(text) as Record<string, unknown>) : {} };
}

const audit = () => db.docs.get('console-audit-log') ?? [];
const actions = (a: string) => audit().filter((e) => e.action === a);

beforeEach(() => {
  for (const k of [...Object.keys(ENV), 'NEXT_PUBLIC_SITE_URL']) savedEnv[k] = process.env[k];
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  db.failAuditWrite = false;
  db.docs = new Map([
    ['console-items', [item('A', { visibility: '팀', team: '한국팀', owners: [{ name: '에이', email: 'a@try-n.com' }] })]],
    [
      'console-people',
      [
        { email: 'b@try-n.com', name: '비', name_en: 'B', team: '한국팀' },
        { email: 'k@try-n.com', name: '케이', name_en: 'K', team: '한국팀' },
        { email: 'g@try-n.com', name: '지', name_en: 'G', team: '방글라데시팀' },
      ],
    ],
    ['console-secrets', [secretFor('A')]],
    ['console-audit-log', []],
  ]);
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.restoreAllMocks();
});

describe('AC-CON-009 permitted reveal', () => {
  it('returns the value, non-cacheable, after writing credential.view', async () => {
    const { res, json } = await call('b@try-n.com', 'A');
    expect(res.status).toBe(200);
    expect(json).toEqual({ value: PW });
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(actions('credential.view')).toHaveLength(1);
    expect(actions('credential.view')[0]).toMatchObject({
      actor: 'b@try-n.com',
      targetId: 'A',
      meta: { field: 'password' },
    });
    expect(JSON.stringify(audit())).not.toContain(PW);
  });

  it('records credential.copy for the copy purpose and can reveal the login id', async () => {
    const { json } = await call('b@try-n.com', 'A', { field: 'login_id', purpose: 'copy' });
    expect(json).toEqual({ value: LOGIN });
    expect(actions('credential.copy')).toHaveLength(1);
    expect(actions('credential.copy')[0]).toMatchObject({ meta: { field: 'login_id' } });
    expect(JSON.stringify(audit())).not.toContain(LOGIN);
  });
});

describe('AC-CON-010 visibility matrix', () => {
  const rows: Array<[string, string, Record<string, number>]> = [
    ['전체', '한국팀', { o: 200, adm: 200, k: 200, g: 200, n: 200 }],
    ['팀', '한국팀', { o: 200, adm: 200, k: 200, g: 403, n: 403 }],
    ['팀', '공통', { o: 200, adm: 200, k: 200, g: 200, n: 200 }],
    ['본인', '방글라데시팀', { o: 200, adm: 200, k: 403, g: 403, n: 403 }],
  ];
  for (const [visibility, team, expected] of rows) {
    for (const [who, status] of Object.entries(expected)) {
      it(`${visibility} / ${team}: ${who} -> ${status}`, async () => {
        db.docs.set('console-items', [item('M', { visibility, team })]);
        db.docs.set('console-secrets', [secretFor('M')]);
        const { res, json, text } = await call(`${who}@try-n.com`, 'M');
        expect(res.status).toBe(status);
        if (status === 403) {
          expect(text).not.toContain(PW);
          expect(json.value).toBeUndefined();
          expect(actions('credential.deny')).toHaveLength(1);
          expect(actions('credential.view')).toHaveLength(0);
        } else {
          expect(json.value).toBe(PW);
        }
      });
    }
  }
});

describe('AC-CON-016 / AC-CON-024 fail closed and rate limit', () => {
  it('answers 503 without a value when the audit entry cannot be written', async () => {
    db.failAuditWrite = true;
    const { res, text } = await call('b@try-n.com', 'A');
    expect(res.status).toBe(503);
    expect(text).not.toContain(PW);
  });

  it('answers 429 on the 31st reveal within 10 minutes and records credential.rate_limited', async () => {
    db.docs.set(
      'console-audit-log',
      Array.from({ length: 30 }, (_, i) => ({
        id: `r-${i}`,
        at: new Date(NOW - 9 * 60_000 + i).toISOString(),
        actor: 'b@try-n.com',
        actorRole: 'console-member',
        module: 'console',
        action: i % 2 ? 'credential.copy' : 'credential.view',
      }))
    );
    const { res, text } = await call('b@try-n.com', 'A');
    expect(res.status).toBe(429);
    expect(text).not.toContain(PW);
    expect(actions('credential.rate_limited')).toHaveLength(1);
  });

  it('does not count reveals older than 10 minutes or by other users', async () => {
    db.docs.set('console-audit-log', [
      ...Array.from({ length: 30 }, (_, i) => ({ id: `old-${i}`, at: new Date(NOW - 11 * 60_000).toISOString(), actor: 'b@try-n.com', action: 'credential.view' })),
      ...Array.from({ length: 30 }, (_, i) => ({ id: `oth-${i}`, at: new Date(NOW - 60_000).toISOString(), actor: 'k@try-n.com', action: 'credential.view' })),
    ]);
    expect((await call('b@try-n.com', 'A')).res.status).toBe(200);
  });
});

describe('AC-CON-008 binding at the route', () => {
  it('answers 500 without a value when the record holds another item’s ciphertext', async () => {
    db.docs.set('console-items', [item('A'), item('B')]);
    db.docs.set('console-secrets', [secretFor('A'), secretFor('B', 'A')]);
    const { res, text } = await call('o@try-n.com', 'B');
    expect(res.status).toBe(500);
    expect(text).not.toContain(PW);
    const stored = db.docs.get('console-secrets')![1] as { password: { ct: string; tag: string } };
    expect(text).not.toContain(stored.password.ct);
    expect(text).not.toContain(KEY_HEX);
  });
});

describe('request guards and boundary cases', () => {
  it('401 without a console session', async () => {
    expect((await call('b@try-n.com', 'A', undefined, { noSession: true })).res.status).toBe(401);
  });

  it.each([
    ['foreign Origin', { origin: 'https://evil.io' }],
    ['no Origin', { origin: null }],
    ['text/plain body', { contentType: 'text/plain' }],
  ])('403 for %s, nothing recorded', async (_label, init) => {
    const { res } = await call('b@try-n.com', 'A', undefined, init);
    expect(res.status).toBe(403);
    expect(audit()).toHaveLength(0);
  });

  it.each([
    ['unknown field', { field: 'secret', purpose: 'view' }],
    ['unknown purpose', { field: 'password', purpose: 'peek' }],
    ['invalid JSON', '{not json'],
  ])('400 for %s', async (_label, body) => {
    expect((await call('b@try-n.com', 'A', body)).res.status).toBe(400);
  });

  it('404 for an unknown or soft-deleted item, without a value', async () => {
    expect((await call('b@try-n.com', 'nope')).res.status).toBe(404);
    db.docs.set('console-items', [item('A', { deletedAt: '2026-11-15T00:00:00.000Z', deletedBy: 'o' })]);
    const { res, text } = await call('o@try-n.com', 'A');
    expect(res.status).toBe(404);
    expect(text).not.toContain(PW);
  });

  it('404 when the item is no longer a shared account or nothing is stored', async () => {
    db.docs.set('console-items', [item('A', { access_method: 'invite' })]);
    expect((await call('o@try-n.com', 'A')).res.status).toBe(404);
    db.docs.set('console-items', [item('A')]);
    db.docs.set('console-secrets', []);
    expect((await call('o@try-n.com', 'A')).json).toEqual({ error: 'not_set' });
  });

  it('503 when only CONSOLE_SECRETS_KEY is invalid', async () => {
    process.env.CONSOLE_SECRETS_KEY = 'not-a-hex-key';
    const { res, text } = await call('o@try-n.com', 'A');
    expect(res.status).toBe(503);
    expect(text).not.toContain(PW);
  });

  it('re-evaluates admin rights from the environment on every request (REQ-CON-007)', async () => {
    db.docs.set('console-items', [item('S', { visibility: '본인', team: '방글라데시팀' })]);
    db.docs.set('console-secrets', [secretFor('S')]);
    expect((await call('adm@try-n.com', 'S')).res.status).toBe(200);
    process.env.CONSOLE_ADMIN_EMAILS = '';
    expect((await call('adm@try-n.com', 'S')).res.status).toBe(403);
  });
});
