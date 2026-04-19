import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Admin-only diagnostic endpoint: reports the deployed ANTHROPIC_API_KEY's
 * last 4 chars and the live status of a tiny Anthropic call. Used to
 * distinguish between:
 *   - wrong key in Vercel env (key suffix won't match Console)
 *   - correct key but org/workspace billing issue (live call returns 400
 *     "credit balance too low")
 *   - correct key + billing fine but something else (live call 200)
 *
 * Never returns the full key. Requires a valid admin session.
 */
export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ ok: false, message: '인증 필요' }, { status: 401 });
  }

  const key = process.env.ANTHROPIC_API_KEY ?? '';
  const keyPresent = key.length > 0;
  const keyLast4 = key.slice(-4);
  const keyPrefix = key.slice(0, 10);
  const keyLength = key.length;

  const githubRepo = process.env.GITHUB_REPO ?? '(default gai-cmd/daracheon)';
  const hasGithubToken = Boolean(process.env.GITHUB_TOKEN);
  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const vercelCommitSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'local').slice(0, 7);

  // Live probe: smallest possible Anthropic call. Uses Haiku to minimise cost.
  let liveStatus: number | null = null;
  let liveBody: string | null = null;
  let liveOk = false;
  let liveElapsedMs = 0;

  if (keyPresent) {
    const startedAt = Date.now();
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      liveStatus = res.status;
      liveOk = res.ok;
      liveElapsedMs = Date.now() - startedAt;
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        liveBody = text.slice(0, 500);
      } else {
        liveBody = '(ok — omitted)';
      }
    } catch (err) {
      liveBody = err instanceof Error ? err.message.slice(0, 300) : 'unknown fetch error';
      liveElapsedMs = Date.now() - startedAt;
    }
  }

  return NextResponse.json({
    ok: true,
    actor: session.email,
    env: {
      keyPresent,
      keyLength,
      keyPrefix,
      keyLast4,
      hasGithubToken,
      hasBlobToken,
      githubRepo,
      vercelCommitSha,
    },
    liveProbe: keyPresent
      ? {
          status: liveStatus,
          ok: liveOk,
          elapsedMs: liveElapsedMs,
          body: liveBody,
        }
      : { skipped: 'ANTHROPIC_API_KEY 미설정' },
    diagnosis: interpret({ keyPresent, keyLast4, liveOk, liveStatus, liveBody }),
  });
}

function interpret(params: {
  keyPresent: boolean;
  keyLast4: string;
  liveOk: boolean;
  liveStatus: number | null;
  liveBody: string | null;
}): string {
  if (!params.keyPresent) {
    return '❌ ANTHROPIC_API_KEY가 Vercel 환경변수에 없음. Settings → Environment Variables에서 추가 후 재배포.';
  }
  if (params.liveOk) {
    return `✅ 키·크레딧·한도 모두 정상. 마지막 4자리 ${params.keyLast4}. Anthropic Console에서 같은 접미사의 키를 확인하세요.`;
  }
  if (params.liveStatus === 401) {
    return `❌ 키 인증 실패 (401). 이 키는 revoke됐거나 오타. 마지막 4자리 ${params.keyLast4}. Console에서 새 키 발급 후 Vercel에 교체하고 재배포.`;
  }
  if (params.liveStatus === 400 && params.liveBody?.includes('credit balance')) {
    return `❌ 크레딧 부족 (400). 키 마지막 4자리 ${params.keyLast4}. 이 키가 속한 조직·워크스페이스를 Anthropic Console에서 찾아 크레딧/한도 확인. Console에서 다른 키와 접미사 비교해보세요.`;
  }
  if (params.liveStatus === 429) {
    return `⚠️ 현재 rate limit (429) — 크레딧 문제 아님. 잠시 후 재시도.`;
  }
  if (params.liveStatus && params.liveStatus >= 500) {
    return `⚠️ Anthropic 서버 에러 (${params.liveStatus}) — 키 문제 아님. 재시도.`;
  }
  return `❓ 예상 못한 상태 (status ${params.liveStatus ?? 'n/a'}). 응답 body 확인: ${params.liveBody ?? ''}`;
}
