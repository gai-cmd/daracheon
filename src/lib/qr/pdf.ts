import type { QrStyle } from './presets';
import { computeLayout, type RenderOptions } from './render';

/**
 * 모듈 매트릭스 → 인쇄용 벡터 PDF (순수 JS, zero-dep).
 *
 * QR 은 다크 모듈(정사각형)들의 격자라서, 각 다크 모듈을 PDF 콘텐츠 스트림의
 * 채워진 사각형(`re ... f`)으로 그리면 무한 확대해도 깨지지 않는 완벽한
 * 인쇄 품질을 zero-dep 으로 얻는다. 이미지 디코딩/임베드가 필요 없어 가볍고 안전.
 *
 * - 좌표계: PDF 는 좌하단 원점, y 가 위로 증가 → 매트릭스 행을 뒤집어 그린다.
 * - 투명 배경(style.bg=null): 배경 사각형을 그리지 않음 → 종이(흰색)가 비침.
 *   ("투명 PDF" 는 실제로는 배경 미인쇄 = 종이색. 진짜 알파가 필요하면 PNG 사용.)
 * - 테두리: style.border 있으면 프레임 사각형을 stroke 로.
 */

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function f(n: number): string {
  // PDF 수치는 소수점 3자리면 인쇄 정밀도에 충분. 불필요한 0 제거.
  return (Math.round(n * 1000) / 1000).toString();
}

export interface PdfOptions extends RenderOptions {
  /** 인쇄 한 변 크기(mm). 기본 40mm (제품 스티커에 적당). */
  sizeMm?: number;
}

const MM_TO_PT = 72 / 25.4;

/**
 * 다운로드용 PDF 바이트를 만든다. 단일 페이지, 페이지 크기는 QR 한 변과 동일.
 * 반환: Uint8Array (클라이언트에서 Blob 으로 감싸 다운로드).
 */
export function renderPdf(matrix: boolean[][], style: QrStyle, opts: PdfOptions = {}): Uint8Array {
  const layout = computeLayout(matrix, style, opts);
  const { totalModules, offset } = layout;
  const sizeMm = opts.sizeMm ?? 40;
  const pageSizePt = sizeMm * MM_TO_PT;
  const unit = pageSizePt / totalModules; // 1 모듈 = unit pt

  const [fr, fg, fb] = hexToRgb01(style.fg);

  // ── 콘텐츠 스트림 ──
  const lines: string[] = [];

  // 배경 (불투명 색일 때만)
  if (style.bg) {
    const [br, bg, bb] = hexToRgb01(style.bg);
    lines.push(`${f(br)} ${f(bg)} ${f(bb)} rg`);
    lines.push(`0 0 ${f(pageSizePt)} ${f(pageSizePt)} re f`);
  }

  // 다크 모듈 — 채움색 지정 후 사각형 나열 (y 반전)
  lines.push(`${f(fr)} ${f(fg)} ${f(fb)} rg`);
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    for (let c = 0; c < row.length; c++) {
      if (!row[c]) continue;
      const x = (c + offset) * unit;
      // 매트릭스 맨 윗행(r=0)이 페이지 상단 → PDF y 는 위가 큰 값.
      const y = pageSizePt - (r + offset + 1) * unit;
      lines.push(`${f(x)} ${f(y)} ${f(unit)} ${f(unit)} re`);
    }
  }
  lines.push('f');

  // 테두리(프레임)
  if (style.border) {
    const [sr, sg, sb] = hexToRgb01(style.border.color);
    const framePad = opts.framePad ?? 3;
    const inset = Math.max(framePad / 2, style.border.widthModules / 2) * unit;
    const sw = style.border.widthModules * unit;
    lines.push(`${f(sr)} ${f(sg)} ${f(sb)} RG`);
    lines.push(`${f(sw)} w`);
    lines.push(
      `${f(inset)} ${f(inset)} ${f(pageSizePt - inset * 2)} ${f(pageSizePt - inset * 2)} re S`,
    );
  }

  const content = lines.join('\n');
  return assemblePdf(content, pageSizePt);
}

/** 최소 단일 페이지 PDF 어셈블 (objects + xref). content 는 단일 콘텐츠 스트림. */
function assemblePdf(content: string, pageSizePt: number): Uint8Array {
  const enc = new TextEncoder();
  const contentBytes = enc.encode(content);

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(pageSizePt)} ${f(pageSizePt)}] /Contents 4 0 R /Resources << >> >>`,
    `<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(enc.encode(pdf).length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = enc.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return enc.encode(pdf);
}
