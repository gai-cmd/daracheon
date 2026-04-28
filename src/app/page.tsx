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

export interface AgarwoodCard { title: string; description: string; kicker?: string; image?: string }
export interface HomeAgarwood { tag: string; title: string; cards: AgarwoodCard[] }
export interface BenefitItem { title: string; description: string; kicker?: string; image?: string }
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
  sectionTag: 'Genuine Only · 진짜 침향만',
  titleKr: '대라천은, 진짜 침향만 다룹니다',
  subtitle: '한 품종, 한 나라 — Aquilaria Agallocha Roxburgh, 베트남 직영.\n25년, 한 회사 — 베트남 직영 생산 · 한국 직판. 조엘라이프가 원산지부터 연결합니다.\n프리미엄이 아니라 근거로 증명합니다.',
  heroBg:
    'https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg',
  ctaPrimaryLabel: '검증 과정 보기 →',
  ctaPrimaryHref: '/brand-story',
  ctaSecondaryLabel: '제품 보기',
  ctaSecondaryHref: '/products',
};

const DEFAULT_STATS: HomeStat[] = [
  { value: '25년+', label: '연구 및 재배' },
  { value: '200ha', label: '400만 그루' },
  { value: '12건+', label: '특허 및 인증' },
  { value: '5개 지역', label: '직영 농장' },
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
  { mark: 'V', name: '원산지 증명', sub: '베트남 100% 원산지' },
  { mark: 'C', name: 'CITES', sub: '국제 보호 수종' },
  { mark: 'O', name: 'OCOP', sub: '베트남 정부 품질' },
  { mark: 'R', name: '유기농 재배', sub: '무농약 유기 농법' },
  { mark: 'Z', name: '청정지역', sub: '토양·환경 청정' },
  { mark: 'P', name: '유기농 완제품', sub: '유기 성분 인증' },
  { mark: 'T', name: '수지 특허', sub: '식용 수지 특허' },
  { mark: 'H', name: 'HACCP', sub: '식품 안전 관리' },
  { mark: 'G', name: 'GMP', sub: '우수 제조 시설' },
  { mark: 'F', name: 'FDA', sub: '미국 FDA 등록' },
  { mark: 'S', name: '유해물질', sub: '중금속·잔류농약 0' },
  { mark: 'L', name: '성분 검사서', sub: '수지 함량 분석' },
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
      title: '20년 이상의 긴 생육 시간',
      description: '20년 이상 생육된 침향나무에서 채취한 수지는 함량이 높아 약재로서 효능과 가치를 인정받습니다.',
    },
    {
      title: '논문에서 발표하는 침향',
      description: '침향 연구는 전 세계에서 활발히 이뤄지고 있으며, SCI급 논문도 실제 효과를 속속 보고합니다.',
    },
  ],
};

const DEFAULT_BENEFITS: HomeBenefits = {
  tag: 'Benefits · 연구 기반 효능',
  title: '침향의 가치, 여섯 가지 효능',
  items: [
    { kicker: 'Qi Circulation', title: '기 뚫고 원기 회복 · 자양강장', description: '몸속 기혈 순환으로 막힌 기를 뚫고 찬 기운을 몰아내 따뜻한 성질로 몸의 기운을 보강, 피로 해소와 활력 증진을 돕습니다.' },
    { kicker: 'Menstruation & Stamina', title: '냉감 · 정력 감퇴 · 복통에 탁월', description: '하복부 냉감, 월경불순, 남성 정력 감퇴, 잦은 소변 증상에 탁월하고, 이런 증상에 수반해 하복통 심한 사람에게 많이 활용됩니다.' },
    { title: '신경 안정 · 숙면', description: "침향의 '아가로스피롤' 성분은 천연 신경 안정제 역할. 예민해진 신경을 이완시키고 심리적 안정과 불면증 개선에 효과적입니다." },
    { title: '항염 · 혈관 건강', description: '항염 작용으로 사이토카인을 억제하고 혈전을 막아, 만성 염증을 가라앉히고 혈관을 튼튼하게 합니다.' },
    { title: '뇌 질환 예방', description: '뇌혈류를 개선하고 뇌세포를 보호해, 뇌졸중·퇴행성 뇌 질환 예방 가능성을 높입니다.' },
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
    '전통 증기 증류 · 최종 검수',
  ],
};

