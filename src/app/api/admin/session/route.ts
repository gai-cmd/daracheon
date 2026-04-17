import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, message: '세션이 없습니다.' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      email: session.email,
      role: session.role,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('[Admin Session] GET error:', error);
    return NextResponse.json({ success: false, message: '세션 확인 실패' }, { status: 500 });
  }
}
