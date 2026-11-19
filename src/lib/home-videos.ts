import { cleanVideoTitle, formatSnsDate, koreanVideosOnly } from '@/lib/sns';
import { SNS_YOUTUBE_OFFICIAL } from '@/data/sns-sample';
import { feedDateKey } from '@/lib/home-feed';
import type { resolveHomeMain } from '@/lib/home-main';

type HomeMain = ReturnType<typeof resolveHomeMain>;

/**
 * 공식 유튜브 두 채널(@ZoelLife_official_00 + @ZoelLife.official)을 날짜순으로 합친다.
 * 한글 제목만, 제목은 해시태그·꼬리표를 걷어 낸다. 같은 영상이 두 채널에 있으면 앞의 것만.
 * 홈 '새로 올라온 소식'과 /videos 목록이 같은 결과를 쓴다.
 */
export function collectOfficialVideos(hm: HomeMain) {
  const snsKo = koreanVideosOnly({ youtube: hm.youtube, instagram: hm.instagram });
  const officialKo = koreanVideosOnly({ youtube: SNS_YOUTUBE_OFFICIAL, instagram: hm.instagram }).youtube;
  const videoSources = [
    ...snsKo.youtube.videos.map((v) => ({ v, source: snsKo.youtube.handle })),
    ...officialKo.videos.map((v) => ({ v, source: officialKo.handle })),
  ]
    .filter(({ v }, i, all) => all.findIndex((x) => x.v.id === v.id) === i)
    .map((x, i) => ({ ...x, i }))
    .sort((a, b) => feedDateKey(b.v.publishedAt) - feedDateKey(a.v.publishedAt) || a.i - b.i);
  const videos = videoSources.map(({ v }) => ({
    id: v.id,
    title: cleanVideoTitle(v.title),
    date: formatSnsDate(v.publishedAt),
    thumbnail: v.thumbnail,
  }));
  return { snsKo, videoSources, videos };
}
