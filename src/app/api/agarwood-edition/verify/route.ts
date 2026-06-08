import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/leads';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/agarwood-edition?error=missing_token`, 302);
  }

  try {
    const result = await verifyToken(token);
    if ('error' in result) {
      const err = result.error;
      return NextResponse.redirect(`${baseUrl}/agarwood-edition?error=${err}`, 302);
    }
    return NextResponse.redirect(
      `${baseUrl}/edition/${encodeURIComponent(result.token)}/agarwood`,
      302
    );
  } catch (err) {
    // verifyToken 의 readDataForWrite 가 blob 일시 장애 시 throw 할 수 있다 —
    // 인증 링크가 500 으로 깨지지 않게 일반 오류로 안내(사용자 재시도 유도).
    console.error('[agarwood-edition:verify] error:', err);
    return NextResponse.redirect(`${baseUrl}/agarwood-edition?error=server`, 302);
  }
}
