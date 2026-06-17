import qrcode from 'qrcode-generator';

/**
 * QR 인코딩 (순수·isomorphic).
 *
 * 직접 GF(256)/마스킹을 구현하면 스캔이 안 되는 QR 이 인쇄될 위험이 커서,
 * 검증된 zero-dep 인코더(qrcode-generator, MIT)로 "모듈 매트릭스"만 뽑고
 * SVG / Canvas PNG / 벡터 PDF 렌더는 모두 이 단일 매트릭스에서 파생한다.
 * 서버(라우트)·클라이언트(다운로드) 양쪽에서 동일하게 동작.
 */

export type EcLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * 문자열을 boolean 모듈 매트릭스로 인코딩 (true = dark module).
 * typeNumber 0 = 데이터 길이에 맞춰 버전 자동 선택.
 *
 * EC level: 기본 'M'(15% 복원). 스티커가 긁히거나 로고를 얹는 경우를 대비해
 * 더 견고하게 하려면 'Q'(25%)/'H'(30%) 사용 — 단 모듈 수가 늘어 더 촘촘해진다.
 */
export function encodeMatrix(text: string, ec: EcLevel = 'M'): boolean[][] {
  if (!text) throw new Error('QR 인코딩할 텍스트가 비어 있습니다.');
  const qr = qrcode(0, ec);
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const matrix: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = new Array(n);
    for (let c = 0; c < n; c++) row[c] = qr.isDark(r, c);
    matrix.push(row);
  }
  return matrix;
}
