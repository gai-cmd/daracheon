import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  PARTNER_COOKIE,
  PARTNER_SESSION_MAX_AGE_SECONDS,
  createPartnerToken,
  verifyPartnerToken,
} from '@/lib/partner-auth';
import {
  PARTNER_ACCOUNTS_FILE,
  invalidatePartnerAccountsCache,
  type PartnerAccount,
} from '@/lib/partner-accounts';
import { hashPassword, verifyPassword } from '@/lib/admin-users';
import { readDataForWrite, writeDataMerged } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(4).max(200),
});

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const session = await verifyPartnerToken(store.get(PARTNER_COOKIE)?.value);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: '새 비밀번호는 4자 이상이어야 합니다. / Mật khẩu mới tối thiểu 4 ký tự.' },
        { status: 400 }
      );
    }

    const accounts = await readDataForWrite<PartnerAccount>(PARTNER_ACCOUNTS_FILE);
    const idx = accounts.findIndex((a) => a.id === session.accountId);
    if (idx < 0 || !accounts[idx].active) {
      return NextResponse.json(
        { success: false, message: '계정을 사용할 수 없습니다. / Tài khoản không khả dụng.' },
        { status: 403 }
      );
    }

    const account = accounts[idx];
    if (!verifyPassword(parsed.data.currentPassword, account.passwordHash)) {
      return NextResponse.json(
        { success: false, message: '현재 비밀번호가 올바르지 않습니다. / Mật khẩu hiện tại không đúng.' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();
    account.passwordHash = hashPassword(parsed.data.newPassword);
    account.passwordChangedAt = now; // 이 시각 이전 발급 세션(다른 기기 포함) 전부 무효
    account.failedAttempts = 0;
    delete account.lockedUntil;
    account.updatedAt = now;
    accounts[idx] = account;
    await writeDataMerged(PARTNER_ACCOUNTS_FILE, accounts);
    invalidatePartnerAccountsCache();

    // 현재 기기는 끊기지 않도록 새 세션 즉시 재발급 (issuedAt ≥ passwordChangedAt).
    const token = await createPartnerToken({
      accountId: account.id,
      loginId: account.loginId,
      name: account.name,
    });
    const response = NextResponse.json({ success: true });
    response.cookies.set(PARTNER_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: PARTNER_SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error('[Partner Change Password] Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
