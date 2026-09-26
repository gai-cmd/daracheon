import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import { readPostsSafe } from '@/lib/blog/store';
import { SNS_SAMPLE } from '@/data/sns-sample';
import { cleanVideoTitle, formatSnsDate, koreanVideosOnly } from '@/lib/sns';
import type { MediaTabData } from '@/app/about-agarwood/page';
import {
  BentoRoot,
  CountUp,
  HeroVideo,
  HoverVideo,
  LatestVideo,
  VideoThumb,
  YoutubeMark,
  type VideoItem,
} from './BentoClient';
import styles from './page.module.css';

/**
 * 메인 시안 C — 벤토형 (2026-09-26).
 *
 * 메인 전체를 촘촘한 벤토 그리드 두 장으로 구성한다. 타일 하나하나가 하위 페이지로 가는 문이고,
 * 영상·카운트업·흐르는 띠·회전 테두리로 '살아 있는' 느낌을 준다.
 * 현행 홈의 골드·명조 톤에서 벗어나 #121212 바탕 + Noto Sans KR 굵은 제목 + 절제된 앰버 포인트로 간다.
 * 비교용 별도 경로라 검색 노출을 막는다.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: "메인 시안 C 벤토형 | 조엘라이프 대라천 '참'침향" },
  robots: { index: false, follow: false },
};

const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

// 영상 원본이 16~41MB 라 첫 화면 자동 재생은 가장 가벼운 농장 영상 하나만 쓴다.
// 운영 전환 시에는 5MB 이하의 짧은 압축 루프 영상으로 반드시 교체한다.
const VIDEO = {
  farm: `${BLOB}/uploads/media/farm-video-03-dongnai.mp4`,
  distill: `${BLOB}/uploads/factory-footage/high-temp-distill-72h-KXSzhfXnfsHUkaT9U1WBw8kDWZ3iZ3.mp4`,
  showroom: `${BLOB}/uploads/ns-brand-videos/ns-showroom-uV5DLMRkwrdC8J0scFqDa3qgNszM3C.mp4`,
  title: `${BLOB}/uploads/ns-brand-videos/ns-title-5zHJXMWFYrgkS9w071NjKlJypJLIje.mp4`,
};

const IMG = {
  farm: `${BLOB}/pages/process/process-02-farm.jpg`,
  company: `${BLOB}/pages/hero/company-hero-default.jpg`,
  showroom: `${BLOB}/uploads/showroom/showroom-01.jpg`,
  species: `${BLOB}/uploads/pages/species-card-roxburgh.jpg`,
};

const STATS = [
  { value: 25, unit: '년', label: '직영 재배' },
  { value: 200, unit: 'ha', label: '하띤 직영 농장' },
  { value: 5, unit: '개 지역', label: '베트남 직영' },
  { value: 12, unit: '건', label: '공식 인증' },
];

const MARQUEE = [
  '식약처 등재 학명 Aquilaria Agallocha Roxburgh',
  '베트남 직영 농장 25년',
  '하띤 직영 농장 200ha',
  '원산지부터 직접 책임',
  '묘목부터 채취·증류까지',
  '공식 인증 12건',
];

interface ProductLite {
  slug: string;
  name: string;
  category?: string;
  image?: string;
  published?: boolean;
}

/** 외부 CDN 금지 원칙 — Blob·번들 자산만 통과시킨다. */
function isOwnAsset(url?: string): url is string {
  return !!url && (url.startsWith(BLOB) || url.startsWith('/'));
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

export default async function HomeV5Page() {
  const [pagesData, productsRaw, postsRaw] = await Promise.all([
    readSingleSafe<{ aboutAgarwood?: { mediaTab?: MediaTabData } }>('pages'),
    readDataSafe<ProductLite>('products'),
    readPostsSafe(),
  ]);

  // 어드민 제품 목록 순서를 그대로 따른다 — 앞의 5개가 대표 제품.
  const products = productsRaw.filter((p) => p.published !== false && isOwnAsset(p.image)).slice(0, 5);
  const posts = postsRaw
    .filter((p) => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 3);
  const press = (pagesData?.aboutAgarwood?.mediaTab?.items ?? [])
    .filter((m) => m.outlet && m.link)
    .map((m, i) => ({ m, i }))
    .sort((a, b) => dateKey(b.m.date) - dateKey(a.m.date) || a.i - b.i)
    .slice(0, 6)
    .map(({ m }) => m);

  // 공식 유튜브 채널(가로 16:9 일반 영상). 한글 제목만, 제목은 해시태그·꼬리표를 걷어 낸다.
  const snsKo = koreanVideosOnly(SNS_SAMPLE);
  const videos: VideoItem[] = snsKo.youtube.videos.map((v) => ({
    id: v.id,
    title: cleanVideoTitle(v.title),
    date: formatSnsDate(v.publishedAt),
    thumbnail: v.thumbnail,
  }));
  const ig = snsKo.instagram;
  // 인스타 2×2 — 칸마다 사진 두 장을 번갈아 보여 준다(8장 → 4칸).
  const igCells = [0, 1, 2, 3].map((i) => [ig.posts[i], ig.posts[i + 4]].filter(Boolean));

  return (
    <BentoRoot videos={videos} className={styles.page}>
      {/* 전역 CSS 가 main > div > section:first-of-type 에 물결 장식을 붙이므로 한 겹 더 감싼다 */}
      <div className={styles.inner}>
        {/* 1. 인트로 */}
        <header className={styles.intro}>
          <span className={styles.badge} data-reveal="">
            <span className={styles.badgeChip}>25년</span>
            베트남 직영 농장에서 기른 침향
          </span>
          <h1 className={styles.headline} data-reveal="">
            묘목부터 증류까지,
            <br />
            직접 키운 <span className={styles.glow}>진짜 침향</span>
          </h1>
          <p className={styles.subline} data-reveal="">
            식약처 등재 학명 <span className={styles.nowrap}>Aquilaria Agallocha Roxburgh</span>.
            <br className={styles.brDesk} /> 원산지부터 직접 책임지는 대라천 &lsquo;참&rsquo;침향입니다.
          </p>
          <div className={styles.ctas} data-reveal="">
            <Link href="/products" className={styles.btnPrimary}>
              제품 보기
            </Link>
            <Link href="/about-agarwood" className={styles.btnGhost}>
              진짜 침향 구별법 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        {/* 2. 벤토 그리드 1 — 대라천을 알아가는 문들 */}
        <section className={styles.grid} aria-label="대라천 둘러보기">
          {/* 히어로: 농장 영상 */}
          <Link href="/media" className={`${styles.tile} ${styles.tHero}`} data-tile="" data-reveal="">
            <HeroVideo src={VIDEO.farm} poster={IMG.farm} />
            <span className={styles.scrim} aria-hidden="true" />
            <span className={styles.liveChip}>
              <span className={styles.liveDot} aria-hidden="true" />
              농장 영상
            </span>
            <Go />
            <span className={styles.heroText}>
              <span className={styles.kicker}>침향 농장 이야기</span>
              <span className={styles.heroTitle}>
                베트남 직영 농장,
                <br />
                오늘의 풍경
              </span>
              <span className={styles.heroSub}>묘목부터 채취·증류까지, 영상과 사진으로 전합니다</span>
            </span>
          </Link>

          {/* 최신 유튜브 영상 */}
          {videos.length > 0 && (
            <div className={`${styles.tile} ${styles.tYt}`} data-tile="" data-reveal="">
              <LatestVideo />
            </div>
          )}

          {/* On-Air */}
          <Link href="/home-shopping" className={`${styles.tile} ${styles.tOnair}`} data-tile="" data-reveal="">
            <HoverVideo src={VIDEO.title} />
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
              <span className={styles.kicker}>홈쇼핑 방송</span>
              <span className={styles.cardTitleLg}>On-Air 특별관</span>
              <span className={styles.cardSub}>방송 다시보기</span>
            </span>
          </Link>


          {/* 숫자 */}
          <div className={`${styles.tile} ${styles.tStats}`} data-tile="" data-reveal="">
            <div className={styles.tileHead}>
              <span className={styles.kicker}>숫자로 보는 대라천</span>
            </div>
            <dl className={styles.stats}>
              {STATS.map((s) => (
                <div key={s.label} className={styles.stat}>
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
          <Link href="/about-agarwood" className={`${styles.tile} ${styles.tRing}`} data-tile="" data-reveal="">
            <span className={styles.ring} aria-hidden="true" />
            <span className={styles.ringGlow} aria-hidden="true" />
            <span className={styles.specimen} aria-hidden="true">
              <Image src={IMG.species} alt="" fill sizes="120px" className={styles.specimenImg} />
            </span>
            <Go />
            <span className={styles.ringBody}>
              <span className={styles.kicker}>진짜 침향 구별법</span>
              <span className={styles.ringTitle}>진짜 침향은 학명부터 확인합니다</span>
              <span className={styles.latin}>Aquilaria Agallocha Roxburgh</span>
              <span className={styles.ringNote}>식약처 등재 학명 · 인증 · 산지로 가려내는 법</span>
            </span>
          </Link>

          {/* 인스타그램 2×2 */}
          <a
            href={ig.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.tile} ${styles.tIg}`}
            data-tile=""
            data-reveal=""
          >
            <span className={styles.tileHead}>
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
            </span>
            <span className={styles.igGrid}>
              {igCells.map((cell, i) => (
                <span key={i} className={styles.igCell} style={{ ['--i' as string]: i }}>
                  {cell.map((p, j) => (
                    <Image
                      key={p.id}
                      src={p.image}
                      alt={j === 0 ? p.caption ?? '' : ''}
                      fill
                      sizes="(max-width: 640px) 45vw, 180px"
                      className={j === 0 ? styles.igImg : `${styles.igImg} ${styles.igImgAlt}`}
                    />
                  ))}
                </span>
              ))}
            </span>
          </a>

          {/* 브랜드 이야기 — 호버 시 증류 영상 */}
          <Link href="/brand-story" className={`${styles.tile} ${styles.tBrand}`} data-tile="" data-reveal="">
            <Image src={IMG.company} alt="" fill sizes="(max-width: 640px) 100vw, 40vw" className={styles.media} />
            <HoverVideo src={VIDEO.distill} />
            <span className={styles.scrim} aria-hidden="true" />
            <Go />
            <span className={styles.tileText}>
              <span className={styles.kicker}>브랜드 이야기</span>
              <span className={styles.cardTitleLg}>25년, 한 회사가 원산지부터 잇습니다</span>
              <span className={styles.cardSub}>베트남 직영 생산부터 한국 직판까지</span>
            </span>
          </Link>

          {/* 전시장 — 호버 시 전시장 영상 */}
          <Link href="/showroom" className={`${styles.tile} ${styles.tShowroom}`} data-tile="" data-reveal="">
            <HoverVideo src={VIDEO.showroom} poster={IMG.showroom} />
            <span className={styles.scrim} aria-hidden="true" />
            <span className={styles.hoverHint} aria-hidden="true">
              ▶ 영상
            </span>
            <Go />
            <span className={styles.tileText}>
              <span className={styles.kicker}>전시장</span>
              <span className={styles.cardTitleLg}>원목부터 완제품까지, 직접 보고 맡아 보세요</span>
            </span>
          </Link>

          {/* 흐르는 띠 */}
          <div className={`${styles.tile} ${styles.tMarquee}`} data-reveal="">
            <div className={styles.marquee}>
              {[0, 1].map((k) => (
                <span key={k} className={styles.marqueeRun} aria-hidden={k === 1 ? true : undefined}>
                  {MARQUEE.map((m) => (
                    <span key={m} className={styles.marqueeItem}>
                      {m}
                      <span className={styles.marqueeSep}>✦</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 3. 벤토 그리드 2 — 소식 */}
        <header className={styles.sectionHead} data-reveal="">
          <span className={styles.badge}>
            <span className={styles.badgeChip}>NEW</span>
            소식
          </span>
          <h2 className={styles.h2}>
            새로 올라온 <span className={styles.glow}>대라천 소식</span>
          </h2>
        </header>

        <section className={styles.grid} aria-label="대라천 소식">
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
                    products.map((p) => (
                      <li key={`${k}-${p.slug}`} className={styles.prodItem} aria-hidden={k === 1 ? true : undefined}>
                        <Link href={`/products/${p.slug}`} className={styles.prodCard} tabIndex={k === 1 ? -1 : undefined}>
                          <span className={styles.prodThumb}>
                            <Image src={p.image!} alt={k === 0 ? p.name : ''} fill sizes="200px" style={{ objectFit: 'cover' }} />
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

        {/* 4. 마무리 띠 */}
        <div className={styles.closing} data-reveal="">
          <p className={styles.closingLine}>
            진짜 침향, <span className={styles.glow}>직접 확인해 보세요</span>
          </p>
          <div className={styles.ctas}>
            <Link href="/company#contact" className={styles.btnPrimary}>
              문의하기
            </Link>
            <Link href="/showroom" className={styles.btnGhost}>
              전시장 둘러보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </BentoRoot>
  );
}
