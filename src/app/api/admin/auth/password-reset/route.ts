import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { readData, writeData } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import { logAdmin } from '@/lib/audit';
import { hashPassword, type AdminUser } from '@/lib/admin-users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResetToken {
  token: string;
  email: string;
  expiresAt: string;
  used?: boolean;
}

// 15분으로 축소. 이메일 경유 토큰은 로그/프록시/전달 경로에서 노출될 수
// 있으므로 공격자가 재사용할 시간을 최소화.
const TOKEN_TTL_MINUTES = 15;

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** POST — 이메일로 재설정 링크 발송 요청 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!emailRaw) {
      return NextResponse.json({ success: false, message: '이메일이 필요합니다.' }, { status: 400 });
    }

    // 계정 존재 여부와 무관하게 성공 응답 (정보 유출 방지)
    const users = await readData('admin-users');
    const user = users.find((u) => u.email === emailRaw);

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokens = await readData('password-reset-tokens');
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString();
      tokens.push({
        token: hashToken(rawToken),
        email: emailRaw,
        expiresAt,
      });
      // 만료/사용된 토큰 정리
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const cleaned = tokens.filter((t) => !t.used && new Date(t.expiresAt).getTime() > cutoff);
      await writeData('password-reset-tokens', cleaned);

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
      const resetUrl = `${siteUrl}/admin/password-reset?token=${rawToken}&email=${encodeURIComponent(emailRaw)}`;

      sendEmail({
        to: emailRaw,
        subject: '[대라천] 관리자 비밀번호 재설정',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <h2 style="color:#c9a55c;margin-bottom:8px;">비밀번호 재설정 요청</h2>
            <p style="color:#444;line-height:1.7;">
              <strong>${emailRaw}</strong> 계정에 대한 비밀번호 재설정이 요청되었습니다.<br />
              아래 버튼을 눌러 새 비밀번호를 설정해주세요. 링크는 <strong>${TOKEN_TTL_MINUTES}분</strong> 동안 유효합니다.
            </p>
            <p style="margin:24px 0;">
              <a href="${resetUrl}"
                 style="display:inline-block;padding:12px 24px;background:#c9a55c;color:#1a1a17;text-decoration:none;font-weight:600;">
                비밀번호 재설정
              </a>
            </p>
            <p style="color:#888;font-size:12px;">
              요청하지 않으셨다면 이 이메일을 무시해주세요. 계정은 안전합니다.
            </p>
          </div>
        `,
        text: `비밀번호 재설정 링크: ${resetUrl}\n(${TOKEN_TTL_MINUTES}분 유효)`,
      }).catch((err) => console.error('[password-reset] mail failed:', err));

      await logAdmin('auth', 'update', {
        targetId: emailRaw,
        summary: `비밀번호 재설정 요청`,
      });
    } else {
      console.log('[password-reset] unknown email attempt:', emailRaw);
    }

    return NextResponse.json({
      success: true,
      message: '해당 이메일로 재설정 안내 메일을 보냈습니다. (계정이 등록되어 있는 경우)',
    });
  } catch (error) {
    console.error('[password-reset] POST error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}

/** PUT — 토큰 검증 + 새 비밀번호 저장 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const token = typeof body.token === 'string' ? body.token : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!email || !token || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: '이메일, 토큰, 8자 이상의 새 비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const hashed = hashToken(token);
    const tokens = await readData('password-reset-tokens');
    const matchIdx = tokens.findIndex(
      (t) => t.token === hashed && t.email === email && !t.used && new Date(t.expiresAt).getTime() > Date.now()
    );
    if (matchIdx === -1) {
      return NextResponse.json(
        { success: false, message: '링크가 유효하지 않거나 만료되었습니다.' },
        { status: 400 }
      );
    }

    const users = await readData('admin-users');
    const uIdx = users.findIndex((u) => u.email === email);
    if (uIdx === -1) {
      return NextResponse.json({ success: false, message: '계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    users[uIdx] = {
      ...users[uIdx],
      passwordHash: hashPassword(newPassword),
      updatedAt: new Date().toISOString(),
      failedAttempts: 0,
    };
    if (users[uIdx].lockedUntil) {
      delete users[uIdx].lockedUntil;
    }
    await writeData('admin-users', users);

    // 사용된 토큰은 used 플래그 대신 즉시 삭제. 공격자가 토큰 DB 를
    // 훔쳐도 재활용 불가.
    tokens.splice(matchIdx, 1);
    await writeData('password-reset-tokens', tokens);

    await logAdmin('auth', 'update', {
      targetId: email,
      summary: '비밀번호 재설정 완료 (자가 서비스)',
    });

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('[password-reset] PUT error:', error);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}
