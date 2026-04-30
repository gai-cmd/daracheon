'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RevealOnScroll from '@/components/ui/RevealOnScroll';
import styles from '@/styles/zoel/story-page.module.css';
import type { AboutAgarwoodData, OfficialSourcesSection, AuthenticityTab, UsageTab } from './page';

/**
 * 학명(Latin scientific name) 및 괄호 음역을 한 덩어리로 유지.
 * word-break: keep-all 만으로는 영문 단어 사이 공백에서의 줄바꿈을
 * 막을 수 없으므로 white-space: nowrap 인라인 span 으로 처리.
 * 패턴: 대문자 시작 두 단어 이상 + 선택적으로 뒤따르는 (한국어 음역)
 */
function renderWithNowrap(text: string): ReactNode {
  const re = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s*\([^)]+\))?)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <span key={match.index} style={{ whiteSpace: 'nowrap' }}>
        {match[0]}
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 1 ? nodes : text;
}


const DEFAULT_AUTHENTICITY: AuthenticityTab = {
  subtitle: '진짜가 아닌 가짜가 판치는 시장, 이 세 가지로 반드시 확인하세요.',
  intro: '한국에도 많은 침향 제품들이 소개됐지만, 중요한 건 오리지널에 대한 정의입니다. 가짜가 아닌 진짜를 찾아야 하는데 이에 대한 기준이 모호한 것이 현실입니다. 진짜 침향은 크게 세 가지 방법 — 학명, 산지, 증빙문서 — 으로 확인할 수 있습니다.',
  check01Title: '학명을 따져봐야 한다',
  check01Body: '대한민국 정부의 공식문서 4곳에서 동일하게 등록된 침향은 Aquilaria Agallocha Roxburgh (아퀼라리아 아갈로차 록스버그)입니다.',
  check01Sources: [
    { label: '대한민국약전외한약(생약)규격집', value: '침향의 학명을 Aquilaria Agallocha Roxburgh로 명확히 정의.' },
    { label: '식약처 식품공전', value: '식용 가능한 침향의 학명 2종 — Aquilaria Agallocha Roxburgh / Aquilaria Malaccensis Lam.' },
    { label: '식약처 한약재 관능검사 해설서', value: '침향나무를 Aquilaria Agallocha Roxburgh로 정의.' },
    { label: '한국한의학연구원 한약자원연구센터', value: '침향을 상록교목 Aquilaria Agallocha Roxburgh로 설명.' },
  ],
  check02Title: '산지를 따져봐야 한다',
  check02Body: '고문헌들이 기록한 최고 산지는 역사적으로 베트남산이 가장 높은 품질을 인정받고 있으며, 현재도 가장 비싸게 거래됩니다.',
  check02QuoteSource: '향승(香乘) · 명대 1611년',
  check02QuoteBody: '명대의 주가조가 향에 관해 기록한 책. 침향의 품질을 산지별로 상세히 기록하며 최상품은 진랍(眞臘), 상품은 점성(占城)으로 구분했는데 이는 당시 베트남 중부지역을 말합니다. 이 외에도 교지(交趾), 안남(安南) 등 베트남 원산지를 최상품으로 기록합니다.',
  check03Title: '문서를 따져봐야 한다',
  check03Body: '진짜 침향이라면 아래 증빙 서류를 갖추고 있어야 합니다. 특히 CITES 인증서는 합법 원료 100% 보증 — 가짜 침향은 CITES 통과 불가능합니다.',
  check03Docs: [
    { doc: '원산지 증명서', desc: '베트남 정통 산지임을 확인', highlight: false },
    { doc: '정식 수입 증빙 서류', desc: '정상적인 통관·검역·수입 확인', highlight: false },
    { doc: '유기농 인증서', desc: '식용 가능 여부, 농약·화학물질 관리 확인', highlight: false },
    { doc: 'CITES 인증서', desc: '합법 원료 100% 보증. 가짜 침향은 통과 불가능', highlight: true },
    { doc: '성분검사서', desc: '실제 침향 성분 함량 확인', highlight: false },
    { doc: '유해물질성적서', desc: '중금속·잔류 농약·미생물 등 확인', highlight: false },
  ],
};

