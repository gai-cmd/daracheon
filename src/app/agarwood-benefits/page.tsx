import type { Metadata } from 'next';
import TopicHub from '@/components/seo/TopicHub';
import { AGARWOOD_BENEFITS } from '@/content/topics/agarwood-benefits';
import { pageOpenGraph } from '@/lib/seo/og';
import { SITE_URL } from '@/lib/seo/image';
import { readFurtherReading } from '@/lib/blog/further-reading';
import {
  applyNeutralLabels,
  BENEFITS_FURTHER_READING_LABELS,
  BENEFITS_FURTHER_READING_SLUGS,
} from '@/content/topics/further-reading';
import { BENEFITS_REFERENCE_DOIS, pickVerifiedReferences } from '@/content/topics/benefits-references';

// '침향 효능' 검색어 허브. 효능 정보가 제품 광고로 읽히지 않도록 제품 영역을 두지 않는다
// (콘텐츠에 productsTitle 이 없어 TopicHub 가 제품 영역·'전체 제품 보기' 링크를 렌더하지 않음).
// 본문은 정적. 하단 '더 읽어보기' 블로그 글 제목만 저장소에서 읽어 5분마다 다시 만든다.
export const revalidate = 300;

// 이 허브와 겹치는 블로그 글(src/content/topics/further-reading.ts) — 발행되지 않은 슬러그는 빠진다.
// 2026-11-12 추가분은 원제목 대신 이 페이지가 쓰는 중립 라벨로 보여 준다(질병명 금지 — 10/24 표시·광고 검토).
const FURTHER_READING_SLUGS = BENEFITS_FURTHER_READING_SLUGS;

// 본문 '현대 연구'가 언급하는 논문 중 DOI 가 검증된 것 — 화면 '참고 문헌'과 Article.citation 의 단일 원천.
const REFERENCES = pickVerifiedReferences(BENEFITS_REFERENCE_DOIS);

// 요청된 제목에 이미 브랜드가 들어 있어 레이아웃 템플릿을 건너뛴다(absolute).
const TITLE = "침향 효능 총정리 — 과학 연구와 전통 문헌으로 본 침향의 효과 | 대라천 '참'침향";
// og:title 은 템플릿이 적용되지 않는다 — 40자 이내(네이버 가이드).
const OG_TITLE = '침향 효능 총정리 — 연구와 전통 문헌';
const DESCRIPTION =
  '동의보감 등 전통 문헌의 기록과 세포·동물 중심의 현대 연구를 나눠 정리한 침향 효능 안내. 실험 대상, 부작용·주의사항, 자주 묻는 질문.';

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

export default async function AgarwoodBenefitsPage() {
  const furtherReading = applyNeutralLabels(
    await readFurtherReading('agarwood-benefits-further-reading', FURTHER_READING_SLUGS),
    BENEFITS_FURTHER_READING_LABELS,
  );
  return <TopicHub content={AGARWOOD_BENEFITS} products={[]} furtherReading={furtherReading} references={REFERENCES} />;
}
