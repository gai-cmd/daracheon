'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import styles from '@/styles/zoel/story-page.module.css';
import type { AboutAgarwoodData } from './page';

interface Props {
  data: AboutAgarwoodData | null;
}

const TABS = ['침향이란?', '문헌에 실린 침향', '논문에 실린 침향', '매체에 실린 침향', '고객이 남긴 침향'] as const;

const FALLBACK_MEDIA_ITEMS: Array<{ outlet: string; date?: string; title: string; summary?: string; image?: string; link?: string }> = [
  {
    outlet: '한국경제',
    date: '2025.11',
    title: '25년의 기록 — 대라천, 200ha 침향 숲을 일구다',
    summary: '1998년 캄보디아에서 시작된 침향 여정, 베트남 하띤성 200ha 부지 400만 그루의 직영 농장으로 성장한 대라천의 이야기.',
  },
  {
    outlet: '한국디자인진흥원',
    date: '2026.01',
    title: '라이프스타일 브랜드 인증 — 조엘라이프',
    summary: '침향 원료의 프리미엄 라이프스타일 브랜드로서 정체성과 디자인 완성도를 인정받아 공식 인증 획득.',
  },
  {
    outlet: '식품의약품안전처',
    date: '2026.02',
    title: '건강기능식품 규격 부합 — Aquilaria Agallocha Roxburgh',
    summary: '식약처 고시 공식 학명에 등재된 진짜 침향. 대한민국약전외한약(생약)규격집과 식품공전, 두 곳에 공식 등록된 원료.',
  },
];

const FALLBACK_TESTIMONIAL_ITEMS: Array<{ name: string; role?: string; rating?: number; body: string; product?: string; image?: string }> = [
  {
    name: '김*선',
    role: '60대 · 직장인',
    rating: 5,
    body: '매일 아침 한 알씩 꾸준히 복용했더니 기력이 확연히 좋아졌습니다. 특히 환절기에도 컨디션이 안정적으로 유지되어 놀라웠어요.',
    product: '대라천 참침향환',
  },
  {
    name: '박*호',
    role: '50대 · 자영업',
    rating: 5,
    body: '잠을 제대로 이루지 못해 고민이 많았는데, 침향을 꾸준히 복용하면서 숙면에 도움을 받고 있습니다. 자연의 힘을 느낍니다.',
    product: '대라천 침향 오일',
  },
  {
    name: '이*영',
    role: '70대 · 주부',
    rating: 5,
    body: '손자가 선물해 준 침향환을 어머님께 드렸더니 매우 좋아하셨습니다. 어르신 선물로 이만한 게 없다고 생각합니다.',
    product: '대라천 참침향환 프리미엄',
  },
  {
    name: '정*현',
    role: '40대 · 직장인',
    rating: 4,
    body: '학명(Aquilaria Agallocha Roxburgh)을 직접 확인하고 구매했습니다. 진짜 침향의 그윽한 향과 품질에 만족하고 있어요.',
    product: '대라천 침향 오일',
  },
];

// Registry fallback (CMS data 없을 때) — data/db/pages.json 시드와 동일
const DEFAULT_REGISTRY_TITLE = '대한민국약전외한약(생약)규격집';
const DEFAULT_REGISTRY_SUBTITLE = '공식 등재';
const DEFAULT_REGISTRY_ROWS: Array<{ label: string; value: string }> = [
  { label: '정식명', value: '침수향(沈水香), AQUILARIAE LIGNUM' },
  { label: '학명', value: 'Aquilaria\u00A0Agallocha\u00A0Roxburgh' },
  { label: '과명', value: '팥꽃나무과 Thymeleaceae' },
  { label: '정의', value: '이 약은 침향나무의 수지가 침착된 수간목이다' },
  { label: '성상', value: '흑갈색을 띠며 수지를 함유하고 많은 평행 섬유질로 되어 있다' },
  { label: '기준', value: '건조감량 8.0% 이하, 회분 2.0% 이하, 묽은에탄올엑스 18.0% 이상' },
  { label: '특징', value: '흑갈색을 띠고 맛은 달고 쓰며 물에 가라앉아야 한다' },
];

