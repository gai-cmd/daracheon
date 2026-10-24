import type { Metadata } from 'next';
import TopicHub from '@/components/seo/TopicHub';
import { AGARWOOD_BENEFITS } from '@/content/topics/agarwood-benefits';
import { pageOpenGraph } from '@/lib/seo/og';
import { SITE_URL } from '@/lib/seo/image';

// '침향 효능' 검색어 허브. 효능 정보 옆에 제품 카드를 붙이지 않도록 제품 목록은 비우고
// (TopicHub 가 '전체 제품 보기' 링크만 출력) 데이터 조회 없이 정적으로 렌더한다.

// 요청된 제목에 이미 브랜드가 들어 있어 레이아웃 템플릿을 건너뛴다(absolute).
const TITLE = "침향 효능 총정리 — 과학 연구와 전통 문헌으로 본 침향의 효과 | 대라천 '참'침향";
// og:title 은 템플릿이 적용되지 않는다 — 40자 이내(네이버 가이드).
const OG_TITLE = '침향 효능 총정리 — 연구와 전통 문헌';
const DESCRIPTION =
  '동의보감 등 전통 문헌의 기록과 세포·동물 중심의 현대 연구를 나눠 정리한 침향 효능 안내. 실험 대상, 섭취 시 주의사항, 자주 묻는 질문.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: ['침향 효능', '침향효능', '침향의 효과', '침향 효능 논문', '침향 동의보감', '침향 부작용', '침향 주의사항', '아갈로차 침향'],
  alternates: { canonical: `${SITE_URL}${AGARWOOD_BENEFITS.path}` },
  openGraph: pageOpenGraph({
    path: AGARWOOD_BENEFITS.path,
    title: OG_TITLE,
    description: DESCRIPTION,
    image: AGARWOOD_BENEFITS.heroImage?.src,
  }),
};

export default function AgarwoodBenefitsPage() {
  return <TopicHub content={AGARWOOD_BENEFITS} products={[]} />;
}
