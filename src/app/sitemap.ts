import type { MetadataRoute } from 'next';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import { isNeonEnabled, readPostsSafe, readCategoriesSafe } from '@/lib/blog/store';
import {
  blogSitemapDates,
  isBlogReadSuspect,
  recordEditDate,
  validDateString,
} from '@/lib/blog/sitemap-dates';
import type { Product } from '@/data/products';
import { canonicalProductSlug } from '@/lib/product-slugs';
import type { MediaItem } from '@/app/media/MediaGallery';
import { collectSitemapImages, extractBodyBlobImages } from '@/lib/seo/sitemap-images';
import { collectRecordImages, pageUpdatedAt } from '@/lib/seo/sitemap-pages';
import { AGARWOOD_BENEFITS } from '@/content/topics/agarwood-benefits';
import { AGARWOOD_HWAN } from '@/content/topics/agarwood-hwan';
import { AGARWOOD_OIL } from '@/content/topics/agarwood-oil';
import { AGARWOOD_TEA } from '@/content/topics/agarwood-tea';
import { VIETNAM_AGARWOOD } from '@/content/topics/vietnam-agarwood';

// 코드로 정의한 주제 허브 — 콘텐츠 파일의 dateModified(JSON-LD 와 같은 값)와 대표 이미지를 sitemap 에 싣는다.
// 날짜는 허브 내용을 고치는 커밋에서 콘텐츠 파일 쪽을 올린다(여기서 따로 적지 않는다).
const TOPIC_HUBS = [
  { path: '/vietnam-agarwood', hub: VIETNAM_AGARWOOD },
  { path: '/agarwood-oil', hub: AGARWOOD_OIL },
  { path: '/agarwood-benefits', hub: AGARWOOD_BENEFITS },
  { path: '/agarwood-hwan', hub: AGARWOOD_HWAN },
  { path: '/agarwood-tea', hub: AGARWOOD_TEA },
];

// 어드민에서 편집하는 페이지 — pages 레코드의 키. dateKeys 는 그 페이지가 함께 보여 주는 데이터까지
// (/brand-story 는 쇼룸 챕터도 싣는다), imageKey 는 이미지를 모을 자기 데이터.
const EDITED_PAGES = [
  { path: '/about-agarwood', imageKey: 'aboutAgarwood', dateKeys: ['aboutAgarwood'] },
  { path: '/brand-story', imageKey: 'brandStory', dateKeys: ['brandStory', 'showroom'] },
  { path: '/showroom', imageKey: 'showroom', dateKeys: ['showroom'] },
];

// 신규 블로그·제품(blob 즉시 반영)이 다음 배포 없이도 sitemap 에 반영되도록
// 최대 1시간 주기로 재생성. 발행 핸들러의 revalidatePath('/sitemap.xml') 와 병행.
export const revalidate = 3600;

