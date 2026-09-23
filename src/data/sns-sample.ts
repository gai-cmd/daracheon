import type { SnsChannels } from '@/lib/sns';

/**
 * 시안용 정적 샘플 (2026-09-23).
 *
 * - YouTube: @ZoelLife.official 공개 RSS 에서 받은 실제 최신 쇼츠 8건.
 *   썸네일은 시안이라 i.ytimg.com 을 그대로 쓴다 — 자동 연동 단계에서
 *   크론이 Vercel Blob 으로 복사한 URL 로 대체한다(외부 CDN 금지 원칙).
 * - Instagram: API 연결 전이라 게시물 데이터가 없다. 사이트에 이미 있는
 *   Blob 이미지로 자리만 채우고, 링크는 계정 프로필로 보낸다.
 */

const YT_THUMB = (id: string) => `https://i.ytimg.com/vi/${id}/oardefault.jpg`;
const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';
const IG_URL = 'https://www.instagram.com/zoellife_official/';

export const SNS_SAMPLE: SnsChannels = {
  youtube: {
    name: 'ZOEL LIFE',
    handle: '@ZoelLife.official',
    url: 'https://www.youtube.com/@ZoelLife.official',
    videos: [
      { id: 'oCLAtbA3B38', title: 'How Does a Normal Tree Become Resin-Rich Agarwood?   #대라천 #아갈로차 #침향 #베트남침향 #참침향', publishedAt: '2026-09-09', thumbnail: YT_THUMB('oCLAtbA3B38') },
      { id: 'm96mb5J0GJ0', title: '가짜 침향에 속지 마세요! 검다고 다 진짜가 아닙니다MD', publishedAt: '2026-08-24', thumbnail: YT_THUMB('m96mb5J0GJ0') },
      { id: 'r_nlGYiGh3M', title: '나무의 상처가 세상에서 가장 귀한 향이 되는 순간MD', publishedAt: '2026-08-23', thumbnail: YT_THUMB('r_nlGYiGh3M') },
      { id: '4KRCME3rPqY', title: '시중 침향환 먹고도 아무 느낌 없었다면, 꼭 확인하세요MD', publishedAt: '2026-08-15', thumbnail: YT_THUMB('4KRCME3rPqY') },
      { id: 'NLoQPrXOvQo', title: '왜 침향나무는 20년을 기다려야 할까MD', publishedAt: '2026-08-06', thumbnail: YT_THUMB('NLoQPrXOvQo') },
      { id: 'W4DJLEtIDFY', title: '한 모금에 표정이 달라졌다… ‘천년의 향’ 시음회 현장MD', publishedAt: '2026-08-05', thumbnail: YT_THUMB('W4DJLEtIDFY') },
      { id: 'mM6UbfMTOFc', title: '베트남 밀림 속 200만 평 침향 농장, 그 거대한 숲을 공개합니다MD', publishedAt: '2026-08-05', thumbnail: YT_THUMB('mM6UbfMTOFc') },
      { id: 'S8MhuLxtT_c', title: '나무 한 그루에 20년을 투자하는 진짜 이유MD', publishedAt: '2026-07-31', thumbnail: YT_THUMB('S8MhuLxtT_c') },
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
