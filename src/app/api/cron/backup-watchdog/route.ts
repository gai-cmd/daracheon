import { NextRequest, NextResponse } from 'next/server';
import { listSnapshots, isBlobEnabled } from '@/lib/backup';
import { authorizeCron } from '@/lib/cron-auth';
import { sendOpsAlert } from '@/lib/ops-alert';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 백업 데드맨 스위치(dead man's switch).
 *
 * 2026-07-26 사고: daily-backup 크론이 2026-07-15 이후 11일간 스냅샷을 단 한 개도
 * 만들지 않았는데 아무 경보도 울리지 않았다. 기존 알림은 "라우트가 실행됐는데
 * 실패했을 때"만 발동하기 때문이다. 크론이 아예 호출되지 않으면 실패 신호 자체가
 * 존재하지 않는다. Vercel 공식 문서도 이를 정상 동작 범위로 명시한다 —
 * "Cron job delivery is best effort ... your function does not execute, and no
 * runtime log is created for that scheduled run" / "Vercel will not retry an
 * invocation if a cron job fails."
 *   https://vercel.com/docs/cron-jobs/manage-cron-jobs
 *
 * 그래서 "백업이 실패했는가"가 아니라 "백업 결과물이 최근에 존재하는가"를 본다.
 * 저장소를 직접 조회하므로 어떤 원인(크론 미발사·함수 타임아웃·배포 사고)이든
 * 동일하게 잡힌다. Vercel 내부에서 실행돼 외부 네트워크에 의존하지 않는다.
 *
 * 이 라우트는 읽기 전용이며 멱등하다 — Vercel Cron 과 GitHub Actions 가 각각
 * 독립적으로 호출해도 안전하다(감시자 자신이 조용히 누락되는 경우 대비).
 */

const DEFAULT_MAX_AGE_HOURS = 26; // 일 1회 백업 + 지연 여유 2시간

/**
 * 임계값 파싱. `Number(x) || DEFAULT` 로 쓰면 0 이 falsy 라 명시적으로 설정한
 * 값이 조용히 기본값으로 되돌아간다(2026-07-26 경보 체인 테스트에서 실제로
 * BACKUP_MAX_AGE_HOURS=0 이 무시됨). 설정값 무시야말로 이번 사고의 본질이므로
 * 유한한 양수만 채택하고 나머지는 기본값으로 명시 처리한다.
 */
function resolveMaxAgeHours(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_MAX_AGE_HOURS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(`[backup-watchdog] BACKUP_MAX_AGE_HOURS 값이 올바르지 않아 기본값 ${DEFAULT_MAX_AGE_HOURS} 사용: "${raw}"`);
    return DEFAULT_MAX_AGE_HOURS;
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  const auth = authorizeCron(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }

  const maxAgeHours = resolveMaxAgeHours(process.env.BACKUP_MAX_AGE_HOURS);
  const now = Date.now();

  if (!isBlobEnabled()) {
    const msg = 'Blob 미설정 — 백업 상태를 확인할 수 없습니다 (BLOB_READ_WRITE_TOKEN 확인 필요).';
    const alert = await sendOpsAlert(`🚨 [zoellife 백업 감시] ${msg}`);
    return NextResponse.json(
      { success: false, stale: true, message: msg, alert, at: new Date().toISOString() },
      { status: 500 }
    );
  }

  let snapshots;
  try {
    snapshots = await listSnapshots();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const msg = `스냅샷 목록 조회 실패 — 백업 상태 확인 불가: ${detail}`;
    const alert = await sendOpsAlert(`🚨 [zoellife 백업 감시] ${msg}`);
    return NextResponse.json(
      { success: false, stale: true, message: msg, alert, at: new Date().toISOString() },
      { status: 500 }
    );
  }

  // label 은 id 접두사로 직접 판별한다. listSnapshots 의 label 필드는
  // id.split('-')[0] 이라 'pre-delete-...' 를 'pre' 로 자르므로 신뢰하지 않는다.
  const daily = snapshots.filter((s) => s.id.startsWith('daily-'));

  const latest = daily.reduce<(typeof daily)[number] | null>(
    (acc, s) => (acc === null || s.createdAt > acc.createdAt ? s : acc),
    null
  );

  if (!latest) {
    const msg = '일일 백업 스냅샷이 하나도 없습니다. 백업이 한 번도 성공하지 못했습니다.';
    const alert = await sendOpsAlert(`🚨 [zoellife 백업 감시] ${msg}`);
    return NextResponse.json(
      { success: false, stale: true, dailyCount: 0, message: msg, alert, at: new Date().toISOString() },
      { status: 500 }
    );
  }

  const ageHours = (now - Date.parse(latest.createdAt)) / 3_600_000;
  const stale = !Number.isFinite(ageHours) || ageHours > maxAgeHours;

  // 응답에 blob URL·pathname 을 절대 싣지 않는다 — 그 안에 비밀값
  // BLOB_DATA_PREFIX 가 들어 있고, 이번 사고의 PII 유출 경로였다.
  const body = {
    success: !stale,
    stale,
    ageHours: Number(ageHours.toFixed(2)),
    maxAgeHours,
    latestAt: latest.createdAt,
    dailyCount: daily.length,
    at: new Date().toISOString(),
  };

  if (stale) {
    const msg =
      `일일 백업이 ${ageHours.toFixed(1)}시간째 갱신되지 않았습니다 (허용 ${maxAgeHours}시간). ` +
      `마지막 성공: ${latest.createdAt}. Vercel → Settings → Cron Jobs → View Logs 확인 필요.`;
    const alert = await sendOpsAlert(`🚨 [zoellife 백업 감시] ${msg}`);
    return NextResponse.json({ ...body, message: msg, alert }, { status: 500 });
  }

  return NextResponse.json(body);
}
