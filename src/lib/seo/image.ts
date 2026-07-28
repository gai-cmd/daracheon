/**
 * 이미지 구조화 데이터(ImageObject) 단일 생성기.
 *
 * Google Search Console 「이미지 메타데이터」 리포트는 페이지 안의 모든
 * ImageObject 노드에서 creator / creditText / copyrightNotice / license /
 * acquireLicensePage 5개 필드를 본다. 이 중 license · acquireLicensePage 는
 * 이미지 라이선스 기능의 필수 항목이고, 나머지는 권장 항목이다.
 * (2026-07-28 GSC 경고: creator · copyrightNotice · acquireLicensePage ·
 *  license 4개 누락)
 *
 * 여기서 한 번에 채워 넣어, 새 페이지가 ImageObject 를 직접 조립하다가
 * 필드를 빠뜨리는 재발을 막는다. ImageObject 를 만드는 모든 곳은 이 함수를
 * 거친다.
 */

/** 사이트 정규 도메인 — layout.tsx / sitemap.ts 와 동일 정규화 규칙. */
export function normalizeSiteUrl(raw: string): string {
  return raw
    .replace(/\\[nrt]/g, '')
    .replace(/\s+/g, '')
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\/+$/, '');
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com'
);

/** 이미지 이용 안내 페이지 — license / acquireLicensePage 가 함께 가리킨다. */
export const IMAGE_LICENSE_URL = `${SITE_URL}/image-license`;

/** 저작권 표기 — 법인명 기준. 연도는 사이트 개설년~ 로 고정 표기하지 않는다. */
export const COPYRIGHT_NOTICE = '© 조엘라이프 주식회사 (대라천 ZOEL LIFE)';

/** 크레딧 표기 기본값 — 외부 출처(언론 등)가 있으면 호출부에서 넘긴다. */
export const DEFAULT_CREDIT = '대라천 ZOEL LIFE';

export interface ImageObjectInput {
  /** 이미지 파일 URL. 상대경로면 SITE_URL 을 붙인다. */
  url: string;
  /** 접근성·검색용 설명. */
  caption?: string;
  name?: string;
  description?: string;
  /** @id 를 부여해 다른 노드가 참조할 수 있게 한다. */
  id?: string;
  datePublished?: string;
  /** 언론 제공 사진 등 출처가 우리가 아닐 때. */
  creditText?: string;
  width?: number;
  height?: number;
}

function absolute(url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * 5개 이미지 메타데이터 필드를 모두 채운 ImageObject 노드를 만든다.
 * creator 는 layout.tsx 가 방출하는 Organization 노드를 @id 로 참조한다.
 */
export function imageObject(input: ImageObjectInput): Record<string, unknown> {
  const url = absolute(input.url);
  return {
    '@type': 'ImageObject',
    ...(input.id ? { '@id': input.id } : {}),
    url,
    contentUrl: url,
    ...(input.name ? { name: input.name } : {}),
    ...(input.caption ? { caption: input.caption } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.width ? { width: input.width } : {}),
    ...(input.height ? { height: input.height } : {}),
    inLanguage: 'ko-KR',
    // ── GSC 이미지 메타데이터 5개 필드 ──
    creator: { '@id': `${SITE_URL}/#organization` },
    creditText: input.creditText ?? DEFAULT_CREDIT,
    copyrightNotice: COPYRIGHT_NOTICE,
    license: IMAGE_LICENSE_URL,
    acquireLicensePage: IMAGE_LICENSE_URL,
  };
}
