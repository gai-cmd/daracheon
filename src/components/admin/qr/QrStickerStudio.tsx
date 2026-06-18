'use client';

import { useMemo, useState } from 'react';
import { encodeMatrix } from '@/lib/qr/encoder';
import { svgToDataUrl } from '@/lib/qr/render';
import { renderStickerSvg } from '@/lib/qr/sticker';

/**
 * 인쇄용 정사각 스티커 디자인 (클라이언트).
 * QR(EC H) + 정중앙 라벨 + 하단 안내문구를 한 장에 합성 → PNG(고해상)·SVG 다운로드.
 * 가운데 문구·부수 문구는 입력으로 즉시 편집(실시간 미리보기). 모든 QR·제품에 범용.
 */

const SIZES_MM = [30, 40, 50]; // 스티커 한 변(mm) — 기본 30
const PRINT_DPI = 1200; // PNG 인쇄 해상도

function pxForSize(mm: number): number {
  return Math.min(3000, Math.round((mm / 25.4) * PRINT_DPI));
}

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

async function svgToPngBlob(svg: string, px: number): Promise<Blob> {
  const img = new Image();
  img.decoding = 'sync';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('SVG 래스터 실패'));
    img.src = svgToDataUrl(svg);
  });
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 컨텍스트 없음');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, px, px); // 흰 와꾸 보장
  ctx.drawImage(img, 0, 0, px, px);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 생성 실패'))), 'image/png'),
  );
}

export default function QrStickerStudio({ url, slug }: { url: string; slug: string }) {
  const [centerText, setCenterText] = useState('제품상세');
  const [captionText, setCaptionText] = useState('스캔후 제품상세를 확인하세요');
  const [sizeMm, setSizeMm] = useState(30);
  const [busy, setBusy] = useState<string | null>(null);

  // QR 은 중앙 녹아웃 복원을 위해 항상 EC 레벨 H 로 인코딩.
  const matrix = useMemo(() => {
    try {
      return encodeMatrix(url, 'H');
    } catch {
      return null;
    }
  }, [url]);

  const previewSvg = useMemo(
    () => (matrix ? renderStickerSvg(matrix, { px: 380, sizeMm, centerText, captionText }) : ''),
    [matrix, sizeMm, centerText, captionText],
  );

  if (!matrix) {
    return <p className="text-sm text-terracotta">QR 인코딩에 실패했습니다. 유입 URL을 확인하세요.</p>;
  }

  const fileBase = `스티커_${slug}_${sizeMm}mm`;

  const onPng = async () => {
    setBusy('png');
    try {
      const svg = renderStickerSvg(matrix, { px: pxForSize(sizeMm), sizeMm, centerText, captionText });
      const blob = await svgToPngBlob(svg, pxForSize(sizeMm));
      downloadBlob(blob, `${fileBase}.png`);
    } finally {
      setBusy(null);
    }
  };
  const onSvg = () => {
    const svg = renderStickerSvg(matrix, { px: pxForSize(sizeMm), sizeMm, centerText, captionText });
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${fileBase}.svg`);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      {/* 미리보기 — 실제 흰 스티커가 모달 위에서 보이도록 옅은 체크보드 위에 표시 */}
      <div>
        <div
          className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center rounded-xl border border-gray-300 p-3"
          style={{
            backgroundColor: '#e5e1d8',
            backgroundImage:
              'linear-gradient(45deg,#cec8bb 25%,transparent 25%),linear-gradient(-45deg,#cec8bb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cec8bb 75%),linear-gradient(-45deg,transparent 75%,#cec8bb 75%)',
            backgroundSize: '14px 14px',
            backgroundPosition: '0 0,0 7px,7px -7px,-7px 0',
          }}
        >
          {/* 자체 생성 SVG(사용자 입력은 escapeXml 처리) — XSS 위험 없음.
              주입 SVG 를 컨테이너에 맞게 반응형으로 강제(고정 px 가 박스를 넘쳐 와꾸 밖으로 삐져나오는 것 방지). */}
          <div
            className="w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">실제 인쇄 크기 {sizeMm}mm × {sizeMm}mm</p>
        <p className="mt-1 break-all text-center text-[11px] text-gray-400">{url}</p>
      </div>

      {/* 컨트롤 */}
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">가운데 문구 (QR 정중앙)</span>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/30"
            value={centerText}
            onChange={(e) => setCenterText(e.target.value)}
            placeholder="예: 제품상세"
          />
          <span className="mt-1 block text-[11px] text-gray-500">비우면 라벨 없이 QR 만 — 짧게(권장 6자 이내).</span>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">부수 문구 (하단 안내)</span>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/30"
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            placeholder="예: 스캔후 제품상세를 확인하세요"
          />
          <span className="mt-1 block text-[11px] text-gray-500">비우면 하단 문구 없이 QR 이 더 커집니다.</span>
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">크기</span>
          <div className="flex flex-wrap gap-2">
            {SIZES_MM.map((mm) => (
              <button
                key={mm}
                type="button"
                onClick={() => setSizeMm(mm)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  sizeMm === mm
                    ? 'border-gold-400 bg-gold-50 text-gold-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mm}mm
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-800">다운로드</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="adm-btn-primary" disabled={busy === 'png'} onClick={onPng}>
              {busy === 'png' ? '생성 중…' : 'PNG (인쇄용 고해상)'}
            </button>
            <button type="button" className="adm-btn-secondary" onClick={onSvg}>
              SVG (벡터)
            </button>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-gray-600">
            <li>· <b>흰 와꾸</b> 안에 QR·가운데 문구·안내 문구가 모두 들어간 정사각 스티커입니다.</li>
            <li>· QR 은 가운데 라벨이 가려져도 읽히도록 <b>오류복원 최고(H)</b> 로 인코딩됩니다.</li>
            <li>· <b>PNG</b> {pxForSize(sizeMm)}px(약 {PRINT_DPI}dpi) — 스티커 인쇄소 바로 전달 가능. <b>SVG</b> 는 벡터(일러스트 편집용).</li>
            <li>· 인쇄 후 실제 폰으로 한 번 스캔해 확인하세요(소형 스티커 권장 최소 25mm).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
