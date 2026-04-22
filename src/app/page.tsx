import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/ui/JsonLd';
import { readSingleSafe } from '@/lib/db';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export interface HomeHero {
  sectionTag: string;
  titleKr: string;
  subtitle: string;
  heroBg: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}

export interface HomeStat { value: string; label: string }
export interface NoticeItem { num: string; text: string }

export interface HomeNotice {
  tag: string;
  title: string;
  body: string;
  items: NoticeItem[];
  badges: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface AgarwoodCard { title: string; description: string; kicker?: string }
export interface HomeAgarwood { tag: string; title: string; cards: AgarwoodCard[] }
export interface BenefitItem { title: string; description: string; kicker?: string }
export interface HomeBenefits { tag: string; title: string; items: BenefitItem[] }
export interface ProcessStepItem { title: string; duration?: string }
export interface HomeProcess {
  tag: string;
  title: string;
  steps: string[];
  durations?: string[];
}

export interface VerificationRow { num: string; label: string; meta: string }
export interface VerifiedCard { step: string; title: string; en: string; body: string }
export interface CertChip { mark: string; name: string; sub: string }

export interface HomeData {
  hero?: HomeHero;
  stats?: HomeStat[];
  notice?: HomeNotice;
  agarwood?: HomeAgarwood;
  benefits?: HomeBenefits;
  process?: HomeProcess;
  verification?: VerificationRow[];
  verifiedCards?: VerifiedCard[];
  certs?: CertChip[];
}

const DEFAULT_HERO: HomeHero = {
  sectionTag: 'Verified Agarwood · 참침향',
  titleKr: '확인되는 침향, 대라천 참침향',
  subtitle: '베트남 직영 농장에서 25년. 원산지·원료·제조·시험까지 4단계로 검증된 침향을 프리미엄이 아니라 근거로 증명합니다.',
  heroBg:
    'https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg',
  ctaPrimaryLabel: '검증 과정 보기 →',
  ctaPrimaryHref: '/brand-story',
  ctaSecondaryLabel: '제품 보기',
  ctaSecondaryHref: '/products',
};

const DEFAULT_STATS: HomeStat[] = [
  { value: '25yrs', label: 'Research' },
  { value: '400만+', label: 'Trees' },
  { value: '200ha', label: 'Farm' },
  { value: '8건', label: 'Certifications' },
];

const DEFAULT_VERIFICATION = [
  { num: '01', label: '원산지 — 베트남 하띤 직영 200ha', meta: 'CITES' },
  { num: '02', label: '원료 — Aquilaria Agallocha Roxburgh', meta: '식약처' },
  { num: '03', label: '제조 — HACCP · GMP 시설', meta: '인증' },
  { num: '04', label: '시험 — 중금속·유해물질 0건', meta: 'LOT별' },
];

const DEFAULT_VERIFIED_CARDS = [
  {
    step: '01 · Origin',
    title: '학명 확인된 AAR',
    en: 'Aquilaria Agallocha Roxburgh',
    body:
      "식약처 '대한민국약전외한약(생약)규격집'에 등록된 공식 학명. 유전자(DNA) 검증으로 종 일치 확인 후에만 가공 단계로 진입합니다.",
  },
  {
    step: '02 · Process',
    title: 'HACCP·GMP 생산',
    en: 'Controlled Manufacturing',
    body:
      '원료 수령·분쇄·배합·충전·포장의 5단계 공정을 HACCP 및 GMP 시설에서 관리. 공정별 기록이 Lot 단위로 유지됩니다.',
  },
  {
    step: '03 · Evidence',
    title: 'Lot별 시험성적서',
    en: 'Per-Batch Lab Reports',
    body:
      '중금속(납·카드뮴·비소·수은)·잔류농약·유해물질 검사를 제조 Lot 단위로 실시. 결과는 제품 패키지 QR로 언제든 열람 가능합니다.',
  },
];

const DEFAULT_CERTS = [
  { mark: 'C', name: 'CITES', sub: '국제 보호 수종' },
  { mark: 'H', name: 'HACCP', sub: '식품 안전' },
  { mark: 'G', name: 'GMP', sub: '우수 제조' },
  { mark: 'O', name: 'ORGANIC', sub: '유기농' },
  { mark: 'V', name: '원산지', sub: '베트남 증명' },
  { mark: 'D', name: 'DNA', sub: '유전자 검증' },
  { mark: 'F', name: '식약처', sub: '고시 학명' },
  { mark: 'S', name: 'SGS', sub: '국제 검사' },
];

const DEFAULT_AGARWOOD: HomeAgarwood = {
  tag: 'Agarwood · 신들의 나무',
  title: '수천 년을 지나온 가장 귀한 약재이자 향',
  cards: [
    {
      title: '동서양의 역사적 가치',
      description: '수천 년 전부터 왕실과 귀족들만이 향유할 수 있었던, 동서양을 막론하고 최고의 가치로 인정받아 온 귀한 약재이자 향입니다.',
    },
    {
      title: '20년 이상의 긴 시간',
      description: '20년 이상 생육된 침향나무에서 채취한 수지는 함량이 높아 약재로서의 효능과 가치가 매우 높게 평가됩니다.',
    },
    {
      title: '논문에서 발표하는 침향',
      description: '침향에 대한 연구가 전 세계적으로 진행되고 있으며, SCI급 논문에서도 실제적인 효과에 대해 발표하고 있습니다.',
    },
  ],
};

const DEFAULT_BENEFITS: HomeBenefits = {
  tag: 'Benefits · 연구 기반 효능',
  title: '침향의 가치, 여섯 가지 방향',
  items: [
    { title: '기를 뚫어 순환 효과', description: '침향은 아래로 떨어지는 기운을 통해 몸속 기혈 순환을 원활하게 하여, 막힌 기를 뚫어주고 오장육부의 기능을 정상화합니다.' },
    { title: '원기 회복 · 자양강장', description: '동의보감에 기록된 바와 같이, 찬 기운을 몰아내고 따뜻한 성질로 몸의 기운을 보강해 피로 해소와 활력 증진을 돕습니다.' },
    { title: '신경 안정 · 숙면', description: "침향의 '아가로스피롤' 성분은 천연 신경 안정제 역할. 예민해진 신경을 이완시키고 심리적 안정과 불면증 개선에 효과적입니다." },
    { title: '항염 · 혈관 건강', description: '항염 작용을 통해 염증 물질(사이토카인)을 억제하고 혈전 형성을 방지하여 만성 염증 완화와 혈관 건강 증진에 도움을 줍니다.' },
    { title: '뇌 질환 예방', description: '뇌혈류 개선 및 뇌세포 보호에 도움을 주어 뇌졸중과 같은 혈관 질환, 퇴행성 뇌 질환 예방에 긍정적 영향을 미칩니다.' },
    { title: '소화 · 복통 완화', description: '기(氣)를 잘 통하게 하고 위를 따뜻하게 하여 만성 위장 질환, 위궤양, 장염 증세를 완화하고 복통을 멈추게 합니다.' },
  ],
};

const DEFAULT_PROCESS: HomeProcess = {
  tag: 'Craftsmanship · 6단계 공정',
  title: '씨앗에서 완제품까지 20년이 넘는 시간',
  steps: [
    '씨앗 발아 및 묘목 육성',
    '베트남 직영 농장 식재',
    '20년 이상 오르가닉 육성',
    '특허 수지유도제 주입',
    '벌목 및 원물 정밀 채취',
    '최고급 제품 가공 및 검수',
  ],
};

const PROCESS_DURATIONS = ['6 — 12 Months', 'Ha Tinh 200ha', '20+ Years', '3 — 5 Years', 'Controlled Harvest', 'HACCP · GMP'];

export const metadata: Metadata = {
  title: 'ZOEL LIFE — 25년 검증된 침향, 대라천 참침향',
  description:
    '베트남 직영 농장에서 25년 연구 끝에 탄생한 명품 침향. Aquilaria Agallocha Roxburgh 정품, HACCP·GMP·CITES 인증.',
  alternates: { canonical: 'https://www.daracheon.com' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ZOEL LIFE - 대라천 참침향',
  url: 'https://www.daracheon.com',
};

export default async function HomePage() {
  const pagesData = await readSingleSafe<{ home?: HomeData }>('pages');
  const home = pagesData?.home ?? {};
  const hero = home.hero ?? DEFAULT_HERO;
  const stats = home.stats ?? DEFAULT_STATS;
  const agarwood = home.agarwood ?? DEFAULT_AGARWOOD;
  const benefits = home.benefits ?? DEFAULT_BENEFITS;
  const processData = home.process ?? DEFAULT_PROCESS;
  const verification = home.verification ?? DEFAULT_VERIFICATION;
  const verifiedCards = home.verifiedCards ?? DEFAULT_VERIFIED_CARDS;
  const certs = home.certs ?? DEFAULT_CERTS;
  const processDurations = home.process?.durations ?? PROCESS_DURATIONS;

  return (
    <div className={styles.page}>
      <JsonLd data={websiteJsonLd} />

      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`}>
        <div className="hero-bg-agarwood" aria-hidden />
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url('${hero.heroBg}')` }}
          aria-hidden
        />
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.heroContent}>
          <div className={styles.wrap}>
            <div className={styles.heroRow}>
              <div>
                <div className={styles.heroKicker}>
                  <span>{hero.sectionTag}</span>
                  <span className="idx">01 — 03</span>
                </div>
                <h1>
                  {hero.titleKr.split(',').length > 1 ? (
                    <>
                      {hero.titleKr.split(',')[0]},
                      <br />
                      <em>{hero.titleKr.split(',').slice(1).join(',').trim()}</em>
                    </>
                  ) : (
                    hero.titleKr
                  )}
                </h1>
                <p className={styles.heroSub}>{hero.subtitle}</p>
                <div className={styles.heroCtas}>
                  <Link href={hero.ctaPrimaryHref} className={styles.btnGold}>
                    {hero.ctaPrimaryLabel}
                  </Link>
                  <Link href={hero.ctaSecondaryHref} className={styles.btnOutline}>
                    {hero.ctaSecondaryLabel}
                  </Link>
                </div>
              </div>

