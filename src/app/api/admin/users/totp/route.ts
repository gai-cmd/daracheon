import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { readData, writeData } from '@/lib/db';
import { logAdmin } from '@/lib/audit';
import { generateSecretBase32, buildOtpauthUrl, verifyTOTP } from '@/lib/totp';
import type { AdminUser } from '@/lib/admin-users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const s = await verifySessionToken(token);
  return s?.email ?? null;
}

/** GET — 현재 사용자의 2FA 상태 조회 */
export async function GET() {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ success: false, message: '세션 없음' }, { status: 401 });
  const users = await readData('admin-users');
  const user = users.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'DB 계정만 2FA를 설정할 수 있습니다. (/admin/users 에서 계정 등록 후 사용)' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, enabled: !!user.totpEnabled, email });
}

/** POST — 새 시크릿 발급 + otpauth URL 반환 (아직 enable 전) */
export async function POST() {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ success: false, message: '세션 없음' }, { status: 401 });
  const users = await readData('admin-users');
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) {
    return NextResponse.json(
      { success: false, message: 'DB 계정이 아닙니다. env 계정은 2FA를 설정할 수 없습니다.' },
      { status: 404 }
    );
  }
  const secret = generateSecretBase32();
  users[idx] = { ...users[idx], totpSecret: secret, totpEnabled: false };
  await writeData('admin-users', users);

  const otpauthUrl = buildOtpauthUrl(email, secret, { issuer: '대라천 Admin' });
  return NextResponse.json({ success: true, secret, otpauthUrl });
}

/** PUT — 사용자 입력 코드로 검증 후 enable */
export async function PUT(request: Request) {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ success: false, message: '세션 없음' }, { status: 401 });
  const body = await request.json();
  const code = typeof body.code === 'string' ? body.code.replace(/\s+/g, '') : '';
  if (!code) {
    return NextResponse.json({ success: false, message: '인증 코드를 입력해주세요.' }, { status: 400 });
  }

  const users = await readData('admin-users');
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1 || !users[idx].totpSecret) {
    return NextResponse.json(
      { success: false, message: '먼저 2FA 등록을 시작해주세요.' },
      { status: 400 }
    );
  }
  const ok = verifyTOTP(users[idx].totpSecret!, code);
  if (!ok) {
    return NextResponse.json({ success: false, message: '코드가 올바르지 않습니다.' }, { status: 400 });
  }
  users[idx] = { ...users[idx], totpEnabled: true };
  await writeData('admin-users', users);

  await logAdmin('auth', 'update', {
    targetId: email,
    summary: '2FA 활성화',
  });

  return NextResponse.json({ success: true, message: '2FA가 활성화되었습니다.' });
}

/** DELETE — 2FA 비활성화 (관리자 또는 본인) */
export async function DELETE(request: Request) {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ success: false, message: '세션 없음' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const targetEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : email;

  const users = await readData('admin-users');
  const idx = users.findIndex((u) => u.email === targetEmail);
  if (idx === -1) {
    return NextResponse.json({ success: false, message: '계정을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 타인 2FA 해제는 super_admin만
  if (targetEmail !== email) {
    const me = users.find((u) => u.email === email);
    if (!me || me.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: '타인의 2FA 해제는 super_admin만 가능합니다.' },
        { status: 403 }
      );
    }
  }

  const { totpSecret: _s, totpEnabled: _e, ...rest } = users[idx];
  void _s;
  void _e;
  users[idx] = rest as AdminUser;
  await writeData('admin-users', users);

  await logAdmin('auth', 'delete', {
    targetId: targetEmail,
    summary: '2FA 비활성화',
  });

  return NextResponse.json({ success: true, message: '2FA가 비활성화되었습니다.' });
}
