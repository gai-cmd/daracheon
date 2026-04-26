import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
]);

function isMirrored(url: string): boolean {
  return (
    url.includes('blob.vercel-storage.com') ||
    url.startsWith('/uploads/') ||
    url.startsWith('/images/')
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string; subdir?: string };
    const { url, subdir = 'mirror' } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, message: 'URL이 필요합니다.' }, { status: 400 });
    }

    // 이미 자체 서버 URL이면 미러링 불필요
    if (isMirrored(url)) {
      return NextResponse.json({ success: true, url, alreadyMirrored: true });
    }

    // URL 유효성 검사
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ success: false, message: '유효하지 않은 URL입니다.' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ success: false, message: 'HTTP/HTTPS URL만 허용됩니다.' }, { status: 400 });
    }

    // 이미지 fetch (15초 타임아웃)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    let imgRes: Response;
    try {
      imgRes = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZoelLifeBot/1.0)' },
      });
    } catch {
      return NextResponse.json(
        { success: false, message: '원본 이미지를 가져올 수 없습니다. (네트워크 오류)' },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!imgRes.ok) {
      return NextResponse.json(
        { success: false, message: `원본 서버 오류: ${imgRes.status}` },
        { status: 502 }
      );
    }

    // MIME 타입 확인
    const ct = imgRes.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
    const mimeType = ALLOWED_MIME.has(ct) ? ct : 'image/jpeg';

    // 크기 확인
    const buffer = await imgRes.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: '파일 크기가 8MB를 초과합니다.' },
        { status: 413 }
      );
    }

    // 파일명 추출
    const rawName = parsedUrl.pathname.split('/').pop()?.split('?')[0] || 'image';
    const filename = rawName.length > 60 ? rawName.slice(-60) : rawName;

    const file = new File([buffer], filename, { type: mimeType });
    const result = await uploadFile(file, subdir);

    await logAdmin('upload', 'create', {
      summary: `URL 미러링: ${url.slice(0, 80)}`,
      meta: { sourceUrl: url, destUrl: result.url, size: result.size, driver: result.driver },
    }).catch(() => {});

    return NextResponse.json({ success: true, url: result.url, originalUrl: url });
  } catch (error) {
    const message = error instanceof Error ? error.message : '미러링 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
