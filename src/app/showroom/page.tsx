import type { Metadata } from 'next';
import { readSingleUncached } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import ShowroomClient from './ShowroomClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "대라천 침향 전시장 — ZOEL LIFE Showroom",
  description:
    '베트남 직영 농장 25년의 결실 — 원목·수지·증류 오일·완제품 전 라인업과 시향까지, 대라천 \'참\'침향 전시장(쇼룸)을 사진으로 둘러보세요.',
  keywords: [
    '대라천 침향 전시장', '대라천 쇼룸', '대라천 매장', 'ZOEL LIFE 쇼룸',
    '베트남 침향 전시관', '동나이 대라천', 'Áo dài 도슨트', '침향 시향',
    'Daracheon Agarwood Showroom', '大羅天 沈香 展示場', '쇼룸',
  ],
  alternates: { canonical: 'https://zoellife.com/showroom' },
  openGraph: {
    type: 'article',
    title: "대라천 '참'침향 전시장 — 천년의 향기를 직접 체험",
    description:
      '베트남 직영 본관에서 만나는 대라천 침향의 모든 라인업·원목·증류·시향. 21장의 사진으로 전하는 진짜 침향의 공간.',
    url: 'https://zoellife.com/showroom',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    images: [{
      url: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/showroom/showroom-01.jpg',
      alt: "대라천 '참'침향 전시장 — 베트남 직영 본관 침향 라인업·원목·증류·시향",
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '대라천 침향 전시장 — ZOEL LIFE Showroom',
    description: '베트남 직영 본관 — 침향 원목·증류·시향까지 한 공간에.',
    images: ['https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/showroom/showroom-01.jpg'],
  },
};

export interface GalleryItem { src: string; alt?: string; caption?: string }
export interface ShowroomData {
  hero: { sectionTag: string; titleKr: string; titleEn?: string; subtitle: string; heroBg: string };
  intro: { tag: string; title: string; body: string };
  visit: { address: string; addressEn: string; hours: string; note: string };
  gallery: GalleryItem[];
}

export default async function ShowroomPage() {
  const pagesData = await readSingleUncached<{ showroom: ShowroomData }>('pages');
  const data: ShowroomData | null = pagesData?.showroom ?? null;

  const placeJsonLd = data ? {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: "대라천 '참'침향 전시장",
    description: data.intro?.body?.slice(0, 200) ?? '',
    url: 'https://zoellife.com/showroom',
    image: data.gallery?.slice(0, 6).map((g) => g.src) ?? [],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'VN',
      addressLocality: 'Đồng Nai',
    },
    openingHours: 'Mo-Su 10:00-18:00',
  } : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://zoellife.com' },
      { '@type': 'ListItem', position: 2, name: '전시장 · 쇼룸', item: 'https://zoellife.com/showroom' },
    ],
  };

  return (
    <>
      {placeJsonLd && <JsonLd data={placeJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <ShowroomClient data={data} />
    </>
  );
}
