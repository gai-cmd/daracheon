import { NextResponse } from 'next/server';
import { readData, writeData, readSingle, writeSingle } from '@/lib/db';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DB_FILES = [
  'products',
  'reviews',
  'inquiries',
  'broadcasts',
  'faq',
  'media',
  'productCategories',
  'admin-users',
  'audit-log',
] as const;

const SINGLETON_FILES = ['company', 'announcement', 'pages'] as const;

type DbKey = (typeof DB_FILES)[number];
type SingletonKey = (typeof SINGLETON_FILES)[number];

export async function GET() {
  try {
    const data: Partial<Record<DbKey | SingletonKey, unknown>> = {};

    for (const file of DB_FILES) {
      data[file] = await readData(file);
    }
    for (const file of SINGLETON_FILES) {
      data[file] = await readSingle(file);
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const payload = {
      exportedAt: now.toISOString(),
      version: '1.1',
      data,
    };

    await logAdmin('settings', 'update', {
      summary: '전체 백업 다운로드',
    });

    const filename = `daracheon-backup-${timestamp}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Admin Backup] GET Error:', error);
    return NextResponse.json(
      { success: false, message: '백업 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/** POST — 백업 JSON 업로드 → 복원 (관리자 계정/감사 로그는 덮어쓰지 않음, admin-users와 audit-log는 선택적) */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const restoreUsers = formData.get('restoreUsers') === 'true';
    const restoreAuditLog = formData.get('restoreAuditLog') === 'true';

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'JSON 파일이 필요합니다.' }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: '50MB 이하의 파일만 지원합니다.' }, { status: 413 });
    }

    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ success: false, message: 'JSON 파싱 실패' }, { status: 400 });
    }

    const payload = parsed as { version?: string; data?: Record<string, unknown> };
    if (!payload?.data || typeof payload.data !== 'object') {
      return NextResponse.json(
        { success: false, message: '올바르지 않은 백업 형식입니다. (data 필드 누락)' },
        { status: 400 }
      );
    }

    const restored: string[] = [];
    const skipped: string[] = [];

    for (const key of DB_FILES) {
      if (key === 'admin-users' && !restoreUsers) {
        skipped.push(key);
        continue;
      }
      if (key === 'audit-log' && !restoreAuditLog) {
        skipped.push(key);
        continue;
      }
      const value = payload.data[key];
      if (Array.isArray(value)) {
        await writeData(key, value);
        restored.push(key);
      }
    }

    for (const key of SINGLETON_FILES) {
      const value = payload.data[key];
      if (value && typeof value === 'object') {
        await writeSingle(key, value);
        restored.push(key);
      }
    }

    await logAdmin('settings', 'update', {
      summary: `백업 복원: ${restored.join(', ')}`,
      meta: { restored, skipped, filename: file.name, version: payload.version ?? 'unknown' },
    });

    return NextResponse.json({
      success: true,
      message: `복원 완료. ${restored.length}개 테이블이 복원되었습니다.`,
      restored,
      skipped,
    });
  } catch (error) {
    console.error('[Admin Backup] POST error:', error);
    return NextResponse.json({ success: false, message: '복원 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
