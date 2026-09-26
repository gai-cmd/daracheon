import type { SnsChannels } from '@/lib/sns';

/**
 * 시안용 정적 샘플 (2026-09-23).
 *
 * - YouTube: 공식 채널 @ZoelLife_official_00 공개 RSS 의 실제 영상 (2026-09-26 기준 2편).
 *   이 채널은 쇼츠 없이 가로 16:9 일반 영상만 있다. 썸네일은 시안이라 i.ytimg.com 을
 *   그대로 쓴다 — 자동 연동 단계에서 크론이 Vercel Blob 으로 복사한 URL 로
 *   대체한다(외부 CDN 금지 원칙). 이전 샘플은 @ZoelLife.official 채널 쇼츠였다.
 * - Instagram: 공식 계정 @zoellife_official 공개 게시물 스냅샷 (2026-09-26, 최신 12건 중 5건).
 *   전부 세로 9:16 릴스라 표지를 /public/images/sns/instagram/ 에 복사해 쓴다(외부 CDN 금지).
 *   제외: 반려동물·캐릭터 표지 5건(DdqHZZ8RCeL, Db-IN7QxzFn, DbsMiG6xBp6, DbcicZvRv85,
 *   DbciWTzRvky), 효능 주장 캡션 2건(Db444GPx3Gh, Db4azP0RosO).
 *   자동 동기화(Meta 공식 API 토큰 필요)가 붙으면 크론 결과로 대체한다.
 */

// maxresdefault = 16:9 1280x720 (hqdefault 는 4:3 에 검은 띠가 들어간다).
const YT_THUMB = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const IG_URL = 'https://www.instagram.com/zoellife_official/';
const IG_REEL = (code: string) => `https://www.instagram.com/reel/${code}/`;
const IG_IMG = (code: string) => `/images/sns/instagram/${code}.jpg`;

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
      { id: 'DdkZiWmRCeu', permalink: IG_REEL('DdkZiWmRCeu'), image: IG_IMG('DdkZiWmRCeu'), caption: '매일 애쓰는 밤, 나를 챙기는 작은 습관', mediaType: 'VIDEO' },
      { id: 'DcDUH3aRpKO', permalink: IG_REEL('DcDUH3aRpKO'), image: IG_IMG('DcDUH3aRpKO'), caption: '이 나무가 세상에서 가장 비싼 기름이 되기까지', mediaType: 'VIDEO' },
      { id: 'DcAA9lbxQH6', permalink: IG_REEL('DcAA9lbxQH6'), image: IG_IMG('DcAA9lbxQH6'), caption: '사장님 몰래 침향나무 태우기', mediaType: 'VIDEO' },
      { id: 'Db7r8uLxjDT', permalink: IG_REEL('Db7r8uLxjDT'), image: IG_IMG('Db7r8uLxjDT'), caption: '진짜 침향을 태우면 생기는 일', mediaType: 'VIDEO' },
      { id: 'DbsRQMfRXsI', permalink: IG_REEL('DbsRQMfRXsI'), image: IG_IMG('DbsRQMfRXsI'), caption: '침향 살 때 딱 3가지만 확인하세요', mediaType: 'VIDEO' },
    ],
  },
};
