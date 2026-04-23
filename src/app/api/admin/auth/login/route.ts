import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifyCredentials,
} from '@/lib/auth';
import { readData, writeData } from '@/lib/db';
import type { AuditEntry } from '@/lib/audit';
import { verifyPassword, type AdminUser } from '@/lib/admin-users';
import { verifyTOTPOnce } from '@/lib/totp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const loginSchema = z.object({
  email: z.string().min(1, '아이디(또는 이메일)를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  totp: z.string().optional(),
});

async function auditLogin(
  email: string,
  role: string,
  action: 'login' | 'login_failed' | 'login_locked',
  summary: string
) {
  try {
    const entries = await readData('audit-log');
    entries.push({
      id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actor: email,
      actorRole: role,
      module: 'auth',
      action,
      summary,
    });
    if (entries.length > 2000) entries.splice(0, entries.length - 2000);
    await writeData('audit-log', entries);
  } catch (err) {
    console.error('[Audit] login log failed:', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const { email, password, totp } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    let role: 'super_admin' | 'admin' | 'editor' | null = null;
    let matchedDbUser: AdminUser | undefined;

    try {
      const users = await readData('admin-users');
      const userIndex = users.findIndex((u) => u.email === normalizedEmail);
      if (userIndex >= 0) {
        const user = users[userIndex];

        // 잠금 확인
        if (user.lockedUntil) {
          const until = new Date(user.lockedUntil).getTime();
          if (Date.now() < until) {
            const minutesLeft = Math.ceil((until - Date.now()) / 60000);
            auditLogin(normalizedEmail, user.role, 'login_locked', `잠긴 계정 로그인 시도 (${minutesLeft}분 남음)`);
            return NextResponse.json(
              {
                success: false,
                message: `계정이 잠겼습니다. ${minutesLeft}분 후 다시 시도하거나 super_admin에게 문의하세요.`,
              },
              { status: 423 }
            );
          } else {
            // 잠금 만료 → 해제
            delete user.lockedUntil;
            user.failedAttempts = 0;
          }
        }

        if (verifyPassword(password, user.passwordHash)) {
          // 2FA 확인
          if (user.totpEnabled && user.totpSecret) {
            if (!totp) {
              return NextResponse.json(
                { success: false, message: '2단계 인증 코드가 필요합니다.', requiresTotp: true },
                { status: 401 }
              );
            }
            const ok = verifyTOTPOnce(normalizedEmail, user.totpSecret, totp.replace(/\s+/g, ''));
            if (!ok) {
              user.failedAttempts = (user.failedAttempts ?? 0) + 1;
              if (user.failedAttempts >= MAX_ATTEMPTS) {
                user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
                auditLogin(normalizedEmail, user.role, 'login_locked', `2FA 실패 ${MAX_ATTEMPTS}회로 ${LOCK_MINUTES}분 잠금`);
              }
              users[userIndex] = user;
              await writeData('admin-users', users);
              return NextResponse.json(
                { success: false, message: '2단계 인증 코드가 올바르지 않습니다.', requiresTotp: true },
                { status: 401 }
              );
            }
          }

          role = user.role;
          matchedDbUser = user;
          user.lastLoginAt = new Date().toISOString();
          user.failedAttempts = 0;
          delete user.lockedUntil;
          users[userIndex] = user;
          await writeData('admin-users', users);
        } else {
          // 비밀번호 실패
          user.failedAttempts = (user.failedAttempts ?? 0) + 1;
          if (user.failedAttempts >= MAX_ATTEMPTS) {
            user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
            auditLogin(normalizedEmail, user.role, 'login_locked', `비밀번호 실패 ${MAX_ATTEMPTS}회로 ${LOCK_MINUTES}분 잠금`);
          } else {
            auditLogin(normalizedEmail, user.role, 'login_failed', `비밀번호 실패 (${user.failedAttempts}/${MAX_ATTEMPTS})`);
          }
          users[userIndex] = user;
          await writeData('admin-users', users);
        }
      }
    } catch (dbErr) {
      console.error('[Admin Login] admin-users 조회 오류:', dbErr);
    }

    if (!role) {
      role = verifyCredentials(email, password);
    }

    if (!role) {
      return NextResponse.json(
        { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    auditLogin(normalizedEmail, role, 'login', `관리자 로그인: ${normalizedEmail}`);
    void matchedDbUser;

    const token = await createSessionToken({ email: normalizedEmail, role });
    const response = NextResponse.json({
      success: true,
      message: '로그인에 성공했습니다.',
      session: { email: normalizedEmail, role },
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
