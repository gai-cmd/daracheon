import { modulesToPath } from './render';

/**
 * 인쇄용 정사각 "스티커" SVG 합성 (순수·isomorphic).
 *
 * 한 장의 정사각 SVG 안에 ── 흰 와꾸(여백) + QR(흰 quiet zone) +
 * 정중앙 라벨(녹아웃) + 하단 안내문구 ── 를 모두 담는다.
 * 미리보기(작은 px)와 PNG 래스터(큰 px)가 동일 소스라서 픽셀 단위로 일치.
 * 외부 리소스 0 (프로젝트 헌법: 외부 CDN 금지).
 *
 * 스캔 안전 설계:
 * - QR 은 반드시 EC 레벨 H(30% 복원)로 인코딩한 매트릭스를 넘길 것 → 중앙 녹아웃 복원.
 * - 모듈은 정사각 유지(라운드/곡선 미적용) — 30mm 소형 + 중앙 녹아웃이 이미 스캔을
 *   압박하므로 가장 안전한 정사각으로. (재디자인 요소는 와꾸/라벨/문구 합성으로 제공)
 * - 중앙 녹아웃 크기는 jsQR 경험적 스윕으로 결정한 안전 상한 이하로 고정.
 * - 텍스트는 textLength+lengthAdjust 로 폭을 강제해 폰트 측정 의존을 제거(틀 밖 침범 방지).
 *
 * 제품/문구가 바뀌어도 옵션만 갈아끼우면 되는 데이터 구동 — 모든 QR·제품에 범용.
 */

export interface StickerOptions {
  /** 정사각 한 변 물리 크기(mm). 기본 30. */
  sizeMm?: number;
  /** 출력 SVG 픽셀 한 변. 미리보기는 작게, PNG 래스터는 크게(인쇄용). 기본 1500. */
  px?: number;
  /** 정중앙 라벨 문구(QR 위 흰 녹아웃 안). 비우면 라벨 없음 → QR 최대(스캔 최상). */
  centerText?: string;
  /** 하단 안내 문구. 비우면 캡션 밴드 없음 → QR 더 큼. */
  captionText?: string;
  /** QR 모듈 색. 기본 브랜드 ink(#0a0b10) — 흰 바탕 위 최대 대비. */
  qrColor?: string;
  /** 텍스트(라벨·캡션) 색. 기본 ink(#1a1206). */
  textColor?: string;
  /** 라벨 테두리(가는 골드 악센트) 색. 기본 브랜드 골드. */
  accentColor?: string;
  /** 스티커 바탕(=흰 와꾸) 색. 기본 흰색. */
  bg?: string;
}

/** QR 자체 흰 여백(모듈) — 스캔 신뢰성을 위한 quiet zone. */
const QUIET = 4;

/**
 * 중앙 녹아웃(흰 후광=실제 클리어 영역) 크기 — 데이터 영역(quiet zone 제외) 대비 비율.
 * jsQR 스윕으로 0.38×0.28 까지 복원 PASS 확인 → 여유 마진 두고 채택.
 * 안쪽 골드 배지는 이 흰 영역 내부에 들어가므로 스캔성은 흰 영역 크기로만 결정.
 */
const CENTER_W_FRAC = 0.34;
const CENTER_H_FRAC = 0.24;

/** XML 텍스트 노드/속성용 escape (사용자 입력이 SVG 로 들어가므로 필수). */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const FONT_STACK =
  "'Pretendard','Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif";

/**
 * 매트릭스(EC H 권장) + 문구 → 정사각 스티커 SVG 문자열.
 * 좌표계: 1 단위 = 0.1mm (viewBox = sizeMm*10), 픽셀은 width/height 로 별도 지정해
 *         래스터를 1:1 로 떠 QR 모듈 경계를 또렷하게 유지(crispEdges).
 */
