/**
 * 라우트 테스트 공용 보조 — 인메모리 db 목, 테스트 전용 관리자 세션 토큰, 요청 빌더.
 * (이 파일은 *.test.ts 가 아니므로 직접 실행되지 않는다. 운영 저장소·.env 는 전혀 건드리지 않는다.)
 */
import { NextRequest } from 'next/server';
import { SESSION_COOKIE, createSessionToken } from '@/lib/auth';

export const TEST_SECRET = 'vitest-only-secret-not-a-real-credential';

const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

export const mem = new Map<string, unknown>();
export const failures = { read: false, readForWrite: false, write: false };

/** vi.mock('@/lib/db', ...) 팩토리가 돌려줄 객체. */
export const dbMock = {
  readSingleUncached: async (name: string) => {
    if (failures.read) throw new Error('blob down');
    return mem.has(name) ? clone(mem.get(name)) : null;
  },
  readSingleForWrite: async (name: string) => {
    if (failures.readForWrite) throw new Error('blob down');
    await Promise.resolve();
    return mem.has(name) ? clone(mem.get(name)) : null;
  },
  writeSingle: async (name: string, data: unknown) => {
    if (failures.write) throw new Error('write failed');
    await Promise.resolve();
    mem.set(name, clone(data));
  },
};

export function resetMemDb(): void {
  mem.clear();
  failures.read = false;
  failures.readForWrite = false;
  failures.write = false;
}

export async function sessionToken(
  email = 'editor@try-n.com',
  role: 'super_admin' | 'admin' | 'editor' = 'editor',
): Promise<string> {
  process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
  return createSessionToken({ email, role });
}

export interface ReqOptions {
  method?: string;
  token?: string | null;
  origin?: string | null;
  host?: string;
  body?: unknown;
  rawBody?: string;
  headers?: Record<string, string>;
}

/** NextRequest 빌더 — 기본은 같은 사이트(zoellife.com)에서 온 요청. */
export function buildRequest(url: string, opts: ReqOptions = {}): NextRequest {
  const method = opts.method ?? 'GET';
  const parsed = new URL(url);
  const headers: Record<string, string> = {
    host: opts.host ?? parsed.host,
    ...(opts.origin === null ? {} : { origin: opts.origin ?? parsed.origin }),
    ...(opts.token ? { cookie: `${SESSION_COOKIE}=${opts.token}` } : {}),
    ...(opts.headers ?? {}),
  };
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  let body: string | undefined;
  if (hasBody) {
    body = opts.rawBody ?? JSON.stringify(opts.body ?? {});
    headers['content-type'] = headers['content-type'] ?? 'application/json';
  }
  return new NextRequest(url, { method, headers, body });
}

export const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });

export const BLOB_SRC =
  'https://abc123xyz.public.blob.vercel-storage.com/uploads/detail-concepts/1730000000000-ab12cd34ef.jpg';

export const emptyDocBody = () => ({ texts: [], images: [], bgs: [], hidden: [] });
