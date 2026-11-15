// Browser-side calls to the console API (SPEC-CONSOLE-001 design.md §5). Same-origin fetches only;
// the session cookie travels automatically and every response is no-store on the server side.

import { AUTOFILL_GUIDE_VERSION, type ConsoleCategory, type ConsoleListItem, type ConsolePerson } from '@/lib/console/types';
import type { ConsoleMe } from '@/lib/console/ui-model';

export interface BootstrapData {
  me: ConsoleMe;
  categories: ConsoleCategory[];
  people: ConsolePerson[];
  settings: { teamPins: string[] };
  items: ConsoleListItem[];
  /** 사람별 화면 기록 (SPEC-CONSOLE-002 REQ-CS2-006). 없는 서버 응답이면 확인한 것으로 본다. */
  prefs?: { autofillGuideAck: boolean };
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

/** 항목의 자격증명 사건 한 건 (GET /activity, SPEC-CONSOLE-002 design.md §2.2). 값은 없다. */
export interface ActivityEvent {
  at: string;
  actor: string;
  action: 'view' | 'copy' | 'deny' | 'rate_limited';
  field?: CredentialField;
  reason?: string;
}

/** 담당자·관리자만 받는다. 최신순 최대 20건. */
export function fetchActivity(itemId: string) {
  return api<{ events: ActivityEvent[] }>('GET', `/api/console/items/${encodeURIComponent(itemId)}/activity`);
}

/** 자동 입력 끄기 안내를 확인했다고 서버에 남긴다(사람별, 같은 버전이면 다시 써도 같음). */
export function ackAutofillGuide() {
  return api<{ autofillGuideAck: boolean }>('POST', '/api/console/me/autofill-guide', { version: AUTOFILL_GUIDE_VERSION });
}
