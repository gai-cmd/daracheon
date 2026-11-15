import { readSingleForWrite, writeSingle } from '@/lib/db';
import { normalizeStoredChannels, readChannels, validateChannels } from '@/lib/console/channels';
import { authorizeConsole, consoleJson, readJsonObject } from '@/lib/console/http';
import { auditAfterWrite } from '@/lib/console/store';
import { CONSOLE_DOCS, type ConsoleSettings } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 홈 "채널 새 소식"의 채널 목록 (SPEC-CONSOLE-002 REQ-CS2-030, design.md §2.10, CS2-D19).
// 콘솔 관리자만 읽고 바꾼다. 설정 문서의 다른 칸(teamPins)은 그대로 두고 channels 만 바꿔 쓴다.

export async function GET(request: Request) {
  const auth = await authorizeConsole(request, { admin: true });
  if (!auth.ok) return auth.response;
  try {
    return consoleJson({ channels: await readChannels() });
  } catch (err) {
    console.error('[console channels] read failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}

export async function PUT(request: Request) {
  const auth = await authorizeConsole(request, { stateChange: 'json', admin: true });
  if (!auth.ok) return auth.response;
  const { user, actorRole } = auth.ctx;

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;

  try {
    const current = ((await readSingleForWrite<Partial<ConsoleSettings>>(CONSOLE_DOCS.settings)) ?? {}) as Partial<ConsoleSettings>;
    const existingIds = new Set(normalizeStoredChannels(current.channels).map((c) => c.id));
    const result = validateChannels(parsed.body.channels, existingIds);
    if (!result.ok) return consoleJson({ error: 'invalid', errors: result.errors }, 400);

    const next = { ...current, teamPins: Array.isArray(current.teamPins) ? current.teamPins : [], channels: result.channels };
    await writeSingle(CONSOLE_DOCS.settings, next);
    await auditAfterWrite({ actor: user.email, actorRole, action: 'settings.update', meta: { channels: result.channels.length } });
    return consoleJson({ channels: result.channels });
  } catch (err) {
    console.error('[console channels] update failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
