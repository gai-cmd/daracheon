import type { Metadata } from 'next';
import Link from 'next/link';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import { readCategoriesSafe, readPostsSafe } from '@/lib/blog/store';
import { SNS_SAMPLE } from '@/data/sns-sample';
import { cleanVideoTitle, formatSnsDate, koreanVideosOnly } from '@/lib/sns';
import type { MediaTabData } from '@/app/about-agarwood/page';
import Feed from './Feed';
import type { FeedItem } from './types';
import styles from './page.module.css';

/**
 * 메인 시안 A — 갤러리형 (2026-09-26).
 *
 * motionsites.ai 메인처럼 첫 화면을 '살아 있는 피드'로 둔다.
 * 쇼츠·농장 영상·인스타그램·제품·블로그·언론 보도를 한 갤러리에 섞어
 * 필터 칩으로 골라 보게 한다. 현행 다크·골드·명조 톤과 의도적으로 결을 달리한
 * 비교용 시안이라 검색 노출을 막는다.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: "메인 시안 A 갤러리형 | 조엘라이프 대라천 '참'침향" },
  robots: { index: false, follow: false },
};

const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

/**
 * 농장·브랜드 영상 (Blob mp4).
 * ⚠ 원본이 16~41MB 라 preload="none" + 포스터로만 버틴다. 운영 전환 시에는
 *   5~8초 길이의 저용량 루프(수 MB 이하)로 따로 인코딩해 Blob 에 올려야 한다.
 */
const FARM_VIDEOS: Array<{ file: string; poster: string; title: string; sub: string }> = [
  { file: 'uploads/media/farm-video-03-dongnai.mp4', poster: 'pages/process/process-02-farm.jpg', title: '동나이 직영 농장의 숲', sub: '농장 영상' },
  { file: 'uploads/factory-footage/harvest-agarwood-TjZSNSkQnn2br7raRpYhaoE25a3MuK.mp4', poster: 'pages/process/process-05-harvest.jpg', title: '수지가 앉은 원목을 채취합니다', sub: '농장 영상 · 채취' },
  { file: 'uploads/media/farm-video-02-planting.mp4', poster: 'pages/process/process-01-seedling.jpg', title: '묘목을 심는 날', sub: '농장 영상 · 식재' },
  { file: 'uploads/ns-brand-videos/ns-showroom-uV5DLMRkwrdC8J0scFqDa3qgNszM3C.mp4', poster: 'uploads/showroom/showroom-01.jpg', title: '대라천 침향 전시장', sub: '브랜드 영상' },
  { file: 'uploads/factory-footage/high-temp-distill-72h-KXSzhfXnfsHUkaT9U1WBw8kDWZ3iZ3.mp4', poster: 'pages/process/process-06-distill.jpg', title: '고온 증류, 오일이 모이기까지', sub: '농장 영상 · 증류' },
  { file: 'uploads/ns-brand-videos/ns-title-5zHJXMWFYrgkS9w071NjKlJypJLIje.mp4', poster: 'pages/hero/company-hero-default.jpg', title: "대라천 '참'침향 브랜드 필름", sub: '브랜드 영상' },
];

/** 그리드 사이사이에 끼우는 안내 카드 */
const PROMOS: Array<{ href: string; kicker: string; line: string; body: string; cta: string }> = [
  {
    href: '/about-agarwood',
    kicker: '진짜 침향 구별법',
    line: '침향은 학명부터 확인합니다',
    body: '식약처 등재 학명 Aquilaria Agallocha Roxburgh',
    cta: '구별법 보기',
  },
  {
    href: '/showroom',
    kicker: '전시장',
    line: '원목부터 완제품까지, 직접 맡아 보세요',
    body: '대라천 침향 전시장 둘러보기',
    cta: '전시장 보기',
  },
  {
    href: '/home-shopping',
    kicker: 'On-Air 특별관',
    line: '방송에서 소개한 대라천을 다시 봅니다',
    body: '홈쇼핑 방송 다시보기와 방송 구성',
    cta: '특별관 가기',
  },
];

/**
 * 종류별로 뭉치지 않게 섞는 순서. 피드는 짧은 열부터 채우므로
 * 이 순서가 대략 '왼쪽 위 → 오른쪽 아래' 읽기 순서가 된다.
 */
const PATTERN: FeedItem['kind'][] = [
  'video', 'short', 'promo', 'product', 'insta',
  'short', 'blog', 'video', 'press', 'product',
  'insta', 'short', 'video', 'product', 'blog',
  'press', 'promo', 'short', 'video', 'insta',
  'product', 'short', 'blog', 'video', 'press',
  'short', 'promo', 'product', 'insta', 'video',
];

interface ProductLite {
  slug: string;
  name: string;
  category?: string;
  image?: string;
  published?: boolean;
}

/** '2026.05.16' / '2026-05-16' → 정렬용 숫자. 형식을 모르면 0. */
function dateKey(raw?: string): number {
  const m = (raw ?? '').trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  return m ? Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]) : 0;
}

/** 외부 CDN 금지 — Blob·번들 자산만 통과시킨다. */
function ownAsset(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith(BLOB) || url.startsWith('/') ? url : undefined;
}

/** 종류별 대기열을 PATTERN 순서로 섞고, 남은 것은 뒤에 번갈아 붙인다. */
function interleave(items: FeedItem[]): FeedItem[] {
  const queues = new Map<FeedItem['kind'], FeedItem[]>();
  for (const it of items) {
    const q = queues.get(it.kind) ?? [];
    q.push(it);
    queues.set(it.kind, q);
  }
  const out: FeedItem[] = [];
  for (const kind of PATTERN) {
    const next = queues.get(kind)?.shift();
    if (next) out.push(next);
  }
  let left = true;
  while (left) {
    left = false;
    for (const q of queues.values()) {
      const next = q.shift();
      if (next) {
        out.push(next);
        left = true;
      }
    }
  }
  return out;
}

