import { NextRequest, NextResponse } from 'next/server';
import {
  createSnapshot,
  listSnapshots,
  fetchSnapshot,
  restoreSnapshot,
} from '@/lib/backup';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { logAdmin } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireSuperAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) {
    return { session: null, error: NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 }) };
  }
  if (session.role !== 'super_admin') {
    return { session: null, error: NextResponse.json({ success: false, message: '권한이 없습니다. (super_admin 전용)' }, { status: 403 }) };
  }
  return { session, error: null };
}

/** GET ?id=<snapshot-id> : 단일 스냅샷 JSON 다운로드
 *  GET (no id): 스냅샷 목록 */
export async function GET(request: NextRequest) {
  const gate = await requireSuperAdmin(request);
  if (gate.error) return gate.error;

  const id = request.nextUrl.searchParams.get('id');
  if (id) {
    const payload = await fetchSnapshot(id);
    if (!payload) {
      return NextResponse.json({ success: false, message: '스냅샷을 찾을 수 없습니다.' }, { status: 404 });
    }
    await logAdmin('settings', 'update', {
      summary: `스냅샷 다운로드: ${id}`,
      meta: { id, actor: gate.session!.email },
    }).catch(() => {});
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${id}.json"`,
      },
    });
  }

  const snapshots = await listSnapshots();
  return NextResponse.json({ success: true, snapshots });
}

/** POST : 수동 스냅샷 생성 */
export async function POST(request: NextRequest) {
  const gate = await requireSuperAdmin(request);
  if (gate.error) return gate.error;

  try {
    const snap = await createSnapshot('manual', { actor: gate.session!.email });
    await logAdmin('settings', 'update', {
      summary: `수동 스냅샷 생성: ${snap?.id ?? 'skipped'}`,
      meta: { id: snap?.id, size: snap?.size },
    }).catch(() => {});
    return NextResponse.json({ success: true, snapshot: snap });
  } catch (err) {
    console.error('[backup:manual] error', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : '스냅샷 생성 실패' },
      { status: 500 }
    );
  }
}

/** PUT : 스냅샷 복원 (body: { id, restoreUsers?, restoreAuditLog? }) */
export async function PUT(request: NextRequest) {
  const gate = await requireSuperAdmin(request);
  if (gate.error) return gate.error;

  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      return NextResponse.json({ success: false, message: '스냅샷 id 는 필수입니다.' }, { status: 400 });
    }
    const result = await restoreSnapshot(id, {
      restoreUsers: body.restoreUsers === true,
      restoreAuditLog: body.restoreAuditLog === true,
    });
    await logAdmin('settings', 'update', {
      summary: `스냅샷 복원: ${id} (${result.restored.length}개 테이블)`,
      meta: {
        id,
        restored: result.restored,
        skipped: result.skipped,
        preRestoreId: result.preRestoreId,
        actor: gate.session!.email,
      },
    }).catch(() => {});
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[backup:restore] error', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : '복원 실패' },
      { status: 500 }
    );
  }
}
