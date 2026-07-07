import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { PARTNER_COOKIE, verifyPartnerToken } from '@/lib/partner-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 브라우저 → Vercel Blob 직행(클라이언트) 업로드용 토큰 발급.
 * 서버리스 함수의 4.5MB 요청 한도를 우회하므로 현장 영상(수백 MB)도
 * 업로드 가능. 실제 파일 바이트는 이 함수를 거치지 않는다.
 */

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const MAX_SIZE = 1024 * 1024 * 1024; // 1GB — 현장 영상 여유분

export async function POST(request: Request): Promise<NextResponse> {
  // middleware 가 1차 차단하지만 route 자체에서도 재검증 (심층 방어).
  const store = await cookies();
  const session = await verifyPartnerToken(store.get(PARTNER_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('uploads/partner/')) {
          throw new Error('허용되지 않은 업로드 경로입니다.');
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ partner: session.name }),
        };
      },
      // 제출 레코드는 클라이언트가 업로드 완료 후 /api/partner/submissions 로
      // 생성한다 (GPS·시간 메타데이터를 함께 보내야 하므로). 여기서는 no-op.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('[Partner Upload] token error:', error);
    const message = error instanceof Error ? error.message : '업로드 토큰 발급에 실패했습니다.';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
