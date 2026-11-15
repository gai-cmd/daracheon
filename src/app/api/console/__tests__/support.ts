// Shared fixtures for the console API route tests (SPEC-CONSOLE-001 M4). Not a test file.
// All names, addresses, ids and values are synthetic (public repository).
//
// The in-memory db mirrors the one behavior of src/lib/db.ts writeDataMerged that matters for
// replacement writes: a record present in storage but absent from the new array is KEPT unless its
// key is listed in removedIds. A route that forgets removedIds therefore fails these tests the same
// way it would leave records behind in production.

import { vi } from 'vitest';
import { CONSOLE_SESSION_COOKIE, createConsoleSessionToken } from '@/lib/console/session';
import { sealField } from '@/lib/console/vault';

type Rec = Record<string, unknown>;

export const KEY_HEX = '0123456789abcdef'.repeat(4);
export const KEY = Buffer.from(KEY_HEX, 'hex');
export const CANARY_PW = 'canary-Pw-7f3e';
export const CANARY_ID = 'canary-id-91ab';
export const NOW = Date.UTC(2026, 10, 15, 0, 0, 0);

export const ENV: Record<string, string> = {
  ADMIN_SESSION_SECRET: 'unit-admin-session-secret-aaaaaaaaaaaaaaaa',
  CONSOLE_SESSION_SECRET: 'unit-console-session-secret-0123456789abcdef',
  CONSOLE_SECRETS_KEY: KEY_HEX,
  CONSOLE_ADMIN_EMAILS: 'adm@try-n.com',
};

const KEY_OF: Record<string, string> = {
  'console-people': 'email',
  'console-secrets': 'itemId',
  'console-user-prefs': 'email',
};
const keyOf = (doc: string, r: Rec) => r[KEY_OF[doc] ?? 'id'] as string | undefined;

export const store = {
  docs: new Map<string, Rec[]>(),
  singles: new Map<string, Rec>(),
  failWrites: new Set<string>(),
  /** 읽기가 실패하는 문서 (SPEC-CONSOLE-002: prefs 읽기 실패에도 bootstrap 은 살아야 함). */
  failReads: new Set<string>(),
  writes: [] as string[],
};

