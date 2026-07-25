import { NextRequest, NextResponse } from 'next/server';
import { createSnapshot, pruneSnapshots, mirrorSnapshot } from '@/lib/backup';
import { mirrorToSecondaryStore } from '@/lib/backup-secondary';
import { archiveQrRecords } from '@/lib/qr-archive';
import { authorizeCron } from '@/lib/cron-auth';
import { sendOpsAlert } from '@/lib/ops-alert';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 백업 저하/실패를 운영 채널로 즉시 알린다 (진단 ARCH-4 'Blob 저하 알림').
// Vercel Cron 실패 알림은 대시보드를 봐야 눈에 띄므로, 운영자가 실제로 보는
// 채널로 push 한다. 2026-07-26 사고 이후 텔레그램 단일 채널 → 텔레그램+Slack
// 이중 발송으로 변경(한 채널 미설정 시 경보가 무음 소멸하던 문제).
// 알림 실패가 백업 응답 자체를 깨면 안 되므로 sendOpsAlert 는 throw 하지 않는다.
async function alertBackupProblem(summary: string): Promise<void> {
  await sendOpsAlert(`🚨 [zoellife 백업] ${summary}`);
}

/**
 * Vercel Cron 호출 전용 엔드포인트. 매일 1회 실행되어:
 *   Tier 1    전체 DB 스냅샷 생성 (Vercel Blob, label='daily')
 *   Tier 2-B  별도 private Blob 스토어로 이중화 (원본과 다른 바구니)
 *   Tier 2    GitHub backups 브랜치에 암호화 커밋 미러링
 *   Tier 3    일요일엔 관리자 이메일로 암호화 첨부 발송
 *   + 보존 정책에 따라 오래된 Blob 스냅샷 정리 (daily 30회차)
 *
 * 인증: @/lib/cron-auth 의 authorizeCron — CRON_SECRET 설정 시 Bearer 시크릿만 통과.
 */
export async function GET(request: NextRequest) {
  const auth = authorizeCron(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }
  const trigger = auth.via === 'secret' ? 'cron-secret' : 'legacy-header';

  try {
    // Tier 1 — Blob snapshot
    const snap = await createSnapshot('daily', { trigger });

    // Blob 비활성 또는 생성 실패 → 명확한 에러. success:true 로 감추지 않음
    if (!snap) {
      await alertBackupProblem('Tier 1 스냅샷 생성 실패 — Blob 미설정 또는 스토리지 오류. 오늘 백업이 저장되지 않았습니다.');
      return NextResponse.json(
        {
          success: false,
          message: 'Tier 1 백업 실패: BLOB_READ_WRITE_TOKEN 미설정 또는 Blob 스토리지 오류. 백업이 저장되지 않았습니다.',
          tier1: null,
          at: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Tier 2/3 — 외부 미러링 (암호화). 일요일(UTC getDay()===0)엔 이메일도.
    const isWeekly = new Date().getUTCDay() === 0;
    const mirror = await mirrorSnapshot('daily', snap.body, {
      sendEmail: isWeekly,
      meta: { snapshotId: snap.id, trigger },
    });

    // Tier 2-B — 별도 private 스토어로 이중화. 원본과 스냅샷이 같은 스토어에
    // 있으면 그 스토어 사고 한 번에 둘 다 사라지므로 바구니를 나눈다.
    const secondary = await mirrorToSecondaryStore(snap.id, snap.body);
    if (!secondary.ok && !secondary.skipped) {
      await alertBackupProblem(`보조 스토어 이중화 실패: ${secondary.error}. Tier 1 스냅샷은 저장됨.`);
    }

    // 오래된 blob 스냅샷 정리
    const prune = await pruneSnapshots();

    // QR per-record 아카이브 (Tier 1 보강 — createSnapshot 이 못 담는
    // qr-events/coupons/serials 를 _qr-archive/ 월 롤업으로). 실패해도
    // 스냅샷 자체는 유효하므로 throw 로 전체를 죽이지 않되, degraded 는
    // 아래에서 500 으로 크게 알린다.
    let qrArchive: Awaited<ReturnType<typeof archiveQrRecords>> = null;
    let qrArchiveError: string | null = null;
    try {
      qrArchive = await archiveQrRecords();
    } catch (err) {
      console.error('[cron:daily-backup] qr-archive error', err);
      qrArchiveError = err instanceof Error ? err.message : String(err);
    }

    // 일부 컬렉션 읽기 실패(degraded) → 스냅샷은 저장·미러링됐으나 불완전.
    // 조용히 success:true 로 감추지 않고 500 으로 크게 실패시켜(진단 DATA-4)
    // Vercel Cron 실패 알림이 뜨도록 한다. 부분 스냅샷 정보는 함께 반환.
    const qrDegraded = qrArchiveError !== null || (qrArchive !== null && !qrArchive.ok);
    if (snap.degraded.length > 0 || qrDegraded) {
      const parts = [
        ...(snap.degraded.length > 0
          ? [`${snap.degraded.join(', ')} 컬렉션을 읽지 못했습니다`]
          : []),
        ...(qrDegraded
          ? [`QR 아카이브 불완전(${qrArchiveError ?? qrArchive?.degraded.join(', ')})`]
          : []),
      ];
      await alertBackupProblem(`부분 실패(degraded): ${parts.join(' / ')}. 부분 스냅샷은 저장됨 — Blob 상태 확인 필요.`);
      return NextResponse.json(
        {
          success: false,
          message: `백업 부분 실패(degraded): ${parts.join(' / ')}. 부분 스냅샷은 저장·미러링됨. Blob 상태 확인 필요.`,
          tier1: { id: snap.id, size: snap.size, degraded: snap.degraded },
          tier2_secondary_store: secondary,
          tier2_github: mirror.tier2Github,
          tier3_email: mirror.tier3Email,
          qrArchive: qrArchive ?? { error: qrArchiveError },
          prune,
          at: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // ⚠️ snap.url 은 응답에 절대 넣지 않는다. URL 경로에 비밀값 BLOB_DATA_PREFIX 가
    // 들어 있고, 스냅샷 blob 은 access:'public' 이라 URL 을 아는 사람은 인증 없이
    // 고객 PII 전체 DB 를 내려받을 수 있다. 2026-07-26 에 이 경로로 실제 유출이
    // 가능함이 실증됐다(위조한 x-vercel-cron 헤더 → 200 → URL 획득 → 1.3MB 다운로드).
    return NextResponse.json({
      success: true,
      tier1: { id: snap.id, size: snap.size },
      tier2_secondary_store: secondary,
      tier2_github: mirror.tier2Github,
      tier3_email: mirror.tier3Email,
      qrArchive,
      prune,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron:daily-backup] error', err);
    await alertBackupProblem(
      `백업 크론 예외: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
    );
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
