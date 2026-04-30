import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SIZE = 200 * 1024 * 1024; // 200MB

const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
]);

const EXT_MAP: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/ogg': 'ogv',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ success: false, message: '빈 파일입니다.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: `파일 크기는 ${MAX_SIZE / 1024 / 1024}MB 이하여야 합니다.` },
        { status: 413 },
      );
    }

    const mimeType = file.type || 'video/mp4';
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        { success: false, message: `지원하지 않는 형식입니다. (mp4, webm, mov만 가능)` },
        { status: 415 },
      );
    }

    const ext = EXT_MAP[mimeType] ?? 'mp4';
    const id = crypto.randomBytes(10).toString('hex');
    const filename = `${Date.now()}-${id}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/videos/${filename}`, file, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: false,
      });
      return NextResponse.json({ success: true, url: blob.url });
    }

    // 로컬 파일 시스템
    const dir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), buffer);
    return NextResponse.json({ success: true, url: `/uploads/videos/${filename}` });
  } catch (error) {
    console.error('[Video Upload] Error:', error);
    const message = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
