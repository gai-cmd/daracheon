'use client';

import { useRef, useState } from 'react';

interface VideoUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoUploadField({ value, onChange, label }: VideoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadInfo(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload-video', { method: 'POST', body: formData });
      const data = (await res.json()) as { success: boolean; url?: string; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message || '업로드에 실패했습니다.');
      if (data.url) {
        onChange(data.url);
        setUploadInfo(`업로드 완료 (${formatBytes(file.size)})`);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>}

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { setUploadError(null); setUploadInfo(null); onChange(e.target.value); }}
          placeholder="/uploads/videos/farm.mp4 또는 https://..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-gold-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gold-700 bg-gold-50 border border-gold-200 rounded-lg hover:bg-gold-100 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              업로드 중
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

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadInfo && !uploadError && (
        <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {uploadInfo}
        </p>
      )}
      {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}

      {value && !uploadError && (
        <video
          src={value}
          controls
          preload="metadata"
          className="mt-2 w-full rounded-lg border border-gray-100"
          style={{ maxHeight: 120, background: '#000' }}
          onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}
