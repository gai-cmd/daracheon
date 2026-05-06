import type { Metadata } from 'next';
import { readSingleUncached } from '@/lib/db';
import LegalPage from '@/components/ui/LegalPage';
import { DEFAULT_PRIVACY, type LegalDoc } from '@/data/legal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    '조엘라이프 주식회사(대라천 ZOEL LIFE)의 개인정보처리방침. zoellife.com 이용자의 개인정보 수집·이용·보관·파기에 관한 사항을 안내합니다.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://zoellife.com/privacy' },
};

interface PagesData {
  privacy?: Partial<LegalDoc>;
}

export default async function PrivacyPage() {
  const data = await readSingleUncached<PagesData>('pages');
  const doc: LegalDoc = {
    effectiveDate: data?.privacy?.effectiveDate || DEFAULT_PRIVACY.effectiveDate,
    content: data?.privacy?.content || DEFAULT_PRIVACY.content,
  };

  return (
    <LegalPage
      kicker="Privacy Policy"
      title="개인정보처리방침"
      effectiveDate={doc.effectiveDate}
      content={doc.content}
    />
  );
}