const DEFAULT_USAGE: UsageTab = {
  tag: 'Dosage & Usage · 복용법',
  title: '복용 및 사용법',
  subtitle: '침향 제품별 올바른 복용법과 사용 방법을 안내합니다.',
  introLines: [
    '침향의 하루 섭취량은 아퀼라리아 아갈로차 록스버그(AAR)에서 추출한 정품일 경우, 오일 기준 3mg, 분말 기준 0.5g이고, 오일은 아침 공복에, 분말은 저녁에 복용하시는 게 좋습니다.',
    '채취된 침향은 그 모양 그대로 사용되는 게 가장 좋기에, 고객의 요청이 있기 전까지는 형태를 변형시키거나 가공하지 않습니다.',
    "대라천 '참'침향은 제품이력제를 도입, 생산부터 유통까지 품질을 보증합니다.",
  ],
  items: [
    { product: '침향캡슐', instruction: '1일 1회 아침식사 후 1캡슐(1일 적정 침향오일 복용량은 3mg)을 권장합니다.' },
    { product: '침향오일(수지)', instruction: '1일 1~2회 손목이나 인중 또는 목 뒷부분에 발라주거나 소량을 복용합니다.' },
    { product: '침향수', instruction: '1일 1회 20ml씩 음용하거나 가습기 등을 이용해 취수 및 취향해도 좋습니다.' },
    { product: '침향스틱', instruction: "조금씩 조각 내 온열판에 올려 취향하시고, 그런 후 '차'처럼 다시 사용해도 좋습니다." },
    { product: '침향차', instruction: '1일 1회 25~30개의 조각을 뜨거운 물에 우려 마십니다. 재탕 삼탕해도 좋습니다. (뜨거운 물을 붓고 처음 올라오는 향은 반드시 취향하시길 권장합니다)' },
    { product: '침향단', instruction: '하루 1회 저녁식사 후 침향단을 천천히 씹어서 복용합니다.' },
    { product: '침향선향', instruction: '취향실을 정해 선향을 충분히 발향시키고 약 30분 후에 들어가 명상하며 취향합니다.' },
  ],
};

interface Props {
  data: AboutAgarwoodData | null;
}

const TABS = ['침향이란?', '진짜 침향 구별', '문헌에 실린 침향', '논문에 실린 침향', '복용 및 사용법'] as const;

