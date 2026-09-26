import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { readDataSafe } from '@/lib/db';
import { SNS_SAMPLE } from '@/data/sns-sample';
import { cleanVideoTitle, formatSnsDate, koreanVideosOnly } from '@/lib/sns';
import { InViewVideo, Manifesto, MotionRoot } from './Motion';
import VideoFeature from './VideoFeature';
import ProductIndex from './ProductIndex';
import styles from './page.module.css';

/**
 * 메인 시안 B — 시네마틱형 (2026-09-26).
 *
 * 스크롤하면 한 편의 브랜드 필름처럼 넘어가는 랜딩(motionsites.ai 류 모션 랜딩 참고).
 * 현행 홈의 다크·골드·세리프 톤에서 벗어나, 고딕 900 굵기의 큰 활자와
 * 따뜻한 수지(레진)색 포인트 하나로만 정리했다.
 * 비교용 별도 경로라 검색 노출을 막는다 — 확정되면 / 로 승격한다.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: "메인 시안 B 시네마틱형 | 조엘라이프 대라천 '참'침향" },
  robots: { index: false, follow: false },
};

const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

// ⚠ 영상은 모두 Blob 원본(16~41MB)이다. 운영 전환 전 5MB 이하 짧은 압축 루프로 교체할 것.
//   히어로만 가장 작은 파일(16MB)을 preload="auto" 로 받고, 나머지는 화면에 들어올 때 재생한다.
const HERO_VIDEO = `${BLOB}/uploads/media/farm-video-03-dongnai.mp4`;
const HERO_POSTER = `${BLOB}/pages/hero/home-hero-default.jpg`;

const TICKER = [
  '25년 직영 재배',
  '하띤 직영 농장 200ha',
  '베트남 5개 지역 직영',
  '공식 인증 12건',
  '식약처 등재 학명 Aquilaria Agallocha Roxburgh',
  '묘목부터 채취·증류까지',
];

// *단어* 는 스크롤로 켜질 때 강조색이 된다.
const MANIFESTO =
  '침향은 나무가 제 상처를 감싸며 오랜 시간 만들어 낸 향입니다. ' +
  '대라천은 베트남 직영 농장에서 *25년,* 그 시간을 지켜 왔습니다. ' +
  '묘목을 심는 일부터 채취와 증류까지 *원산지에서* *직접* 책임집니다. ' +
  '그래서 이름부터 분명히 밝힙니다. *Aquilaria* *Agallocha* *Roxburgh.*';

const STORIES = [
  {
    href: '/about-agarwood',
    kicker: '침향 이야기',
    title: ['진짜 침향은', '학명부터 확인합니다'],
    body: '식약처에 등재된 학명 Aquilaria Agallocha Roxburgh. 이름과 인증, 산지로 진짜를 가려내는 법을 정리했습니다.',
    cta: '침향 이야기 보기',
    video: `${BLOB}/uploads/factory-footage/harvest-agarwood-TjZSNSkQnn2br7raRpYhaoE25a3MuK.mp4`,
    poster: `${BLOB}/pages/process/process-05-harvest.jpg`,
  },
  {
    href: '/media',
    kicker: '농장 이야기',
    title: ['하띤 200ha,', '농장의 오늘'],
    body: '묘목을 심는 날부터 채취와 증류까지. 베트남 5개 지역 직영 농장의 기록을 영상과 사진으로 전합니다.',
    cta: '농장 이야기 보기',
    video: `${BLOB}/uploads/media/farm-video-02-planting.mp4`,
    poster: `${BLOB}/pages/process/process-02-farm.jpg`,
  },
  {
    href: '/showroom',
    kicker: '전시장',
    title: ['원목부터 완제품까지', '직접 보고 맡아 보세요'],
    body: '대라천 침향 전시장에서 원목과 제품을 가까이에서 만나 보세요.',
    cta: '전시장 둘러보기',
    video: `${BLOB}/uploads/ns-brand-videos/ns-showroom-uV5DLMRkwrdC8J0scFqDa3qgNszM3C.mp4`,
    poster: `${BLOB}/uploads/showroom/showroom-01.jpg`,
  },
];

interface ProductLite {
  slug: string;
  name: string;
  nameEn?: string;
  category?: string;
  image?: string;
  published?: boolean;
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 4.8a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"
      />
    </svg>
  );
}

function YoutubeMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"
      />
    </svg>
  );
}

export default async function HomeV4Page() {
  const productsRaw = await readDataSafe<ProductLite>('products');
  // 어드민 제품 목록 순서를 그대로 따른다 — 앞의 5개가 대표 제품.
  const products = productsRaw
    .filter((p): p is ProductLite & { image: string } => p.published !== false && !!p.image)
    .slice(0, 5)
    .map((p) => ({ slug: p.slug, name: p.name, nameEn: p.nameEn, category: p.category, image: p.image }));

  // 한국어 사이트이므로 한글 제목 영상만 — 제목은 해시태그·'MD' 꼬리를 정리해서 쓴다.
  // 최신 영상이 앞에 오도록 게시일 내림차순(같은 날이면 원래 순서).
  const sns = koreanVideosOnly(SNS_SAMPLE);
  const videos = [...sns.youtube.videos]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((v) => ({
    id: v.id,
    title: cleanVideoTitle(v.title),
    date: formatSnsDate(v.publishedAt),
    thumbnail: v.thumbnail,
  }));
  const igPosts = sns.instagram.posts;
  // 릴스 표지(세로 9:16)를 한 줄로 흘린다. 게시물이 적어 한 벌로는 화면 폭을 못 채우므로
  // 두 번 이어 붙인 것을 '한 벌'로 삼고, 끊김 없는 루프를 위해 그 한 벌을 다시 두 번 깐다.
  const igSet = igPosts.length < 8 ? [...igPosts, ...igPosts] : igPosts;

  return (
    <MotionRoot>
      {/* 1. HERO — 전면 영상 + 큰 활자 + 사실 티커 */}
      <section className={styles.hero}>
        <InViewVideo src={HERO_VIDEO} poster={HERO_POSTER} className={styles.heroVideo} eager />
        <div className={styles.heroScrim} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />

        <div className={`${styles.wrap} ${styles.heroInner}`}>
          <span className={`${styles.badge} ${styles.enter}`} style={{ ['--d' as string]: '80ms' }}>
            <span className={styles.badgeDot} aria-hidden="true" />
            식약처 등재 학명 <i>Aquilaria Agallocha Roxburgh</i>
          </span>

          <p className={`${styles.wordmark} ${styles.enter}`} style={{ ['--d' as string]: '180ms' }} aria-hidden="true">
            <span className={styles.wmSolid}>Genuine</span>
            <span className={styles.wmOutline}>Agarwood</span>
          </p>

          <h1 className={`${styles.heroTitle} ${styles.enter}`} style={{ ['--d' as string]: '320ms' }}>
            원산지부터 직접,{' '}
            <span className={styles.glow} data-text="진짜 침향만">
              진짜 침향만
            </span>
          </h1>

          <p className={`${styles.heroSub} ${styles.enter}`} style={{ ['--d' as string]: '440ms' }}>
            베트남 직영 농장에서 25년. 묘목부터 채취·증류까지 대라천이 직접 합니다.
          </p>

          <div className={`${styles.ctas} ${styles.enter}`} style={{ ['--d' as string]: '560ms' }}>
            <Link href="/products" className={styles.btnResin}>
              제품 보기 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/about-agarwood" className={styles.btnGhost}>
              진짜 침향 구별법
            </Link>
          </div>
        </div>

        <a href="#manifesto" className={styles.scrollCue} aria-label="아래로 스크롤">
          <span>Scroll</span>
          <span className={styles.scrollLine} aria-hidden="true" />
        </a>

        <div className={styles.ticker} aria-label="대라천 한눈에 보기">
          <ul className={styles.tickerTrack}>
            {/* 끊김 없이 돌도록 같은 목록을 두 번 붙인다 — 두 번째는 보조기기에서 숨김 */}
            {[0, 1].map((copy) =>
              TICKER.map((t) => (
                <li key={`${copy}-${t}`} aria-hidden={copy === 1 ? true : undefined}>
                  <span>{t}</span>
                  <span className={styles.tickerStar} aria-hidden="true">
                    ✦
                  </span>
                </li>
              )),
            )}
          </ul>
        </div>
      </section>

      {/* 2. MANIFESTO — 스크롤에 따라 단어가 켜지는 선언문 */}
      <div id="manifesto">
        <Manifesto text={MANIFESTO} label="대라천이 일하는 방식" />
      </div>

      {/* 3. YOUTUBE — 공식 채널 영상 (가로 16:9) */}
      {videos.length > 0 && (
        <section className={`${styles.section} ${styles.sectionDeep}`}>
          <div className={styles.wrap}>
            <header className={styles.headRow} data-reveal="">
              <div>
                <span className={styles.pillLabel}>
                  <YoutubeMark /> 공식 채널 · YouTube
                </span>
                <h2 className={styles.h2}>
                  농장의 오늘을,
                  <br />
                  <span className={styles.accent}>영상으로</span>
                </h2>
              </div>
              <a href={sns.youtube.url} target="_blank" rel="noopener noreferrer" className={styles.btnGhostSm}>
                채널 구독하기 ↗
              </a>
            </header>
          </div>
          <div className={styles.wrap}>
            <VideoFeature videos={videos} />
          </div>
        </section>
      )}

      {/* 4. STORIES — 스크롤하면 카드가 차곡차곡 쌓인다 */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <header className={styles.headCenter} data-reveal="">
            <span className={styles.pillLabel}>Stories</span>
            <h2 className={styles.h2}>
              대라천의 <span className={styles.glow} data-text="세 가지">세 가지</span> 이야기
            </h2>
          </header>
          <ol className={styles.stack}>
            {STORIES.map((s, i) => (
              <li key={s.href} className={styles.storyCard} style={{ ['--i' as string]: i }}>
                <InViewVideo src={s.video} poster={s.poster} className={styles.storyVideo} />
                <span className={styles.storyShade} aria-hidden="true" />
                <div className={styles.storyText}>
                  <span className={styles.storyKicker}>
                    <b>{String(i + 1).padStart(2, '0')}</b> {s.kicker}
                  </span>
                  <h3 className={styles.storyTitle}>
                    {s.title.map((line) => (
                      <span key={line} className={styles.line}>
                        {line}
                      </span>
                    ))}
                  </h3>
                  <p className={styles.storyBody}>{s.body}</p>
                  <Link href={s.href} className={styles.btnResin}>
                    {s.cta} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. PRODUCTS — 타이포그래피 인덱스 */}
      {products.length > 0 && (
        <section className={`${styles.section} ${styles.sectionDeep}`}>
          <div className={styles.wrap}>
            <header className={styles.headRow} data-reveal="">
              <div>
                <span className={styles.pillLabel}>Products</span>
                <h2 className={styles.h2}>
                  대라천 <span className={styles.accent}>&lsquo;참&rsquo;</span>침향
                </h2>
              </div>
              <Link href="/products" className={styles.btnGhostSm}>
                전체 제품 보기 →
              </Link>
            </header>
            <ProductIndex products={products} />
          </div>
        </section>
      )}

      {/* 6. INSTAGRAM — 릴스 표지가 한 줄로 흐르는 띠 (마우스를 올리면 멈춤) */}
      {igPosts.length > 0 && (
        <section className={styles.igSection} aria-label="인스타그램 릴스">
          <div className={styles.igRow}>
            <ul className={styles.igTrack}>
              {[0, 1].map((copy) =>
                igSet.map((p, i) => {
                  // 첫 벌의 첫 5개만 보조기기·키보드에 노출 — 나머지는 루프용 복제
                  const dup = copy === 1 || i >= igPosts.length;
                  return (
                    <li key={`${copy}-${i}-${p.id}`} className={styles.igItem} aria-hidden={dup ? true : undefined}>
                      <a
                        href={p.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.igTile}
                        tabIndex={dup ? -1 : undefined}
                        aria-label={p.caption ? `인스타그램 릴스: ${p.caption}` : '인스타그램 릴스'}
                      >
                        <Image
                          src={p.image}
                          alt=""
                          fill
                          sizes="(max-width: 700px) 42vw, 220px"
                          className={styles.igImg}
                        />
                        {p.mediaType === 'VIDEO' && (
                          <span className={styles.igReel} aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="13" height="13">
                              <path fill="currentColor" d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        )}
                        {p.caption && <span className={styles.igCaption}>{p.caption}</span>}
                      </a>
                    </li>
                  );
                }),
              )}
            </ul>
          </div>
          <div className={styles.igCenter}>
            <a href={sns.instagram.url} target="_blank" rel="noopener noreferrer" className={styles.igPill}>
              <InstagramMark />
              {sns.instagram.handle} 팔로우
            </a>
          </div>
        </section>
      )}

      {/* 7. CLOSING — 문의·방송 */}
      <section className={styles.closing}>
        <div className={styles.closingGlow} aria-hidden="true" />
        <div className={`${styles.wrap} ${styles.closingInner}`} data-reveal="">
          <span className={styles.pillLabel}>Contact</span>
          <h2 className={styles.closingTitle}>
            <span className={styles.line}>진짜 침향,</span>
            <span className={styles.line}>
              <span className={styles.glow} data-text="직접">
                직접
              </span>{' '}
              확인해 보세요
            </span>
          </h2>
          <div className={styles.ctas}>
            <Link href="/company#contact" className={styles.btnResin}>
              문의하기 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/home-shopping" className={styles.btnGhost}>
              On-Air 특별관 · 방송 다시보기
            </Link>
          </div>
        </div>
      </section>
    </MotionRoot>
  );
}
