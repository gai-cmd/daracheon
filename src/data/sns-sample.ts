import type { SnsChannels } from '@/lib/sns';

/**
 * 시안용 정적 샘플 (2026-09-23).
 *
 * - YouTube: 공식 채널 @ZoelLife_official_00 공개 RSS 의 실제 영상 (2026-09-26 기준 2편).
 *   이 채널은 쇼츠 없이 가로 16:9 일반 영상만 있다. 썸네일은 시안이라 i.ytimg.com 을
 *   그대로 쓴다 — 자동 연동 단계에서 크론이 Vercel Blob 으로 복사한 URL 로
 *   대체한다(외부 CDN 금지 원칙). 이전 샘플은 @ZoelLife.official 채널 쇼츠였다.
 * - Instagram: API 연결 전이라 게시물 데이터가 없다. 사이트에 이미 있는
 *   Blob 이미지로 자리만 채우고, 링크는 계정 프로필로 보낸다.
 */

// maxresdefault = 16:9 1280x720 (hqdefault 는 4:3 에 검은 띠가 들어간다).
const YT_THUMB = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';
const IG_URL = 'https://www.instagram.com/zoellife_official/';

export const SNS_SAMPLE: SnsChannels = {
  youtube: {
    name: 'ZOEL LIFE',
    handle: '@ZoelLife_official_00',
    url: 'https://www.youtube.com/@ZoelLife_official_00',
    videos: [
      { id: '7ZOtzYmMvcM', title: "침향 오일을 '나노'로 쪼갰더니 벌어진 일", publishedAt: '2026-08-13', thumbnail: YT_THUMB('7ZOtzYmMvcM') },
      { id: '-nmj_zZwIS0', title: '낙원의 향기, 침향 — 사막 문명이 남긴 신앙과 치유의 언어', publishedAt: '2026-08-13', thumbnail: YT_THUMB('-nmj_zZwIS0') },
    ],
  },
  instagram: {
    name: "대라천 '참'침향",
    handle: '@zoellife_official',
    url: IG_URL,
    posts: [
      { id: 's1', permalink: IG_URL, image: `${BLOB}/pages/process/process-02-farm.jpg`, caption: '하띤 직영 농장의 아침' },
      { id: 's2', permalink: IG_URL, image: `${BLOB}/pages/process/process-05-harvest.jpg`, caption: '원물 채취 현장', mediaType: 'VIDEO' },
      { id: 's3', permalink: IG_URL, image: `${BLOB}/uploads/pages/species-card-roxburgh.jpg`, caption: '아갈로차 록스버그 원목 단면', mediaType: 'CAROUSEL_ALBUM' },
      { id: 's4', permalink: IG_URL, image: `${BLOB}/pages/process/process-01-seedling.jpg`, caption: '묘목 육성' },
      { id: 's5', permalink: IG_URL, image: `${BLOB}/pages/process/process-06-distill.jpg`, caption: '증기 증류 공정', mediaType: 'VIDEO' },
      { id: 's6', permalink: IG_URL, image: `${BLOB}/pages/process/process-03-organic.jpg`, caption: '20년 오르가닉 육성' },
      { id: 's7', permalink: IG_URL, image: `${BLOB}/pages/process/process-04-resin.jpg`, caption: '수지 형성', mediaType: 'CAROUSEL_ALBUM' },
      { id: 's8', permalink: IG_URL, image: `${BLOB}/pages/hero/home-hero-default.jpg`, caption: "대라천 '참'침향" },
    ],
  },
};
