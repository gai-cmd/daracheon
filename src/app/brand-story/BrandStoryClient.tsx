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

export default function BrandStoryClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  const hero = data?.hero;
  const brandStoryTab = data?.brandStoryTab;
  const farms = data?.farms ?? [];
  const sceneTab = data?.sceneTab;
  const sceneImages = sceneTab?.images ?? [];
  const historyTab = data?.historyTab;
  const eras = historyTab?.eras ?? [];
  const certificationsTab = data?.certificationsTab;
  const certImages = certificationsTab?.images ?? [];
  const certLabels = certificationsTab?.imageLabels ?? [];
  const certSections = certificationsTab?.sections ?? [];
  const qualityTab = data?.qualityTab;
  const qualityImages = qualityTab?.images ?? [];
  const heavyMetals = qualityTab?.heavyMetals ?? [];
  const processTab = data?.processTab;
  const processSteps = processTab?.steps ?? [];
  const processStats = processTab?.stats ?? [];

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`}>
        <div className="hero-bg-agarwood" aria-hidden />
        <div
          className={styles.heroBg}
          style={{ backgroundImage: hero?.heroBg ? `url('${hero.heroBg}')` : undefined }}
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
                {sceneTab?.body ?? ''}
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