// env 값에 줄바꿈/공백 섞이면 sitemap URL 이 깨져 검색엔진 색인 실패.
// 모든 공백·제어문자 제거 + trailing slash 정리.
function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
    .replace(/\\[nrt]/g, '')
    .replace(/\s+/g, '')
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\/+$/, '');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  // lastmod 는 실제 수정 시각을 아는 URL(블로그 글·카테고리·목록, 편집 이력(_mt)이 있는 제품,
  // 콘텐츠 파일에 dateModified 가 있는 주제 허브, 어드민 저장 시각이 기록된 편집 페이지)에만
  // 넣는다. 정적 페이지 등에 요청 시각을 넣으면 매 크롤마다 '방금 바뀜'이 되어 검색엔진이 사이트 전체 lastmod 를 불신한다.

  // 모든 URL 에 단일 ko-KR + x-default hreflang 신호를 부여 — Google 이
  // 다국어 변형이 없음을 명확히 인지하도록 한다. (단일 한국어 사이트.)
  const withAlternates = (url: string) => ({
    languages: { 'ko-KR': url, 'x-default': url },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1.0, alternates: withAlternates(baseUrl) },
    { url: `${baseUrl}/about-agarwood`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/about-agarwood`) },
    // 핵심 검색어 주제 허브 — '베트남 침향' · '침향 오일'
    { url: `${baseUrl}/vietnam-agarwood`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/vietnam-agarwood`) },
    { url: `${baseUrl}/agarwood-oil`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/agarwood-oil`) },
    // 정보 검색어 랜딩 — '침향 효능' · '침향환/침향단' · '침향차'
    { url: `${baseUrl}/agarwood-benefits`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/agarwood-benefits`) },
    { url: `${baseUrl}/agarwood-hwan`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/agarwood-hwan`) },
    { url: `${baseUrl}/agarwood-tea`, changeFrequency: 'monthly', priority: 0.9, alternates: withAlternates(`${baseUrl}/agarwood-tea`) },
    { url: `${baseUrl}/brand-story`, changeFrequency: 'monthly', priority: 0.8, alternates: withAlternates(`${baseUrl}/brand-story`) },
    { url: `${baseUrl}/showroom`, changeFrequency: 'monthly', priority: 0.7, alternates: withAlternates(`${baseUrl}/showroom`) },
    { url: `${baseUrl}/products`, changeFrequency: 'weekly', priority: 0.9, alternates: withAlternates(`${baseUrl}/products`) },
    { url: `${baseUrl}/home-shopping`, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/home-shopping`) },
    { url: `${baseUrl}/company`, changeFrequency: 'monthly', priority: 0.6, alternates: withAlternates(`${baseUrl}/company`) },
    { url: `${baseUrl}/media`, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/media`) },
    { url: `${baseUrl}/reviews`, changeFrequency: 'weekly', priority: 0.7, alternates: withAlternates(`${baseUrl}/reviews`) },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.8, alternates: withAlternates(`${baseUrl}/blog`) },
    { url: `${baseUrl}/guide`, changeFrequency: 'monthly', priority: 0.7, alternates: withAlternates(`${baseUrl}/guide`) },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/privacy`) },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/terms`) },
    // 모든 ImageObject 의 license · acquireLicensePage 목적지 — 크롤러가 실제로
    // 도달해야 이미지 라이선스 구조화 데이터가 유효하다.
    { url: `${baseUrl}/image-license`, changeFrequency: 'yearly', priority: 0.3, alternates: withAlternates(`${baseUrl}/image-license`) },
  ];

  const routeFor = (path: string) => staticRoutes.find((r) => r.url === `${baseUrl}${path}`);

  // 주제 허브 5개 — dateModified → lastmod, 대표 이미지 → 이미지 항목 (Blob·/public 원본만).
  for (const { path, hub } of TOPIC_HUBS) {
    const route = routeFor(path);
    if (!route) continue;
    const lastModified = validDateString(hub.dateModified);
    if (lastModified) route.lastModified = lastModified;
    const images = collectSitemapImages([hub.heroImage?.src], baseUrl);
    if (images.length) route.images = images;
  }

  try {
    // 어드민 편집 페이지 — 저장 시각이 기록돼 있을 때만 lastmod, 저장된 페이지 데이터의 이미지를 이미지 항목으로.
    const pages = await readSingleSafe<Record<string, unknown>>('pages');
    for (const { path, imageKey, dateKeys } of EDITED_PAGES) {
      const route = routeFor(path);
      if (!route || !pages) continue;
      const lastModified = pageUpdatedAt(pages, ...dateKeys);
      if (lastModified) route.lastModified = lastModified;
      const images = collectSitemapImages(collectRecordImages(pages[imageKey]), baseUrl);
      if (images.length) route.images = images;
    }
  } catch {
    /* 페이지 데이터 로드 실패 시 lastmod·이미지 없이 */
  }

  let productDetailRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await readDataSafe<Product>('products');
    // 비공개(published=false) 제품은 sitemap 에서 제외 — 검색엔진에 노출하지 않음.
    productDetailRoutes = products
      .filter((p) => p.slug && p.published !== false)
      .map((p) => {
        const url = `${baseUrl}/products/${canonicalProductSlug(p.slug)}`;
        // 저장된 마지막 편집 시각(_mt)이 있을 때만 lastmod — 없으면 태그 생략.
        const lastModified = recordEditDate(p);
        // 이미지 확장 — 대표 이미지 + 갤러리 (Blob·/public 원본만, 외부 CDN 제외)
        const images = collectSitemapImages([p.image, ...(p.gallery ?? [])], baseUrl);
        return {
          url,
          ...(lastModified ? { lastModified } : {}),
          ...(images.length ? { images } : {}),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          alternates: withAlternates(url),
        };
      });
  } catch {
    /* DB 조회 실패 시 정적 경로만 반환 */
  }

  let blogRoutes: MetadataRoute.Sitemap = [];
  const [posts, categories] = await Promise.all([
    readPostsSafe(),
    readCategoriesSafe(),
  ]);
  // 블로그 DB 가 켜져 있는데 발행 글이 0편이면 읽기 실패다(readPostsSafe 는 실패를 [] 로 삼킨다).
  // 여기서 던져야 재생성(ISR)이 실패로 끝나 직전의 온전한 sitemap 이 계속 나간다 — 블로그 URL 이 전부
  // 빠진 사본을 캐시하지 않는다. (빌드 시점에 DB 가 죽어 있으면 빌드가 실패한다 — 잘린 sitemap 배포보다 낫다.)
  if (isBlogReadSuspect(isNeonEnabled(), posts.filter((p) => p.status === 'published').length)) {
    throw new Error('[sitemap] blog read returned no published posts — keeping the last good sitemap');
  }
  try {
    // 잘못된/빈 updatedAt 은 helper 가 publishedAt 또는 '날짜 없음'으로 처리 — Invalid Date 가
    // toISOString RangeError 로 catch 에 흘러 블로그 전량이 sitemap 에서 사라지던 경로도 막는다.
    const dates = blogSitemapDates(posts, categories);
    const blogIndex = staticRoutes.find((r) => r.url === `${baseUrl}/blog`);
    if (blogIndex && dates.latest) blogIndex.lastModified = dates.latest;
    const postBySlug = new Map(posts.filter((p) => p.status === 'published').map((p) => [p.slug, p]));
    const postRoutes: MetadataRoute.Sitemap = dates.posts.map((p) => {
      const url = `${baseUrl}/blog/${p.slug}`;
      const post = postBySlug.get(p.slug);
      // 이미지 확장 — 커버 + 저장 본문의 Blob 이미지 최대 5개 (본문은 읽기만)
      const images = post
        ? collectSitemapImages([post.coverImage, ...extractBodyBlobImages(post.content)], baseUrl)
        : [];
      return {
        url,
        ...(p.lastModified ? { lastModified: p.lastModified } : {}),
        ...(images.length ? { images } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: withAlternates(url),
      };
    });
    // 발행 글이 0편인 카테고리는 noindex 페이지라 sitemap 에서 뺀다 (helper 가 걸러 줌).
    const categoryRoutes: MetadataRoute.Sitemap = dates.categories.map((c) => {
      const url = `${baseUrl}/blog/category/${c.id}`;
      return {
        url,
        ...(c.lastModified ? { lastModified: c.lastModified } : {}),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
        alternates: withAlternates(url),
      };
    });
    blogRoutes = [...categoryRoutes, ...postRoutes];
  } catch {
    /* 블로그 데이터 로드 실패 시 정적 경로만 */
  }

  try {
    // /media 사진 갤러리 이미지 — DB 미디어 중 사진만 (Blob·/public 원본만)
    const media = await readDataSafe<MediaItem>('media');
    const photos = collectSitemapImages(
      media.filter((m) => m.type === 'photo').map((m) => m.image),
      baseUrl,
    );
    const mediaRoute = staticRoutes.find((r) => r.url === `${baseUrl}/media`);
    if (mediaRoute && photos.length) mediaRoute.images = photos;
  } catch {
    /* 미디어 데이터 로드 실패 시 이미지 없이 */
  }

  return [...staticRoutes, ...productDetailRoutes, ...blogRoutes];
}
