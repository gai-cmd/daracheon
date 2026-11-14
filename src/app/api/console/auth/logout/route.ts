import { CONSOLE_SESSION_COOKIE, consoleSessionCookieOptions } from '@/lib/console/session';
import { consoleJson, isSameOriginRequest } from '@/lib/console/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Console sign-out (SPEC-CONSOLE-001 REQ-CON-006). Works without a session (REQ-CON-001 exception)
// but keeps the Origin check. Only the console cookie is cleared; the admin session is untouched.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return consoleJson({ error: 'forbidden' }, 403);
  const res = consoleJson({ ok: true });
  res.cookies.set(CONSOLE_SESSION_COOKIE, '', { ...consoleSessionCookieOptions(), maxAge: 0 });
  return res;
}
