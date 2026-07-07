import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { PARTNER_COOKIE, verifyPartnerToken } from '@/lib/partner-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 소용량 파일용 서버 경유 업로드 폴백.
 * - 프로덕션: 클라이언트 직행 업로드(/api/partner/upload)가 기본이고,
 *   그 경로가 실패한 4MB 이하 파일만 여기로 재시도.
 * - 로컬 dev(BLOB 토큰 없음): public/uploads/partner 에 저장 — 전체 플로우 테스트용.
 * Vercel 서버리스 요청 본문 한도(4.5MB) 안쪽으로 제한한다.
 */

const MAX_SIZE = 4 * 1024 * 1024; // 4MB (Vercel 함수 본문 한도 4.5MB 이내)
const MAX_SIZE_DEV = 500 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'video/mp4', 'video/webm', 'video/quicktime',
]);

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const session = await verifyPartnerToken(store.get(PARTNER_COOKIE)?.value);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, message: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    const maxSize = process.env.VERCEL ? MAX_SIZE : MAX_SIZE_DEV;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: `이 경로는 ${Math.round(maxSize / 1024 / 1024)}MB 이하 파일 전용입니다.` },
        { status: 413 }
      );
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        { success: false, message: '지원하지 않는 형식입니다. (jpg, png, webp, heic, mp4, webm, mov)' },
        { status: 415 }
      );
    }

    const ext = EXT_MAP[mimeType] ?? 'bin';
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/partner/${filename}`, file, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: false,
      });
      return NextResponse.json({ success: true, url: blob.url });
    }

    const dir = path.join(process.cwd(), 'public', 'uploads', 'partner');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), buffer);
    return NextResponse.json({ success: true, url: `/uploads/partner/${filename}` });
  } catch (error) {
    console.error('[Partner Upload Direct] Error:', error);
    return NextResponse.json(
      { success: false, message: '업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