function readOrFail(name: string) {
  if (store.failReads.has(name)) throw new Error(`read failed: ${name}`);
  return clone(store.docs.get(name) ?? []);
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const dbMock = {
  readData: vi.fn(async (name: string) => readOrFail(name)),
  readDataUncached: vi.fn(async (name: string) => readOrFail(name)),
  readDataForWrite: vi.fn(async (name: string) => readOrFail(name)),
  writeDataMerged: vi.fn(async (name: string, next: Rec[], opts: { removedIds?: string[] } = {}) => {
    if (store.failWrites.has(name)) throw new Error(`write failed: ${name}`);
    store.writes.push(name);
    const removed = new Set(opts.removedIds ?? []);
    const nextKeys = new Set(next.map((r) => keyOf(name, r)));
    const revived = (store.docs.get(name) ?? []).filter((r) => {
      const k = keyOf(name, r);
      return k !== undefined && !nextKeys.has(k) && !removed.has(k);
    });
    store.docs.set(name, clone([...next.filter((r) => !removed.has(keyOf(name, r) as string)), ...revived]));
  }),
  readSingle: vi.fn(async (name: string) => clone(store.singles.get(name) ?? null)),
  readSingleUncached: vi.fn(async (name: string) => clone(store.singles.get(name) ?? null)),
  readSingleForWrite: vi.fn(async (name: string) => clone(store.singles.get(name) ?? null)),
  /** 공개 Blob 호스트 (SPEC-CONSOLE-002 M4 썸네일 허용 목록). 지어낸 호스트. */
  publicBlobHost: vi.fn(() => 'fakeblob.public.blob.vercel-storage.com'),
  writeSingle: vi.fn(async (name: string, data: Rec) => {
    if (store.failWrites.has(name)) throw new Error(`write failed: ${name}`);
    store.writes.push(name);
    store.singles.set(name, clone(data));
  }),
};

export const doc = (name: string) => store.docs.get(name) ?? [];
export const auditActions = (action: string) => doc('console-audit-log').filter((e) => e.action === action);

export function item(id: string, overrides: Rec = {}): Rec {
  return {
    id,
    category: 'sites',
    type: 'link',
    status: 'ok',
    access_method: 'public',
    visibility: '전체',
    team: '공통',
    owners: [{ name: '담당 오', email: 'o@try-n.com' }],
    url: `https://example.com/${id}`,
    title: `항목 ${id}`,
    title_en: '',
    description: '',
    description_en: '',
    tags: [],
    links: [],
    note: '확인할 일 메모',
    note_en: '',
    version: 1,
    updatedAt: '2026-11-14T00:00:00.000Z',
    updatedBy: '담당 오',
    ...overrides,
  };
}

export function secretFor(itemId: string): Rec {
  return {
    itemId,
    login_id: sealField(KEY, itemId, 'login_id', CANARY_ID),
    password: sealField(KEY, itemId, 'password', CANARY_PW),
    updatedAt: '2026-11-14T00:00:00.000Z',
    updatedBy: '담당 오',
  };
}

export const CATEGORIES: Rec[] = [
  { id: 'sites', icon: 'globe', name: '사이트', name_en: 'Sites' },
  { id: 'assets', icon: 'folder', name: '자료', name_en: 'Assets' },
];

export const PEOPLE: Rec[] = [
  { email: 'o@try-n.com', name: '담당 오', name_en: 'O', team: '한국팀', role: '직무 메모' },
  { email: 'k@try-n.com', name: '케이', name_en: 'K', team: '한국팀' },
  { email: 'u@try-n.com', name: '유저', name_en: 'U', team: '방글라데시팀' },
];

/** Resets the store to a small baseline and pins the environment and clock. */
export function resetStore(saved: Record<string, string | undefined>) {
  for (const k of [...Object.keys(ENV), 'NEXT_PUBLIC_SITE_URL']) saved[k] = process.env[k];
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  store.docs = new Map([
    ['console-items', [item('B')]],
    ['console-categories', clone(CATEGORIES)],
    ['console-people', clone(PEOPLE)],
    ['console-secrets', []],
    ['console-audit-log', []],
  ]);
  store.singles = new Map();
  store.failWrites = new Set();
  store.failReads = new Set();
  store.writes = [];
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
}

export function restoreEnv(saved: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.restoreAllMocks();
}

export interface CallInit {
  /** Signed-in user; null for no session cookie. */
  email?: string | null;
  body?: unknown;
  origin?: string | null;
  contentType?: string | null;
  cookie?: string;
}

/** Builds a Request against https://zoellife.com with a console session by default. */
export async function request(method: string, path: string, init: CallInit = {}): Promise<Request> {
  const headers: Record<string, string> = {};
  if (init.contentType !== null) headers['content-type'] = init.contentType ?? 'application/json';
  if (init.origin !== null) headers.origin = init.origin ?? 'https://zoellife.com';
  const email = init.email === undefined ? 'o@try-n.com' : init.email;
  if (init.cookie) headers.cookie = init.cookie;
  else if (email) {
    const token = await createConsoleSessionToken({ email, name: email.split('@')[0] });
    headers.cookie = `${CONSOLE_SESSION_COOKIE}=${token}`;
  }
  return new Request(`https://zoellife.com${path}`, {
    method,
    headers,
    body: init.body === undefined || method === 'GET' ? undefined : typeof init.body === 'string' ? init.body : JSON.stringify(init.body),
  });
}

export async function read(res: Response) {
  const text = await res.text();
  return { status: res.status, text, json: text ? (JSON.parse(text) as Rec) : ({} as Rec), headers: res.headers };
}

export const params = (id: string) => ({ params: Promise.resolve({ id }) });
