'use client';

import { useRef, useState, useCallback } from 'react';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  subdir: string;
  label?: string;
  className?: string;
  /** AI 이미지 생성 버튼 비활성화 (기본: 활성) */
  disableAi?: boolean;
  /** AI 생성 시 사용할 비율 기본값 (1:1, 4:3, 3:4, 16:9, 9:16) */
  aiAspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  /** AI 프롬프트에 자동 첨부할 시드 텍스트(예: 챕터 제목) */
  aiPromptSeed?: string;
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
  disableAi,
  aiAspectRatio = '4:3',
  aiPromptSeed = '',
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [mirrorStatus, setMirrorStatus] = useState<'idle' | 'mirroring' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI 이미지 생성 상태
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(aiPromptSeed);
  const [aiAspect, setAiAspect] = useState<typeof aiAspectRatio>(aiAspectRatio);
  const [aiBusy, setAiBusy] = useState(false);
  // 생성 결과는 "적용" 버튼을 누르기 전까지 onChange 를 부르지 않고 미리보기에만 표시.
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);
  // 같은 패널 안에서 여러 번 재생성한 결과를 이력으로 보관(최대 5장) — 클릭 시 그 시안을 다시 미리보기로 선택.
  const [aiHistory, setAiHistory] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleAiGenerate() {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      setAiError('프롬프트를 입력하세요.');
      return;
    }
    setAiBusy(true);
    setAiError(null);
    setUploadError(null);
    setCompressionInfo(null);
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, subdir, aspectRatio: aiAspect }),
      });
      const data = (await res.json()) as { success: boolean; url?: string; message?: string };
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.message || 'AI 이미지 생성 실패');
      }
      // onChange 는 부르지 않는다 — "적용" 시점까지 외부 값은 그대로 유지.
      const newUrl: string = data.url;
      setAiPreviewUrl(newUrl);
      setAiHistory((prev) => [newUrl, ...prev.filter((u) => u !== newUrl)].slice(0, 5));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 이미지 생성 실패');
    } finally {
      setAiBusy(false);
    }
  }

  function handleAiApply() {
    if (!aiPreviewUrl) return;
    onChange(aiPreviewUrl);
    setAiOpen(false);
    setAiPreviewUrl(null);
    setAiHistory([]);
    setAiError(null);
  }

  function handleAiCancel() {
    setAiOpen(false);
    setAiPreviewUrl(null);
    setAiHistory([]);
    setAiError(null);
  }

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
        {!disableAi && (
          <button
            type="button"
            onClick={() => {
              setAiOpen((v) => !v);
              setUploadError(null);
              if (!aiOpen && !aiPrompt && aiPromptSeed) setAiPrompt(aiPromptSeed);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            title="Imagen API 로 이미지 생성"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI 생성
          </button>
        )}
      </div>

      {/* AI 이미지 생성 패널 */}
      {!disableAi && aiOpen && (
        <div className="mt-2 p-3 border border-purple-200 bg-purple-50/40 rounded-lg space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-purple-700">Imagen — AI 이미지 생성</span>
            <select
              value={aiAspect}
              onChange={(e) => setAiAspect(e.target.value as typeof aiAspect)}
              className="text-xs px-2 py-1 border border-purple-200 rounded bg-white"
              disabled={aiBusy}
            >
              <option value="1:1">1:1</option>
              <option value="4:3">4:3 (가로)</option>
              <option value="3:4">3:4 (세로)</option>
              <option value="16:9">16:9 (와이드)</option>
              <option value="9:16">9:16 (모바일)</option>
            </select>
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
            placeholder="원하는 이미지를 영어 또는 한국어로 묘사하세요. 예: traditional Korean herbal medicine document, ancient parchment, calligraphy of agarwood characters, no people, warm sepia tones"
            className="w-full text-sm px-3 py-2 border border-purple-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
            disabled={aiBusy}
          />

          {/* 생성 결과 미리보기 */}
          {aiPreviewUrl && (
            <div className="rounded border border-purple-300 bg-white p-2">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[11px] font-semibold text-purple-700">미리보기</span>
                <span className="text-[11px] text-gray-500">
                  마음에 들면 <b className="text-purple-700">적용</b> · 아니면 프롬프트 수정 후 <b className="text-purple-700">재생성</b>
                </span>
              </div>
              <div className="relative w-full bg-gray-50 rounded overflow-hidden" style={{ maxHeight: 360 }}>
                {/* 새 이미지 로드 중 깜빡임 줄이기 위해 next/image 대신 native img */}
                <img
                  src={aiPreviewUrl}
                  alt="AI 생성 미리보기"
                  className="w-full h-auto object-contain max-h-[360px] block"
                />
              </div>

              {/* 생성 이력 — 직전 시안 비교/되돌리기 */}
              {aiHistory.length > 1 && (
                <div className="mt-2">
                  <p className="text-[11px] text-gray-500 mb-1 px-1">이전 시안 — 클릭해서 다시 미리보기</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 px-1">
                    {aiHistory.map((u, idx) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setAiPreviewUrl(u)}
                        className={`shrink-0 relative w-14 h-14 rounded overflow-hidden border-2 transition ${
                          u === aiPreviewUrl ? 'border-purple-500 ring-1 ring-purple-300' : 'border-gray-200 hover:border-purple-300'
                        }`}
                        title={`시안 ${aiHistory.length - idx}`}
                      >
                        <img src={u} alt={`시안 ${aiHistory.length - idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {aiError && <p className="text-xs text-red-500">{aiError}</p>}

          <div className="flex justify-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAiCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50"
              disabled={aiBusy}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiBusy || !aiPrompt.trim()}
              className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-300 rounded hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {aiBusy ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  {aiPreviewUrl ? '재생성 중...' : '생성 중...'}
                </>
              ) : aiPreviewUrl ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  재생성
                </>
              ) : (
                '생성'
              )}
            </button>
            {aiPreviewUrl && (
              <button
                type="button"
                onClick={handleAiApply}
                disabled={aiBusy}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                이 이미지로 적용
              </button>
            )}
          </div>
        </div>
      )}

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
