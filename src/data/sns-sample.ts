import type { SnsChannels } from '@/lib/sns';

/**
 * 공식 YouTube·Instagram 채널의 정적 스냅샷.
 * 갱신하려면 이 파일을 고치고, 표지·썸네일을 public/images/sns/ 에 복사한 뒤 배포한다.
 *
 * - YouTube: 공식 채널 @ZoelLife_official_00 공개 RSS 의 실제 영상 (2026-09-26 기준 2편).
 *   이 채널은 쇼츠 없이 가로 16:9 일반 영상만 있다. 썸네일(maxresdefault)은
 *   /public/images/sns/youtube/ 에 복사해 쓴다(외부 CDN 금지). 이전 샘플은 @ZoelLife.official 채널 쇼츠였다.
 * - Instagram: 공식 계정 @zoellife_official 공개 게시물 스냅샷 (2026-09-26, 최신 12건 중 5건).
 *   전부 세로 9:16 릴스라 표지를 /public/images/sns/instagram/ 에 복사해 쓴다(외부 CDN 금지).
 *   제외: 반려동물·캐릭터 표지 5건(DdqHZZ8RCeL, Db-IN7QxzFn, DbsMiG6xBp6, DbcicZvRv85,
 *   DbciWTzRvky), 효능 주장 캡션 2건(Db444GPx3Gh, Db4azP0RosO).
 */

// maxresdefault = 16:9 1280x720 (hqdefault 는 4:3 에 검은 띠가 들어간다).
// 파일명의 yt- 접두어는 영상 ID 가 '-' 로 시작할 수 있어서 붙인다.
const YT_THUMB = (id: string) => `/images/sns/youtube/yt-${id}.jpg`;
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

/**
 * 두 번째 공식 YouTube 채널 @ZoelLife.official (channel_id UCGy1eR9TDWeUXkfU6U2hdWA) 스냅샷.
 * 메인 '새로 올라온 소식'은 위 @ZoelLife_official_00 과 이 채널의 영상을 합쳐 날짜순으로 보여 준다.
 *
 * - 공개 RSS 2026-11-14 기준. 한글 제목만 싣고, 제목 끝의 'MD' 꼬리표는 떼었다.
 * - 대부분 세로 쇼츠라 표지는 oardefault(1080x1920)를 960px 높이로 줄여 복사했다(외부 CDN 금지).
 *   가로 영상(침향의 눈물)은 maxresdefault 를 쓴다.
 * - 제외: 효능을 암시하는 제목 2건(4KRCME3rPqY 시중 침향환…, poDYXnU0Nbw 부모님께 안마의자 대신…),
 *   영어 제목 5건(DLzHR7V-axo, mkLvy1K3YdA, bESgqPohrLE, oCLAtbA3B38 등).
 */
export const SNS_YOUTUBE_OFFICIAL: SnsChannels['youtube'] = {
  name: 'ZOEL LIFE',
  handle: '@ZoelLife.official',
  url: 'https://www.youtube.com/@ZoelLife.official',
  videos: [
    { id: '8jegHbjbUsM', title: '침향의 눈물', publishedAt: '2026-11-11', thumbnail: YT_THUMB('8jegHbjbUsM') },
    { id: 'm96mb5J0GJ0', title: '가짜 침향에 속지 마세요! 검다고 다 진짜가 아닙니다', publishedAt: '2026-08-24', thumbnail: YT_THUMB('m96mb5J0GJ0') },
    { id: 'r_nlGYiGh3M', title: '나무의 상처가 세상에서 가장 귀한 향이 되는 순간', publishedAt: '2026-08-23', thumbnail: YT_THUMB('r_nlGYiGh3M') },
    { id: 'NLoQPrXOvQo', title: '왜 침향나무는 20년을 기다려야 할까', publishedAt: '2026-08-06', thumbnail: YT_THUMB('NLoQPrXOvQo') },
    { id: 'W4DJLEtIDFY', title: '한 모금에 표정이 달라졌다… ‘천년의 향’ 시음회 현장', publishedAt: '2026-08-05', thumbnail: YT_THUMB('W4DJLEtIDFY') },
    { id: 'mM6UbfMTOFc', title: '베트남 밀림 속 200만 평 침향 농장, 그 거대한 숲을 공개합니다', publishedAt: '2026-08-05', thumbnail: YT_THUMB('mM6UbfMTOFc') },
    { id: 'S8MhuLxtT_c', title: '나무 한 그루에 20년을 투자하는 진짜 이유', publishedAt: '2026-07-31', thumbnail: YT_THUMB('S8MhuLxtT_c') },
    { id: 'bbugrgdogek', title: '금보다 귀하다고 불리는 나무, 베트남 침향 실물 공개', publishedAt: '2026-07-30', thumbnail: YT_THUMB('bbugrgdogek') },
    { id: 'YTvXAig5G9U', title: '20년 넘은 나무에서만 나오는 ‘검은 눈물’의 정체', publishedAt: '2026-07-29', thumbnail: YT_THUMB('YTvXAig5G9U') },
  ],
};
