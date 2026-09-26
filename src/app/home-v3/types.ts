/**
 * 갤러리형 메인 시안(/home-v3) 피드 카드 타입.
 * 서버(page.tsx)에서 데이터를 이 모양으로 정리해 클라이언트 피드(Feed.tsx)에 넘긴다.
 */

export type FeedFilter = 'all' | 'short' | 'video' | 'insta' | 'product' | 'blog' | 'press';

interface Base {
  key: string;
}

export interface ShortItem extends Base {
  kind: 'short';
  videoId: string;
  title: string;
  date: string;
  thumb: string;
}

export interface VideoItem extends Base {
  kind: 'video';
  src: string;
  poster: string;
  title: string;
  sub: string;
  /** 카드 크롭 비율 */
  ratio: 'wide' | 'tall';
  href: string;
}

export interface InstaItem extends Base {
  kind: 'insta';
  href: string;
  image: string;
  caption: string;
  handle: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
}

export interface ProductItem extends Base {
  kind: 'product';
  href: string;
  image: string;
  name: string;
  category: string;
}

export interface BlogItem extends Base {
  kind: 'blog';
  href: string;
  image?: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
}

export interface PressItem extends Base {
  kind: 'press';
  href: string;
  outlet: string;
  title: string;
  date: string;
}

export interface PromoItem extends Base {
  kind: 'promo';
  href: string;
  kicker: string;
  line: string;
  body: string;
  cta: string;
}

export type FeedItem = ShortItem | VideoItem | InstaItem | ProductItem | BlogItem | PressItem | PromoItem;
