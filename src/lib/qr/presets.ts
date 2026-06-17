/**
 * QR 디자인 프리셋 — 인쇄/스티커용 3종.
 * 색·배경·테두리만 다르고 인코딩(매트릭스)은 동일하므로 어떤 프리셋이든
 * 같은 QR 로 스캔된다. 모든 색은 우리 자산(인라인 SVG/PNG/PDF)으로만 생성 —
 * 외부 CDN 의존 없음(프로젝트 헌법).
 */

export type QrStyleId = 'white-black' | 'transparent-white' | 'transparent-gold';

export interface QrStyle {
  id: QrStyleId;
  label: string;
  /** 모듈(점) 색 */
  fg: string;
  /** 배경색 — null 이면 투명 */
  bg: string | null;
  /** 브랜드 테두리(프레임) — null 이면 없음 */
  border: { color: string; widthModules: number } | null;
  /** 권장 사용처 */
  hint: string;
  /** 미리보기 체커보드가 필요한가 (투명 배경) */
  transparent: boolean;
}

// 브랜드 골드 honey(#d4a843), 럭셔리 블랙(#0a0b10) — tailwind.config.ts 토큰과 일치.
export const QR_STYLES: QrStyle[] = [
  {
    id: 'white-black',
    label: '흰 바탕 · 검정 QR',
    fg: '#0a0b10',
    bg: '#ffffff',
    border: null,
    hint: '밝은 배경(제품 라벨·전단·종이 패키지)용. 인식률이 가장 높아 기본 권장.',
    transparent: false,
  },
  {
    id: 'transparent-white',
    label: '투명 바탕 · 흰색 QR',
    fg: '#ffffff',
    bg: null,
    border: null,
    hint: '어두운 색 패키지/박스 위에 직접 얹는 용도. 반드시 어두운 배경 위에만 사용.',
    transparent: true,
  },
  {
    id: 'transparent-gold',
    label: '투명 바탕 · 골드 QR + 테두리',
    fg: '#d4a843',
    bg: null,
    border: { color: '#d4a843', widthModules: 1 },
    hint: '브랜드 골드 프리미엄 버전(고급 패키지·명함·기프트박스). 어두운/중간 톤 배경 위에 사용.',
    transparent: true,
  },
];

export function getStyle(id: QrStyleId): QrStyle {
  return QR_STYLES.find((s) => s.id === id) ?? QR_STYLES[0];
}
