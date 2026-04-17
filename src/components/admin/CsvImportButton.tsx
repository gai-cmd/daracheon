'use client';

import { useState } from 'react';

interface Props {
  endpoint: string;
  sampleFilename: string;
  sampleCSV: string;
  onImported?: () => void | Promise<void>;
  label?: string;
}

export default function CsvImportButton({
  endpoint,
  sampleFilename,
  sampleCSV,
  onImported,
  label = 'CSV 가져오기',
}: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setFile(null);
    setResult(null);
    setError(null);
  }

  function downloadSample() {
    const blob = new Blob(['\uFEFF' + sampleCSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sampleFilename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(endpoint, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? '가져오기 실패');
        return;
      }
      setResult({
        created: data.created,
        updated: data.updated,
        skipped: data.skipped,
        errors: data.errors ?? [],
      });
      if (onImported) await onImported();
    } catch (err) {
      console.error('[CsvImport] error:', err);
      setError('네트워크 오류');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v12m0 0l-4-4m4 4l4-4M14 4h6a2 2 0 012 2v14a2 2 0 01-2 2H14" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">CSV 일괄 가져오기</h2>
              <button type="button" onClick={close} className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-lg border border-gold-200 bg-gold-50/50 p-4 text-xs text-neutral-700">
                <p className="mb-2 font-semibold text-neutral-900">CSV 형식</p>
                <p className="mb-2 leading-6">
                  첫 행은 헤더. <code className="rounded bg-white px-1">id</code>가 있으면 업데이트, 없으면 신규.
                </p>
                <button type="button" onClick={downloadSample} className="font-medium text-gold-700 hover:underline">
                  샘플 CSV 다운로드
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">파일 선택</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(null); }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-gold-500 file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-widest file:text-white hover:file:bg-gold-600"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
              )}

              {result && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <p className="font-medium text-gray-900">결과</p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-700">
                    <li>신규: <span className="font-semibold text-emerald-700">{result.created}</span>건</li>
                    <li>수정: <span className="font-semibold text-blue-700">{result.updated}</span>건</li>
                    <li>건너뜀: <span className="font-semibold text-amber-700">{result.skipped}</span>건</li>
                  </ul>
                  {result.errors.length > 0 && (
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <p className="mb-1.5 text-xs font-semibold text-red-600">오류 {result.errors.length}건</p>
                      <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-red-700">
                        {result.errors.slice(0, 20).map((e, i) => (
                          <li key={i}>· {e.row}행: {e.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={close} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {result ? '닫기' : '취소'}
              </button>
              {!result && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? '가져오는 중...' : '가져오기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
