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
  try {
    revalidateTag('db:pages');
    return NextResponse.json({ success: true, revalidated: ['db:pages'] });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
