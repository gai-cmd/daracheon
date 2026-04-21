import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { syncSeedFromBlob } from '@/lib/seed-sync';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST /api/admin/db/resync
// Blob → fs seed 수동 재동기화. 빌드 파이프라인 외에서 admin 이 직접
// 트리거. Super-admin 전용 — seed 파일은 배포 전체에 영향을 주는
// 번들 자산이므로 일반 admin 권한으로는 수정 못 하게 제한.
export async function POST() {
  // Role gate (middleware 는 로그인 여부만 확인, role 은 라우트에서 개별 체크)
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ success: false, message: '세션이 없습니다.' }, { status: 401 });
  }
  if (session.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, message: 'DB 재동기화는 super_admin 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  // allowPreview: admin 수동 트리거는 env 제한 없이 실행되도록 (build 자동
  // 훅과 달리 의도적 액션이므로 preview 환경에서도 허용).
  let result;
  try {
    result = await syncSeedFromBlob({ allowPreview: true });
  } catch (err) {
    console.error('[api:db:resync] sync threw', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Seed 재동기화 중 오류',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  try {
    await logAdmin('settings', 'update', {
      summary: 'DB seed 재동기화 (Blob → fs)',
      meta: {
        attempted: result.attempted,
        written: result.written,
        skipped: result.skipped,
        errors: result.errors,
        reason: result.reason,
      },
    });
  } catch (err) {
    console.warn('[api:db:resync] audit log failed (non-fatal)', err);
  }

  return NextResponse.json({ success: true, ...result });
}