export default function AboutAgarwoodClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [hoveredDefinitionBox, setHoveredDefinitionBox] = useState<boolean>(false);

  const hero = data?.hero;
  const definition = data?.definitionSection;
  const formationSteps = data?.formationSteps ?? [];
  const specialReasons = data?.specialReasons ?? [];
  const benefits = data?.benefits ?? [];
  const dosageSection = data?.dosageSection;
  const literatures = data?.literatures ?? [];
  const papers = data?.papers ?? [];
  const usageTab = data?.usageTab ?? DEFAULT_USAGE;
  const cta = data?.cta;
  const officialSources = data?.officialSourcesSection;
  const auth = data?.authenticityTab ?? DEFAULT_AUTHENTICITY;
  const tabHeroes = data?.tabHeroes ?? {};

  return (
    <>
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '40px' }}>
        {hero?.heroImage && (
          <Image
            src={hero.heroImage}
            alt=""
            fill
            sizes="100vw"
            priority
            unoptimized
            aria-hidden
            style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.7 }}
          />
        )}
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero?.sectionTag ?? '침향 이야기 · Agarwood Story'}</div>
          <div className={styles.heroMain}>
            <h1>
              {hero?.titleKr ?? '이젠 진짜 침향,'}
              <br />
              <em>{hero?.titleEn ?? '학명부터 확인하세요'}</em>
            </h1>
            <p className={styles.lede}>
              {renderWithNowrap(
                hero?.subtitle ??
                  "식약처 고시 '대한민국약전외한약(생약)규격집'과 '식약처 식품공전'. 두 곳에 공식 등재된 바로 그 침향 — Aquilaria Agallocha Roxburgh."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* STICKY TAB NAV */}
      <nav
        style={{
          position: 'sticky',
          top: 'var(--nav-h)',
          zIndex: 10,
          background: 'rgba(10,11,16,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212,168,67,0.15)',
        }}
      >
        <div className={styles.wrap} style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className={styles.chapterGrid}>
            <div aria-hidden />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
          </div>
        </div>
      </nav>

      {/* ════════════ TAB 0: 침향이란? ════════════ */}
      {activeTab === 0 && (
        <>
          {/* Chapter 01 — Definition */}
          <section className={styles.chapter} style={{ paddingTop: '32px' }}>
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
                        '침향(沈香, Agarwood)은 팥꽃나무과 Aquilaria 나무가 외부 상처나 곰팡이 감염에 맞서 분비한 수지(樹脂)가 수십 년간 나무 속에 쌓여 굳은 향목(香木)입니다.'}
                    </p>
                  </RevealOnScroll>
                  <RevealOnScroll delay={300}>
                    <div
                      onMouseEnter={() => setHoveredDefinitionBox(true)}
                      onMouseLeave={() => setHoveredDefinitionBox(false)}
                      style={{
                        marginTop: 26,
                        padding: '20px 20px',
                        border: `2px solid ${hoveredDefinitionBox ? 'var(--accent)' : 'rgba(212,168,67,0.5)'}`,
                        background: hoveredDefinitionBox ? 'rgba(212,168,67,0.15)' : 'rgba(212,168,67,0.08)',
                        transition: 'border-color 300ms ease, background 300ms ease',
                        cursor: 'pointer',
                        boxShadow: hoveredDefinitionBox ? '0 8px 32px rgba(212,168,67,0.15)' : '0 4px 16px rgba(212,168,67,0.05)',
                        overflow: 'hidden',
                      }}
                    >
                      <p style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 'clamp(0.95rem, 3vw, 1.08rem)', color: '#fff', marginBottom: 8, fontWeight: 600, wordBreak: 'keep-all' }}>
                        진짜 침향, 이제는 학명/품종을 반드시 확인하세요.
                      </p>
                      <p style={{ fontSize: 'clamp(0.82rem, 2.5vw, 0.92rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        공식 침향은{' '}
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                          아퀼라리아 아갈로차 록스버그{' '}
                          ({definition?.officialNameCallout ?? 'Aquilaria Agallocha Roxburgh'})
                        </span>
                        입니다.
                      </p>
                    </div>
                  </RevealOnScroll>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 02 — Formation */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>02</div>
                  <div className={styles.chapterTag}>Chapter II · Formation</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>{data?.formationSectionTitle ?? '침향은 어떻게 만들어지나요?'}</h3>
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
                        <div style={{ textAlign: 'center', border: '1px solid rgba(212,168,67,0.15)', overflow: 'hidden' }}>
                          {item.image && (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
                              <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: 'cover', display: 'block' }} />
                            </div>
                          )}
                          <div style={{ padding: '20px 16px' }}>
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
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 03 — Why Special (4가지 이유) */}
          <section className={styles.chapter} data-alt="1">
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>03</div>
                  <div className={styles.chapterTag}>Chapter III · Why Special</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>{data?.specialReasonsSectionTitle ?? '침향이 특별한 4가지 이유'}</h3>
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
                            border: '1px solid rgba(212,168,67,0.22)',
                            background: 'rgba(255,255,255,0.02)',
                            height: '100%',
                            overflow: 'hidden',
                          }}
                        >
                          {card.image && (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                              <Image src={card.image} alt={card.title} fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: 'cover', display: 'block' }} />
                            </div>
                          )}
                          <div style={{ padding: 26 }}>
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
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 04 — Benefits */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>04</div>
                  <div className={styles.chapterTag}>Chapter IV · Benefits</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>{data?.benefitsSectionTitle ?? '침향의 효능에 주목!'}</h3>
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
                        <div style={{ borderTop: '1px solid rgba(212,168,67,0.2)', overflow: 'hidden' }}>
                          {b.image && (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', marginBottom: 0 }}>
                              <Image src={b.image} alt={b.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover', display: 'block' }} />
                            </div>
                          )}
                          <div style={{ paddingTop: 18 }}>
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
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter V — Dosage · 하루 적정 복용량 */}
          {dosageSection && dosageSection.items && dosageSection.items.length > 0 && (
            <section className={styles.chapter}>
              <div className={styles.wrap}>
                <div className={styles.chapterGrid}>
                  <div>
                    <div className={styles.chapterNum}>05</div>
                    <div className={styles.chapterTag}>{dosageSection.tag ?? 'Chapter V · Dosage'}</div>
                  </div>
                  <div className={styles.chapterBody}>
                    <RevealOnScroll>
                      <h3>{dosageSection.title}</h3>
                    </RevealOnScroll>
                    <div style={{ marginTop: 26, display: 'grid', gap: 20 }}>
                      {dosageSection.items.map((item, i) => (
                        <RevealOnScroll key={item.num + i} delay={i * 80}>
                          <div
                            style={{
                              padding: '20px 24px',
                              border: '1px solid rgba(212,168,67,0.25)',
                              background: 'rgba(212,168,67,0.04)',
                              borderRadius: 4,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '1.1rem',
                                color: 'var(--accent)',
                                fontWeight: 400,
                                marginBottom: 10,
                              }}
                            >
                              {item.num}
                            </div>
                            <h4
                              style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '1.08rem',
                                color: '#fff',
                                marginBottom: 10,
                                fontWeight: 500,
                                lineHeight: 1.5,
                              }}
                            >
                              {item.title}
                            </h4>
                            <p
                              style={{
                                fontSize: '0.94rem',
                                color: 'rgba(255,255,255,0.72)',
                                lineHeight: 1.85,
                                fontWeight: 300,
                                whiteSpace: 'pre-line',
                              }}
                            >
                              {item.body}
                            </p>
                          </div>
                        </RevealOnScroll>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
          {/* Chapter 06 — 공식 근거 문헌 (한국 공식 4대 기준) */}
          {officialSources && (
            <section className={styles.chapter} data-alt="1">
              <div className={styles.wrap}>
                <div className={styles.chapterGrid}>
                  <div>
                    <div className={styles.chapterNum}>06</div>
                    <div className={styles.chapterTag}>Chapter VI · Official Proof</div>
                  </div>
                  <div className={styles.chapterBody}>
                    <RevealOnScroll>
                      <h3>{officialSources.title}</h3>
                    </RevealOnScroll>
                    <RevealOnScroll delay={100}>
                      <p style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', color: 'var(--accent-soft)', fontSize: '1.04rem', marginBottom: 32 }}>
                        {officialSources.subtitle}
                      </p>
                    </RevealOnScroll>
                    <div style={{ display: 'grid', gap: 20 }}>
                      {officialSources.sources.map((src, i) => (
                        <RevealOnScroll key={src.num} delay={i * 80}>
                          <div
                            style={{
                              padding: '24px 28px',
                              border: `1px solid ${src.highlight ? 'rgba(255,100,80,0.35)' : 'rgba(212,168,67,0.25)'}`,
                              background: src.highlight ? 'rgba(255,100,80,0.04)' : 'rgba(212,168,67,0.04)',
                              borderRadius: 4,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                              <span
                                style={{
                                  flexShrink: 0,
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  border: '1px solid var(--accent)',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontFamily: "'Noto Serif KR', serif",
                                  fontSize: '0.85rem',
                                  color: 'var(--accent)',
                                }}
                              >
                                {src.num}
                              </span>
                              <div>
                                <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.08rem', color: '#fff', marginBottom: 4, fontWeight: 500 }}>
                                  {src.name}
                                </h4>
                                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                                  {src.authority}
                                </p>
                              </div>
                            </div>
                            <div
                              style={{
                                marginBottom: 12,
                                padding: '10px 14px',
                                background: 'rgba(212,168,67,0.1)',
                                borderLeft: '3px solid var(--accent)',
                              }}
                            >
                              <p style={{ fontSize: '0.94rem', color: '#fff', fontWeight: 600, margin: 0 }}>{src.finding}</p>
                            </div>
                            <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.85, fontWeight: 300 }}>
                              {src.detail}
                            </p>
                            {src.highlight && (
                              <div
                                style={{
                                  marginTop: 12,
                                  padding: '8px 14px',
                                  background: 'rgba(255,100,80,0.12)',
                                  borderLeft: '3px solid rgba(255,100,80,0.7)',
                                  borderRadius: 2,
                                }}
                              >
                                <p style={{ fontSize: '0.82rem', color: 'rgba(255,150,130,0.9)', fontWeight: 600, margin: 0 }}>
                                  ⚠ {src.highlight}
                                </p>
                              </div>
                            )}
                          </div>
                        </RevealOnScroll>
                      ))}
                    </div>
                    <RevealOnScroll delay={400}>
                      <div
                        style={{
                          marginTop: 32,
                          padding: '28px 30px',
                          border: '2px solid var(--accent)',
                          background: 'rgba(212,168,67,0.06)',
                        }}
                      >
                        <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.12rem', color: 'var(--accent)', marginBottom: 14, fontWeight: 500 }}>
                          {officialSources.conclusionTitle}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.78)', lineHeight: 2, fontWeight: 300, whiteSpace: 'pre-line' }}>
                          {officialSources.conclusionBody}
                        </p>
                      </div>
                    </RevealOnScroll>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ════════════ TAB 1: 진짜 침향 구별 방법 ════════════ */}
      {activeTab === 1 && (
        <>
        <section className={styles.chapter} style={{ paddingTop: '32px' }}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>Authenticity · 감별법</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>
                    <em>진짜 침향 구별 방법</em>
                  </h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', color: 'var(--accent-soft)', fontSize: '1.04rem', marginBottom: 18 }}>
                    {auth.subtitle}
                  </p>
                </RevealOnScroll>
                <RevealOnScroll delay={150}>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, marginBottom: 36 }}>
                    {auth.intro}
                  </p>
                </RevealOnScroll>

                {/* Check 01 — 학명 */}
                <RevealOnScroll delay={200}>
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.62rem', letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        CHECK · 01
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(212,168,67,0.25)' }} />
                    </div>
                    <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.18rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                      {auth.check01Title}
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, marginBottom: 20, fontWeight: 300 }}>
                      {renderWithNowrap(auth.check01Body)}
                    </p>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {auth.check01Sources.map((row, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: 16,
                            padding: '14px 18px',
                            border: '1px solid rgba(212,168,67,0.2)',
                            background: 'rgba(212,168,67,0.03)',
                          }}
                        >
                          <span style={{ flexShrink: 0, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--accent)', paddingTop: 3, textTransform: 'uppercase' }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500, marginBottom: 4 }}>{row.label}</p>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, fontWeight: 300 }}>{renderWithNowrap(row.value)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 원문 캡처 — VIHECO 성분명세서 (Aquilaria agallocha Roxburgh 학명 실증) */}
                    <div style={{ marginTop: 28 }}>
                      <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                        원문 서류 · 성분명세서
                      </p>
                      <div style={{ position: 'relative', border: '1px solid rgba(212,168,67,0.3)', overflow: 'hidden', maxHeight: 280 }}>
                        <Image
                          src="/uploads/misc/kfda-doc-1.jpg"
                          alt="VIHECO 제약사 성분명세서 — Agarwood oil 학명: Aquilaria agallocha Roxburgh"
                          width={900}
                          height={1200}
                          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover', objectPosition: 'top' }}
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px', background: 'rgba(10,11,16,0.82)', backdropFilter: 'blur(8px)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                          VIHECO 중앙제약 성분명세서 — Agarwood oil · <em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>Aquilaria agallocha Roxburgh</em> · 2026.03.10
                        </div>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>

                {/* Check 02 — 산지 */}
                <RevealOnScroll delay={250}>
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.62rem', letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        CHECK · 02
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(212,168,67,0.25)' }} />
                    </div>
                    <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.18rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                      {auth.check02Title}
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, marginBottom: 20, fontWeight: 300 }}>
                      {renderWithNowrap(auth.check02Body)}
                    </p>
                    <div
                      style={{
                        padding: '22px 26px',
                        border: '1px solid rgba(212,168,67,0.3)',
                        background: 'rgba(212,168,67,0.05)',
                        borderLeft: '4px solid var(--accent)',
                      }}
                    >
                      <p style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '0.9rem', color: 'var(--accent)', marginBottom: 6, fontWeight: 500 }}>
                        {auth.check02QuoteSource}
                      </p>
                      <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.85, fontWeight: 300 }}>
                        {renderWithNowrap(auth.check02QuoteBody)}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>

                {/* Check 03 — 증빙문서 */}
                <RevealOnScroll delay={300}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.62rem', letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        CHECK · 03
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(212,168,67,0.25)' }} />
                    </div>
                    <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.18rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                      {auth.check03Title}
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, marginBottom: 20, fontWeight: 300 }}>
                      {renderWithNowrap(auth.check03Body)}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                      {auth.check03Docs.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '16px 18px',
                            border: `1px solid ${item.highlight ? 'rgba(255,100,80,0.4)' : 'rgba(212,168,67,0.2)'}`,
                            background: item.highlight ? 'rgba(255,100,80,0.05)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <p style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '0.92rem', color: item.highlight ? '#ff9080' : '#fff', fontWeight: 500, marginBottom: 6 }}>
                            {item.doc}
                          </p>
                          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.75, fontWeight: 300 }}>
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* 원문 인증서 갤러리 */}
                    <div style={{ marginTop: 36 }}>
                      <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>
                        보유 인증서 원본
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                        {[
                          { src: '/uploads/misc/cert-iso22000.jpg', label: 'ISO 22000:2018', sub: '식품안전 경영시스템 인증' },
                          { src: '/uploads/misc/cert-gmp.jpg', label: 'GMP 인증', sub: '베트남 식품안전청 · 식품 안전기준 준수시설' },
                          { src: '/uploads/misc/cert-iso13485.jpg', label: 'ISO 13485:2016', sub: '품질 경영시스템 인증' },
                          { src: '/uploads/misc/cert-ocop.jpg', label: 'OCOP 4성급', sub: '베트남 동나이 인민위원회 · 2025' },
                          { src: '/uploads/misc/cert-gold-brand.jpg', label: '황금브랜드 인증', sub: '베트남 농업총국 · 2025' },
                          { src: '/uploads/misc/cert-asia-brand.jpg', label: 'Asia Excellent Brand', sub: 'Top 10 아시아 우수 브랜드 · 2025' },
                        ].map((cert) => (
                          <div key={cert.src} style={{ border: '1px solid rgba(212,168,67,0.2)', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ position: 'relative', aspectRatio: '3/4', background: '#fff' }}>
                              <Image
                                src={cert.src}
                                alt={cert.label}
                                fill
                                style={{ objectFit: 'contain', padding: 8 }}
                              />
                            </div>
                            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(212,168,67,0.15)' }}>
                              <p style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500, marginBottom: 3 }}>{cert.label}</p>
                              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{cert.sub}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 식약청 제출 서류 원본 */}
                    <div style={{ marginTop: 36 }}>
                      <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>
                        식약청 제출 서류 원본
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                        {[
                          { src: '/uploads/misc/kfda-doc-1.jpg', label: '성분 명세서', sub: 'Aquilaria agallocha Roxburgh 학명 기재' },
                          { src: '/uploads/misc/kfda-doc-2.jpg', label: '항산화제 인증서', sub: 'd-α-토코페롤 성분 확인' },
                          { src: '/uploads/misc/kfda-doc-3.jpg', label: '생산 공정도', sub: '캡슐 제조 전 공정 기록' },
                          { src: '/uploads/misc/kfda-doc-4.jpg', label: '젤라틴 안전 확인서', sub: 'BSE 안전 돈피 유래 젤라틴' },
                        ].map((doc) => (
                          <div key={doc.src} style={{ border: '1px solid rgba(212,168,67,0.2)', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ position: 'relative', aspectRatio: '3/4', background: '#fff' }}>
                              <Image
                                src={doc.src}
                                alt={doc.label}
                                fill
                                style={{ objectFit: 'contain', padding: 8 }}
                              />
                            </div>
                            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(212,168,67,0.15)' }}>
                              <p style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500, marginBottom: 3 }}>{doc.label}</p>
                              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{doc.sub}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* ════════════ TAB 2: 문헌에 실린 침향 ════════════ */}
      {activeTab === 2 && (
        <>
        <section className={styles.chapter} style={{ paddingTop: '32px' }}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
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
        </>
      )}

      {/* ════════════ TAB 3: 논문에 실린 침향 ════════════ */}
      {activeTab === 3 && (
        <>
        <section className={styles.chapter} style={{ paddingTop: '32px' }}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
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
        </>
      )}

      {/* ════════════ TAB 4: 복용 및 사용법 ════════════ */}
      {activeTab === 4 && (
        <>
        <section className={styles.chapter} style={{ paddingTop: '32px' }}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>{usageTab.tag ?? 'Dosage & Usage · 복용법'}</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>
                    <em>{usageTab.title ?? '복용 및 사용법'}</em>
                  </h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', color: 'var(--accent-soft)', fontSize: '1.04rem', marginBottom: 18 }}>
                    {usageTab.subtitle ?? '침향 제품별 올바른 복용법과 사용 방법을 안내합니다.'}
                  </p>
                </RevealOnScroll>
                <div style={{ marginTop: 10, marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(usageTab.introLines ?? DEFAULT_USAGE.introLines!).map((line, i) => (
                    <RevealOnScroll key={i} delay={i * 80}>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, fontWeight: 300, paddingLeft: 14, borderLeft: '2px solid rgba(212,168,67,0.35)' }}>
                        {line}
                      </p>
                    </RevealOnScroll>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {(usageTab.items ?? DEFAULT_USAGE.items).map((item, i) => (
                    <RevealOnScroll key={item.product + i} delay={(i % 7) * 60}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 20,
                          padding: '20px 0',
                          borderBottom: '1px solid rgba(212,168,67,0.15)',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flexShrink: 0, minWidth: 100 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              border: '1px solid rgba(212,168,67,0.4)',
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.65rem',
                              letterSpacing: '0.12em',
                              color: 'var(--accent)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.product}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.85, fontWeight: 300, wordBreak: 'keep-all' }}>
                          {item.instruction}
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
