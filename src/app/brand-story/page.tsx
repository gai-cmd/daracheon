import type { Metadata } from 'next';
import { readSingleUncached } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import BrandStoryClient from './BrandStoryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "브랜드 스토리 — 대라천 '참'침향",
  description:
    "1998년 캄보디아에서 시작, 베트남 하띤성 200ha·400만 그루 직영 농장으로 성장한 대라천 '참'침향의 25년 여정. 농장·공정·역사·인증·품질·영상을 한 페이지에.",
  keywords: [
    // 브랜드
    '대라천', '대라천 참침향', 'ZOEL LIFE', '조엘라이프', '대라천 브랜드 스토리', '大羅天', 'Đại La Thiên',
    // 원산지/농장
    '베트남 침향', '하띤성 농장', '베트남 하띤성 침향', '직영 농장 침향',
    '200ha 농장', '400만 그루', '캄보디아 침향',
    // 학명/공정
    'Aquilaria Agallocha Roxburgh', '아퀼라리아 아갈로차 록스버그',
    '침향 농장', '침향 생산 공정', '침향 재배', '침향 수지 유도',
    '침향 증류', 'HACCP 침향', 'GMP 침향',
    // 신뢰/카테고리
    '침향 브랜드', '명품 침향 브랜드', '침향 브랜드 추천',
    '진짜 침향', '정품 침향', 'CITES 침향', 'OCOP 침향',
  ],
  alternates: { canonical: 'https://zoellife.com/brand-story' },
  openGraph: {
    type: 'article',
    title: "브랜드 스토리 — 대라천 '참'침향의 25년 여정",
    description:
      '베트남 하띤성 200ha 직영 농장에서 자란 400만 그루 침향나무 — 농장·공정·역사·인증·품질을 담은 대라천 브랜드 스토리.',
    url: 'https://zoellife.com/brand-story',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    images: ['/opengraph-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "대라천 '참'침향 — 25년 여정",
    description: '1998년 캄보디아에서 시작된 대라천 침향의 농장·공정·역사 이야기.',
    images: ['/twitter-image.jpg'],
  },
};

export interface Farm { name: string; nameVi: string; desc: string; image?: string }
export interface HistoryEra { era: string; items: string[]; description?: string; image?: string; imageCaption?: string }
export interface CertSection { title: string; items: string[]; body?: string }
export interface CertItem { name: string; nameEn: string; category: string; thumb: string; viewUrl: string }
export interface NarrativeParagraph { title: string; body: string }
export interface ProcessVideo { id: string; title: string }
export interface ProcessChapter { title: string; titleEn: string; description: string; videos: ProcessVideo[] }
export interface ProcessStat { value: string; label: string }
export interface ProcessStep { step: string; name: string; duration?: string; desc: string; image?: string }
export interface ProcessPhoto { src: string; caption?: string }
export interface ProcessGroup { title: string; titleEn: string; description: string; image?: string; steps: ProcessStep[]; photos?: ProcessPhoto[] }
export interface BrandStoryData {
  hero: { sectionTag: string; titleKr: string; titleEn?: string; subtitle: string; heroBg: string };
  brandStoryTab: { headlineTitle: string; headlineSubtitle: string; sourceTag: string; sourceTitle: string; sourceBody: string };
  farms: Farm[];
  historyTab: { tag: string; title: string; eras: HistoryEra[] };
  certificationsTab: { tag: string; title: string; subtitle: string; images?: string[]; imageLabels?: string[]; certs?: CertItem[]; sections: CertSection[] };
  qualityTab: { tag: string; title: string; subtitle: string; images: string[]; heavyMetals: string[]; paragraphs?: NarrativeParagraph[] };
  processTab: {
    tag: string;
    title: string;
    subtitle: string;
    heroVideo?: { id: string; title: string; body: string };
    stats?: ProcessStat[];
    videoChapters?: ProcessChapter[];
    images: string[];
    steps: string[];
    processGroups?: ProcessGroup[];
    totalTimeLabel: string;
    totalTimeValue: string;
    totalTimeDesc: string;
    paragraphs?: NarrativeParagraph[];
  };
}

export default async function BrandStoryPage() {
  // unstable_cache 우회 — 외부 시드 스크립트로 blob 갱신 시 즉시 반영.
  const pagesData = await readSingleUncached<{ aboutAgarwood: unknown; brandStory: BrandStoryData }>('pages');
  const data: BrandStoryData | null = pagesData?.brandStory ?? null;

  // AboutPage JSON-LD — 브랜드 개요 엔티티. AI Overview 가 회사 기원·규모를 직접 인용.
  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: "브랜드 스토리 — 대라천 '참'침향",
    description:
      "1998년 캄보디아에서 시작, 베트남 하띤성 200ha·400만 그루 직영 농장으로 성장한 대라천 '참'침향의 25년 여정.",
    url: 'https://zoellife.com/brand-story',
    about: {
      '@type': 'Organization',
      '@id': 'https://zoellife.com/#localbusiness',
      name: '대라천 ZOEL LIFE Co., Ltd.',
    },
  };

  // VideoObject 그룹 — brandStory processTab 영상 (AI 영상 검색 노출)
  const videoItems = data?.processTab?.videoChapters?.flatMap((ch) => ch.videos) ?? [];
  const videoJsonLd = videoItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '대라천 침향 생산 공정 영상',
    itemListElement: videoItems.map((v, i) => ({
      '@type': 'VideoObject',
      position: i + 1,
      name: v.title,
      description: `대라천 침향 생산 공정 — ${v.title}`,
      contentUrl: `https://drive.google.com/file/d/${v.id}/view`,
      embedUrl: `https://drive.google.com/file/d/${v.id}/preview`,
      uploadDate: '2026-04-11',
      thumbnailUrl: `https://lh3.googleusercontent.com/d/${v.id}=w1280`,
    })),
  } : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://zoellife.com' },
      { '@type': 'ListItem', position: 2, name: '브랜드 이야기', item: 'https://zoellife.com/brand-story' },
    ],
  };

  // Article — 브랜드 스토리는 long-form 콘텐츠 → Article 로 추가 노출.
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: "대라천 '참'침향 — 25년 브랜드 스토리",
    description:
      "1998년 캄보디아 시작, 베트남 하띤성 200ha · 약 400만 그루 직영 농장으로 성장한 대라천 '참'침향의 25년 여정.",
    inLanguage: 'ko-KR',
    isPartOf: { '@id': 'https://zoellife.com/#website' },
    author: { '@type': 'Organization', name: '대라천 ZOEL LIFE', url: 'https://zoellife.com' },
    publisher: { '@id': 'https://zoellife.com/#organization' },
    mainEntityOfPage: 'https://zoellife.com/brand-story',
    about: { '@id': 'https://zoellife.com/#brand' },
    keywords:
      '대라천, ZOEL LIFE, 조엘라이프, 침향 브랜드, 베트남 침향, 25년 침향, Aquilaria Agallocha Roxburgh',
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={aboutPageJsonLd} />
      {videoJsonLd && <JsonLd data={videoJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <BrandStoryClient data={data} />
    </>
  );
}
