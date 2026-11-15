import { readDataForWrite, writeDataMerged } from '@/lib/db';
import { authorizeConsole, consoleJson, readJsonObject } from '@/lib/console/http';
import { AUTOFILL_GUIDE_VERSION, CONSOLE_DOCS, type ConsoleUserPrefs } from '@/lib/console/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 자동 입력 끄기 안내 확인 기록 (SPEC-CONSOLE-002 REQ-CS2-006, design.md §2.2, CS2-D5).
// 로그인한 사람이면 누구나(관리자가 아니어도) 자기 기록만 쓴다. Origin·Content-Type 검사 후
// 새로 읽기 → 내 레코드만 바꿈 → email 키 병합 쓰기. 같은 요청을 다시 보내도 레코드는 하나다.
// 레코드에는 email 과 안내 버전·확인 시각만 담는다.
export async function POST(request: Request) {
  const auth = await authorizeConsole(request, { stateChange: 'json' });
  if (!auth.ok) return auth.response;
  const { user } = auth.ctx;

  const parsed = await readJsonObject(request);
  if (!parsed.ok) return parsed.response;
  if (parsed.body.version !== AUTOFILL_GUIDE_VERSION) {
    return consoleJson({ error: 'invalid', errors: [{ field: 'version', reason: 'unknown_value' }] }, 400);
  }

  try {
    const all = await readDataForWrite<ConsoleUserPrefs>(CONSOLE_DOCS.userPrefs);
    const mine: ConsoleUserPrefs = {
      email: user.email,
      autofillGuide: { version: AUTOFILL_GUIDE_VERSION, at: new Date(Date.now()).toISOString() },
    };
    const others = all.filter((p) => typeof p?.email !== 'string' || p.email.toLowerCase() !== user.email);
    await writeDataMerged(CONSOLE_DOCS.userPrefs, [...others, mine]);
    return consoleJson({ autofillGuideAck: true });
  } catch (err) {
    console.error('[console autofill-guide] write failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