export default async function HomeV3Page() {
  const [pagesData, productsRaw, postsRaw, categories] = await Promise.all([
    readSingleSafe<{ aboutAgarwood?: { mediaTab?: MediaTabData } }>('pages'),
    readDataSafe<ProductLite>('products'),
    readPostsSafe(),
    readCategoriesSafe(),
  ]);

  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const sns = koreanVideosOnly(SNS_SAMPLE);

  const shorts: FeedItem[] = sns.youtube.videos.slice(0, 6).map((v) => ({
    kind: 'short',
    key: `yt-${v.id}`,
    videoId: v.id,
    title: cleanVideoTitle(v.title),
    date: formatSnsDate(v.publishedAt),
    thumb: v.thumbnail,
  }));

  const videos: FeedItem[] = FARM_VIDEOS.map((v, i) => ({
    kind: 'video',
    key: `mv-${i}`,
    src: `${BLOB}/${v.file}`,
    poster: `${BLOB}/${v.poster}`,
    title: v.title,
    sub: v.sub,
    ratio: i % 2 === 0 ? 'wide' : 'tall',
    href: '/media',
  }));

  // 인스타그램은 API 연결 전 샘플 — 영상 포스터와 겹치지 않는 사진만 고른다.
  const igPick = new Set(['s3', 's7', 's8', 's6']);
  const insta: FeedItem[] = sns.instagram.posts
    .filter((p) => igPick.has(p.id))
    .map((p) => ({
      kind: 'insta',
      key: `ig-${p.id}`,
      href: p.permalink,
      image: p.image,
      caption: p.caption ?? sns.instagram.name,
      handle: sns.instagram.handle,
      mediaType: p.mediaType,
    }));

  // 어드민 제품 목록 순서를 그대로 따른다 — 앞쪽이 대표 제품.
  const products: FeedItem[] = productsRaw
    .filter((p) => p.published !== false && ownAsset(p.image))
    .slice(0, 5)
    .map((p) => ({
      kind: 'product',
      key: `pd-${p.slug}`,
      href: `/products/${p.slug}`,
      image: p.image!,
      name: p.name,
      category: p.category ?? '제품',
    }));

  const blog: FeedItem[] = postsRaw
    .filter((p) => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 4)
    .map((p) => ({
      kind: 'blog',
      key: `bl-${p.slug}`,
      href: `/blog/${p.slug}`,
      image: ownAsset(p.coverImage),
      title: p.title,
      excerpt: p.excerpt,
      category: catName.get(p.categoryId) ?? '블로그',
      date: formatSnsDate(p.publishedAt ?? ''),
    }));

  const press: FeedItem[] = (pagesData?.aboutAgarwood?.mediaTab?.items ?? [])
    .filter((m) => m.outlet && m.link)
    .map((m, i) => ({ m, i }))
    .sort((a, b) => dateKey(b.m.date) - dateKey(a.m.date) || a.i - b.i)
    .slice(0, 4)
    .map(({ m }, i) => ({
      kind: 'press',
      key: `pr-${i}`,
      href: m.link!,
      outlet: m.outlet,
      title: m.title || m.outlet,
      date: m.date ?? '',
    }));

  const promos: FeedItem[] = PROMOS.map((p, i) => ({ kind: 'promo', key: `promo-${i}`, ...p }));

  const items = interleave([...shorts, ...videos, ...insta, ...products, ...blog, ...press, ...promos]);

  return (
    <div className={styles.page}>
      {/* 1. HERO — 가운데 정렬 한 문장 + 버튼 두 개 */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            농장 · 제품 · 공식 채널 소식
          </span>
          <h1 className={styles.title}>
            진짜 침향의 오늘을,
            <br />
            <em className={`${styles.titleEm} ${styles.glow}`}>농장에서 바로</em> 전합니다
          </h1>
          <p className={styles.sub}>
            베트남 직영 농장의 하루부터 제품과 언론 보도까지 한곳에 모았습니다.{' '}
            <br className={styles.brWide} />
            식약처 등재 학명 Aquilaria Agallocha Roxburgh — 원산지부터 직접 책임집니다.
          </p>
          <div className={styles.ctas}>
            <Link href="/products" className={styles.btnPrimary}>제품 보기</Link>
            <a href="#feed" className={styles.btnGhost}>새 소식 둘러보기 ↓</a>
          </div>
          <ul className={styles.facts}>
            <li>베트남 직영 농장 25년</li>
            <li>하띤 직영 농장 200ha</li>
            <li>베트남 5개 지역 직영</li>
            <li>공식 인증 12건</li>
          </ul>
        </div>
      </section>

      {/* 2~3. 필터 칩 + 메이슨리 피드 */}
      <Feed items={items} />

      {/* 4. CLOSING — 문의 */}
      <section className={styles.closing}>
        <div className={styles.closingInner}>
          <h2 className={styles.closingTitle}>
            궁금한 점은 <em className={styles.titleEm}>직접</em> 물어보세요
          </h2>
          <p className={styles.closingSub}>제품 선택부터 전시장 방문까지, 편하게 문의해 주세요.</p>
          <div className={styles.ctas}>
            <Link href="/company#contact" className={styles.btnPrimary}>문의하기</Link>
            <Link href="/showroom" className={styles.btnGhost}>전시장 안내</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