export function renderStickerSvg(matrix: boolean[][], opts: StickerOptions = {}): string {
  const sizeMm = opts.sizeMm ?? 30;
  const px = opts.px ?? 1500;
  const qrColor = opts.qrColor ?? '#0a0b10';
  const textColor = opts.textColor ?? '#1a1206';
  const accentColor = opts.accentColor ?? '#d4a843';
  const bg = opts.bg ?? '#ffffff';
  const centerText = (opts.centerText ?? '').trim();
  const captionText = (opts.captionText ?? '').trim();

  const V = sizeMm * 10; // 0.1mm 단위 캔버스
  const edge = Math.round(V * 0.027); // 바깥 흰 와꾸 여백 (~0.8mm @30)
  const gap = Math.round(V * 0.02); // QR 과 캡션 사이 간격 (~0.6mm @30)
  const capH = captionText ? Math.round(V * 0.155) : 0; // 캡션 밴드 높이 (~4.65mm @30)

  // QR 블록(데이터+quiet zone 포함) 정사각 — 폭과 캡션 위 세로공간에 동시에 맞춤.
  const block = Math.min(V - edge * 2, V - edge * 2 - gap - capH);
  const blockX = (V - block) / 2;
  const blockY = edge;

  const dataModules = matrix.length;
  const totalModules = dataModules + QUIET * 2;
  const unit = block / totalModules; // 1 모듈 = unit (0.1mm 단위)
  const dataPx = dataModules * unit; // 데이터 영역 한 변

  const cx = V / 2;
  const cy = blockY + block / 2;

  // ── QR (crispEdges 로 모듈 경계 또렷) ──
  const qrPath = modulesToPath(matrix, QUIET);
  const qrGroup =
    `<g transform="translate(${blockX} ${blockY}) scale(${unit})" shape-rendering="crispEdges">` +
    `<path d="${qrPath}" fill="${qrColor}"/>` +
    `</g>`;

  // ── 정중앙 라벨 ── 흰 후광(녹아웃·QR 과 분리) + 골드 배지 + 짙고 굵은 글씨 → 눈에 띄게.
  let centerLabel = '';
  if (centerText) {
    const pw = dataPx * CENTER_W_FRAC; // 흰 후광(=실제 클리어 영역) 폭
    const ph = dataPx * CENTER_H_FRAC; // 흰 후광 높이
    const halo = Math.min(pw, ph) * 0.12; // 골드 배지 둘레 흰 분리 링 두께
    const bw = pw - halo * 2; // 골드 배지 폭
    const bh = ph - halo * 2; // 골드 배지 높이
    const padX = bw * 0.12;
    const fontSize = bh * 0.66;
    const stroke = Math.max(unit * 0.5, V * 0.004);
    const badgeBorder = '#9e7825'; // gold-600 — 배지 윤곽 또렷하게
    centerLabel =
      // 흰 후광(녹아웃) — QR 모듈과 골드 배지를 깔끔히 분리
      `<rect x="${fmt(cx - pw / 2)}" y="${fmt(cy - ph / 2)}" width="${fmt(pw)}" height="${fmt(ph)}" ` +
      `rx="${fmt(ph * 0.3)}" ry="${fmt(ph * 0.3)}" fill="${bg}"/>` +
      // 골드 배지
      `<rect x="${fmt(cx - bw / 2)}" y="${fmt(cy - bh / 2)}" width="${fmt(bw)}" height="${fmt(bh)}" ` +
      `rx="${fmt(bh * 0.32)}" ry="${fmt(bh * 0.32)}" fill="${accentColor}" stroke="${badgeBorder}" stroke-width="${fmt(stroke)}"/>` +
      // 짙고 굵은 글씨
      `<text x="${fmt(cx)}" y="${fmt(cy)}" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="${FONT_STACK}" font-weight="800" font-size="${fmt(fontSize)}" fill="${textColor}" ` +
      `textLength="${fmt(bw - padX * 2)}" lengthAdjust="spacingAndGlyphs">${escapeXml(centerText)}</text>`;
  }

  // ── 하단 안내 문구 ──
  let caption = '';
  if (captionText) {
    const capCenterY = blockY + block + gap + capH / 2;
    const capW = V * 0.86;
    const capFont = capH * 0.5;
    caption =
      `<text x="${fmt(cx)}" y="${fmt(capCenterY)}" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="${FONT_STACK}" font-weight="700" font-size="${fmt(capFont)}" fill="${textColor}" ` +
      `textLength="${fmt(capW)}" lengthAdjust="spacingAndGlyphs">${escapeXml(captionText)}</text>`;
  }

  const bgRect = `<rect width="${V}" height="${V}" rx="${fmt(V * 0.05)}" ry="${fmt(V * 0.05)}" fill="${bg}"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${V} ${V}">` +
    bgRect +
    qrGroup +
    centerLabel +
    caption +
    `</svg>`
  );
}

function fmt(n: number): string {
  return (Math.round(n * 1000) / 1000).toString();
}
