// Shared request guards for console API routes (SPEC-CONSOLE-001 REQ-CON-013, design.md §5).
// Every console API response is non-cacheable.

import { NextResponse } from 'next/server';

export const NO_STORE = 'no-store';

/** JSON response with Cache-Control: no-store. */
export function consoleJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': NO_STORE } });
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
 * or null when the request may proceed.
 */
export function guardStateChange(request: Request): NextResponse | null {
  if (!isSameOriginRequest(request) || !isJsonRequest(request)) {
    return consoleJson({ error: 'forbidden' }, 403);
  }
  return null;
}
