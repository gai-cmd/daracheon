import type { Metadata } from 'next';
import LegalPage from '@/components/ui/LegalPage';
import JsonLd from '@/components/ui/JsonLd';
import { IMAGE_LICENSE_CONTENT, IMAGE_LICENSE_EFFECTIVE_DATE } from '@/data/image-license';
import { SITE_URL, IMAGE_LICENSE_URL } from '@/lib/seo/image';

export const metadata: Metadata = {
  title: '이미지 이용 안내',
  description:
    'zoellife.com 에 게시된 사진·영상 등 이미지 자산의 저작권 귀속과 이용 조건, 사용 허가 문의 방법을 안내합니다.',
  robots: { index: true, follow: true },
  alternates: { canonical: IMAGE_LICENSE_URL },
};

// 이 페이지 자체가 모든 ImageObject 의 license · acquireLicensePage 목적지다.
// 크롤러가 실제로 도달해 라이선스 조건을 읽을 수 있어야 하므로 색인 허용.
export default function ImageLicensePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${IMAGE_LICENSE_URL}#webpage`,
    url: IMAGE_LICENSE_URL,
    name: '이미지 이용 안내 — 대라천 ZOEL LIFE',
    description:
      'zoellife.com 이미지 자산의 저작권 귀속·이용 조건·사용 허가 문의 절차.',
    inLanguage: 'ko-KR',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: '이미지 이용 안내', item: IMAGE_LICENSE_URL },
      ],
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LegalPage
        kicker="Image License"
        title="이미지 이용 안내"
        effectiveDate={IMAGE_LICENSE_EFFECTIVE_DATE}
        content={IMAGE_LICENSE_CONTENT}
      />
    </>
  );
}
