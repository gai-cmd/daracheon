import type { Metadata } from 'next';
import { readSingleSafe } from '@/lib/db';
import BrandStoryClient from './BrandStoryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "브랜드 스토리 — 대라천 '참'침향 | ZOEL LIFE",
  description:
    "1998년 캄보디아에서 시작, 베트남 하띤성 200ha·400만 그루 직영 농장으로 성장한 대라천 '참'침향의 25년 여정. 농장·공정·역사·인증·품질·영상을 한 페이지에.",
  keywords: [
    '대라천', '대라천 참침향', 'ZOEL LIFE', '조엘라이프',
    '베트남 침향', '하띤성 농장', 'Aquilaria Agallocha Roxburgh',
    '침향 농장', '침향 생산 공정', '침향 브랜드',
  ],
  alternates: { canonical: 'https://www.daracheon.com/brand-story' },
  openGraph: {
    type: 'article',
    title: "브랜드 스토리 — 대라천 '참'침향의 25년 여정",
    description:
      '베트남 하띤성 200ha 직영 농장에서 자란 400만 그루 침향나무 — 농장·공정·역사·인증·품질을 담은 대라천 브랜드 스토리.',
    url: 'https://www.daracheon.com/brand-story',
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: "대라천 '참'침향 — 25년 여정",
    description: '1998년 캄보디아에서 시작된 대라천 침향의 농장·공정·역사 이야기.',
  },
};

export interface Farm { name: string; nameVi: string; desc: string; image?: string }
export interface HistoryEra { era: string; items: string[] }
export interface CertSection { title: string; items: string[] }
export interface ProcessVideo { id: string; title: string }
export interface ProcessChapter { title: string; titleEn: string; description: string; videos: ProcessVideo[] }
export interface ProcessStat { value: string; label: string }
export interface MediaItem { outlet: string; date?: string; title: string; summary?: string; image?: string; link?: string }
export interface TestimonialItem { name: string; role?: string; rating?: number; body: string; product?: string; image?: string }

export interface BrandStoryData {
  hero: { sectionTag: string; titleKr: string; subtitle: string; heroBg: string };
  brandStoryTab: { headlineTitle: string; headlineSubtitle: string; sourceTag: string; sourceTitle: string; sourceBody: string };
  farms: Farm[];
  sceneTab: { tag: string; title: string; subtitle: string; body: string; images: string[] };
  historyTab: { tag: string; title: string; eras: HistoryEra[] };
  certificationsTab: { tag: string; title: string; subtitle: string; images: string[]; imageLabels?: string[]; sections: CertSection[] };
  qualityTab: { tag: string; title: string; subtitle: string; images: string[]; heavyMetals: string[] };
  processTab: {
    tag: string;
    title: string;
    subtitle: string;
    heroVideo?: { id: string; title: string; body: string };
    stats?: ProcessStat[];
    videoChapters?: ProcessChapter[];
    images: string[];
    steps: string[];
    totalTimeLabel: string;
    totalTimeValue: string;
    totalTimeDesc: string;
  };
  mediaTab?: { tag: string; title: string; subtitle: string; items: MediaItem[] };
  testimonialsTab?: { tag: string; title: string; subtitle: string; items: TestimonialItem[] };
}

export default async function BrandStoryPage() {
  const pagesData = await readSingleSafe<{ aboutAgarwood: unknown; brandStory: BrandStoryData }>('pages');
  const data: BrandStoryData | null = pagesData?.brandStory ?? null;

  return <BrandStoryClient data={data} />;
}
