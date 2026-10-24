/**
 * 제품 상세 갤러리 이미지 대체텍스트 — "<제품명> <카테고리 라벨> 제품 사진 N".
 * 저장된 제품명·카테고리 라벨만 쓴다(설명을 지어내지 않는다).
 * 제품명에 이미 라벨이 들어 있으면(공백 무시) 라벨을 반복하지 않는다 — 예: '침향수 (沈香水)' + '침향수'.
 */
export function productImageAlt(name: string, categoryLabel: string | undefined, index: number): string {
  const n = name.trim();
  const label = categoryLabel?.trim();
  const squash = (s: string) => s.replace(/\s+/g, '');
  const withLabel = label && label !== '전체' && !squash(n).includes(squash(label)) ? `${n} ${label}` : n;
  return `${withLabel} 제품 사진 ${index}`;
}
