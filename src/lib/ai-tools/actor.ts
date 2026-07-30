import { cookies, headers } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * 현재 요청의 행위자(감사 로그·변경 통지용) 식별.
 *
 * 미들웨어가 이미 관리자 세션을 강제하므로(/api/ai-tools/*, mcp·cron 제외),
 * 여기서는 세션 이메일만 확인해 변경 통지의 "변경자" 로 쓴다. 세션이 없으면
 * 미들웨어가 설정한 x-admin-email 헤더를 폴백으로 사용한다.
 */
export async function currentActor(): Promise<string> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (session?.email) return session.email;
  } catch {
    /* ignore */
  }
  try {
    const h = await headers();
    const email = h.get('x-admin-email');
    if (email) return email;
  } catch {
    /* ignore */
  }
  return 'unknown';
}
