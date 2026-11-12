/**
 * 허브 하단 "더 읽어보기" 목록 — 허브별 블로그 글 슬러그와, 필요한 곳의 중립 라벨.
 *
 * 블로그 글 원제목에는 질병명·효과 단정 표현이 들어 있는 것이 있다. 제품을 함께 싣는 허브(침향 오일)와
 * 효능 정보 허브(침향 효능)에서는 2026-10-24 표시·광고 검토에 맞춰 원제목 대신 중립 라벨을 쓴다.
 * 라벨은 /agarwood-benefits 가 이미 쓰는 표현(연구 항목 이름·링크 라벨)과 글 제목의 중립적인 부분만으로 만들었다.
 * 라벨이 없는 슬러그는 저장소의 실제 제목이 그대로 나온다. 발행되지 않은 슬러그는 목록에서 빠진다(readFurtherReading).
 */
export interface FurtherReadingItem {
  slug: string;
  title: string;
}

/** 라벨이 지정된 슬러그만 제목을 바꾼다. 순서·개수는 그대로 둔다. */
export function applyNeutralLabels<T extends FurtherReadingItem>(
  posts: readonly T[],
  labels: Readonly<Record<string, string>>,
): T[] {
  return posts.map((p) => (labels[p.slug] ? { ...p, title: labels[p.slug] } : p));
}

/** /agarwood-oil — 제목에 '오일'이 든 연구 소개 글 6개 + 성분·수지 함량 글. */
export const OIL_FURTHER_READING_SLUGS = [
  'agarwood-oil-hypoxia-gut-study',
  'agarwood-oil-mental-health',
  'agarwood-anxiety-depression-insomnia',
  'agarwood-oil-nanoemulsion-inflammation',
  'agarwood-nanoemulsion-anti-inflammatory-macrophages-lps',
  'agarwood-nanoemulsion-protects-airway-cells-smoking',
  'agarwood-sesquiterpene-guide',
  'agarwood-resin-content-determines-quality',
] as const;

export const OIL_FURTHER_READING_LABELS: Record<string, string> = {
  'agarwood-oil-hypoxia-gut-study': '침향 오일과 위·장 연구',
  'agarwood-oil-mental-health': '침향 오일 향기 성분과 행동 지표 연구',
  'agarwood-anxiety-depression-insomnia': '침향 오일 향 성분 연구 리뷰 (Molecules, 2022)',
  'agarwood-oil-nanoemulsion-inflammation': '침향 오일 나노에멀션 연구 — 나노 기술의 도전',
  'agarwood-nanoemulsion-anti-inflammatory-macrophages-lps': '침향 오일 나노에멀션과 면역세포 연구',
  'agarwood-nanoemulsion-protects-airway-cells-smoking': '침향 오일 나노에멀션과 기도 세포 연구',
  'agarwood-sesquiterpene-guide': '침향 속 핵심 성분 세스퀴테르펜',
};

/** /vietnam-agarwood — 산지·학명·농장 글. 원제목 그대로 쓴다. */
export const VIETNAM_FURTHER_READING_SLUGS = [
  'vietnam-5-farms-200ha-4million-trees',
  'agarwood-origin-vietnam-trade-history',
  'indonesian-agarwood-microscope-not-aquilaria',
  'why-aquilaria-agallocha-roxburgh-matters',
] as const;

/** /agarwood-benefits — 앞의 4개는 2026-11-09 부터 있던 목록(원제목), 뒤의 4개는 2026-11-12 추가분(중립 라벨). */
export const BENEFITS_FURTHER_READING_SLUGS = [
  'agarwood-sleep-and-nerve-research',
  'agarwood-anxiety-depression-insomnia',
  'agarwood-cyp',
  'agarwood-nanoemulsion-protects-airway-cells-smoking',
  'stress-brain',
  'new-agarwood-sesquiterpenes-protect-brain-neurons',
  'agarwood-nanoemulsion-anti-inflammatory-macrophages-lps',
  'agarwood-extract-obesity-antioxidant',
] as const;

export const BENEFITS_FURTHER_READING_LABELS: Record<string, string> = {
  'stress-brain': '스트레스 호르몬과 배양 신경세포 연구',
  'new-agarwood-sesquiterpenes-protect-brain-neurons': '신규 세스퀴테르펜 12종 연구 (Phytochemistry, 2025)',
  'agarwood-nanoemulsion-anti-inflammatory-macrophages-lps': '침향 오일 나노에멀션과 면역세포 연구',
  'agarwood-extract-obesity-antioxidant': '침향 추출물의 항산화·지방분해효소 저해 연구',
};
