import type { QrStyle } from './presets';

/**
 * 모듈 매트릭스 → SVG 문자열 (순수·isomorphic).
 * 동일 함수가 서버 미리보기·클라이언트 PNG 래스터(SVG→canvas)에 모두 쓰여
 * 미리보기와 다운로드가 픽셀 단위로 일치한다.
 */

export interface RenderOptions {
  /** 데이터 둘레 quiet zone (모듈 단위). 스캔 신뢰성을 위해 ≥4 권장(기본 4). */
  quietZone?: number;
  /** 1 모듈을 몇 px 로 그릴지 (SVG width/height 산출용). 기본 16 → 충분히 큰 미리보기. */
  modulePx?: number;
  /** 테두리(프레임)와 데이터 사이 추가 여백 (모듈 단위). 테두리가 quiet zone 을 침범하지 않게. */
  framePad?: number;
}

export interface QrLayout {
  /** 한 변의 총 모듈 수 (데이터 + quiet zone + 테두리 여백) */
  totalModules: number;
  /** 데이터 매트릭스가 시작되는 오프셋 (모듈 단위) */
  offset: number;
  /** 데이터 매트릭스 한 변 모듈 수 */
  dataModules: number;
}

const DEFAULT_QUIET = 4;
const DEFAULT_FRAME_PAD = 3;

export function computeLayout(matrix: boolean[][], style: QrStyle, opts: RenderOptions = {}): QrLayout {
  const quiet = opts.quietZone ?? DEFAULT_QUIET;
  const framePad = style.border ? (opts.framePad ?? DEFAULT_FRAME_PAD) : 0;
  const dataModules = matrix.length;
  const offset = quiet + framePad;
  const totalModules = dataModules + offset * 2;
  return { totalModules, offset, dataModules };
}

/** 다크 모듈들을 하나의 SVG path d 문자열로 합친다 (모듈 단위 좌표, offset 적용). */
export function modulesToPath(matrix: boolean[][], offset: number): string {
  const parts: string[] = [];
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c]) parts.push(`M${c + offset} ${r + offset}h1v1h-1z`);
    }
  }
  return parts.join('');
}

/**
 * SVG 문자열 생성.
 * - bg=null 이면 배경 rect 를 그리지 않아 투명.
 * - style.border 가 있으면 프레임 사각형을 framePad 안쪽에 stroke 로 그린다.
 * - shape-rendering=crispEdges 로 래스터(PNG) 시 경계가 또렷하게 유지.
 */
export function renderSvg(matrix: boolean[][], style: QrStyle, opts: RenderOptions = {}): string {
  const layout = computeLayout(matrix, style, opts);
  const { totalModules, offset } = layout;
  const modulePx = opts.modulePx ?? 16;
  const sizePx = totalModules * modulePx;

  const bgRect = style.bg
    ? `<rect width="${totalModules}" height="${totalModules}" fill="${style.bg}"/>`
    : '';

  let borderRect = '';
  if (style.border) {
    const sw = style.border.widthModules;
    // 프레임은 캔버스 가장자리에서 framePad 의 절반 안쪽(테두리 두께 중심)을 지난다.
    const framePad = opts.framePad ?? DEFAULT_FRAME_PAD;
    const inset = Math.max(framePad / 2, sw / 2);
    const x = inset;
    const w = totalModules - inset * 2;
    const radius = 1.5;
    borderRect =
      `<rect x="${x}" y="${x}" width="${w}" height="${w}" rx="${radius}" ry="${radius}" ` +
      `fill="none" stroke="${style.border.color}" stroke-width="${sw}"/>`;
  }

  const path = modulesToPath(matrix, offset);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" ` +
    `viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges">` +
    bgRect +
    borderRect +
    `<path d="${path}" fill="${style.fg}"/>` +
    `</svg>`
  );
}

/** SVG 문자열 → data URL (클라이언트에서 <img> src 로 써서 canvas 래스터에 사용). */
export function svgToDataUrl(svg: string): string {
  // base64 대신 encodeURIComponent — 한글/특수문자 없이 가볍고 안전.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