              {/* 4-Point Verification Card (edit in /admin/pages/home) */}
              <div className={styles.heroTrust}>
                <div className={styles.heroTrustTitle}>4-Point Verification</div>
                {verification.map((row, i) => (
                  <div key={`${row.num}-${i}`} className={styles.heroTrustRow}>
                    <div className={styles.heroTrustNum}>{row.num}</div>
                    <div className={styles.heroTrustLabel}>{row.label}</div>
                    <div className={styles.heroTrustMeta}>{row.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className={styles.trustStrip}>
        <div className={styles.trustStripInner}>
          {stats.map((s) => (
            <div key={s.label} className={styles.trustStat}>
              <div className="num">{s.value}</div>
              <div className="lbl">{s.label}</div>
              <div className="caption">{/* TODO: caption 필드 없음 */}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VERIFIED */}
      <section className={styles.verified} id="verified">
        <div className={styles.wrap}>
          <div className={styles.verifiedHead}>
            <span className={styles.tag}>Notice — 식약처 고시 기준</span>
            <h2 className={styles.h2}>
              진짜 침향, 이젠
              <br />
              <em>학명부터 확인하세요</em>
            </h2>
            <div className={styles.line} />
            <p>
              대한민국 국가법령정보센터의 식약처 고시에 등록된 공식 침향은{' '}
              <em style={{ color: 'var(--accent)', fontStyle: 'normal', fontFamily: "'Noto Serif KR', serif", fontWeight: 400 }}>
                Aquilaria Agallocha Roxburgh(AAR)
              </em>
              . 대라천은 첫 묘목부터 완제품까지, 품질의 모든 단계를 공개합니다.
            </p>
          </div>

          <div className={styles.verifiedGrid}>
            {verifiedCards.map((c, i) => (
              <div key={`${c.step}-${i}`} className={styles.verifiedCard}>
                <div className={styles.verifiedStep}>{c.step}</div>
                <h3>{c.title}</h3>
                <div className={styles.verifiedEn}>{c.en}</div>
                <p>{c.body}</p>
              </div>
            ))}
          </div>

          <div className={styles.certRow}>
            <span className={styles.tag}>Certifications · {certs.length}개 인증</span>
            <div className={styles.certGrid}>
              {certs.map((c, i) => (
                <div key={`${c.name}-${i}`} className={styles.certChip}>
                  <div className={styles.certMark}>{c.mark}</div>
                  <div className={styles.certName}>{c.name}</div>
                  <div className={styles.certSub}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AGARWOOD INTRO */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.wrap}>
          <div className="head" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 30px' }}>
            <span className={styles.tag}>{agarwood.tag}</span>
            <h2 className={styles.h2}>{agarwood.title}</h2>
            <div className={styles.line} />
          </div>
          <div className={styles.agGrid}>
            {agarwood.cards.map((c, i) => {
              const kicker = c.kicker ?? (['Heritage', 'Time', 'Research'][i] ?? 'Insight');
              return (
                <div key={`${c.title}-${i}`} className={styles.agCard}>
                  <div className={styles.agNum}>{String(i + 1).padStart(2, '0')} · {kicker}</div>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className={styles.section} id="benefits">
        <div className={styles.wrap}>
          <div className="head" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 30px' }}>
            <span className={styles.tag}>{benefits.tag}</span>
            <h2 className={styles.h2}>{benefits.title}</h2>
            <div className={styles.line} />
          </div>
          <div className={styles.benGrid}>
            {benefits.items.map((b, i) => {
              const kicker = b.kicker ?? (['Qi Circulation', 'Vitality', 'Relaxation', 'Anti-inflammatory', 'Brain Health', 'Digestion'][i] ?? 'Benefit');
              return (
                <div key={`${b.title}-${i}`} className={styles.benItem}>
                  <div className={styles.benIdx}>{String(i + 1).padStart(2, '0')}</div>
                  <div className={styles.benKo}>{kicker}</div>
                  <h4>{b.title}</h4>
                  <p>{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="process">
        <div className={styles.wrap}>
          <div className="head" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 30px' }}>
            <span className={styles.tag}>{processData.tag}</span>
            <h2 className={styles.h2}>{processData.title}</h2>
            <div className={styles.line} />
            <p style={{ fontSize: '1rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.7)', fontWeight: 300 }}>
              묘목 발아에서 정밀 채취, 최종 검수까지 — 모든 단계의 책임을 감추지 않고 공개합니다.
            </p>
          </div>
          <div className={styles.procGrid}>
            {processData.steps.map((step, i) => (
              <div key={`${step}-${i}`} className={styles.procStep}>
                <div className={styles.procIdx}>{String(i + 1).padStart(2, '0')}</div>
                <h4>{step}</h4>
                <div className={styles.procDur}>{processDurations[i] ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.section} style={{ textAlign: 'center', borderTop: '1px solid rgba(212,168,67,0.15)' }}>
        <div className={styles.wrap}>
          <span className={styles.tag}>Order · 지금 만나기</span>
          <h2 className={styles.h2}>
            대라천 <em>참침향</em>의 검증된 가치
          </h2>
          <div className={styles.line} />
          <div className={styles.heroCtas} style={{ justifyContent: 'center', marginTop: 30 }}>
            <Link href="/products" className={styles.btnGold}>제품 보기 →</Link>
            <Link href="/home-shopping" className={styles.btnOutline}>홈쇼핑 편성표</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
