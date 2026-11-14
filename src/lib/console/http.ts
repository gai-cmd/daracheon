// Shared request guards for console API routes (SPEC-CONSOLE-001 REQ-CON-001/007/013, design.md §5).
// Every console API response is non-cacheable. Node runtime only (reads the people directory).

import { NextResponse } from 'next/server';
import { readDataUncached } from '@/lib/db';
import { getConsoleAdminEmails, isConsoleConfigured } from './config';
import { resolveConsoleUser } from './permissions';
import { readConsoleSession } from './session';
import { CONSOLE_DOCS, type ConsoleActorRole, type ConsolePerson, type ConsoleUser } from './types';

export const NO_STORE = 'no-store';

/** JSON response with Cache-Control: no-store. */
export function consoleJson(body: unknown, status = 200, headers: Record<string, string> = {}): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': NO_STORE, ...headers } });
}

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * True when the request's Origin header equals the site's own origin (the request origin or
 * NEXT_PUBLIC_SITE_URL). A missing Origin header is refused: browsers always send one on
 * state-changing fetches.
 */
export function isSameOriginRequest(request: Request, env: Record<string, string | undefined> = process.env): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const allowed = [originOf(request.url), originOf(env.NEXT_PUBLIC_SITE_URL)].filter((o): o is string => !!o);
  return allowed.includes(origin);
}

/** True when the body is declared as JSON. */
export function isJsonRequest(request: Request): boolean {
  const type = request.headers.get('content-type') ?? '';
  return type.split(';', 1)[0].trim().toLowerCase() === 'application/json';
}

/**
 * Origin + Content-Type gate for state-changing console requests. Returns the 403 response to send,
 * or null when the request may proceed. `json: false` is for body-less requests (DELETE), which
 * still need a same-origin Origin header.
 */
export function guardStateChange(request: Request, opts: { json?: boolean } = {}): NextResponse | null {
  if (!isSameOriginRequest(request) || ((opts.json ?? true) && !isJsonRequest(request))) {
    return consoleJson({ error: 'forbidden' }, 403);
  }
  return null;
}

export interface ConsoleContext {
  user: ConsoleUser;
  /** Name shown as updatedBy: the people-directory name, else the Google profile name. */
  displayName: string;
  actorRole: Exclude<ConsoleActorRole, 'unknown'>;
  people: ConsolePerson[];
}

export type ConsoleAuth = { ok: true; ctx: ConsoleContext } | { ok: false; response: NextResponse };

// @MX:ANCHOR: [AUTO] Entry gate of every console data API (bootstrap, items, admin routes).
// @MX:REASON: order matters — Origin/Content-Type before anything, fail closed when the console is
// not configured, admin rights re-read from CONSOLE_ADMIN_EMAILS on each request (REQ-CON-007).
/**
 * Resolves the signed-in console user for one request:
 * state-change guard -> console configured (503) -> session (401) -> people -> admin check (403).
 */
export async function authorizeConsole(
  request: Request,
  opts: { stateChange?: 'json' | 'origin'; admin?: boolean } = {}
): Promise<ConsoleAuth> {
  if (opts.stateChange) {
    const blocked = guardStateChange(request, { json: opts.stateChange === 'json' });
    if (blocked) return { ok: false, response: blocked };
  }
  if (!isConsoleConfigured()) return { ok: false, response: consoleJson({ error: 'console_not_configured' }, 503) };
  const session = await readConsoleSession(request);
  if (!session) return { ok: false, response: consoleJson({ error: 'unauthorized' }, 401) };

  let people: ConsolePerson[];
  try {
    people = await readDataUncached<ConsolePerson>(CONSOLE_DOCS.people);
  } catch (err) {
    console.error('[console] people read failed:', err instanceof Error ? err.message : 'unknown');
    return { ok: false, response: consoleJson({ error: 'server_error' }, 500) };
  }
  const user = resolveConsoleUser(session, { adminEmails: getConsoleAdminEmails(), people });
  if (opts.admin && !user.isAdmin) return { ok: false, response: consoleJson({ error: 'forbidden' }, 403) };
  const listed = people.find((p) => typeof p?.email === 'string' && p.email.toLowerCase() === user.email);
  return {
    ok: true,
    ctx: {
      user,
      displayName: listed?.name || session.name,
      actorRole: user.isAdmin ? 'console-admin' : 'console-member',
      people,
    },
  };
}

/** Parses a JSON object body; anything else is a 400 response. */
export async function readJsonObject(
  request: Request
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return { ok: true, body: body as Record<string, unknown> };
  } catch {
    // fall through
  }
  return { ok: false, response: consoleJson({ error: 'invalid_body' }, 400) };
}
