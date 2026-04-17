import { NextResponse } from 'next/server';
import { uploadFile, getStorageDriver } from '@/lib/storage';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const subdirRaw = (formData.get('subdir') as string) || 'misc';

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ success: false, message: '빈 파일입니다.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다.` },
        { status: 413 }
      );
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { success: false, message: `지원하지 않는 파일 형식입니다. (${file.type})` },
        { status: 415 }
      );
    }

    const result = await uploadFile(file, subdirRaw);

    await logAdmin('upload', 'create', {
      summary: `이미지 업로드 (${result.driver}): ${result.filename}`,
      meta: { size: result.size, mimeType: result.mimeType, subdir: subdirRaw },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
      driver: result.driver,
    });
  } catch (error) {
    console.error('[Admin Upload] Error:', error);
    const message = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, message, driver: getStorageDriver() },
      { status: 500 }
    );
  }
}