const PROCESS_DURATIONS = ['6 — 12 Months', 'Ha Tinh 200ha', '20+ Years', '3 — 5 Years', 'Controlled Harvest', 'Steam Distillation · GMP'];

const PROCESS_IMAGES = [
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-01-seedling.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-02-farm.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-03-organic.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-04-resin.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-05-harvest.jpg',
  'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process/process-06-distill.jpg',
];

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
                <p className={styles.heroSub} style={{ whiteSpace: 'pre-line' }}>{hero.subtitle}</p>
              </div>

              {/* 3-Point Verification Card (edit in /admin/pages/home) */}
              <div className={styles.heroTrust}>
                <div className={styles.heroTrustTitle}>3-Point Verification</div>
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
              가짜가 많을수록,
              <br />
              <em>진짜는 드러난다</em>
            </h2>
            <div className={styles.line} />
            <p>
              이젠 학명/품종부터 확인하세요!<br />
              식품의약품안전처(식약처) 고시 &lsquo;대한민국약전외한약(생약)규격집&rsquo;,
              &lsquo;식품공전&rsquo;, &lsquo;한약재 관능검사 해설서&rsquo;와
              &lsquo;한국한의학연구원 한약자원연구센터&rsquo;에<br />
              공식 등록된 침향은{' '}
              <em style={{ color: 'var(--accent)', fontStyle: 'normal', fontFamily: "'Noto Serif KR', serif", fontWeight: 400 }}>
                &lsquo;Aquilaria Agallocha Roxburgh(아퀼라리아 아갈로차 록스버그)&rsquo;
              </em>
              입니다.
            </p>
            <p>
              대라천 &lsquo;참&rsquo;침향은 첫 묘목부터 완제품까지 모든 단계와 과정을 투명하게 공개합니다.
            </p>
          </div>

          <div className={styles.refGrid}>
            {[
              { num: '01', label: '대한민국약전외한약\n(생약)규격집' },
              { num: '02', label: '식약처\n식품공전' },
              { num: '03', label: '한약재 관능검사\n해설서' },
              { num: '04', label: '한국한의학연구원\n한약자원연구센터' },
            ].map(({ num, label }) => (
              <div key={num} className={styles.refCard}>
                <span className={styles.refNum}>{num}</span>
                <p className={styles.refLabel}>{label.split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}</p>
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
                <div key={`${c.title}-${i}`} className={styles.agCard} style={{ overflow: 'hidden', padding: 0 }}>
                  {c.image && (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
                      <img src={c.image} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}
                  <div style={{ padding: 26 }}>
                    <div className={styles.agNum}>{String(i + 1).padStart(2, '0')} · {kicker}</div>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>
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
                <div key={`${b.title}-${i}`} className={styles.benItem} style={{ borderTop: 'none', overflow: 'hidden', padding: 0 }}>
                  {b.image && (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
                      <img src={b.image} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}
                  <div style={{ padding: '18px 0 0', borderTop: '1px solid rgba(212,168,67,0.2)' }}>
                    <div className={styles.benIdx}>{String(i + 1).padStart(2, '0')}</div>
                    <div className={styles.benKo}>{kicker}</div>
                    <h4>{b.title}</h4>
                    <p>{b.description}</p>
                  </div>
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
            <h2 className={styles.h2} style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.4rem)' }}>{processData.title}</h2>
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
                {PROCESS_IMAGES[i] && (
                  <div className={styles.procImgWrap}>
                    <img src={PROCESS_IMAGES[i]} alt={step} className={styles.procImg} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
