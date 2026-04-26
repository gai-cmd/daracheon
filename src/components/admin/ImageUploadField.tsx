'use client';

import { useRef, useState, useCallback } from 'react';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  subdir: string;
  label?: string;
  className?: string;
}

// ── Canvas 리사이즈 유틸 ─────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function canvasToWebP(
  img: ImageBitmap,
  w: number,
  h: number,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context를 가져올 수 없습니다.');
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob 실패'));
      },
      'image/webp',
      quality
    );
  });
}

async function resizeImage(
  file: File,
  maxWidth = 1600,
  quality = 0.85
): Promise<{ file: File; originalSize: number; compressedSize: number; resized: boolean }> {
  const originalSize = file.size;

  // GIF / SVG — 원본 그대로
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return { file, originalSize, compressedSize: originalSize, resized: false };
  }

  let img: ImageBitmap;
  try {
    img = await createImageBitmap(file);
  } catch {
    // createImageBitmap 실패 시 원본 반환
    return { file, originalSize, compressedSize: originalSize, resized: false };
  }

  const needsResize = img.width > maxWidth;
  const targetW = needsResize ? maxWidth : img.width;
  const targetH = needsResize ? Math.round(img.height * (maxWidth / img.width)) : img.height;

  let blob: Blob;
  try {
    blob = await canvasToWebP(img, targetW, targetH, quality);
  } finally {
    img.close();
  }

  // 원본 파일명에서 확장자를 .webp로 교체
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const webpFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });

  return {
    file: webpFile,
    originalSize,
    compressedSize: blob.size,
    resized: needsResize,
  };
}

// ── 미러링 대상 판별 ──────────────────────────────────────────────────────────

function needsMirror(url: string): boolean {
  if (!url.startsWith('http')) return false;
  return (
    !url.includes('blob.vercel-storage.com') &&
    !url.startsWith('/uploads/') &&
    !url.startsWith('/images/')
  );
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function ImageUploadField({
  value,
  onChange,
  subdir,
  label,
  className,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [mirrorStatus, setMirrorStatus] = useState<'idle' | 'mirroring' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMirrorUrl = useCallback(async (url: string) => {
    if (!needsMirror(url)) return;
    setMirrorStatus('mirroring');
    setUploadError(null);
    try {
      const res = await fetch('/api/admin/mirror-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, subdir }),
      });
      const data = await res.json() as { success: boolean; url?: string; message?: string; alreadyMirrored?: boolean };
      if (!res.ok || !data.success) throw new Error(data.message || '미러링 실패');
      if (data.url) onChange(data.url);
      setMirrorStatus('done');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '서버 저장 실패');
      setMirrorStatus('error');
    }
  }, [subdir, onChange]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;

    setUploading(true);
    setUploadError(null);
    setCompressionInfo(null);

    let fileToUpload = raw;

    try {
      // 리사이즈 / WebP 변환 시도
      const result = await resizeImage(raw);
      fileToUpload = result.file;

      if (result.originalSize !== result.compressedSize) {
        const ratio = Math.round((1 - result.compressedSize / result.originalSize) * 100);
        setCompressionInfo(
          `${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${ratio}% 압축됨)`
        );
      } else {
        setCompressionInfo(null);
      }
    } catch {
      // 리사이즈 실패 → 원본 파일 그대로 업로드 (fallback)
      fileToUpload = raw;
      setCompressionInfo(null);
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('subdir', subdir);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as { success: boolean; url?: string; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || '업로드에 실패했습니다.');
      }
      if (data.url) {
        onChange(data.url);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.';
      setUploadError(msg);
      setCompressionInfo(null);
    } finally {
      setUploading(false);
      // 동일 파일 재선택 가능하도록 초기화
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      {/* URL 텍스트 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setUploadError(null);
            setCompressionInfo(null);
            setMirrorStatus('idle');
            onChange(e.target.value);
          }}
          onBlur={(e) => {
            const url = e.target.value.trim();
            if (url) handleMirrorUrl(url);
          }}
          placeholder="https:// 또는 /uploads/..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gold-700 bg-gold-50 border border-gold-200 rounded-lg hover:bg-gold-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              처리 중
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              파일 선택
            </>
          )}
        </button>
      </div>

      {/* 숨김 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 미러링 상태 */}
      {mirrorStatus === 'mirroring' && (
        <p className="mt-1 text-xs text-blue-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          이미지를 서버에 저장 중...
        </p>
      )}
      {mirrorStatus === 'done' && !uploadError && (
        <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          서버(Blob)에 저장됨 — 원본 URL이 삭제되어도 안전합니다
        </p>
      )}

      {/* 압축 정보 */}
      {compressionInfo && !uploadError && (
        <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {compressionInfo}
        </p>
      )}

      {/* 에러 메시지 */}
      {uploadError && (
        <p className="mt-1 text-xs text-red-500">{uploadError}</p>
      )}

      {/* 미리보기 */}
      {value && !uploadError && (
        <img
          src={value}
          alt="미리보기"
          className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-100"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
    </div>
  );
}
