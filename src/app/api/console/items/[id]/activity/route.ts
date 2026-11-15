import { readDataUncached } from '@/lib/db';
import { authorizeConsole, consoleJson } from '@/lib/console/http';
import { canEdit } from '@/lib/console/permissions';
import { CONSOLE_DOCS, type ConsoleAuditEntry, type ConsoleItem } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 한 번에 돌려주는 사건 수 (SPEC-CONSOLE-002 REQ-CS2-005). 페이지 넘김은 범위 밖이다. */
const ACTIVITY_LIMIT = 20;

const CREDENTIAL_ACTIONS: Record<string, ActivityEvent['action']> = {
  'credential.view': 'view',
  'credential.copy': 'copy',
  'credential.deny': 'deny',
  'credential.rate_limited': 'rate_limited',
};

interface ActivityEvent {
  at: string;
  actor: string;
  action: 'view' | 'copy' | 'deny' | 'rate_limited';
  field?: string;
  reason?: string;
}

/** 감사 기록 한 건을 응답 모양으로 바꾼다. 칸을 하나씩 골라 담으므로 값·암호문·기록 메타는 나갈 수 없다. */
function toEvent(e: ConsoleAuditEntry, names: ReadonlyMap<string, string>): ActivityEvent {
  const actor = typeof e.actor === 'string' ? e.actor : '';
  const out: ActivityEvent = {
    at: e.at,
    actor: names.get(actor.toLowerCase()) || actor,
    action: CREDENTIAL_ACTIONS[e.action],
  };
  if (typeof e.meta?.field === 'string') out.field = e.meta.field;
  if (typeof e.meta?.reason === 'string') out.reason = e.meta.reason;
  return out;
}

// 한 항목의 사용 기록 (SPEC-CONSOLE-002 REQ-CS2-005, design.md §2.2). 편집 권한자(관리자·담당자)만.
// 최근 자격증명 사건 20건을 최신순으로 돌려준다. GET 이라 Origin 검사는 하지 않고, 이 조회 자체는
// 감사 기록에 남기지 않는다. 응답은 no-store.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeConsole(request);
  if (!auth.ok) return auth.response;
  const { user, people } = auth.ctx;

  const { id } = await params;
  try {
    const items = await readDataUncached<ConsoleItem>(CONSOLE_DOCS.items);
    const item = items.find((i) => i.id === id && !i.deletedAt);
    if (!item) return consoleJson({ error: 'not_found' }, 404);
    if (!canEdit(user, item)) return consoleJson({ error: 'forbidden' }, 403);

    const audit = await readDataUncached<ConsoleAuditEntry>(CONSOLE_DOCS.audit);
    const names = new Map(
      people
        .filter((p) => typeof p?.email === 'string' && typeof p.name === 'string' && p.name)
        .map((p) => [p.email.toLowerCase(), p.name])
    );
    const events = audit
      .filter((e) => e.targetId === item.id && Object.hasOwn(CREDENTIAL_ACTIONS, e.action) && Number.isFinite(Date.parse(e.at)))
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, ACTIVITY_LIMIT)
      .map((e) => toEvent(e, names));
    return consoleJson({ events });
  } catch (err) {
    console.error('[console activity] failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
