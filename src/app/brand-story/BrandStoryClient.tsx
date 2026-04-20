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
  '매체에 실린 침향',
  '고객이 말한 침향',
] as const;

const DEFAULT_HERO_BG =
  'https://assets.floot.app/e11132a3-2be5-48d4-9778-d3572811b06d/1663ba31-5f63-43a3-904f-5b635d42acd4.jpg';

export default function BrandStoryClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  const hero = data?.hero;
  const brandStoryTab = data?.brandStoryTab;
  const farms = data?.farms ?? [];
  const sceneTab = data?.sceneTab;
  const historyTab = data?.historyTab;
  const certificationsTab = data?.certificationsTab;
  const qualityTab = data?.qualityTab;
  const processTab = data?.processTab;
  const mediaTab = data?.mediaTab;
  const testimonialsTab = data?.testimonialsTab;

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url('${hero?.heroBg ?? DEFAULT_HERO_BG}')` }}
          aria-hidden
        />
        <div className={styles.heroInner}>
          <div className={styles.heroKicker}>{hero?.sectionTag ?? 'Agarwood Story'}</div>
          <div className={styles.heroHanja} aria-hidden>沈香</div>
          <h1>{hero?.titleKr ?? "대라천 '참'침향"}</h1>
          <p className={styles.heroSub}>
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
                <span className={styles.tabIdx}>{String(i + 1).padStart(2, '0')}</span>
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
            {sceneTab?.images && sceneTab.images.length > 0 && (
              <div className={styles.imgGrid}>
                {sceneTab.images.map((src, i) => (
                  <div key={i} className={styles.imgFrame}>
                    <Image src={src} alt={`현장 ${i + 1}`} fill sizes="(max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
            <div className={styles.chapterBody}>
              <p style={{ whiteSpace: 'pre-line' }}>
                {sceneTab?.body ?? '하띤성 200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리합니다.'}
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
              {(historyTab?.eras ?? []).map((era, i) => (
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
            {certificationsTab?.images && certificationsTab.images.length > 0 && (
              <div className={styles.imgGrid}>
                {certificationsTab.images.map((src, i) => (
                  <div key={i} className={styles.imgFrame} style={{ aspectRatio: '3/4', background: '#fff', padding: 12 }}>
                    <Image src={src} alt={`인증서 ${i + 1}`} fill sizes="(max-width: 1024px) 50vw, 25vw" style={{ objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            )}
            <div className={styles.gridAuto}>
              {(certificationsTab?.sections ?? []).map((section, i) => (
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
            {qualityTab?.images && qualityTab.images.length > 0 && (
              <div className={styles.imgGrid}>
                {qualityTab.images.map((src, i) => (
                  <div key={i} className={styles.imgFrame}>
                    <Image src={src} alt={`품질 ${i + 1}`} fill sizes="(max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
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
                  {(qualityTab?.heavyMetals ?? []).map((m) => (
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
            <div className={styles.stepGrid}>
              {(processTab?.steps ?? []).map((step, i) => (
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
          </div>
        </section>
      )}

      {/* TAB 6 — Media */}
      {activeTab === 6 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterHead}>
              <div className={styles.chapterTag}>{mediaTab?.tag ?? 'IN THE MEDIA'}</div>
              <h2 className={styles.chapterTitle}>{mediaTab?.title ?? '매체에 실린 침향'}</h2>
              {mediaTab?.subtitle && <p className={styles.chapterSubtitle}>{mediaTab.subtitle}</p>}
              <div className={styles.line} />
            </div>
            {mediaTab?.items && mediaTab.items.length > 0 ? (
              <div className={styles.gridAuto}>
                {mediaTab.items.map((item, i) => {
                  const card = (
                    <div className={styles.card}>
                      {item.image && (
                        <div className={styles.imgFrame} style={{ marginBottom: 14, aspectRatio: '16/9' }}>
                          <Image src={item.image} alt={item.title} fill sizes="(max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
                        </div>
                      )}
                      <div className={styles.cardKicker}>
                        {item.outlet}
                        {item.date ? ` · ${item.date}` : ''}
                      </div>
                      <div className={styles.cardTitle}>{item.title}</div>
                      {item.summary && <div className={styles.cardDesc}>{item.summary}</div>}
                    </div>
                  );
                  return item.link ? (
                    <a
                      key={item.title + i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      {card}
                    </a>
                  ) : (
                    <div key={item.title + i}>{card}</div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyTag}>Coming Soon</div>
                등록된 매체 기사가 없습니다.
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 7 — Testimonials */}
      {activeTab === 7 && (
        <section className={`${styles.chapter} ${styles.chapterAlt}`}>
          <div className={styles.wrap}>
            <div className={styles.chapterHead}>
              <div className={styles.chapterTag}>{testimonialsTab?.tag ?? 'TESTIMONIALS'}</div>
              <h2 className={styles.chapterTitle}>{testimonialsTab?.title ?? '고객이 말한 침향'}</h2>
              {testimonialsTab?.subtitle && <p className={styles.chapterSubtitle}>{testimonialsTab.subtitle}</p>}
              <div className={styles.line} />
            </div>
            {testimonialsTab?.items && testimonialsTab.items.length > 0 ? (
              <div className={styles.gridAuto}>
                {testimonialsTab.items.map((item, i) => (
                  <div key={item.name + i} className={styles.testCard}>
                    {typeof item.rating === 'number' && (
                      <div className={styles.testStars}>
                        {[...Array(5)].map((_, j) => (
                          <span key={j} className={j < item.rating! ? styles.testStarFill : styles.testStar}>
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                    <p className={styles.testBody}>{item.body}</p>
                    <div className={styles.testFoot}>
                      <span className={styles.testName}>{item.name}</span>
                      {item.role && <span className={styles.testRole}>{item.role}</span>}
                      {item.product && <span className={styles.testProd}>{item.product}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyTag}>Coming Soon</div>
                등록된 고객 후기가 없습니다.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
