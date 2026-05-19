import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

// BLOB_READ_WRITE_TOKEN 을 auth 대신 사용하는 경량 재검증 엔드포인트.
// 스크립트에서 직접 blob 에 쓴 후 Next.js unstable_cache 를 무효화할 때 사용.
export async function POST(request: Request) {
  const token = request.headers.get('x-blob-token');
  if (!token || token !== process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ success: false, message: '인증 실패' }, { status: 401 });
  }
  // body 로 추가 tag 받음. 기본은 pages — 호환성 유지.
  let extraTags: string[] = [];
  try {
    const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
    if (Array.isArray(body.tags)) {
      extraTags = body.tags.filter((t): t is string => typeof t === 'string');
    }
  } catch { /* ignore body parse errors */ }

  const tags = ['db:pages', ...extraTags];
  try {
    for (const t of tags) revalidateTag(t);
    return NextResponse.json({ success: true, revalidated: tags });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
