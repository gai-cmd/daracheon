import type { Metadata } from 'next';
import { readSingleUncached } from '@/lib/db';
import LegalPage from '@/components/ui/LegalPage';
import { DEFAULT_TERMS, type LegalDoc } from '@/data/legal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '이용약관',
  description:
    '조엘라이프 주식회사(대라천 ZOEL LIFE)가 운영하는 zoellife.com 의 이용약관. 서비스 이용 조건, 이용자 의무, 회사의 의무, 면책 조항 등을 안내합니다.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://zoellife.com/terms' },
};

interface PagesData {
  terms?: Partial<LegalDoc>;
}

export default async function TermsPage() {
  const data = await readSingleUncached<PagesData>('pages');
  const doc: LegalDoc = {
    effectiveDate: data?.terms?.effectiveDate || DEFAULT_TERMS.effectiveDate,
    content: data?.terms?.content || DEFAULT_TERMS.content,
  };

  return (
    <LegalPage
      kicker="Terms of Service"
      title="이용약관"
      effectiveDate={doc.effectiveDate}
      content={doc.content}
    />
  );
}
