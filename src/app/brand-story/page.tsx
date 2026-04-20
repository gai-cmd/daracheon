import { readSingleSafe } from '@/lib/db';
import BrandStoryClient from './BrandStoryClient';

export const revalidate = 60;

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
