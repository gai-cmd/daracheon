import { Fragment, type ReactNode } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import { readLatestPublishedPostsSafe } from '@/lib/blog/store';
import { isOwnAsset, parseEmphasis, resolveHomeMain, safeHref } from '@/lib/home-main';
import { cleanVideoTitle, formatSnsDate, koreanVideosOnly } from '@/lib/sns';
import JsonLd from '@/components/ui/JsonLd';
import { imageObject } from '@/lib/seo/image';
import { HOME_FAQ, faqPageNode } from '@/lib/seo/home-faq';
import type { MediaTabData } from '@/app/about-agarwood/page';
import type { Announcement } from '@/app/api/admin/announcement/route';
import {
  BentoRoot,
  CountUp,
  HeroVideo,
  HoverVideo,
  IgReels,
  LatestVideo,
  VideoThumb,
  YoutubeMark,
  type VideoItem,
} from './BentoClient';
import styles from './page.module.css';

/**
 * 메인 홈 — 벤토 그리드형.
 *
 * 메인 전체를 촘촘한 벤토 그리드 두 장으로 구성한다. 타일 하나하나가 하위 페이지로 가는 문이고,
 * 영상·카운트업·흐르는 띠·회전 테두리로 '살아 있는' 느낌을 준다.
 * 순서: 인트로 → 공지 띠(어드민 공지가 켜져 있을 때만) → 소식(자주 갱신되는 블록)
 * → 둘러보기 그리드 → 마무리 띠. 재방문 고객이 새 소식부터 보도록 소식 그리드를 인트로 바로 아래에 둔다.
 *
 * 문구·링크·영상·이미지·공식 채널 목록은 어드민 '메인 페이지'(/admin/pages/home-main)가
 * pages.homeMain 에 저장한다. 저장값이 없으면 src/lib/home-main.ts 의 기본값(처음 올린 문구)이 나온다.
 */

export const dynamic = 'force-dynamic';

// 홈은 root layout 의 사이트 공통 JSON-LD(Organization·Brand·WebSite)에 더해 홈 전용 WebPage·FAQPage·대표 제품 ItemList 를 붙인다.
// (root metadata 의 alternates.canonical 이 이미 zoellife.com 으로 지정됨.)
export const metadata: Metadata = {
  // absolute — 루트 template("%s | 조엘라이프 대라천 '참'침향")이 홈 title 에
  // 브랜드를 한 번 더 붙여 2회 중복·53자 초과되던 것을 차단.
  // 어드민 SEO 메타 제목·OG 제목과 동일 문구(33자)로 통일 (2026-09-23, 네이버 40자 권고).
  // 2026-10-03: 핵심 검색어(베트남 침향·침향 오일)를 제목에 직접 넣는다 (31자, 네이버 40자 권고 이내).
  title: { absolute: "조엘라이프 대라천 '참'침향 | 베트남 침향·침향 오일" },
  // Naver 검색엔진 사이트 설명 가이드라인: 80자 이내.
  // (긴 본문은 OG description / FAQ schema / 본문 카피로 보강.)
  description:
    '베트남 5개 직영 농장에서 25년 이상 기른 학명 Aquilaria agallocha Roxburgh 침향. 침향 오일·침향단·침향수.',
  alternates: { canonical: '/' },
};

// 구조화 데이터의 url 은 미리보기 도메인이 섞이지 않도록 정식 도메인으로 고정한다 (/products 와 동일).
const SITE_URL = 'https://zoellife.com';

// 홈 전용 노드 — root layout 의 Organization/Brand/WebSite(@id 참조)와 이어진다.
// FAQPage 는 아래 '자주 묻는 질문' 섹션에 실제로 보이는 문답과 같은 원천(HOME_FAQ)을 쓴다.
const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "조엘라이프 대라천 '참'침향 — 베트남 침향·침향 오일",
      inLanguage: 'ko-KR',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#brand` },
      primaryImageOfPage: { '@id': `${SITE_URL}/#primary-image` },
      breadcrumb: { '@id': `${SITE_URL}/#breadcrumb-home` },
    },
    imageObject({
      id: `${SITE_URL}/#primary-image`,
      url: `${SITE_URL}/opengraph-image.jpg`,
      caption: '대라천 ZOEL LIFE — 베트남 직영 25년 이상, 학명 Aquilaria agallocha Roxburgh 정품 침향',
    }),
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/#breadcrumb-home`,
      itemListElement: [{ '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL }],
    },
    faqPageNode(`${SITE_URL}/#faq`, HOME_FAQ, {
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#brand` },
    }),
  ],
};

