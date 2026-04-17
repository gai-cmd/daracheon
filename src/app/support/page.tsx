import type { Metadata } from 'next';
import { readData } from '@/lib/db';
import type { FaqItem } from '@/data/company';
import SupportClient from './SupportClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '고객 지원 - 문의 및 안내 | ZOEL LIFE',
  description:
    'ZOEL LIFE 고객 지원 센터. 전화, 이메일 문의 및 1:1 문의, 자주 묻는 질문을 확인하세요.',
  alternates: { canonical: 'https://www.daracheon.com/support' },
};

export default async function SupportPage() {
  const faqItems = await readData('faq');

  return <SupportClient faqItems={faqItems} />;
}
