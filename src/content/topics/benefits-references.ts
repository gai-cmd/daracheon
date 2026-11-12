import { BLOG_REFERENCES, type BlogReference } from '@/content/blog-references';

/**
 * /agarwood-benefits '참고 문헌' — 이 허브의 '현대 연구' 항목이 이름으로 언급하는 논문 가운데
 * 2026-11-09 에 DOI 를 검증해 src/content/blog-references.ts 에 넣어 둔 것만 싣는다.
 * 새 출처는 넣지 않는다. DOI 가 없는 연구(Journal of Natural Medicines 2008, Planta Medica 1996,
 * 서울대 석사 학위논문 2013)는 목록에 없다.
 *
 * 순서는 허브 본문에 나오는 순서다.
 */
export const BENEFITS_REFERENCE_DOIS = [
  '10.3390/molecules27144528', // Molecules, 2022 — 향기 성분과 행동 지표 리뷰
  '10.1016/j.phytochem.2025.114527', // Phytochemistry, 2025 — 신경세포 보호
  '10.1016/j.phytochem.2021.112920', // Phytochemistry, 2021 — 신규 성분의 염증 지표
  '10.1016/j.prp.2023.154895', // Pathology - Research and Practice, 2023 — 나노에멀션과 면역세포
  '10.3390/nu15041019', // Nutrients, 2023 — 나노에멀션과 기도 세포
  '10.1186/s13568-025-01928-z', // AMB Express, 2025 — 저산소 환경의 위·소장 지표
  '10.3390/ph17111548', // Pharmaceuticals, 2024 — 연구 종합 리뷰
  '10.11002/kjfp.2015.22.3.437', // 한국식품저장유통학회지 — 항산화·지방분해효소 저해
] as const;

/**
 * DOI 목록을 검증된 참고 문헌 데이터로 푼다.
 * 데이터에 없는 DOI 는 버리고(출처를 지어내지 않는다), 같은 DOI 는 한 번만 싣는다.
 */
export function pickVerifiedReferences(
  dois: readonly string[],
  source: Readonly<Record<string, BlogReference[]>> = BLOG_REFERENCES,
): BlogReference[] {
  const byDoi = new Map<string, BlogReference>();
  for (const refs of Object.values(source)) {
    for (const r of refs) {
      const key = r.doi.toLowerCase();
      if (!byDoi.has(key)) byDoi.set(key, r);
    }
  }
  const seen = new Set<string>();
  const out: BlogReference[] = [];
  for (const doi of dois) {
    const key = doi.toLowerCase();
    const ref = byDoi.get(key);
    if (!ref || seen.has(key)) continue;
    seen.add(key);
    out.push(ref);
  }
  return out;
}
