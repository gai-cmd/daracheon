import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Admin-only diagnostic endpoint. Probes multiple models in parallel so that
 * a transient 429 on Haiku doesn't look like a global outage — chat route's
 * fallback chain may still be usable via Sonnet/Opus.
 */

const PROBE_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-7',
] as const;

interface ModelProbe {
  model: string;
  status: number | null;
  ok: boolean;
  elapsedMs: number;
  body?: string;
  error?: string;
}

async function probeModel(key: string, model: string): Promise<ModelProbe> {
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
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    const elapsedMs = Date.now() - startedAt;
    if (res.ok) return { model, status: res.status, ok: true, elapsedMs, body: '(ok)' };
    const text = await res.text().catch(() => '');
    return { model, status: res.status, ok: false, elapsedMs, body: text.slice(0, 500) };
  } catch (err) {
    return {
      model,
      status: null,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message.slice(0, 300) : 'fetch error',
    };
  }
}

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

  const probes: ModelProbe[] = keyPresent
    ? await Promise.all(PROBE_MODELS.map((m) => probeModel(key, m)))
    : [];

  const anyOk = probes.some((p) => p.ok);
  const okModels = probes.filter((p) => p.ok).map((p) => p.model);
  const rateLimitedModels = probes.filter((p) => p.status === 429).map((p) => p.model);
  const primary = probes[0] ?? null; // Haiku — 호환성용 legacy 필드

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
    // 전체 probe 결과
    probes,
    anyOk,
    okModels,
    rateLimitedModels,
    // Legacy 단일 probe 필드 (기존 UI 호환)
    liveProbe: keyPresent && primary
      ? { status: primary.status, ok: primary.ok, elapsedMs: primary.elapsedMs, body: primary.body ?? primary.error ?? null }
      : { skipped: 'ANTHROPIC_API_KEY 미설정' },
    diagnosis: interpret({ keyPresent, keyLast4, probes }),
  });
}

function interpret(params: {
  keyPresent: boolean;
  keyLast4: string;
  probes: ModelProbe[];
}): string {
  if (!params.keyPresent) {
    return '❌ ANTHROPIC_API_KEY가 Vercel 환경변수에 없음. Settings → Environment Variables에서 추가 후 재배포.';
  }
  const anyOk = params.probes.some((p) => p.ok);
  const okModels = params.probes.filter((p) => p.ok).map((p) => p.model);
  const rateLimited = params.probes.filter((p) => p.status === 429).map((p) => p.model);
  const auth401 = params.probes.find((p) => p.status === 401);
  const credit400 = params.probes.find((p) => p.status === 400 && p.body?.includes('credit balance'));

  if (auth401) {
    return `❌ 키 인증 실패 (401). 모든 모델에서 동일. 키 ${params.keyLast4} revoke 또는 오타 가능. Console 에서 새 키 발급 후 Vercel 에 교체 · 재배포.`;
  }
  if (credit400) {
    return `❌ 크레딧 부족 (400). 키 ${params.keyLast4}. Anthropic Console 에서 조직/워크스페이스 크레딧 확인.`;
  }
  if (anyOk) {
    const summary = `✅ AI 사용 가능 — 성공 모델: ${okModels.join(', ')}.`;
    if (rateLimited.length > 0) {
      return `${summary} ⚠️ Rate limit 모델: ${rateLimited.join(', ')} (chat 은 fallback 으로 자동 전환됨).`;
    }
    return `${summary} 키 ${params.keyLast4}.`;
  }
  if (rateLimited.length === params.probes.length) {
    return `⚠️ 전 모델 rate limit (429) — 크레딧 문제 아님. 1~2 분 후 재시도.`;
  }
  if (rateLimited.length > 0) {
    const other = params.probes.filter((p) => !p.ok && p.status !== 429);
    const detail = other.map((p) => `${p.model}=${p.status ?? 'err'}`).join(', ');
    return `⚠️ 일부 rate limit(${rateLimited.join(',')}) · 나머지 실패(${detail}). 1~2 분 후 재시도.`;
  }
  const details = params.probes.map((p) => `${p.model}=${p.status ?? 'err'}`).join(', ');
  return `❓ 예상 못한 상태: ${details}.`;
}
