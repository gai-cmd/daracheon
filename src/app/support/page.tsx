import type { Metadata } from 'next';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import type { FaqItem } from '@/data/company';
import SupportClient, { type SupportData } from './SupportClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '문의하기 — 고객 지원·FAQ·Lot 조회 | 대라천 ZOEL LIFE',
  description:
    '대라천 침향 제품 문의·FAQ·Lot 인증서 조회·주문 및 배송 안내. 전화 070-4140-4086, 평일 09:00~18:00.',
  alternates: { canonical: 'https://www.daracheon.com/support' },
};

interface FaqItemWithMeta extends FaqItem {
  id?: string;
  category?: string;
}

export default async function SupportPage() {
  const [faqItems, pagesData] = await Promise.all([
    readDataSafe<FaqItemWithMeta>('faq'),
    readSingleSafe<{ support?: SupportData }>('pages'),
  ]);

  // FAQPage JSON-LD — 실제 DB 데이터 기반 동적 생성
  // AI Overview / SGE / Bing Copilot 이 FAQ 원문을 직접 인용할 수 있게 제공.
  const faqJsonLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://www.daracheon.com' },
      { '@type': 'ListItem', position: 2, name: '문의하기', item: 'https://www.daracheon.com/support' },
    ],
  };

  return (
    <>
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <SupportClient faqItems={faqItems} supportData={pagesData?.support ?? null} />
    </>
  );
}