export default function AboutAgarwoodClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<number>(0);

  const hero = data?.hero;
  const definition = data?.definitionSection;
  const formationSteps = data?.formationSteps ?? [];
  const specialReasons = data?.specialReasons ?? [];
  const benefits = data?.benefits ?? [];
  const literatures = data?.literatures ?? [];
  const papers = data?.papers ?? [];
  const mediaTab = data?.mediaTab;
  const testimonialsTab = data?.testimonialsTab;
  const mediaItems = mediaTab?.items && mediaTab.items.length > 0 ? mediaTab.items : FALLBACK_MEDIA_ITEMS;
  const testimonialItems = testimonialsTab?.items && testimonialsTab.items.length > 0 ? testimonialsTab.items : FALLBACK_TESTIMONIAL_ITEMS;
  const registry = data?.registrySection;
  const registryTitle = registry?.title ?? DEFAULT_REGISTRY_TITLE;
  const registrySubtitle = registry?.subtitle ?? DEFAULT_REGISTRY_SUBTITLE;
  const registryRows = registry?.rows && registry.rows.length > 0 ? registry.rows : DEFAULT_REGISTRY_ROWS;
  const cta = data?.cta;

  return (
    <>
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`}>
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero?.sectionTag ?? 'Agarwood Story · 침향 이야기'}</div>
          <h1>
            {hero?.titleKr ?? '이젠 진짜 침향,'}
            <br />
            <em>{hero?.titleEn ?? '학명부터 확인하세요'}</em>
          </h1>
          <p className={styles.lede}>
            {hero?.subtitle ??
              "식약처 고시 '대한민국약전외한약(생약)규격집'과 '식약처 식품공전'. 두 곳에 공식 등재된 바로 그 침향 — Aquilaria Agallocha Roxburgh."}
          </p>
        </div>
      </section>

      {/* TAB BAR */}
      <section
        style={{
          position: 'sticky',
          top: 72,
          zIndex: 40,
          background: 'rgba(10, 11, 16, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(212,168,67,0.15)',
          borderBottom: '1px solid rgba(212,168,67,0.15)',
        }}
      >
        <div className={styles.wrap} style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '14px 28px', flexWrap: 'wrap' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              aria-current={activeTab === i ? 'page' : undefined}
              style={{
                padding: '10px 20px',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '0.72rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                border: `1px solid ${activeTab === i ? 'var(--accent)' : 'rgba(212,168,67,0.25)'}`,
                background: activeTab === i ? 'var(--accent)' : 'transparent',
                color: activeTab === i ? 'var(--lx-black)' : 'rgba(255,255,255,0.7)',
                fontWeight: activeTab === i ? 600 : 400,
                transition: 'all 300ms',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* ════════════ TAB 0: 침향이란? ════════════ */}
      {activeTab === 0 && (
        <>
          {/* Chapter 01 — Definition */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>01</div>
                  <div className={styles.chapterTag}>Chapter I · Definition</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>{definition?.title ?? '침향(沈香)이란 무엇인가?'}</h3>
                  </RevealOnScroll>
                  <RevealOnScroll delay={100}>
                    <p style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', color: 'var(--accent-soft)', fontSize: '1.08rem', marginBottom: 18 }}>
                      {definition?.subtitle ?? '자연이 수십 년에 걸쳐 빚어낸 신비의 향, 물에 가라앉는 귀한 향나무 (세계 3대 향 중 하나)'}
                    </p>
                  </RevealOnScroll>
                  <RevealOnScroll delay={200}>
                    <p>
                      {definition?.body ??
                        '침향(沈香, Agarwood)은 팥꽃나무과(Thymeleaceae)에 속하는 Aquilaria 속 나무가 외부 상처나 곰팡이 감염에 대응하여 분비한 수지(樹脂)가 수십 년에 걸쳐 나무 내부에 침착되어 형성된 향목(香木)입니다.'}
                    </p>
                  </RevealOnScroll>
                  <RevealOnScroll delay={300}>
                    <div
                      style={{
                        marginTop: 26,
                        padding: '22px 24px',
                        border: '1px solid rgba(212,168,67,0.35)',
                        background: 'rgba(212,168,67,0.05)',
                      }}
                    >
                      <p style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.08rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                        진짜 침향, 이제는 학명을 반드시 확인하세요.
                      </p>
                      <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.85 }}>
                        공식 침향은{' '}
                        <span style={{ color: 'var(--accent)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {(definition?.officialNameCallout ?? '아퀼라리아 아갈로차 록스버그(Aquilaria Agallocha Roxburgh)')
                            .replace(/Aquilaria\s+Agallocha\s+Roxburgh/g, 'Aquilaria\u00A0Agallocha\u00A0Roxburgh')}
                        </span>
                        입니다.
                      </p>
                    </div>
                  </RevealOnScroll>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 02 — Official Registration (CMS 편집 가능) */}
          <section className={styles.chapter} data-alt="1">
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>02</div>
                  <div className={styles.chapterTag}>Chapter II · Registry</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>
                      {registryTitle}
                      <br />
                      <em>{registrySubtitle}</em>
                    </h3>
                  </RevealOnScroll>
                  <RevealOnScroll delay={150}>
                    <div
                      style={{
                        marginTop: 20,
                        padding: '28px 30px',
                        border: '1px solid rgba(212,168,67,0.25)',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '18px 30px',
                        }}
                      >
                        {registryRows.map((row) => (
                          <div
                            key={row.label}
                            style={{
                              display: 'flex',
                              gap: 18,
                              paddingBottom: 12,
                              borderBottom: '1px solid rgba(212,168,67,0.12)',
                            }}
                          >
                            <span
                              style={{
                                flexShrink: 0,
                                width: 70,
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.66rem',
                                letterSpacing: '0.18em',
                                color: 'var(--accent)',
                                textTransform: 'uppercase',
                                paddingTop: 3,
                              }}
                            >
                              {row.label}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontWeight: 300 }}>
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </RevealOnScroll>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 03 — Formation */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>03</div>
                  <div className={styles.chapterTag}>Chapter III · Formation</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>침향은 어떻게 만들어지나요?</h3>
                  </RevealOnScroll>
                  <RevealOnScroll delay={100}>
                    <p style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', color: 'var(--accent-soft)', fontSize: '1.08rem', marginBottom: 26 }}>
                      자연의 치유 본능이 만든 기적의 향
                    </p>
                  </RevealOnScroll>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 24,
                    }}
                  >
                    {(formationSteps.length > 0
                      ? formationSteps
                      : [
                          { step: '01', title: '외부 자극', description: '침향나무가 외부 상처나 곰팡이 감염 등 자극을 받습니다.' },
                          { step: '02', title: '수지 분비', description: '상처 치유를 위해 나무 스스로 방어 수지를 분비합니다.' },
                          { step: '03', title: '침착', description: '분비된 수지가 수십 년에 걸쳐 나무 내부에 서서히 침착됩니다.' },
                          { step: '04', title: '형성', description: '수지가 충분히 침착된 부분이 향목 — 침향이 됩니다.' },
                        ]
                    ).map((item, i) => (
                      <RevealOnScroll key={item.step + i} delay={i * 90}>
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              margin: '0 auto 18px',
                              borderRadius: '50%',
                              border: '1px solid var(--accent)',
                              display: 'grid',
                              placeItems: 'center',
                              fontFamily: "'Noto Serif KR', serif",
                              fontSize: '1.2rem',
                              fontWeight: 400,
                              color: 'var(--accent)',
                            }}
                          >
                            {item.step}
                          </div>
                          <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.08rem', color: 'var(--accent-soft)', marginBottom: 10, fontWeight: 400 }}>
                            {item.title}
                          </h4>
                          <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, fontWeight: 300 }}>
                            {item.description}
                          </p>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 04 — Why Special (4가지 이유) */}
          <section className={styles.chapter} data-alt="1">
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>04</div>
                  <div className={styles.chapterTag}>Chapter IV · Why Special</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>
                      침향이 <em>특별한 4가지 이유</em>
                    </h3>
                  </RevealOnScroll>
                  <div
                    style={{
                      marginTop: 26,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {(specialReasons.length > 0
                      ? specialReasons
                      : [
                          { title: '수십 년의 시간', description: '20년 이상의 긴 시간이 만들어낸 자연의 결정체입니다.' },
                          { title: '희귀한 수지', description: '전 세계적으로 생산량이 제한된 귀한 향목입니다.' },
                          { title: '학명 기반 품질', description: '식약처 고시 학명 Aquilaria Agallocha Roxburgh.' },
                          { title: '동서양 의학서', description: '동의보감·본초강목 등 수천 년간 약재로 기록.' },
                        ]
                    ).map((card, i) => (
                      <RevealOnScroll key={card.title + i} delay={i * 90}>
                        <div
                          style={{
                            padding: 26,
                            border: '1px solid rgba(212,168,67,0.22)',
                            background: 'rgba(255,255,255,0.02)',
                            height: '100%',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.62rem',
                              letterSpacing: '0.26em',
                              color: 'var(--accent)',
                              textTransform: 'uppercase',
                              marginBottom: 14,
                            }}
                          >
                            {String(i + 1).padStart(2, '0')} — Reason
                          </div>
                          <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.12rem', color: '#fff', marginBottom: 10, fontWeight: 400, lineHeight: 1.4 }}>
                            {card.title}
                          </h4>
                          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, fontWeight: 300 }}>
                            {card.description}
                          </p>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 05 — Benefits */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>05</div>
                  <div className={styles.chapterTag}>Chapter V · Benefits</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>
                      침향의 <em>효능에 주목!</em>
                    </h3>
                  </RevealOnScroll>
                  <div
                    style={{
                      marginTop: 26,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {(benefits.length > 0
                      ? benefits
                      : [
                          { title: '기혈 순환', description: '막힌 기를 뚫어 오장육부 기능을 정상화합니다.' },
                          { title: '자양강장', description: '찬 기운을 몰아내고 몸을 따뜻하게 보강합니다.' },
                          { title: '신경 안정', description: '예민한 신경을 이완시키고 숙면에 도움.' },
                          { title: '항염 · 혈관', description: '염증 억제와 혈관 건강 증진.' },
                          { title: '뇌 건강', description: '뇌혈류 개선과 뇌세포 보호.' },
                          { title: '소화 · 복통', description: '위를 따뜻하게 하여 소화 기능 개선.' },
                        ]
                    ).map((b, i) => (
                      <RevealOnScroll key={b.title + i} delay={(i % 6) * 70}>
                        <div style={{ paddingTop: 18, borderTop: '1px solid rgba(212,168,67,0.2)' }}>
                          <div
                            style={{
                              fontFamily: "'Noto Serif KR', serif",
                              fontSize: '1.3rem',
                              color: 'var(--accent)',
                              fontWeight: 400,
                              marginBottom: 8,
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </div>
                          <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.02rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                            {b.title}
                          </h4>
                          <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.8, fontWeight: 300 }}>
                            {b.description}
                          </p>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ════════════ TAB 1: 문헌에 실린 침향 ════════════ */}
      {activeTab === 1 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>—</div>
                <div className={styles.chapterTag}>Literature · 문헌</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>
                    <em>문헌에 실린 침향</em>
                  </h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p>
                    침향(沈香)은 수천 년간 동서양의 의학 문헌에서 그 가치를 인정받아 온 귀중한 약재입니다.
                  </p>
                </RevealOnScroll>
                {literatures.length > 0 ? (
                  <div
                    style={{
                      marginTop: 30,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {literatures.map((lit, i) => (
                      <RevealOnScroll key={lit.title + i} delay={(i % 6) * 60}>
                        <div
                          style={{
                            padding: 22,
                            border: '1px solid rgba(212,168,67,0.2)',
                            background: 'rgba(255,255,255,0.02)',
                            height: '100%',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                border: '1px solid rgba(212,168,67,0.35)',
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.62rem',
                                letterSpacing: '0.22em',
                                color: 'var(--accent)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {lit.year}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{lit.author}</span>
                          </div>
                          <h4
                            style={{
                              fontFamily: "'Noto Serif KR', serif",
                              fontSize: '1.05rem',
                              color: '#fff',
                              marginBottom: 6,
                              fontWeight: 400,
                              lineHeight: 1.4,
                            }}
                          >
                            {lit.title}
                          </h4>
                          <p
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.62rem',
                              letterSpacing: '0.2em',
                              color: 'var(--accent-soft)',
                              textTransform: 'uppercase',
                              marginBottom: 10,
                            }}
                          >
                            {lit.topic}
                          </p>
                          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontWeight: 300 }}>
                            {lit.description}
                          </p>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 30,
                      padding: '50px 30px',
                      textAlign: 'center',
                      border: '1px dashed rgba(212,168,67,0.25)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.68rem', letterSpacing: '0.28em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>
                      Coming Soon
                    </div>
                    문헌 자료가 곧 업데이트됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════ TAB 2: 논문에 실린 침향 ════════════ */}
      {activeTab === 2 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>—</div>
                <div className={styles.chapterTag}>Research · 논문</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>
                    <em>논문에 실린 침향</em>
                  </h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p>현대 과학 논문에서 그 가치를 인정받아 온 귀중한 약재입니다.</p>
                </RevealOnScroll>
                {papers.length > 0 ? (
                  <>
                    <div
                      style={{
                        marginTop: 30,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: 20,
                      }}
                    >
                      {papers.map((paper, i) => {
                        const CardInner = (
                          <div
                            style={{
                              padding: 22,
                              border: '1px solid rgba(212,168,67,0.2)',
                              background: 'rgba(255,255,255,0.02)',
                              height: '100%',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                              <span
                                style={{
                                  padding: '4px 10px',
                                  border: '1px solid rgba(212,168,67,0.35)',
                                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                  fontSize: '0.62rem',
                                  letterSpacing: '0.22em',
                                  color: 'var(--accent)',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {paper.year}
                              </span>
                              {paper.citations && paper.citations !== '-' && (
                                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
                                  cited {paper.citations}
                                </span>
                              )}
                            </div>
                            <h4
                              style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '0.98rem',
                                color: '#fff',
                                marginBottom: 8,
                                fontWeight: 400,
                                lineHeight: 1.5,
                              }}
                            >
                              {paper.title}
                            </h4>
                            {paper.authors && (
                              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 6, lineHeight: 1.6 }}>
                                {paper.authors}
                              </p>
                            )}
                            <p style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--accent-soft)' }}>
                              {paper.journal}
                            </p>
                            {paper.link && (
                              <p
                                style={{
                                  marginTop: 12,
                                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                  fontSize: '0.64rem',
                                  letterSpacing: '0.22em',
                                  color: 'var(--accent)',
                                  textTransform: 'uppercase',
                                }}
                              >
                                원문 보기 →
                              </p>
                            )}
                          </div>
                        );
                        return (
                          <RevealOnScroll key={paper.title + i} delay={(i % 6) * 60}>
                            {paper.link ? (
                              <a
                                href={paper.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                              >
                                {CardInner}
                              </a>
                            ) : (
                              CardInner
                            )}
                          </RevealOnScroll>
                        );
                      })}
                    </div>
                    <RevealOnScroll>
                      <p style={{ textAlign: 'center', marginTop: 50, fontSize: '0.86rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.85, fontWeight: 300 }}>
                        위 논문은 침향의 전통적·과학적 가치를 뒷받침하는 대표적인 자료입니다.
                      </p>
                    </RevealOnScroll>
                  </>
                ) : (
                  <div
                    style={{
                      marginTop: 30,
                      padding: '50px 30px',
                      textAlign: 'center',
                      border: '1px dashed rgba(212,168,67,0.25)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.68rem', letterSpacing: '0.28em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>
                      Coming Soon
                    </div>
                    논문 자료가 곧 업데이트됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════ TAB 3: 매체에 실린 침향 ════════════ */}
      {activeTab === 3 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>—</div>
                <div className={styles.chapterTag}>{mediaTab?.tag ?? 'In the Media · 매체'}</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>
                    <em>{mediaTab?.title ?? '매체에 실린 침향'}</em>
                  </h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p>
                    {mediaTab?.subtitle ??
                      '주요 매체와 기관에서 조명한 대라천 침향의 이야기. 25년의 기록과 공식 인증을 확인하세요.'}
                  </p>
                </RevealOnScroll>
                <div
                  style={{
                    marginTop: 30,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 20,
                  }}
                >
                  {mediaItems.map((item, i) => {
                    const CardInner = (
                      <div
                        style={{
                          padding: 22,
                          border: '1px solid rgba(212,168,67,0.2)',
                          background: 'rgba(255,255,255,0.02)',
                          height: '100%',
                        }}
                      >
                        {item.image && (
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              aspectRatio: '16/9',
                              marginBottom: 16,
                              overflow: 'hidden',
                              border: '1px solid rgba(212,168,67,0.15)',
                            }}
                          >
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="(max-width: 1024px) 50vw, 33vw"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              border: '1px solid rgba(212,168,67,0.35)',
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.62rem',
                              letterSpacing: '0.22em',
                              color: 'var(--accent)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.outlet}
                          </span>
                          {item.date && (
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{item.date}</span>
                          )}
                        </div>
                        <h4
                          style={{
                            fontFamily: "'Noto Serif KR', serif",
                            fontSize: '1.05rem',
                            color: '#fff',
                            marginBottom: 10,
                            fontWeight: 400,
                            lineHeight: 1.5,
                          }}
                        >
                          {item.title}
                        </h4>
                        {item.summary && (
                          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontWeight: 300 }}>
                            {item.summary}
                          </p>
                        )}
                        {item.link && (
                          <p
                            style={{
                              marginTop: 14,
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.64rem',
                              letterSpacing: '0.22em',
                              color: 'var(--accent)',
                              textTransform: 'uppercase',
                            }}
                          >
                            원문 보기 →
                          </p>
                        )}
                      </div>
                    );
                    return (
                      <RevealOnScroll key={item.title + i} delay={(i % 6) * 60}>
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                          >
                            {CardInner}
                          </a>
                        ) : (
                          CardInner
                        )}
                      </RevealOnScroll>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════ TAB 4: 고객이 남긴 침향 ════════════ */}
      {activeTab === 4 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>—</div>
                <div className={styles.chapterTag}>{testimonialsTab?.tag ?? 'Testimonials · 후기'}</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>
                    <em>{testimonialsTab?.title ?? '고객이 남긴 침향'}</em>
                  </h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p>
                    {testimonialsTab?.subtitle ??
                      '대라천 침향을 경험한 고객들의 진솔한 이야기. 세월이 빚어낸 향이 일상에 남긴 흔적입니다.'}
                  </p>
                </RevealOnScroll>
                <div
                  style={{
                    marginTop: 30,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 20,
                  }}
                >
                  {testimonialItems.map((item, i) => (
                    <RevealOnScroll key={item.name + i} delay={(i % 6) * 60}>
                      <div
                        style={{
                          padding: 24,
                          border: '1px solid rgba(212,168,67,0.2)',
                          background: 'rgba(255,255,255,0.02)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {typeof item.rating === 'number' && item.rating > 0 && (
                          <div style={{ marginBottom: 14, letterSpacing: '0.1em' }}>
                            {[...Array(5)].map((_, j) => (
                              <span
                                key={j}
                                style={{
                                  color: j < item.rating! ? 'var(--accent)' : 'rgba(212,168,67,0.2)',
                                  fontSize: '0.95rem',
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                        <p
                          style={{
                            fontFamily: "'Noto Serif KR', serif",
                            fontSize: '0.95rem',
                            color: 'rgba(255,255,255,0.82)',
                            lineHeight: 1.85,
                            fontWeight: 300,
                            flexGrow: 1,
                            marginBottom: 18,
                          }}
                        >
                          &ldquo;{item.body}&rdquo;
                        </p>
                        <div style={{ paddingTop: 14, borderTop: '1px solid rgba(212,168,67,0.15)' }}>
                          <div
                            style={{
                              fontFamily: "'Noto Serif KR', serif",
                              fontSize: '1rem',
                              color: '#fff',
                              fontWeight: 400,
                              marginBottom: 4,
                            }}
                          >
                            {item.name}
                          </div>
                          {item.role && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: 'rgba(255,255,255,0.55)',
                                marginBottom: 6,
                              }}
                            >
                              {item.role}
                            </div>
                          )}
                          {item.product && (
                            <div
                              style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.6rem',
                                letterSpacing: '0.22em',
                                color: 'var(--accent-soft)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {item.product}
                            </div>
                          )}
                        </div>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={styles.chapter} data-alt="1">
        <div className={styles.wrap} style={{ textAlign: 'center' }}>
          <RevealOnScroll>
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.3em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              — Explore —
            </div>
            <h3 style={{ marginBottom: 30, fontFamily: "'Noto Sans KR', sans-serif" }}>
              {cta?.title ?? '침향의 세계가 궁금하시다면'}
            </h3>
            <div style={{ display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link
                href={cta?.buttonProductsHref ?? '/products'}
                style={{
                  padding: '14px 28px',
                  background: 'var(--accent)',
                  color: 'var(--lx-black)',
                  border: '1px solid var(--accent)',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {cta?.buttonProducts ?? '제품 보기'}
              </Link>
              <Link
                href={cta?.buttonBrandHref ?? '/brand-story'}
                style={{
                  padding: '14px 28px',
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {cta?.buttonBrand ?? '브랜드 스토리'}
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
