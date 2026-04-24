import { NextRequest, NextResponse } from 'next/server';
import {
  createSnapshot,
  listSnapshots,
  fetchSnapshot,
  restoreSnapshot,
  restoreFromPayload,
  listGitHubBackups,
  fetchGitHubBackup,
  fetchGitHubSnapshot,
  parseBackupString,
  isGitHubBackupConfigured,
  isEmailBackupConfigured,
  isEncryptionConfigured,
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

/** GET ?id=<snapshot-id>                 : Tier 1 (Blob) 스냅샷 다운로드
 *  GET ?source=github&path=<path>         : Tier 2 (GitHub) 스냅샷 다운로드 (복호화됨)
 *  GET ?source=github                     : GitHub 백업 목록
 *  GET (no params)                        : Tier 1 (Blob) + 시스템 상태 */
export async function GET(request: NextRequest) {
  const gate = await requireSuperAdmin(request);
  if (gate.error) return gate.error;

  const id = request.nextUrl.searchParams.get('id');
  const source = request.nextUrl.searchParams.get('source');
  const path = request.nextUrl.searchParams.get('path');

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

  if (source === 'github' && path) {
    const payload = await fetchGitHubSnapshot(path);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'GitHub 백업을 찾을 수 없거나 복호화에 실패했습니다.' },
        { status: 404 }
      );
    }
    await logAdmin('settings', 'update', {
      summary: `GitHub 백업 다운로드: ${path}`,
      meta: { path, actor: gate.session!.email },
    }).catch(() => {});
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${path.replace(/\//g, '_')}"`,
      },
    });
  }

  if (source === 'github') {
    const entries = await listGitHubBackups();
    return NextResponse.json({
      success: true,
      source: 'github',
      backups: entries,
      configured: isGitHubBackupConfigured(),
    });
  }

  const snapshots = await listSnapshots();
  return NextResponse.json({
    success: true,
    snapshots,
    status: {
      tier1_blob: true,
      tier2_github: isGitHubBackupConfigured(),
      tier3_email: isEmailBackupConfigured(),
      encryption: isEncryptionConfigured(),
    },
  });
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

/** PUT : 스냅샷 복원
 *  body: { id?, source?: 'github', path?, rawBody?, restoreUsers?, restoreAuditLog? }
 *   - id 있으면 Tier 1 (Blob) 복원
 *   - source='github' + path 이면 Tier 2 (GitHub) 복원 (자동 복호화)
 *   - rawBody (문자열) 있으면 업로드된 평문/암호문을 바로 복원 */
export async function PUT(request: NextRequest) {
  const gate = await requireSuperAdmin(request);
  if (gate.error) return gate.error;

  try {
    const body = await request.json();
    const opts = {
      restoreUsers: body.restoreUsers === true,
      restoreAuditLog: body.restoreAuditLog === true,
    };

    if (typeof body.id === 'string' && body.id) {
      const result = await restoreSnapshot(body.id, opts);
      await logAdmin('settings', 'update', {
        summary: `스냅샷 복원 (Tier1 Blob): ${body.id} (${result.restored.length}개 테이블)`,
        meta: { source: 'tier1_blob', id: body.id, ...result, actor: gate.session!.email },
      }).catch(() => {});
      return NextResponse.json({ success: true, source: 'tier1_blob', ...result });
    }

    if (body.source === 'github' && typeof body.path === 'string' && body.path) {
      const payload = await fetchGitHubSnapshot(body.path);
      if (!payload) {
        return NextResponse.json(
          { success: false, message: 'GitHub 백업을 찾을 수 없거나 복호화 실패 (BACKUP_ENCRYPTION_KEY 확인).' },
          { status: 404 }
        );
      }
      const result = await restoreFromPayload(payload, { ...opts, sourceNote: `github:${body.path}` });
      await logAdmin('settings', 'update', {
        summary: `스냅샷 복원 (Tier2 GitHub): ${body.path} (${result.restored.length}개 테이블)`,
        meta: { source: 'tier2_github', path: body.path, ...result, actor: gate.session!.email },
      }).catch(() => {});
      return NextResponse.json({ success: true, source: 'tier2_github', path: body.path, ...result });
    }

    if (typeof body.rawBody === 'string' && body.rawBody.length > 0) {
      const payload = parseBackupString(body.rawBody);
      if (!payload) {
        return NextResponse.json(
          { success: false, message: '업로드한 백업 본문을 파싱·복호화할 수 없습니다.' },
          { status: 400 }
        );
      }
      const result = await restoreFromPayload(payload, { ...opts, sourceNote: 'upload' });
      await logAdmin('settings', 'update', {
        summary: `스냅샷 복원 (업로드): ${payload.label} ${payload.createdAt}`,
        meta: { source: 'upload', ...result, actor: gate.session!.email },
      }).catch(() => {});
      return NextResponse.json({ success: true, source: 'upload', ...result });
    }

    return NextResponse.json(
      { success: false, message: 'id / source+path / rawBody 중 하나는 필수입니다.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[backup:restore] error', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : '복원 실패' },
      { status: 500 }
    );
  }
}
