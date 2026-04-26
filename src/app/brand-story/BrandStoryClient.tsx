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
  const certs = certificationsTab?.certs ?? [];
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
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero?.sectionTag ?? 'Brand Story'}</div>
          <div className={styles.heroMain}>
            <h1>
              {(() => {
                const t = hero?.titleKr ?? "대라천 '참'침향";
                const cut = t.indexOf("'참'");
                if (cut > 0) {
                  return <>{t.slice(0, cut).trim()}<br /><em>{t.slice(cut)}</em></>;
                }
                return t;
              })()}
            </h1>
            <p className={styles.lede}>
              {hero?.subtitle ??
                "조엘라이프의 대라천 '참'침향은 단순한 제품이 아닌, 자연이 허락한 수십 년 이상의 기다림을 선물합니다."}
            </p>
          </div>
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
                  <div className={styles.cardKicker}>농장 · {String(i + 1).padStart(2, '0')}</div>
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
                  <div>
                    <ul className={styles.timelineList}>
                      {era.items.map((it, j) => (
                        <li key={j}>{it}</li>
                      ))}
                    </ul>
                    {era.description && (
                      <p
                        style={{
                          marginTop: 14,
                          paddingTop: 14,
                          borderTop: '1px solid rgba(212,168,67,0.18)',
                          fontSize: '0.98rem',
                          color: 'rgba(255,255,255,0.78)',
                          lineHeight: 1.95,
                          fontWeight: 300,
                        }}
                      >
                        {era.description}
                      </p>
                    )}
                  </div>
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
            {/* 카테고리 범례 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '28px 0 32px' }}>
              {(['국제인증', '품질인증', '유기농인증', 'ISO인증', '특허', '수상', '사업등록'] as const).map((cat) => {
                const COLOR_MAP: Record<string, string> = {
                  국제인증: '#d4a843', 품질인증: '#6eb5ff', 유기농인증: '#7ecb7e',
                  ISO인증: '#b8a0e8', 특허: '#ff9a6c', 수상: '#ffd166', 사업등록: '#aaa',
                };
                return (
                  <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: `1px solid ${COLOR_MAP[cat]}44`, borderRadius: 999, fontSize: '0.68rem', color: COLOR_MAP[cat], fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR_MAP[cat], flexShrink: 0 }} />
                    {cat}
                  </span>
                );
              })}
            </div>

            {/* 인증서 액자 갤러리 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
                gap: 24,
                margin: '0 0 48px',
              }}
            >
              {certs.map((cert, i) => {
                const COLOR_MAP: Record<string, string> = {
                  국제인증: '#d4a843', 품질인증: '#6eb5ff', 유기농인증: '#7ecb7e',
                  ISO인증: '#b8a0e8', 특허: '#ff9a6c', 수상: '#ffd166', 사업등록: '#aaa',
                };
                const accentColor = COLOR_MAP[cert.category] ?? '#d4a843';
                return (
                  <a
                    key={i}
                    href={cert.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                    title={`${cert.name} 원본 보기`}
                  >
                    {/* 외부 액자 프레임 */}
                    <div
                      style={{
                        position: 'relative',
                        padding: '10px',
                        background: 'linear-gradient(145deg, #1c1a12, #110f0a)',
                        border: `2px solid ${accentColor}88`,
                        boxShadow: `0 0 0 1px #0a0b1044, inset 0 0 0 1px ${accentColor}22`,
                        transition: 'transform 220ms ease, box-shadow 220ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${accentColor}33, 0 0 0 1px #0a0b10`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px #0a0b1044, inset 0 0 0 1px ${accentColor}22`;
                      }}
                    >
                      {/* 네 모서리 장식 */}
                      {(['tl','tr','bl','br'] as const).map((pos) => (
                        <span key={pos} style={{
                          position: 'absolute',
                          width: 14, height: 14,
                          top: pos.startsWith('t') ? 3 : undefined,
                          bottom: pos.startsWith('b') ? 3 : undefined,
                          left: pos.endsWith('l') ? 3 : undefined,
                          right: pos.endsWith('r') ? 3 : undefined,
                          borderTop: pos.startsWith('t') ? `2px solid ${accentColor}` : undefined,
                          borderBottom: pos.startsWith('b') ? `2px solid ${accentColor}` : undefined,
                          borderLeft: pos.endsWith('l') ? `2px solid ${accentColor}` : undefined,
                          borderRight: pos.endsWith('r') ? `2px solid ${accentColor}` : undefined,
                        }} />
                      ))}

                      {/* 내부 매트 */}
                      <div style={{
                        border: `1px solid ${accentColor}33`,
                        padding: '8px',
                        background: 'rgba(255,255,255,0.02)',
                      }}>
                        {/* 인증서 이미지 — 원본 비율 유지, 고정 높이 컨테이너 */}
                        <div style={{ height: 260, background: '#f8f5ec', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, position: 'relative' }}>
                          <Image
                            src={cert.thumb}
                            alt={cert.name}
                            fill
                            sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, (max-width: 1200px) 22vw, 210px"
                            style={{ objectFit: 'contain', padding: 8 }}
                            unoptimized
                          />
                        </div>
                      </div>

                      {/* 카테고리 배지 */}
                      <div style={{
                        position: 'absolute', top: 14, right: 14,
                        padding: '2px 7px',
                        background: `${accentColor}22`,
                        border: `1px solid ${accentColor}66`,
                        borderRadius: 999,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.55rem',
                        letterSpacing: '0.14em',
                        color: accentColor,
                      }}>
                        {cert.category}
                      </div>
                    </div>

                    {/* 명판 */}
                    <div style={{
                      marginTop: 10,
                      textAlign: 'center',
                      padding: '0 4px',
                    }}>
                      <p style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontSize: '0.82rem',
                        color: '#fff',
                        fontWeight: 500,
                        lineHeight: 1.45,
                        marginBottom: 3,
                        wordBreak: 'keep-all',
                      }}>
                        {cert.name}
                      </p>
                      <p style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.58rem',
                        letterSpacing: '0.1em',
                        color: `${accentColor}99`,
                        lineHeight: 1.4,
                      }}>
                        {cert.nameEn}
                      </p>
                    </div>
                  </a>
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
                  {section.body && (
                    <p
                      style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop: '1px solid rgba(212,168,67,0.18)',
                        fontSize: '0.92rem',
                        color: 'rgba(255,255,255,0.68)',
                        lineHeight: 1.85,
                        fontWeight: 300,
                      }}
                    >
                      {section.body}
                    </p>
                  )}
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
            {qualityTab?.paragraphs && qualityTab.paragraphs.length > 0 && (
              <div
                style={{
                  marginTop: 36,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 20,
                }}
              >
                {qualityTab.paragraphs.map((p, i) => (
                  <div
                    key={p.title + i}
                    style={{
                      padding: '22px 26px',
                      border: '1px solid rgba(212,168,67,0.22)',
                      background: 'rgba(212,168,67,0.05)',
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: '0.7rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        marginBottom: 10,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')} · {p.title}
                    </div>
                    <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.9, fontWeight: 300 }}>
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
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

            {processTab?.paragraphs && processTab.paragraphs.length > 0 && (
              <div
                style={{
                  marginTop: 36,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: 20,
                }}
              >
                {processTab.paragraphs.map((p, i) => (
                  <div
                    key={p.title + i}
                    style={{
                      padding: '22px 26px',
                      border: '1px solid rgba(212,168,67,0.22)',
                      background: 'rgba(212,168,67,0.05)',
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: '0.7rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        marginBottom: 10,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')} · {p.title}
                    </div>
                    <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.9, fontWeight: 300 }}>
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

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
                  <a
                    key={v.id}
                    href={`https://drive.google.com/file/d/${v.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      border: '1px solid rgba(212,168,67,0.25)',
                      background: 'rgba(255,255,255,0.02)',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      transition: 'border-color 200ms',
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: '16 / 9',
                        position: 'relative',
                        background: '#000',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Drive 공개 썸네일 — iframe 은 auth 필요해 빈 화면이 돼 썸네일로 대체,
                          클릭 시 Drive 뷰어 새 탭으로 열어 실제 영상 재생 */}
                      <img
                        src={`https://lh3.googleusercontent.com/d/${v.id}=w1280`}
                        alt={v.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {/* Play overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)',
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: 'rgba(212,168,67,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0a0b10',
                            fontSize: '1.6rem',
                            lineHeight: 1,
                            paddingLeft: 4,
                            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                          }}
                        >
                          ▶
                        </div>
                      </div>
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
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
