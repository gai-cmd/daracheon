import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Vercel Cron 엔드포인트 공용 인증.
 *
 * 2026-07-26 사고 대응: 기존 구현은 `x-vercel-cron: 1` 헤더 단독으로 인증을
 * 통과시켰다. 이 헤더는 외부에서 위조 가능하다는 사실이 실측으로 확인됐다
 * (로컬 머신에서 해당 헤더만 붙여 /api/cron/daily-backup 호출 → HTTP 200,
 * 응답으로 비밀 BLOB_DATA_PREFIX 가 포함된 스냅샷 URL 획득 → 인증 없이
 * 고객 PII 전체 DB 다운로드 성공).
 *
 * Vercel 공식 문서가 제시하는 크론 인증 수단은 CRON_SECRET 환경변수뿐이며,
 * 이 값은 Vercel 이 크론 호출 시 `Authorization: Bearer <CRON_SECRET>` 로
 * 자동 전송한다. `x-vercel-cron` 을 인증 근거로 제시한 문서 문구는 없다.
 *   https://vercel.com/docs/cron-jobs/manage-cron-jobs (Securing cron jobs)
 *
 * 그래서 정책은 다음과 같다:
 *   - CRON_SECRET 이 설정돼 있으면: Bearer 시크릿 일치만 통과. 위조 가능한
 *     x-vercel-cron 은 인증 근거로 쓰지 않는다.
 *   - CRON_SECRET 이 없으면: 레거시 헤더를 임시 허용하되 경고를 남긴다.
 *     (여기서 즉시 fail-closed 하면 시크릿을 넣기 전까지 백업·메일폴링 크론이
 *      전부 죽으므로, 가용성을 지키면서 시크릿 설정을 유도한다.)
 *
 * ⚠️ 레거시 경로가 열려 있는 동안에도 응답 본문에 비밀값(blob URL·prefix)을
 *    절대 싣지 않는 것이 실제 누출 차단선이다. daily-backup 라우트 참고.
 */

export type CronAuthResult =
  | { ok: true; via: 'secret' | 'legacy-header' }
  | { ok: false; reason: string };

/** NextRequest 전체가 아니라 헤더 조회 능력만 요구해 단위 테스트를 쉽게 한다. */
export interface HeaderCarrier {
  headers: { get(name: string): string | null };
}

function safeEqual(a: string, b: string): boolean {
  // 길이 노출 없이 상수 시간 비교하기 위해 해시 후 비교한다.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function extractProvidedSecret(request: HeaderCarrier): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice('Bearer '.length);
  return request.headers.get('x-cron-secret');
}

export function authorizeCron(request: HeaderCarrier): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const provided = extractProvidedSecret(request)?.trim();

  if (cronSecret) {
    if (provided && safeEqual(provided, cronSecret)) return { ok: true, via: 'secret' };
    return { ok: false, reason: 'CRON_SECRET 불일치' };
  }

  if (request.headers.get('x-vercel-cron') === '1') {
    console.warn(
      '[cron-auth] CRON_SECRET 미설정 — 위조 가능한 x-vercel-cron 헤더로 통과시켰습니다. ' +
        'Vercel 프로젝트 환경변수에 CRON_SECRET 을 설정하세요.'
    );
    return { ok: true, via: 'legacy-header' };
  }

  return { ok: false, reason: '인증 정보 없음' };
}
