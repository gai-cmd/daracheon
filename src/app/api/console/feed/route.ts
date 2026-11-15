import { readChannels } from '@/lib/console/channels';
import { buildFeed } from '@/lib/console/feed';
import { authorizeConsole, consoleJson } from '@/lib/console/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 홈 "채널 새 소식" (SPEC-CONSOLE-002 REQ-CS2-031·032, design.md §2.11, CS2-D20). 콘솔 세션이 있어야 한다.
// bootstrap 과 따로 부른다 — 느린 바깥 피드가 첫 화면을 붙잡지 않게. 피드에는 비밀값이 없으므로 이 경로만
// 브라우저에 30분 개인 캐시를 허용한다.
export async function GET(request: Request) {
  const auth = await authorizeConsole(request);
  if (!auth.ok) return auth.response;
  try {
    const feed = await buildFeed(await readChannels());
    return consoleJson(feed, 200, { 'Cache-Control': 'private, max-age=1800' });
  } catch (err) {
    console.error('[console feed] failed:', err instanceof Error ? err.message : 'unknown');
    return consoleJson({ error: 'server_error' }, 500);
  }
}
