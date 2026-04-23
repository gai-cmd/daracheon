import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { sendEmail } from '@/lib/mail';
import { hashPassword, type AdminUser } from '@/lib/admin-users';
import { snapshotBeforeDestructive } from '@/lib/backup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROLE_VALUES = ['super_admin', 'admin', 'editor'] as const;

const createSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  role: z.enum(ROLE_VALUES),
});

const updateSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLE_VALUES).optional(),
  password: z.string().min(8).optional(),
});

const deleteSchema = z.object({
  email: z.string().email(),
});

function redact(u: AdminUser) {
  const { passwordHash: _ph, ...rest } = u;
  void _ph;
  return rest;
}

export async function GET() {
  try {
    const users = await readData('admin-users');
    return NextResponse.json({ users: users.map(redact), total: users.length });
  } catch (error) {
    console.error('[Admin Users] GET error:', error);
    return NextResponse.json({ success: false, message: '조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }
    const { email, password, role } = parsed.data;
    const normalized = email.trim().toLowerCase();

    const users = await readData('admin-users');
    if (users.some((u) => u.email === normalized)) {
      return NextResponse.json(
        { success: false, message: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const user: AdminUser = {
      email: normalized,
      role,
      passwordHash: hashPassword(password),
      createdAt: now,
      updatedAt: now,
    };
    users.push(user);
    await writeData('admin-users', users);

    await logAdmin('settings', 'create', {
      targetId: normalized,
      summary: `관리자 계정 추가: ${normalized} (${role})`,
    });

    // 환영 메일 발송 (실패해도 응답 차단하지 않음)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    sendEmail({
      to: normalized,
      subject: '[대라천] 관리자 계정이 생성되었습니다',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#c9a55c;margin-bottom:8px;">대라천 관리자 계정 안내</h2>
          <p style="color:#444;line-height:1.7;">
            <strong>${normalized}</strong>님의 관리자 계정이 생성되었습니다.<br />
            역할: <strong>${role}</strong>
          </p>
          <p style="color:#444;line-height:1.7;">
            아래 주소로 로그인해 주세요:
          </p>
          <p style="margin:16px 0;">
            <a href="${siteUrl}/admin/login"
               style="display:inline-block;padding:12px 24px;background:#c9a55c;color:#1a1a17;text-decoration:none;font-weight:600;">
              관리자 로그인
            </a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:32px;">
            이 메일은 ZOEL LIFE 대라천 관리자 시스템에서 자동 발송되었습니다.<br />
            본인이 요청한 것이 아니라면 super_admin에게 문의해 주세요.
          </p>
        </div>
      `,
      text: `대라천 관리자 계정이 생성되었습니다.\n이메일: ${normalized}\n역할: ${role}\n로그인: ${siteUrl}/admin/login`,
    }).catch((err) => console.error('[admin-users] welcome mail failed:', err));

    return NextResponse.json({ success: true, user: redact(user) }, { status: 201 });
  } catch (error) {
    console.error('[Admin Users] POST error:', error);
    return NextResponse.json({ success: false, message: '생성 실패' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }
    const { email, role, password } = parsed.data;
    const normalized = email.trim().toLowerCase();

    const users = await readData('admin-users');
    const idx = users.findIndex((u) => u.email === normalized);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: '계정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updated: AdminUser = {
      ...users[idx],
      ...(role ? { role } : {}),
      ...(password ? { passwordHash: hashPassword(password) } : {}),
      updatedAt: new Date().toISOString(),
    };
    users[idx] = updated;
    await writeData('admin-users', users);

    const summaryParts: string[] = [];
    if (role) summaryParts.push(`역할=${role}`);
    if (password) summaryParts.push('비밀번호 재설정');

    await logAdmin('settings', 'update', {
      targetId: normalized,
      summary: `계정 수정: ${normalized} ${summaryParts.join(', ')}`.trim(),
    });

    return NextResponse.json({ success: true, user: redact(updated) });
  } catch (error) {
    console.error('[Admin Users] PUT error:', error);
    return NextResponse.json({ success: false, message: '수정 실패' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'email 필수' }, { status: 400 });
    }
    const normalized = parsed.data.email.trim().toLowerCase();
    const users = await readData('admin-users');
    const idx = users.findIndex((u) => u.email === normalized);
    if (idx === -1) {
      return NextResponse.json({ success: false, message: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    // Lockout 방지: 마지막 super_admin 은 삭제 불가. 시드 계정도 없어진
    // 상태에서 유일한 super_admin 을 제거하면 어드민 콘솔에 영구 로그인 불가.
    const target = users[idx];
    if (target.role === 'super_admin') {
      const superAdminCount = users.filter((u) => u.role === 'super_admin').length;
      if (superAdminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: '마지막 super_admin 계정은 삭제할 수 없습니다. 먼저 다른 super_admin 을 생성하세요.',
          },
          { status: 409 }
        );
      }
    }

    const snapId = await snapshotBeforeDestructive(undefined, `admin-user delete ${normalized}`);

    users.splice(idx, 1);
    await writeData('admin-users', users);

    await logAdmin('settings', 'delete', {
      targetId: normalized,
      summary: `관리자 계정 삭제: ${normalized}`,
      meta: snapId ? { preDeleteSnapshot: snapId } : undefined,
    });

    return NextResponse.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    console.error('[Admin Users] DELETE error:', error);
    return NextResponse.json({ success: false, message: '삭제 실패' }, { status: 500 });
  }
}
