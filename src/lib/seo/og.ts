import type { Metadata } from 'next';
import { SITE_URL } from './image';

/**
 * 페이지 전용 openGraph — 루트 openGraph 는 deep-merge 되지 않고 통째로 대체되므로
 * openGraph 를 지정하지 않은 페이지는 루트의 og:url(=홈)을 그대로 물려받는다.
 * og:url 이 canonical 과 어긋나면 네이버·SNS 가 해당 페이지를 홈의 중복으로 묶을 수 있어,
 * 자체 openGraph 가 없는 페이지는 이 헬퍼로 url/title/description 을 명시한다.
 */
export function pageOpenGraph(input: {
  path: string;
  title: string;
  description: string;
  image?: string;
}): NonNullable<Metadata['openGraph']> {
  return {
    type: 'website',
    url: `${SITE_URL}${input.path}`,
    siteName: '대라천 ZOEL LIFE',
    locale: 'ko_KR',
    title: input.title,
    description: input.description,
    images: [input.image ?? `${SITE_URL}/opengraph-image.jpg`],
  };
}
