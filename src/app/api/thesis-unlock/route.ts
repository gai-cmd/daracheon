import { NextRequest, NextResponse } from 'next/server';

// 침향 논문 아카이브(/thesis) 비밀번호 검증 → 쿠키 발급.
// 비밀번호 한 칸만 받음(아이디 없음). 기존 사이트와 독립된 추가 엔드포인트.
const THESIS_COOKIE = 'thesis_auth';

export async function POST(req: NextRequest) {
  // 하드코딩 기본값 없음 — env 미설정 시 잠금 해제 자체를 비활성화(fail-closed).
  const THESIS_TOKEN = process.env.THESIS_TOKEN;
  const THESIS_PASSWORD = process.env.THESIS_PASSWORD;

  let password = '';
  try {
    const form = await req.formData();
    password = String(form.get('password') || '');
  } catch {
    password = '';
  }

  if (!THESIS_TOKEN || !THESIS_PASSWORD || password !== THESIS_PASSWORD) {
    // env 미설정이거나 비밀번호가 틀리면 로그인 화면으로(에러 표시)
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
