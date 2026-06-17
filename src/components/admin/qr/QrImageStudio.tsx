'use client';

import { useMemo, useState } from 'react';
import { encodeMatrix } from '@/lib/qr/encoder';
import { renderSvg, svgToDataUrl } from '@/lib/qr/render';
import { renderPdf } from '@/lib/qr/pdf';
import { QR_STYLES, getStyle, type QrStyleId } from '@/lib/qr/presets';

/**
 * QR 원본 미리보기 + 다운로드 (클라이언트).
 * 동일 모듈 매트릭스에서 SVG(미리보기)·PNG(고해상 래스터)·PDF(벡터)를 파생 —
 * 미리보기와 다운로드가 픽셀 단위로 일치. 외부 CDN 없이 브라우저 내에서 전부 생성.
 */

const PNG_SIZE = 2048; // 인쇄용 고해상 PNG 한 변(px)
const PDF_SIZES = [30, 40, 50, 80]; // mm

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function svgToPngBlob(svg: string, sizePx: number): Promise<Blob> {
  const img = new Image();
  img.decoding = 'sync';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('SVG 래스터 실패'));
    img.src = svgToDataUrl(svg);
  });
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 컨텍스트 없음');
  ctx.imageSmoothingEnabled = false; // 모듈 경계 또렷하게
  ctx.clearRect(0, 0, sizePx, sizePx); // 투명 배경 유지
  ctx.drawImage(img, 0, 0, sizePx, sizePx);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 생성 실패'))), 'image/png'),
  );
}

export default function QrImageStudio({
  url,
  slug,
  defaultStyle = 'white-black',
}: {
  url: string;
  slug: string;
  defaultStyle?: QrStyleId;
}) {
  const [styleId, setStyleId] = useState<QrStyleId>(defaultStyle);
  const [pdfMm, setPdfMm] = useState(40);
  const [busy, setBusy] = useState<string | null>(null);

  // url 이 바뀔 때만 인코딩 (matrix 는 모든 프리셋 공유)
  const matrix = useMemo(() => {
    try {
      return encodeMatrix(url, 'M');
    } catch {
      return null;
    }
  }, [url]);

  const style = getStyle(styleId);
  const previewSvg = useMemo(
    () => (matrix ? renderSvg(matrix, style, { modulePx: 12 }) : ''),
    [matrix, style],
  );

  if (!matrix) {
    return <p className="text-sm text-terracotta">QR 인코딩에 실패했습니다. 유입 URL을 확인하세요.</p>;
  }

  const fileBase = `QR_${slug}_${styleId}`;

  const onPng = async () => {
    setBusy('png');
    try {
      const svg = renderSvg(matrix, style, { modulePx: 16 });
      const blob = await svgToPngBlob(svg, PNG_SIZE);
      downloadBlob(blob, `${fileBase}.png`);
    } finally {
      setBusy(null);
    }
  };
  const onSvg = () => {
    const svg = renderSvg(matrix, style, { modulePx: 16 });
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${fileBase}.svg`);
  };
  const onPdf = () => {
    const bytes = renderPdf(matrix, style, { sizeMm: pdfMm });
    // Uint8Array → Blob (ArrayBuffer 슬라이스로 정확히 전달)
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    downloadBlob(new Blob([ab], { type: 'application/pdf' }), `${fileBase}_${pdfMm}mm.pdf`);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      {/* 미리보기 */}
      <div>
        <div
          className="flex aspect-square items-center justify-center rounded-xl border border-warm-300 p-4"
          style={
            style.transparent
              ? {
                  // 투명 배경이 보이도록 체커보드
                  backgroundColor: '#e5e1d8',
                  backgroundImage:
                    'linear-gradient(45deg,#cec8bb 25%,transparent 25%),linear-gradient(-45deg,#cec8bb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cec8bb 75%),linear-gradient(-45deg,transparent 75%,#cec8bb 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
                }
              : { backgroundColor: '#ffffff' }
          }
          // 자체 생성 SVG (외부 리소스 없음) — XSS 위험 없음
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
        <p className="mt-2 text-xs text-warm-600">{style.hint}</p>
        <p className="mt-1 break-all text-[11px] text-warm-500">{url}</p>
      </div>

      {/* 컨트롤 */}
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-warm-800">디자인 (3종)</p>
          <div className="flex flex-wrap gap-2">
            {QR_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyleId(s.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  styleId === s.id
                    ? 'border-gold-400 bg-gold-50 text-gold-700'
                    : 'border-warm-300 bg-white text-warm-700 hover:bg-warm-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-warm-800">다운로드</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="adm-btn-primary" disabled={busy === 'png'} onClick={onPng}>
              {busy === 'png' ? '생성 중…' : 'PNG 원본 (고해상)'}
            </button>
            <button type="button" className="adm-btn-secondary" onClick={onSvg}>
              SVG (벡터)
            </button>
            <button type="button" className="adm-btn-secondary" onClick={onPdf}>
              PDF (인쇄용)
            </button>
            <select
              value={pdfMm}
              onChange={(e) => setPdfMm(Number(e.target.value))}
              className="rounded-lg border border-warm-300 bg-white px-2 py-2 text-xs text-warm-700"
              aria-label="PDF 크기(mm)"
            >
              {PDF_SIZES.map((mm) => (
                <option key={mm} value={mm}>
                  {mm}mm
                </option>
              ))}
            </select>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-warm-600">
            <li>· <b>PNG</b> — 스티커 인쇄용 {PNG_SIZE}px 고해상. 투명 배경은 투명 그대로 유지됩니다.</li>
            <li>· <b>SVG</b> — 무한 확대해도 깨지지 않는 벡터. 디자인 툴(일러스트 등) 편집용.</li>
            <li>· <b>PDF</b> — 인쇄소 전달용 벡터 PDF. 크기(mm) 지정 가능.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
