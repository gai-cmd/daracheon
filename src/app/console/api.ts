// Browser-side calls to the console API (SPEC-CONSOLE-001 design.md §5). Same-origin fetches only;
// the session cookie travels automatically and every response is no-store on the server side.

import type { ConsoleCategory, ConsoleListItem, ConsolePerson } from '@/lib/console/types';
import type { ConsoleMe } from '@/lib/console/ui-model';

export interface BootstrapData {
  me: ConsoleMe;
  categories: ConsoleCategory[];
  people: ConsolePerson[];
  settings: { teamPins: string[] };
  items: ConsoleListItem[];
}

export interface ApiError {
  error?: string;
  errors?: { field?: string; reason?: string; section?: string; index?: number }[];
}

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; data: ApiError & Partial<T> };

export const LOGIN_PATH = '/console/login';

export async function api<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, data: { error: 'network' } as ApiError & Partial<T> };
  }
  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (res.status === 401 && typeof window !== 'undefined') {
    const next = window.location.pathname + window.location.search;
    window.location.assign(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`);
  }
  return res.ok ? { ok: true, status: res.status, data: data as T } : { ok: false, status: res.status, data: data as ApiError & Partial<T> };
}

export type CredentialField = 'login_id' | 'password';

/** Reveals one credential field; the server writes the audit entry before answering. */
export function revealCredential(itemId: string, field: CredentialField, purpose: 'view' | 'copy') {
  return api<{ value: string }>('POST', `/api/console/items/${encodeURIComponent(itemId)}/credential`, { field, purpose });
}
