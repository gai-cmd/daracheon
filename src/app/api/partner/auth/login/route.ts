import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  PARTNER_COOKIE,
  PARTNER_SESSION_MAX_AGE_SECONDS,
  createPartnerToken,
} from '@/lib/partner-auth';
import {
  PARTNER_ACCOUNTS_FILE,
  normalizeLoginId,
  type PartnerAccount,
} from '@/lib/partner-accounts';
import { verifyPassword } from '@/lib/admin-users';
import { readDataForWrite, writeDataMerged } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const loginSchema = z.object({
  loginId: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

const INVALID_MSG =
  '아이디 또는 비밀번호가 올바르지 않습니다. / Tên đăng nhập hoặc mật khẩu không đúng.';

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: '아이디와 비밀번호를 입력해주세요. / Vui lòng nhập đầy đủ.' },
        { status: 400 }
      );
    }

    const loginId = normalizeLoginId(parsed.data.loginId);
    const { password } = parsed.data;

    const accounts = await readDataForWrite<PartnerAccount>(PARTNER_ACCOUNTS_FILE);
    const idx = accounts.findIndex((a) => a.loginId === loginId);
    if (idx < 0) {
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    const account = accounts[idx];

    if (!account.active) {
      return NextResponse.json(
        { success: false, message: '비활성화된 계정입니다. 관리자에게 문의하세요. / Tài khoản đã bị vô hiệu hóa.' },
        { status: 403 }
      );
    }

    if (account.lockedUntil) {
      const until = new Date(account.lockedUntil).getTime();
      if (Date.now() < until) {
        const minutesLeft = Math.ceil((until - Date.now()) / 60000);
        return NextResponse.json(
          { success: false, message: `잠긴 계정입니다. ${minutesLeft}분 후 다시 시도하세요. / Tài khoản tạm khóa, thử lại sau ${minutesLeft} phút.` },
          { status: 423 }
        );
      }
      delete account.lockedUntil;
      account.failedAttempts = 0;
    }

    if (!verifyPassword(password, account.passwordHash)) {
      account.failedAttempts = (account.failedAttempts ?? 0) + 1;
      if (account.failedAttempts >= MAX_ATTEMPTS) {
        account.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
      }
      account.updatedAt = new Date().toISOString();
      accounts[idx] = account;
      await writeDataMerged(PARTNER_ACCOUNTS_FILE, accounts);
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    account.lastLoginAt = new Date().toISOString();
    account.failedAttempts = 0;
    delete account.lockedUntil;
    account.updatedAt = new Date().toISOString();
    accounts[idx] = account;
    await writeDataMerged(PARTNER_ACCOUNTS_FILE, accounts);

    const token = await createPartnerToken({
      accountId: account.id,
      loginId: account.loginId,
      name: account.name,
    });
    const response = NextResponse.json({ success: true, name: account.name });
    response.cookies.set(PARTNER_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: PARTNER_SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error('[Partner Login] Error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
