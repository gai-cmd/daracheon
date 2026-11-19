import type { Metadata } from 'next';
import { readSingleSafe } from '@/lib/db';
import { resolveHomeMain } from '@/lib/home-main';
import { collectOfficialVideos } from '@/lib/home-videos';
import { YOUTUBE_STORE, type YoutubeStore } from '@/lib/youtube-sync';
import { BentoRoot } from '../BentoClient';
import VideoGrid from './VideoGrid';

const SITE_URL = 'https://zoellife.com';
const TITLE = '대라천 유튜브 — 침향 영상 모아 보기';
const DESCRIPTION = '대라천 ZOEL LIFE 공식 유튜브 채널의 침향 영상을 최신순으로 한곳에 모았습니다.';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/videos` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/videos`,
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image.jpg'],
  },
};

export default async function VideosPage() {
  const [pagesData, ytStore] = await Promise.all([
    readSingleSafe<{ homeMain?: unknown }>('pages'),
    readSingleSafe<YoutubeStore>(YOUTUBE_STORE),
  ]);
  const { videoSources, videos } = collectOfficialVideos(resolveHomeMain(pagesData?.homeMain), ytStore?.videos);

  return (
    <BentoRoot videos={videos} className="min-h-screen bg-[#0b0b0d] text-[#fdfbf7]">
      <section className="border-b border-[#3a3328] px-7 py-16 md:py-24 lg:px-16">
        <div className="mx-auto max-w-[1312px]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#d4a853]">VIDEO</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">대라천 유튜브</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#fdfbf7]/70 md:text-base">
            공식 채널에 올라온 침향 영상을 최신순으로 모았습니다. 카드를 누르면 바로 재생됩니다.
          </p>
        </div>
      </section>
      <section className="px-7 py-12 lg:px-16">
        <div className="mx-auto max-w-[1312px]">
          {videos.length > 0 ? (
            <VideoGrid sources={videoSources.map((s) => s.source)} />
          ) : (
            <p className="rounded-lg border border-[#3a3328] p-12 text-center text-[#fdfbf7]/60">
              아직 올라온 영상이 없습니다.
            </p>
          )}
        </div>
      </section>
    </BentoRoot>
  );
}
