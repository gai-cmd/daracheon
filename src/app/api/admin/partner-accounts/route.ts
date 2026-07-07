import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { readDataUncached, readDataForWrite, writeDataMerged } from '@/lib/db';
import { hashPassword } from '@/lib/admin-users';
import {
  PARTNER_ACCOUNTS_FILE,
  normalizeLoginId,
  isValidLoginId,
  type PartnerAccount,
} from '@/lib/partner-accounts';
import { logAdmin } from '@/lib/audit';
import { resolveActor } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 응답에서 해시/보안 필드 제거 */
function sanitize(a: PartnerAccount) {
  const { passwordHash, ...rest } = a;
  void passwordHash;
  return rest;
}

export async function GET() {
  try {
    const accounts = await readDataUncached<PartnerAccount>(PARTNER_ACCOUNTS_FILE);
    return NextResponse.json({
      accounts: accounts
        .map(sanitize)
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    });
  } catch (error) {
    console.error('[Partner Accounts] GET Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

const createSchema = z.object({
  loginId: z.string().min(3).max(32),
  name: z.string().min(1).max(60),
  password: z.string().min(8).max(200).optional(),
  memo: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const loginId = normalizeLoginId(parsed.data.loginId);
    if (!isValidLoginId(loginId)) {
      return NextResponse.json(
        { success: false, message: '아이디는 영문 소문자/숫자로 시작하는 3~32자 (a-z, 0-9, ., _, -)여야 합니다.' },
        { status: 400 }
      );
    }

    const accounts = await readDataForWrite<PartnerAccount>(PARTNER_ACCOUNTS_FILE);
    if (accounts.some((a) => a.loginId === loginId)) {
      return NextResponse.json(
        { success: false, message: '이미 존재하는 아이디입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 미지정 시 안전한 임시 비밀번호 자동 생성 → 응답으로 1회만 노출.
    const plainPassword =
      parsed.data.password ?? crypto.randomBytes(9).toString('base64url');

    const { email: actor } = await resolveActor();
    const now = new Date().toISOString();
    const account: PartnerAccount = {
      id: `pa-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
      loginId,
      name: parsed.data.name.trim(),
      passwordHash: hashPassword(plainPassword),
      active: true,
      ...(parsed.data.memo?.trim() ? { memo: parsed.data.memo.trim() } : {}),
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
    };

    accounts.push(account);
    // 같은 loginId 가 과거에 삭제됐던 계정이면 tombstone 이 남아 있을 수 있다 —
    // 의도적 재생성이므로 revivedIds 로 되살린다.
    await writeDataMerged(PARTNER_ACCOUNTS_FILE, accounts, { revivedIds: [account.id] });

    await logAdmin('settings', 'create', {
      targetId: account.id,
      summary: `파트너 계정 생성: ${loginId} (${account.name})`,
    });

    return NextResponse.json(
      { success: true, account: sanitize(account), password: plainPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Partner Accounts] POST Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['toggle-active', 'reset-password', 'update']),
  name: z.string().min(1).max(60).optional(),
  memo: z.string().max(300).optional(),
  password: z.string().min(8).max(200).optional(),
});

export async function PUT(request: Request) {
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const accounts = await readDataForWrite<PartnerAccount>(PARTNER_ACCOUNTS_FILE);
    const idx = accounts.findIndex((a) => a.id === parsed.data.id);
    if (idx < 0) {
      return NextResponse.json({ success: false, message: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    const account = accounts[idx];
    let newPassword: string | undefined;
    let summary = '';

    if (parsed.data.action === 'toggle-active') {
      account.active = !account.active;
      // 비활성화 즉시 재로그인 차단. (이미 발급된 세션 쿠키는 만료까지 유효하므로
      // 완전 차단이 필요하면 업로드/제출 API 가 계정 active 를 재확인한다.)
      summary = `파트너 계정 ${account.active ? '활성화' : '비활성화'}: ${account.loginId}`;
    } else if (parsed.data.action === 'reset-password') {
      newPassword = parsed.data.password ?? crypto.randomBytes(9).toString('base64url');
      account.passwordHash = hashPassword(newPassword);
      account.failedAttempts = 0;
      delete account.lockedUntil;
      summary = `파트너 계정 비밀번호 재설정: ${account.loginId}`;
    } else {
      if (parsed.data.name) account.name = parsed.data.name.trim();
      if (parsed.data.memo !== undefined) account.memo = parsed.data.memo.trim();
      summary = `파트너 계정 수정: ${account.loginId}`;
    }

    account.updatedAt = new Date().toISOString();
    accounts[idx] = account;
    await writeDataMerged(PARTNER_ACCOUNTS_FILE, accounts);

    await logAdmin('settings', 'update', { targetId: account.id, summary });

    return NextResponse.json({
      success: true,
      account: sanitize(account),
      ...(newPassword ? { password: newPassword } : {}),
    });
  } catch (error) {
    console.error('[Partner Accounts] PUT Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'id는 필수입니다.' }, { status: 400 });
    }

    const accounts = await readDataForWrite<PartnerAccount>(PARTNER_ACCOUNTS_FILE);
    const idx = accounts.findIndex((a) => a.id === body.id);
    if (idx < 0) {
      return NextResponse.json({ success: false, message: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    const removed = accounts.splice(idx, 1)[0];
    await writeDataMerged(PARTNER_ACCOUNTS_FILE, accounts, { removedIds: [body.id] });

    await logAdmin('settings', 'delete', {
      targetId: body.id,
      summary: `파트너 계정 삭제: ${removed.loginId} (${removed.name})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Partner Accounts] DELETE Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}
