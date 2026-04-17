import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  driver: 'local' | 'cloudinary';
}

const EXT_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function safeSubdir(raw: string): string {
  return raw.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'misc';
}

/**
 * 저장 드라이버 자동 감지:
 *   CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET 이 있으면 Cloudinary (unsigned upload)
 *   그렇지 않으면 로컬 파일시스템 (/public/uploads)
 */
export function getStorageDriver(): 'cloudinary' | 'local' {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (cloud && preset) return 'cloudinary';
  return 'local';
}

export async function uploadToLocal(file: File, subdirRaw: string): Promise<UploadResult> {
  const ext = EXT_MAP[file.type] ?? 'bin';
  const id = crypto.randomBytes(10).toString('hex');
  const timestamp = Date.now();
  const filename = `${timestamp}-${id}.${ext}`;
  const subdir = safeSubdir(subdirRaw);
  const dir = path.join(process.cwd(), 'public', 'uploads', subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return {
    url: `/uploads/${subdir}/${filename}`,
    filename,
    size: file.size,
    mimeType: file.type,
    driver: 'local',
  };
}

export async function uploadToCloudinary(file: File, subdirRaw: string): Promise<UploadResult> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    throw new Error('Cloudinary 환경변수가 설정되지 않았습니다.');
  }
  const subdir = safeSubdir(subdirRaw);
  const folder = `daracheon/${subdir}`;

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', preset);
  form.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/auto/upload`;
  const res = await fetch(endpoint, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary 업로드 실패: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { secure_url?: string; public_id?: string; bytes?: number; format?: string };
  if (!data.secure_url) throw new Error('Cloudinary 응답에 URL이 없습니다.');

  return {
    url: data.secure_url,
    filename: data.public_id ?? file.name,
    size: data.bytes ?? file.size,
    mimeType: file.type || (data.format ? `image/${data.format}` : 'application/octet-stream'),
    driver: 'cloudinary',
  };
}

export async function uploadFile(file: File, subdirRaw: string): Promise<UploadResult> {
  const driver = getStorageDriver();
  if (driver === 'cloudinary') return uploadToCloudinary(file, subdirRaw);
  return uploadToLocal(file, subdirRaw);
}
