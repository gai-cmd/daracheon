import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import { readPostsSafe } from '@/lib/blog/store';
import SnsChannels from '@/components/home/SnsChannels';
import { SNS_SAMPLE } from '@/data/sns-sample';
import { koreanVideosOnly } from '@/lib/sns';
import type { MediaTabData } from '@/app/about-agarwood/page';
import styles from './page.module.css';

/**
 * 메인 단순화 시안 (2026-09-23).
 *
 * 현행 홈(약 11,000px, 섹션 10여 개)이 상세 내용을 전부 품고 있어 복잡하다는 피드백.
 * 이 시안은 메인을 '안내판'으로 두고 각 주제는 하위 페이지로 보낸다.
 * 비교용 별도 경로라 검색 노출을 막는다 — 확정되면 / 로 승격한다.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: "메인 시안 | 조엘라이프 대라천 '참'침향" },
  robots: { index: false, follow: false },
};

const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';
const DEFAULT_HERO_BG = `${BLOB}/pages/hero/home-hero-default.jpg`;

const STATS = [
  { value: '25년', label: '직영 재배' },
  { value: '200ha', label: '하띤 직영 농장' },
  { value: '5개 지역', label: '베트남 직영' },
  { value: '12건', label: '공식 인증' },
];

const GATEWAYS = [
  {
    href: '/about-agarwood',
    kicker: '침향 이야기',
    title: '진짜 침향은\n학명부터 확인합니다',
    body: '식약처 등재 학명, 인증, 산지로 가려내는 법',
    image: `${BLOB}/pages/hero/agarwood-definition.png`,
  },
  {
    href: '/brand-story',
    kicker: '브랜드 이야기',
    title: '25년, 한 회사가\n원산지부터 잇습니다',
    body: '베트남 직영 생산부터 한국 직판까지',
    image: `${BLOB}/pages/hero/company-hero-default.jpg`,
  },
  {
    href: '/media',
    kicker: '침향 농장 이야기',
    title: '하띤 200ha,\n농장의 오늘',
    body: '묘목부터 채취·증류까지 영상과 사진으로',
    image: `${BLOB}/pages/process/process-05-harvest.jpg`,
  },
  {
    href: '/showroom',
    kicker: '전시장',
    title: '원목부터 완제품까지\n직접 보고 맡아 보세요',
    body: '대라천 침향 전시장 둘러보기',
    image: `${BLOB}/uploads/showroom/showroom-01.jpg`,
  },
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

export default async function HomeV2Page() {
  const [pagesData, productsRaw, postsRaw] = await Promise.all([
    readSingleSafe<{ home?: { hero?: { heroBg?: string } }; aboutAgarwood?: { mediaTab?: MediaTabData } }>('pages'),
    readDataSafe<ProductLite>('products'),
    readPostsSafe(),
  ]);

  // 외부 CDN 금지 원칙 — Blob·번들 자산이 아니면 기본 이미지로 대체한다.
  // (2026-09-23 기준 운영 heroBg 가 assets.floot.app 을 가리키고 있다.)
  const rawHeroBg = pagesData?.home?.hero?.heroBg ?? '';
  const heroBg = rawHeroBg.startsWith(BLOB) || rawHeroBg.startsWith('/') ? rawHeroBg : DEFAULT_HERO_BG;
  // 어드민 제품 목록 순서를 그대로 따른다 — 앞의 5개가 대표 제품.
  const products = productsRaw.filter((p) => p.published !== false && p.image).slice(0, 5);
  const posts = postsRaw
    .filter((p) => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 3);
  const press = (pagesData?.aboutAgarwood?.mediaTab?.items ?? [])
    .filter((m) => m.outlet && m.link)
    .map((m, i) => ({ m, i }))
    .sort((a, b) => dateKey(b.m.date) - dateKey(a.m.date) || a.i - b.i)
    .slice(0, 4)
    .map(({ m }) => m);
  // 메인에서는 채널 맛보기만 — 유튜브 최신(최대 5), 인스타 한 줄(4).
  const snsKo = koreanVideosOnly(SNS_SAMPLE);
  const sns = {
    youtube: { ...snsKo.youtube, videos: snsKo.youtube.videos.slice(0, 5) },
    instagram: { ...snsKo.instagram, posts: snsKo.instagram.posts.slice(0, 4) },
  };

  return (
    <div className={styles.page}>
      {/* 1. HERO — 한 문장 + 버튼 두 개 + 숫자 네 개 */}
      <section className={styles.hero}>
        <Image src={heroBg} alt="" fill priority sizes="100vw" className={styles.heroBg} />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={`${styles.wrap} ${styles.heroInner}`}>
          <span className={styles.eyebrow}>Genuine Only · 진짜 침향만</span>
          <h1 className={styles.heroTitle}>
            대라천은,
            <br />
            <em>진짜 침향</em>만 다룹니다
          </h1>
          <p className={styles.heroSub}>
            식약처 등재 학명 Aquilaria Agallocha Roxburgh.
            <br />
            베트남 직영 농장에서 25년, 원산지부터 직접 책임집니다.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/products" className={styles.btnGold}>제품 보기</Link>
            <Link href="/about-agarwood" className={styles.btnGhost}>진짜 침향 구별법 →</Link>
          </div>
          <dl className={styles.stats}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.stat}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. GATEWAYS — 각 주제는 하위 페이지로 */}
      <section className={styles.section}>
        <div className={styles.wrap}>
          <header className={styles.head}>
            <span className={styles.eyebrow}>Explore · 둘러보기</span>
            <h2 className={styles.h2}>대라천을 알아가는 네 가지 이야기</h2>
          </header>
          <ul className={styles.gateGrid}>
            {GATEWAYS.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className={styles.gateCard}>
                  <Image src={g.image} alt="" fill sizes="(max-width: 700px) 100vw, 25vw" className={styles.gateImg} />
                  <span className={styles.gateShade} aria-hidden="true" />
                  <span className={styles.gateText}>
                    <span className={styles.gateKicker}>{g.kicker}</span>
                    <span className={styles.gateTitle}>
                      {g.title.split('\n').map((line, i) => (
                        <span key={i} className={styles.gateLine}>{line}</span>
                      ))}
                    </span>
                    <span className={styles.gateBody}>{g.body}</span>
                    <span className={styles.gateGo} aria-hidden="true">자세히 보기 →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. PRODUCTS — 대표 5개 */}
      {products.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.wrap}>
            <header className={styles.headRow}>
              <div>
                <span className={styles.eyebrow}>Products · 대표 제품</span>
                <h2 className={styles.h2}>대라천 &lsquo;참&rsquo;침향 제품</h2>
              </div>
              <Link href="/products" className={styles.moreLink}>전체 제품 보기 →</Link>
            </header>
            <ul className={styles.prodRow}>
              {products.map((p) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} className={styles.prodCard}>
                    <span className={styles.prodThumb}>
                      <Image src={p.image!} alt={p.name} fill sizes="(max-width: 700px) 45vw, 18vw" style={{ objectFit: 'cover' }} />
                    </span>
                    {p.category && <span className={styles.prodCat}>{p.category}</span>}
                    <span className={styles.prodName}>{p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 4. CHANNELS — 유튜브·인스타 맛보기 */}
      <section className={styles.channelsHead}>
        <div className={styles.wrap}>
          <header className={styles.head}>
            <span className={styles.eyebrow}>Official Channels · 공식 채널</span>
            <h2 className={styles.h2}>농장의 오늘을 영상으로 전합니다</h2>
          </header>
        </div>
      </section>
      <SnsChannels data={sns} className={styles.channelsBody} />

      {/* 5. NEWS — 블로그 최신 3 + 언론 보도 4 (텍스트 목록) */}
      {(posts.length > 0 || press.length > 0) && (
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={`${styles.wrap} ${styles.newsGrid}`}>
            {posts.length > 0 && (
              <div>
                <header className={styles.newsHead}>
                  <h2 className={styles.h3}>블로그</h2>
                  <Link href="/blog" className={styles.moreLink}>더 보기 →</Link>
                </header>
                <ul className={styles.newsList}>
                  {posts.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/blog/${p.slug}`} className={styles.newsItem}>
                        <span className={styles.newsTitle}>{p.title}</span>
                        <span className={styles.newsMeta}>{formatDot(p.publishedAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {press.length > 0 && (
              <div>
                <header className={styles.newsHead}>
                  <h2 className={styles.h3}>언론 보도</h2>
                  <Link href="/about-agarwood#tab-5" className={styles.moreLink}>더 보기 →</Link>
                </header>
                <ul className={styles.newsList}>
                  {press.map((m, i) => (
                    <li key={`${m.link}-${i}`}>
                      <a href={m.link} target="_blank" rel="noopener noreferrer" className={styles.newsItem}>
                        <span className={styles.newsTitle}>{m.title || m.outlet}</span>
                        <span className={styles.newsMeta}>
                          {m.outlet}
                          {m.date ? ` · ${m.date}` : ''}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. CLOSING — 방송·문의 */}
      <section className={styles.closing}>
        <div className={`${styles.wrap} ${styles.closingInner}`}>
          <h2 className={styles.h2}>
            진짜 침향, <em>직접 확인해 보세요</em>
          </h2>
          <div className={styles.heroCtas}>
            <Link href="/home-shopping" className={styles.btnGhost}>On-Air 특별관 · 방송 다시보기</Link>
            <Link href="/company#contact" className={styles.btnGold}>문의하기</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
