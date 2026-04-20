'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { BrandStoryData } from './page';
import styles from './BrandStoryClient.module.css';

interface Props {
  data: BrandStoryData | null;
}

const TAB_LIST = [
  '브랜드 스토리',
  '대라천 침향 현장',
  '대라천 침향 역사',
  '다양한 인증',
  '검증된 품질',
  '생산 공정',
] as const;

const DEFAULT_HERO_BG =
  'https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg';

// CMS 데이터 비어있을 때 기본 fallback (data/db/pages.json 시드와 동일)
const DEFAULT_FARMS = [
  { name: '하띤', nameVi: 'Ha Tinh', desc: '메인 대규모 농장 (200ha)', image: 'https://lh3.googleusercontent.com/d/1xedUAtI2JRIwwjyLKmHRV_laaOApjEbf=w1280' },
  { name: '동나이', nameVi: 'Dong Nai', desc: '전략 재배 거점', image: 'https://lh3.googleusercontent.com/d/1t02AQvPDeUsqjOv-NcUpwiDWrXwZ6mgA=w1280' },
  { name: '냐짱', nameVi: 'Nha Trang', desc: '고품질 원료 산지', image: 'https://lh3.googleusercontent.com/d/1pCKsRdo3kix6XDUeFgdYHHomS3UJkLDX=w1280' },
  { name: '푸국', nameVi: 'Phu Quoc', desc: '해양성 기후 재배지', image: 'https://lh3.googleusercontent.com/d/1G7-mche4RToYvtfBkHyLZt_qVxJJtIAs=w1280' },
  { name: '람동', nameVi: 'Lam Dong', desc: '고산지대 특화 농장', image: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png' },
];

const DEFAULT_SCENE_IMAGES = [
  'https://lh3.googleusercontent.com/d/13tVS4hk6RF6BbMEddB0TcWsCP2RF_Zrc=w1280',
  'https://lh3.googleusercontent.com/d/1Cb_a1JSUJe5RHgSPs6vjyn1Mr3G_rlQ0=w1280',
  'https://lh3.googleusercontent.com/d/1jF9DcPGhLe1-lsMDYX8ntkwyrTioAeCH=w1280',
];
const DEFAULT_SCENE_BODY =
  '1998년 캄보디아에서 시작된 대라천의 여정.\n\n2000년에는 베트남 5개 성(하띤·동나이·냐짱·푸국·람동)으로 확장되었습니다.\n\n현재는 하띤성 200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리하며, 원료 재배부터 가공·유통까지 전 과정을 수직계열화하여 품질을 보증합니다.';

const DEFAULT_ERAS = [
  {
    era: '1998-2001',
    items: [
      '1998 캄보디아 침향사업 시작',
      '2000 베트남 5개 성 농장 조성',
      '2001 동나이성 대규모 식재',
    ],
  },
  {
    era: '2014-2019',
    items: [
      '2014 노니발효 시스템 개발',
      '2018 NTV Vietnam 통합법인 + Organic/HACCP 인증 + 식용가능 수지유도제 재개발',
      '2019 OCOP 품질보증',
    ],
  },
  {
    era: '2023-2025',
    items: [
      '2023 침향캡슐 건강기능성 재인증(18품목)',
      '2024 조엘라이프 한국 시장 진출',
      '2025 아시아 10대 선도 브랜드 선정 + 특허 출원',
    ],
  },
];

// 실제 인증서 — Google Drive 폴더 1uTUso6IURawC0oNFEQqzp9qWNDsVml_g
// (8장 중 시각적 중복 가능성 있는 항목 제외 — 6장 대표 인증서만 노출)
const DEFAULT_CERT_IMAGES = [
  'https://lh3.googleusercontent.com/d/1_58va33_QyYOIH_wD0BDTpxCNEyrqiT5=w1600',
  'https://lh3.googleusercontent.com/d/12W4V2LVy0Fj4biFyIyOu-GdkqEEbHhC_=w1600',
  'https://lh3.googleusercontent.com/d/136xmgMvuaxhaqEJGvzm7GXqh9IzS3YvR=w1600',
  'https://lh3.googleusercontent.com/d/1Qmq5y3WmvMt-8QbD-IRbQ3l757Px8HGT=w1600',
  'https://lh3.googleusercontent.com/d/1UzVurmG7uxiAEi49wG2pc03ziBNH97QY=w1600',
  'https://lh3.googleusercontent.com/d/1xpiojAGQAFwMOBoiudCNIwV_1ArK6a6A=w1600',
];
const DEFAULT_CERT_LABELS = [
  'CITES 국제거래 인증서',
  '식약처 건강기능식품 규격 적합',
  '베트남 OCOP 품질 인증',
  'HACCP 식품안전 인증',
  '수지유도 특허증 #12835',
  'TSL ISO/IEC 17025:2017 시험성적서',
];
const DEFAULT_CERT_SECTIONS = [
  {
    title: '국제 거래 및 기술 특허',
    items: ['CITES IIA-DNI-007', '수지유도 특허 #12835'],
  },
  {
    title: '품질 보증',
    items: ['Organic', 'HACCP', 'OCOP', '2025 아시아 10대 브랜드'],
  },
  {
    title: '안전성 시험',
    items: ['TSL ISO/IEC 17025:2017', '중금속 8종 전부 불검출'],
  },
];

const DEFAULT_QUALITY_IMAGES = [
  'https://lh3.googleusercontent.com/d/13Rz2KejfZg2bt19UhNklV-Fb0n6-zN7x=w1280',
  'https://lh3.googleusercontent.com/d/1QOBVQuJizCRU0K_YT2dtW6p32GIMQWe-=w1280',
];
const DEFAULT_HEAVY_METALS = ['납(Pb)', '카드뮴(Cd)', '수은(Hg)', '비소(As)', '구리(Cu)', '주석(Sn)', '안티몬(Sb)', '니켈(Ni)'];

const DEFAULT_PROCESS_STEPS = [
  '식목',
  '수지앉힘(특허#12835)',
  '침향검사',
  '침향수확',
  '원목입고',
  '세척(표피제거)',
  '절단(10-20cm)',
  '수지목분리',
  '이물질제거',
  '세척(3회)',
  '건조(자연광)',
  '분쇄(1-2mm)',
  '고온증류(72시간)',
  '수지채취후숙성검사출고',
];
const DEFAULT_PROCESS_STATS = [
  { value: '400만+', label: '하띤 직영 농장 침향나무' },
  { value: '#12835', label: '수지유도 특허' },
  { value: '72h', label: '고온 증류 공정' },
  { value: '26+', label: '식목부터 출고까지 (년)' },
];

export default function BrandStoryClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  const hero = data?.hero;
  const brandStoryTab = data?.brandStoryTab;
  const farms = data?.farms && data.farms.length > 0 ? data.farms : DEFAULT_FARMS;
  const sceneTab = data?.sceneTab;
  const sceneImages = sceneTab?.images && sceneTab.images.length > 0 ? sceneTab.images : DEFAULT_SCENE_IMAGES;
  const historyTab = data?.historyTab;
  const eras = historyTab?.eras && historyTab.eras.length > 0 ? historyTab.eras : DEFAULT_ERAS;
  const certificationsTab = data?.certificationsTab;
  const certImages = certificationsTab?.images && certificationsTab.images.length > 0 ? certificationsTab.images : DEFAULT_CERT_IMAGES;
  const certLabels = certificationsTab?.imageLabels && certificationsTab.imageLabels.length > 0 ? certificationsTab.imageLabels : DEFAULT_CERT_LABELS;
  const certSections = certificationsTab?.sections && certificationsTab.sections.length > 0 ? certificationsTab.sections : DEFAULT_CERT_SECTIONS;
  const qualityTab = data?.qualityTab;
  const qualityImages = qualityTab?.images && qualityTab.images.length > 0 ? qualityTab.images : DEFAULT_QUALITY_IMAGES;
  const heavyMetals = qualityTab?.heavyMetals && qualityTab.heavyMetals.length > 0 ? qualityTab.heavyMetals : DEFAULT_HEAVY_METALS;
  const processTab = data?.processTab;
  const processSteps = processTab?.steps && processTab.steps.length > 0 ? processTab.steps : DEFAULT_PROCESS_STEPS;
  const processStats = processTab?.stats && processTab.stats.length > 0 ? processTab.stats : DEFAULT_PROCESS_STATS;
  // mediaTab/testimonialsTab는 /about-agarwood 전용 — brand-story에서는 노출 안 함

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`}>
        <div className="hero-bg-agarwood" aria-hidden />
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url('${hero?.heroBg ?? DEFAULT_HERO_BG}')` }}
          aria-hidden
        />
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.heroInner}>
          <div className={styles.heroKicker}>{hero?.sectionTag ?? 'Agarwood Story'}</div>
          <div className={styles.heroHanja} aria-hidden>沈香</div>
          <h1 style={{ whiteSpace: 'nowrap' }}>{hero?.titleKr ?? "대라천 '참'침향"}</h1>
          <p className={styles.heroSub} style={{ whiteSpace: 'nowrap' }}>
            {hero?.subtitle ??
              "조엘라이프의 대라천 '참'침향은 단순한 제품이 아닌, 자연이 허락한 수십 년 이상의 기다림을 선물합니다."}
          </p>
        </div>
      </section>

      {/* TAB BAR */}
      <section className={styles.tabBar}>
        <div className={styles.wrap}>
          <div className={styles.tabRow}>
            {TAB_LIST.map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tabBtn} ${activeTab === i ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(i)}
                aria-current={activeTab === i ? 'page' : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TAB 0 — Brand Story */}
      {activeTab === 0 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterHead}>
              <div className={styles.chapterTag}>{brandStoryTab?.sourceTag ?? 'THE SOURCE'}</div>
              <h2 className={styles.chapterTitle}>
                {brandStoryTab?.headlineTitle ?? '100% 베트남산, 아갈로차 침향나무만!'}
              </h2>
              <p className={styles.chapterSubtitle}>
                {brandStoryTab?.headlineSubtitle ?? '200ha 부지에 400만 그루 이상의 침향나무가 자라는 생명의 터전'}
              </p>
              <div className={styles.line} />
            </div>
            <div className={styles.chapterBody}>
              <p style={{ whiteSpace: 'pre-line' }}>
                {brandStoryTab?.sourceBody ??
                  '1998년 캄보디아에서 시작된 대라천의 여정.\n\n2000년에는 베트남 5개 성(하띤·동나이·냐짱·푸국·람동)으로 확장되었습니다.'}
              </p>
            </div>
            <div className={styles.gridAuto}>
              {farms.map((farm, i) => (
                <div key={farm.nameVi + i} className={styles.card}>
                  {farm.image && (
                    <div className={styles.imgFrame} style={{ marginBottom: 14, aspectRatio: '4/3' }}>
                      <Image
                        src={farm.image}
                        alt={`${farm.name} (${farm.nameVi}) 농장`}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <div className={styles.cardKicker}>Farm · {String(i + 1).padStart(2, '0')}</div>
                  <div className={styles.cardTitle}>{farm.name}</div>
                  <div className={styles.cardSub}>{farm.nameVi}</div>
                  <div className={styles.cardDesc}>{farm.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 1 — Scene */}
      {activeTab === 1 && (
        <section className={`${styles.chapter} ${styles.chapterAlt}`}>
          <div className={styles.wrap}>
            <div className={styles.chapterHead}>
              <div className={styles.chapterTag}>{sceneTab?.tag ?? 'THE FIELD'}</div>
              <h2 className={styles.chapterTitle}>{sceneTab?.title ?? '대라천 침향 현장'}</h2>
              <p className={styles.chapterSubtitle}>
                {sceneTab?.subtitle ?? '200ha 부지에 400만 그루 이상의 침향나무가 자라는 생명의 터전'}
              </p>
              <div className={styles.line} />
            </div>
            <div className={styles.imgGrid}>
              {sceneImages.map((src, i) => (
                <div key={i} className={styles.imgFrame}>
                  <Image src={src} alt={`현장 ${i + 1}`} fill sizes="(max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <div className={styles.chapterBody}>
              <p style={{ whiteSpace: 'pre-line' }}>
                {sceneTab?.body ?? DEFAULT_SCENE_BODY}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2 — History */}
      {activeTab === 2 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterHead}>
              <div className={styles.chapterTag}>{historyTab?.tag ?? 'HISTORY'}</div>
              <h2 className={styles.chapterTitle}>{historyTab?.title ?? '대라천 침향 역사'}</h2>
              <div className={styles.line} />
            </div>
            <div className={styles.timeline}>
              {eras.map((era, i) => (
                <div key={era.era + i} className={styles.timelineItem}>
                  <div className={styles.timelineEra}>{era.era}</div>
                  <ul className={styles.timelineList}>
                    {era.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3 — Certifications */}
      {activeTab === 3 && (
        <section className={`${styles.chapter} ${styles.chapterAlt}`}>
          <div className={styles.wrap}>
            <div className={styles.chapterHead}>
              <div className={styles.chapterTag}>{certificationsTab?.tag ?? 'CERTIFICATIONS'}</div>
              <h2 className={styles.chapterTitle}>{certificationsTab?.title ?? '신뢰의 지표'}</h2>
              <p className={styles.chapterSubtitle}>{certificationsTab?.subtitle ?? '국제가 인정하는 대라천의 품질'}</p>
              <div className={styles.line} />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 28,
                margin: '30px 0',
              }}
            >
              {certImages.map((src, i) => {
                const label = certLabels[i] ?? `인증서 ${i + 1}`;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div
                      style={{
                        aspectRatio: '3 / 4',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(212,168,67,0.28)',
                        background: '#ffffff',
                        padding: 16,
                      }}
                    >
                      <Image
                        src={src}
                        alt={label}
                        fill
                        sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                        style={{ objectFit: 'contain' }}
                        unoptimized
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: '0.66rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        textAlign: 'center',
                        lineHeight: 1.5,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.gridAuto}>
              {certSections.map((section, i) => (
                <div key={section.title + i} className={styles.card}>
                  <div className={styles.numBadge}>{i + 1}</div>
                  <div className={styles.certTitle}>{section.title}</div>
                  <ul className={styles.certList}>
                    {section.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 4 — Quality */}
      {activeTab === 4 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterHead}>
              <div className={styles.chapterTag}>{qualityTab?.tag ?? 'VERIFIED QUALITY'}</div>
              <h2 className={styles.chapterTitle}>{qualityTab?.title ?? '과학으로 입증된 안전'}</h2>
              <p className={styles.chapterSubtitle}>{qualityTab?.subtitle ?? '최소 26년의 시간이 만드는 한 방울의 가치'}</p>
              <div className={styles.line} />
            </div>
            <div className={styles.imgGrid}>
              {qualityImages.map((src, i) => (
                <div key={i} className={styles.imgFrame}>
                  <Image src={src} alt={`품질 ${i + 1}`} fill sizes="(max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <div className={styles.gridAuto}>
              <div className={styles.card}>
                <div className={styles.cardKicker}>01 — Raw Material</div>
                <div className={styles.cardTitle}>원료</div>
                <div className={styles.cardDesc}>침수향 (AQUILARIAE LIGNUM)</div>
                <p style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
                  Aquilaria agallocha Roxburgh
                </p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardKicker}>02 — Standards</div>
                <div className={styles.cardTitle}>약전 규격</div>
                <ul className={styles.certList}>
                  <li>건조감량 8.0% 이하</li>
                  <li>회분 2.0% 이하</li>
                  <li>묽은에탄올엑스 18.0% 이상</li>
                </ul>
              </div>
              <div className={styles.card}>
                <div className={styles.cardKicker}>03 — TSL Safety</div>
                <div className={styles.cardTitle}>TSL 안전성</div>
                <div className={styles.cardDesc}>중금속 8종 전부 불검출</div>
                <div className={styles.metalRow}>
                  {heavyMetals.map((m) => (
                    <span key={m} className={styles.metalPill}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5 — Process */}
      {activeTab === 5 && (
        <section className={`${styles.chapter} ${styles.chapterAlt}`}>
          <div className={styles.wrap}>
            <div className={styles.chapterHead}>
              <div className={styles.chapterTag}>{processTab?.tag ?? 'PRODUCTION PROCESS'}</div>
              <h2 className={styles.chapterTitle}>{processTab?.title ?? '생산 공정'}</h2>
              <p className={styles.chapterSubtitle}>{processTab?.subtitle ?? '총 소요 시간: 최소 26년'}</p>
              <div className={styles.line} />
            </div>
            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 14,
                margin: '30px 0 40px',
              }}
            >
              {processStats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: '20px 16px',
                    border: '1px solid rgba(212,168,67,0.25)',
                    background: 'rgba(255,255,255,0.02)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontSize: '1.6rem',
                      color: 'var(--accent)',
                      fontWeight: 400,
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: '0.6rem',
                      letterSpacing: '0.22em',
                      color: 'rgba(255,255,255,0.55)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.stepGrid}>
              {processSteps.map((step, i) => (
                <div key={i} className={styles.stepCard}>
                  <div className={styles.stepNum}>{i + 1}</div>
                  <div className={styles.stepTxt}>{step}</div>
                </div>
              ))}
            </div>
            <div className={styles.totalTime}>
              <div className={styles.totalLabel}>{processTab?.totalTimeLabel ?? 'TOTAL PROCESS TIME'}</div>
              <div className={styles.totalValue}>{processTab?.totalTimeValue ?? '26+ Years'}</div>
              <div className={styles.totalDesc}>
                {processTab?.totalTimeDesc ?? '식목부터 최종 출고까지, 최소 26년의 시간이 만드는 가치'}
              </div>
            </div>

            {/* 공장 동영상 — Drive mov 폴더 (1t8GYG9Gl4_EleEQBlxmwwntQF662RpNO) */}
            <div style={{ marginTop: 60 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.3em',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                  textAlign: 'center',
                }}
              >
                Factory Footage · 공장 현장 영상
              </div>
              <h3
                style={{
                  textAlign: 'center',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
                  fontWeight: 200,
                  color: '#fff',
                  marginBottom: 30,
                }}
              >
                베트남 직영 공장 <em style={{ color: 'var(--accent)', fontFamily: "'Noto Serif KR', serif", fontStyle: 'normal', fontWeight: 400 }}>실측 영상</em>
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {[
                  { id: '1nhqc4UMyUUgBJKwMBX8pPabVgj_M231g', title: '농장 현장 — 식목·관수' },
                  { id: '1dBm27G-X2cLWy5ISGCMcpRXRzsFlLlwg', title: '수확 현장 — 침향 채취' },
                  { id: '1uMxdrgJds4tYaMfiC-He9RXsu5P0vLLN', title: '특허 #12835 — 수지유도 공정' },
                  { id: '1fVou2UCQ4fETdRWYvkjXS5Wd3inBxa1I', title: '72시간 고온증류' },
                  { id: '1wdjW37Z8ETzPdMEwbHBBPF-t0TfMJjVV', title: 'VIMECO 위탁 제조 라인' },
                  { id: '1ftsQrPVw13ZSe84s6gRYiap1wgvie8in', title: '품질 검사 — 중금속 8종 불검출' },
                ].map((v) => (
                  <div
                    key={v.id}
                    style={{
                      border: '1px solid rgba(212,168,67,0.25)',
                      background: 'rgba(255,255,255,0.02)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ aspectRatio: '16 / 9', position: 'relative', background: '#000' }}>
                      <iframe
                        src={`https://drive.google.com/file/d/${v.id}/preview`}
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                        title={v.title}
                      />
                    </div>
                    <div
                      style={{
                        padding: '14px 16px',
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: '0.88rem',
                        color: '#fff',
                        fontWeight: 400,
                      }}
                    >
                      {v.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