// 홈 FAQ 아래 '더 알아보기' — 핵심 검색어별 주제 페이지로 가는 내부 링크(앵커 텍스트 = 검색어).
const TOPIC_LINKS = [
  { href: '/about-agarwood', label: '침향이란? 학명·형성·문헌' },
  { href: '/vietnam-agarwood', label: '베트남 침향 — 산지와 역사' },
  { href: '/agarwood-oil', label: '침향 오일 — 증류·고르는 법' },
  { href: '/about-agarwood#tab-1', label: '진짜 침향 구별법' },
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

function formatDot(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
}

/** 제목 표기 → JSX. 줄바꿈은 <br />, *강조* 는 금색(glow). */
function renderTitle(src: string): ReactNode[] {
  return parseEmphasis(src).map((t, i) =>
    t.type === 'br' ? (
      <br key={i} />
    ) : t.type === 'em' ? (
      <span key={i} className={styles.glow}>
        {t.value}
      </span>
    ) : (
      t.value
    ),
  );
}

/**
 * 인트로 부제 표기 → JSX. 줄바꿈은 데스크톱에서만 꺾이고(brDesk), *구절* 은 한 줄로 묶는다(nowrap).
 * 모바일에서는 줄바꿈이 사라지므로 줄바꿈 뒤 글자 앞에 공백 한 칸을 둬 앞뒤 글자가 붙지 않게 한다.
 */
function renderSubline(src: string): ReactNode[] {
  const tokens = parseEmphasis(src);
  return tokens.map((t, i) => {
    const afterBreak = tokens[i - 1]?.type === 'br';
    if (t.type === 'br') return <br key={i} className={styles.brDesk} />;
    if (t.type === 'em') {
      const span = <span className={styles.nowrap}>{t.value}</span>;
      return <Fragment key={i}>{afterBreak ? ' ' : null}{span}</Fragment>;
    }
    return afterBreak && !/^\s/.test(t.value) ? ` ${t.value}` : t.value;
  });
}

function InstagramMark({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 4.8a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"
      />
    </svg>
  );
}

/** 타일 오른쪽 위 화살표 원 — 호버 시 45° 돈다. */
function Go() {
  return (
    <span className={styles.go} aria-hidden="true">
      <svg viewBox="0 0 16 16" width="14" height="14">
        <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default async function HomePage() {
  const [pagesData, productsRaw, posts, announcement] = await Promise.all([
    readSingleSafe<{ aboutAgarwood?: { mediaTab?: MediaTabData }; homeMain?: unknown }>('pages'),
    readDataSafe<ProductLite>('products'),
    // 블로그 최신 발행글 3개 — 본문은 읽지 않고, 2초 안에 답이 없으면 타일을 숨긴다.
    readLatestPublishedPostsSafe(3),
    readSingleSafe<Partial<Announcement>>('announcement'),
  ]);

  // 어드민 '메인 페이지'에서 저장한 문구·링크·미디어. 저장 전이면 전부 기본값.
  const hm = resolveHomeMain(pagesData?.homeMain);
  const { intro, news, tiles, closing } = hm;

  // 어드민 '공지' 설정(/admin/settings) — 켜져 있고 문구가 있을 때만 소식 위에 한 줄 띠로 보인다.
  const noticeText = announcement?.enabled ? (announcement.text ?? '').trim() : '';
  const notice = noticeText
    ? {
        text: noticeText,
        href: safeHref(announcement?.link),
        label: (announcement?.linkLabel ?? '').trim() || '자세히 보기',
        // gold 는 기본 .notice 가 이미 금색이라 덧붙일 클래스가 없다.
        className:
          announcement?.variant === 'red'
            ? styles.noticeRed
            : announcement?.variant === 'dark'
              ? styles.noticeDark
              : '',
      }
    : null;

  // 어드민 제품 목록 순서를 그대로 따른다 — 앞의 5개가 대표 제품.
  const products = productsRaw.filter((p) => p.published !== false && isOwnAsset(p.image)).slice(0, 5);
  // 기사 링크는 공지와 같은 검사(사이트 내부 경로·http(s))를 통과한 것만 싣는다.
  const press = (pagesData?.aboutAgarwood?.mediaTab?.items ?? [])
    .map((m) => ({ ...m, link: safeHref(m.link) }))
    .filter((m): m is typeof m & { link: string } => !!m.outlet && !!m.link)
    .map((m, i) => ({ m, i }))
    .sort((a, b) => dateKey(b.m.date) - dateKey(a.m.date) || a.i - b.i)
    .slice(0, 6)
    .map(({ m }) => m);

  // 대표 제품 타일과 같은 목록으로 ItemList 구조화 데이터를 만든다 (실제 슬러그).
  const productListJsonLd =
    products.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: '대라천 ZOEL LIFE 대표 침향 제품',
          itemListElement: products.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: p.name,
            url: `${SITE_URL}/products/${p.slug}`,
          })),
        }
      : null;

  // 공식 유튜브 채널(가로 16:9 일반 영상). 한글 제목만, 제목은 해시태그·꼬리표를 걷어 낸다.
  const snsKo = koreanVideosOnly({ youtube: hm.youtube, instagram: hm.instagram });
  const videos: VideoItem[] = snsKo.youtube.videos.map((v) => ({
    id: v.id,
    title: cleanVideoTitle(v.title),
    date: formatSnsDate(v.publishedAt),
    thumbnail: v.thumbnail,
  }));
  const ig = snsKo.instagram;

  return (
    <BentoRoot videos={videos} className={styles.page}>
      {/* 홈 전용 구조화 데이터(WebPage·Breadcrumb·FAQPage) + 대표 제품 ItemList */}
      <JsonLd data={homeJsonLd} />
      {productListJsonLd && <JsonLd data={productListJsonLd} />}
      {/* 전역 CSS 가 main > div > section:first-of-type 에 물결 장식을 붙이므로 한 겹 더 감싼다 */}
      <div className={styles.inner}>
        {/* 1. 인트로 */}
        <header className={styles.intro}>
          <span className={styles.badge} data-reveal="">
            <span className={styles.badgeChip}>{intro.badgeChip}</span>
            {intro.badgeText}
          </span>
          <h1 className={styles.headline} data-reveal="">
            {renderTitle(intro.headline)}
          </h1>
          <p className={styles.subline} data-reveal="">
            {renderSubline(intro.subline)}
          </p>
          <div className={styles.ctas} data-reveal="">
            <Link href={intro.primary.href} className={styles.btnPrimary}>
              {intro.primary.label}
            </Link>
            <Link href={intro.secondary.href} className={styles.btnGhost}>
              {`${intro.secondary.label} `}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        {/* 2. 공지 띠 — 어드민 공지 설정이 켜져 있을 때만 */}
        {notice && (
          <aside className={`${styles.notice} ${notice.className}`.trim()} aria-label="공지" data-reveal="">
            <span className={styles.noticeChip}>공지</span>
            <p className={styles.noticeText}>{notice.text}</p>
            {notice.href &&
              (notice.href.startsWith('/') ? (
                <Link href={notice.href} className={styles.more}>
                  {notice.label} →
                </Link>
              ) : (
                <a href={notice.href} target="_blank" rel="noopener noreferrer" className={styles.more}>
                  {notice.label} →
                </a>
              ))}
          </aside>
        )}

        {/* 3. 소식 — 자주 갱신되는 블록(제품·언론·블로그·공식 채널)을 인트로 바로 아래에 둔다 */}
        <header className={styles.sectionHead} data-reveal="">
          <span className={styles.badge}>
            <span className={styles.badgeChip}>{news.chip}</span>
            {news.label}
          </span>
          <h2 id="home-news-title" className={styles.h2}>
            {renderTitle(news.title)}
          </h2>
        </header>

        <section className={styles.grid} aria-labelledby="home-news-title">
          {/* 대표 제품 — 흐르는 카드 */}
          {products.length > 0 && (
            <div className={`${styles.tile} ${styles.tProducts}`} data-tile="" data-reveal="">
              <div className={styles.tileHead}>
                <span>
                  <span className={styles.cardTitle}>대표 제품</span>
                  <span className={styles.cardSub}>대라천 &lsquo;참&rsquo;침향</span>
                </span>
                <Link href="/products" className={styles.more}>
                  전체 보기 →
                </Link>
              </div>
              <div className={styles.prodViewport}>
                <ul className={styles.prodTrack}>
                  {[0, 1].map((k) =>
                    products.map((p, i) => (
                      <li key={`${k}-${p.slug}`} className={styles.prodItem} aria-hidden={k === 1 ? true : undefined}>
                        <Link href={`/products/${p.slug}`} className={styles.prodCard} tabIndex={k === 1 ? -1 : undefined}>
                          <span className={styles.prodThumb}>
                            {/* 소식이 첫 화면에 오면서 첫 제품 사진이 모바일 LCP 요소가 되었다 — 첫 장만 우선 로딩 */}
                            {/* 이미지 검색(네이버·구글) 노출용으로 제품명을 alt 에 싣는다. 복제 트랙(k=1)은 aria-hidden 이라 중복 낭독 없음 */}
                            <Image
                              src={p.image!}
                              alt={k === 0 ? `${p.name} — 대라천 '참'침향` : ''}
                              fill
                              sizes="200px"
                              priority={k === 0 && i === 0}
                              style={{ objectFit: 'cover' }}
                            />
                          </span>
                          {p.category && <span className={styles.cardSub}>{p.category}</span>}
                          <span className={styles.prodName}>{p.name}</span>
                        </Link>
                      </li>
                    )),
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* 언론 보도 — 세로로 흐르는 목록 */}
          {press.length > 0 && (
            <div className={`${styles.tile} ${styles.tPress}`} data-tile="" data-reveal="">
              <div className={styles.tileHead}>
                <span>
                  <span className={styles.cardTitle}>언론 보도</span>
                  <span className={styles.cardSub}>기사 원문으로 연결됩니다</span>
                </span>
                <Link href="/about-agarwood#tab-5" className={styles.more}>
                  더 보기 →
                </Link>
              </div>
              <div className={styles.tickerViewport}>
                <ul className={styles.tickerTrack}>
                  {[0, 1].map((k) =>
                    press.map((m, i) => (
                      <li key={`${k}-${m.link}-${i}`} aria-hidden={k === 1 ? true : undefined}>
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.pressItem}
                          tabIndex={k === 1 ? -1 : undefined}
                        >
                          <span className={styles.pressOutlet}>
                            {m.outlet}
                            {m.date ? <span className={styles.pressDate}> · {m.date}</span> : null}
                          </span>
                          <span className={styles.pressTitle}>{m.title || m.outlet}</span>
                        </a>
                      </li>
                    )),
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* 블로그 최신 3 */}
          {posts.length > 0 && (
            <div className={`${styles.tile} ${styles.tBlog}`} data-tile="" data-reveal="">
              <div className={styles.tileHead}>
                <span>
                  <span className={styles.cardTitle}>블로그</span>
                  <span className={styles.cardSub}>침향을 더 깊이 읽는 글</span>
                </span>
                <Link href="/blog" className={styles.more}>
                  더 보기 →
                </Link>
              </div>
              <ol className={styles.blogList}>
                {posts.map((p, i) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`} className={styles.blogItem}>
                      <span className={styles.blogIdx}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={styles.blogText}>
                        <span className={styles.blogTitle}>{p.title}</span>
                        <span className={styles.blogDate}>{formatDot(p.publishedAt)}</span>
                      </span>
                      <span className={styles.blogArrow} aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 공식 채널 — 유튜브 영상 (16:9) */}
          {videos.length > 0 && (
            <div className={`${styles.tile} ${styles.tChannel}`} data-tile="" data-reveal="">
              <div className={styles.tileHead}>
                <span className={styles.igAccount}>
                  <span className={`${styles.igMark} ${styles.ytMark}`}>
                    <YoutubeMark size={16} />
                  </span>
                  <span>
                    <span className={styles.cardTitle}>공식 채널</span>
                    <span className={styles.cardSub}>
                      {snsKo.youtube.name} {snsKo.youtube.handle}
                    </span>
                  </span>
                </span>
                <a href={snsKo.youtube.url} target="_blank" rel="noopener noreferrer" className={styles.more}>
                  채널 구독 →
                </a>
              </div>
              <div className={styles.chRow}>
                {videos.slice(0, 2).map((v, i) => (
                  <VideoThumb key={v.id} index={i} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. 벤토 그리드 — 대라천을 알아가는 문들 */}
        {/* 소식 제목 아래에 딸려 읽히지 않도록 화면에는 보이지 않는 제목을 둔다 */}
        <h2 id="home-brand-title" className={styles.srOnly}>
          대라천 둘러보기
        </h2>
        <section className={`${styles.grid} ${styles.gridBrand}`} aria-labelledby="home-brand-title">
          {/* 히어로: 농장 영상 */}
          <Link href={tiles.hero.href} className={`${styles.tile} ${styles.tHero}`} data-tile="" data-reveal="">
            <HeroVideo src={tiles.hero.video} poster={tiles.hero.poster} />
            <span className={styles.scrim} aria-hidden="true" />
            <span className={styles.liveChip}>
              <span className={styles.liveDot} aria-hidden="true" />
              {tiles.hero.chip}
            </span>
            <Go />
            <span className={styles.heroText}>
              <span className={styles.kicker}>{tiles.hero.kicker}</span>
              <span className={styles.heroTitle}>{renderTitle(tiles.hero.title)}</span>
              <span className={styles.heroSub}>{tiles.hero.sub}</span>
            </span>
          </Link>

          {/* 최신 유튜브 영상 */}
          {videos.length > 0 && (
            <div className={`${styles.tile} ${styles.tYt}`} data-tile="" data-reveal="">
              <LatestVideo />
            </div>
          )}

          {/* On-Air */}
          <Link href={tiles.onair.href} className={`${styles.tile} ${styles.tOnair}`} data-tile="" data-reveal="">
            <HoverVideo src={tiles.onair.video} />
            <span className={styles.onairShade} aria-hidden="true" />
            <span className={styles.onairMark} aria-hidden="true">
              ON AIR
            </span>
            <Go />
            <span className={styles.onairBadge}>
              <span className={styles.onairDot} aria-hidden="true" />
              ON AIR
            </span>
            <span className={styles.eq} aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ ['--i' as string]: i }} />
              ))}
            </span>
            <span className={styles.tileText}>
              <span className={styles.kicker}>{tiles.onair.kicker}</span>
              <span className={styles.cardTitleLg}>{renderTitle(tiles.onair.title)}</span>
              <span className={styles.cardSub}>{tiles.onair.sub}</span>
            </span>
          </Link>


          {/* 숫자 */}
          <div className={`${styles.tile} ${styles.tStats}`} data-tile="" data-reveal="">
            <div className={styles.tileHead}>
              <span className={styles.kicker}>{tiles.stats.kicker}</span>
            </div>
            <dl className={styles.stats}>
              {hm.stats.map((s, i) => (
                <div key={`${i}-${s.label}`} className={styles.stat}>
                  <dt className={styles.statLabel}>{s.label}</dt>
                  <dd className={styles.statValue}>
                    <CountUp value={s.value} />
                    <span className={styles.statUnit}>{s.unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 구별법 — 회전하는 빛 테두리 */}
          <Link href={tiles.ring.href} className={`${styles.tile} ${styles.tRing}`} data-tile="" data-reveal="">
            <span className={styles.ring} aria-hidden="true" />
            <span className={styles.ringGlow} aria-hidden="true" />
            <span className={styles.specimen} aria-hidden="true">
              <Image src={tiles.ring.image} alt="" fill sizes="120px" className={styles.specimenImg} />
            </span>
            <Go />
            <span className={styles.ringBody}>
              <span className={styles.kicker}>{tiles.ring.kicker}</span>
              <span className={styles.ringTitle}>{renderTitle(tiles.ring.title)}</span>
              <span className={styles.latin}>{tiles.ring.latin}</span>
              <span className={styles.ringNote}>{tiles.ring.note}</span>
            </span>
          </Link>

          {/* 인스타그램 — 공식 계정 릴스 커버를 세로(9:16) 그대로 넘겨 본다 */}
          <div className={`${styles.tile} ${styles.tIg}`} data-tile="" data-reveal="">
            <a href={ig.url} target="_blank" rel="noopener noreferrer" className={`${styles.tileHead} ${styles.igHeadLink}`}>
              <span className={styles.igAccount}>
                <span className={styles.igMark}>
                  <InstagramMark size={16} />
                </span>
                <span>
                  <span className={`${styles.cardTitle} ${styles.handle}`}>{ig.handle}</span>
                  <span className={styles.cardSub}>Instagram</span>
                </span>
              </span>
              <Go />
            </a>
            <IgReels
              posts={ig.posts.map((p) => ({ id: p.id, permalink: p.permalink, image: p.image, caption: p.caption ?? '' }))}
            />
          </div>

          {/* 브랜드 이야기 — 호버 시 증류 영상 */}
          <Link href={tiles.brand.href} className={`${styles.tile} ${styles.tBrand}`} data-tile="" data-reveal="">
            <Image src={tiles.brand.image} alt="베트남 직영 농장의 침향나무 — 대라천 브랜드 이야기" fill sizes="(max-width: 640px) 100vw, 40vw" className={styles.media} />
            <HoverVideo src={tiles.brand.video} />
            <span className={styles.scrim} aria-hidden="true" />
            <Go />
            <span className={styles.tileText}>
              <span className={styles.kicker}>{tiles.brand.kicker}</span>
              <span className={styles.cardTitleLg}>{renderTitle(tiles.brand.title)}</span>
              <span className={styles.cardSub}>{tiles.brand.sub}</span>
            </span>
          </Link>

          {/* 전시장 — 호버 시 전시장 영상 */}
          <Link href={tiles.showroom.href} className={`${styles.tile} ${styles.tShowroom}`} data-tile="" data-reveal="">
            <HoverVideo src={tiles.showroom.video} poster={tiles.showroom.poster} />
            <span className={styles.scrim} aria-hidden="true" />
            <span className={styles.hoverHint} aria-hidden="true">
              ▶ 영상
            </span>
            <Go />
            <span className={styles.tileText}>
              <span className={styles.kicker}>{tiles.showroom.kicker}</span>
              <span className={styles.cardTitleLg}>{renderTitle(tiles.showroom.title)}</span>
            </span>
          </Link>

          {/* 흐르는 띠 */}
          <div className={`${styles.tile} ${styles.tMarquee}`} data-reveal="">
            <div className={styles.marquee}>
              {[0, 1].map((k) => (
                <span key={k} className={styles.marqueeRun} aria-hidden={k === 1 ? true : undefined}>
                  {hm.marquee.map((m, i) => (
                    <span key={`${i}-${m}`} className={styles.marqueeItem}>
                      {m}
                      <span className={styles.marqueeSep}>✦</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 5. 자주 묻는 질문 — 홈의 유일한 '읽는 본문'. FAQPage 구조화 데이터와 같은 문구(HOME_FAQ).
             답변은 <details> 안에 있어도 HTML 에 그대로 실려 검색·AI 크롤러가 읽는다. */}
        <section className={styles.faq} aria-labelledby="home-faq-title">
          <header className={styles.sectionHead}>
            <span className={styles.badge}>
              <span className={styles.badgeChip}>FAQ</span>
              침향 기본 지식
            </span>
            <h2 id="home-faq-title" className={styles.h2}>
              침향, 자주 묻는 질문
            </h2>
          </header>
          <div className={styles.faqList}>
            {HOME_FAQ.map((f, i) => (
              <details key={f.q} className={styles.faqItem} open={i === 0}>
                <summary className={styles.faqSummary}>
                  <h3 className={styles.faqQ}>{f.q}</h3>
                  <span className={styles.faqIcon} aria-hidden="true" />
                </summary>
                <p className={styles.faqA}>{f.a}</p>
              </details>
            ))}
          </div>
          <nav className={styles.faqTopics} aria-label="침향 더 알아보기">
            {TOPIC_LINKS.map((t) => (
              <Link key={t.href} href={t.href} className={styles.faqTopic}>
                {t.label} <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </section>

        {/* 6. 마무리 띠 */}
        <div className={styles.closing} data-reveal="">
          <p className={styles.closingLine}>{renderTitle(closing.line)}</p>
          <div className={styles.ctas}>
            <Link href={closing.primary.href} className={styles.btnPrimary}>
              {closing.primary.label}
            </Link>
            <Link href={closing.secondary.href} className={styles.btnGhost}>
              {`${closing.secondary.label} `}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </BentoRoot>
  );
}
