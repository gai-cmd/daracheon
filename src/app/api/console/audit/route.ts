import { readRecentConsoleAudit } from '@/lib/console/audit';
import { authorizeConsole, consoleJson } from '@/lib/console/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RECENT = 200;

// Recent console audit entries, newest first (SPEC-CONSOLE-001 REQ-CON-018). Console admins only.
// Entries carry field names and reason codes only, never a credential value.
export async function GET(request: Request) {
  const auth = await authorizeConsole(request, { admin: true });
  if (!auth.ok) return auth.response;
  try {
    return consoleJson({ entries: await readRecentConsoleAudit(RECENT) });
  } catch (err) {
    console.error('[console audit] read failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
