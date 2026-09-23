/**
 * 홈 '공식 채널' 섹션(YouTube 쇼츠 + Instagram) 공용 타입·헬퍼.
 *
 * 2026-09-23 시안 단계: 데이터는 src/data/sns-sample.ts 의 정적 샘플을 쓴다.
 * 자동 연동 단계에서는 크론이 YouTube RSS·Instagram API 결과를 같은 모양
 * (SnsChannels)으로 Blob 에 저장하고, 썸네일은 외부 CDN 금지 원칙에 따라
 * Vercel Blob 으로 복사한 URL 을 thumbnail/image 에 채운다.
 */

export interface SnsVideo {
  /** YouTube 영상 ID (11자) */
  id: string;
  title: string;
  /** ISO 8601 */
  publishedAt: string;
  /** 세로(9:16) 썸네일 URL */
  thumbnail: string;
}

export interface SnsPost {
  id: string;
  /** 게시물 원문 링크 */
  permalink: string;
  /** 정사각 크롭으로 노출할 이미지 URL */
  image: string;
  caption?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
}

export interface SnsYoutubeChannel {
  name: string;
  handle: string;
  url: string;
  videos: SnsVideo[];
}

export interface SnsInstagramAccount {
  name: string;
  handle: string;
  url: string;
  posts: SnsPost[];
}

export interface SnsChannels {
  youtube: SnsYoutubeChannel;
  instagram: SnsInstagramAccount;
}

/**
 * 채널 원제목을 카드용으로 정리한다.
 * - #해시태그 제거 (카드에서는 잡음)
 * - 업로드 도구가 붙인 것으로 보이는 끝의 'MD' 제거 (공백 없이 한글·문장부호 뒤에 붙은 경우만)
 * - 연속 공백 정리
 */
export function cleanVideoTitle(raw: string): string {
  return raw
    .replace(/(^|\s)#[^\s#]+/g, ' ')
    .replace(/([^\sA-Za-z0-9])MD\s*$/u, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** '2026-09-09T…' → '2026.09.09' */
export function formatSnsDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
}
