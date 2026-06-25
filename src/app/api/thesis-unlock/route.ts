import { NextRequest, NextResponse } from 'next/server';

// 침향 논문 아카이브(/thesis) 비밀번호 검증 → 쿠키 발급.
// 비밀번호 한 칸만 받음(아이디 없음). 기존 사이트와 독립된 추가 엔드포인트.
const THESIS_COOKIE = 'thesis_auth';
const THESIS_TOKEN = process.env.THESIS_TOKEN || 'zoel-thesis-2026-ok';
const THESIS_PASSWORD = process.env.THESIS_PASSWORD || 'agarwooding';

export async function POST(req: NextRequest) {
  let password = '';
  try {
    const form = await req.formData();
    password = String(form.get('password') || '');
  } catch {
    password = '';
  }

  if (password !== THESIS_PASSWORD) {
    // 틀리면 로그인 화면으로(에러 표시)
    const back = new URL('/thesis', req.url);
    back.searchParams.set('e', '1');
    return NextResponse.redirect(back, 303);
  }

  // 성공: 쿠키 발급 후 /thesis 로
  const res = NextResponse.redirect(new URL('/thesis', req.url), 303);
  res.cookies.set(THESIS_COOKIE, THESIS_TOKEN, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/thesis',
    maxAge: 60 * 60 * 12, // 12시간
  });
  return res;
}
