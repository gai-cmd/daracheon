'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { BrandStoryData, PromoVideoItem } from './page';
import type { ShowroomData } from '@/app/showroom/page';
import ChapterCarousel from '@/components/ui/ChapterCarousel';
import StickyTabBar from '@/components/layout/StickyTabBar';
import styles from './BrandStoryClient.module.css';
import storyStyles from '@/styles/zoel/story-page.module.css';

interface Props {
  data: BrandStoryData | null;
  showroom?: ShowroomData | null;
}

const TAB_LIST = [
  '브랜드 스토리',
  '다양한 인증',
  '생산 공정',
] as const;

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function PromoVideoModal({ item, onClose }: { item: PromoVideoItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const ytId = item.url ? extractYouTubeId(item.url) : null;
  const driveMatch = item.url ? item.url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^#]*id=)([A-Za-z0-9_-]+)/) : null;
  const embedSrc = ytId
    ? `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`
    : driveMatch
      ? `https://drive.google.com/file/d/${driveMatch[1]}/preview`
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.92)',
        display: 'grid', placeItems: 'center',
        padding: 'clamp(12px, 4vw, 40px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 1280, maxHeight: '90dvh',
          background: '#000',
          border: '1px solid rgba(212,168,67,0.35)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', background: 'rgba(10,11,16,0.95)',
            borderBottom: '1px solid rgba(212,168,67,0.2)', gap: 16,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {(item.source || item.date) && (
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '0.7rem', letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4,
                }}
              >
                {[item.source, item.date].filter(Boolean).join(' · ')}
              </div>
            )}
            <h3
              style={{
                fontSize: '1.05rem', fontWeight: 500, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
              }}
            >
              {item.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', padding: '6px 12px',
                  border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                원본 →
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              style={{
                width: 36, height: 36, background: 'transparent',
                border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
                fontSize: '1.1rem', cursor: 'pointer', borderRadius: 4,
              }}
            >✕</button>
          </div>
        </div>
        <div style={{ position: 'relative', aspectRatio: '16 / 9', width: '100%', background: '#000', overflow: 'hidden' }}>
          {embedSrc ? (
            <iframe
              src={embedSrc}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              title={item.title}
            />
          ) : (
            <div
              style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                color: 'rgba(255,255,255,0.6)', fontSize: '0.92rem', padding: 40, textAlign: 'center',
              }}
            >
              임베드할 수 있는 영상이 아닙니다.
            </div>
          )}
        </div>
        {item.excerpt && (
          <div
            style={{
              padding: '16px 20px', background: 'rgba(10,11,16,0.95)',
              borderTop: '1px solid rgba(212,168,67,0.15)',
              color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem',
              lineHeight: 1.85, fontWeight: 300,
            }}
          >
            {item.excerpt}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrandStoryClient({ data, showroom }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [activePromoVideo, setActivePromoVideo] = useState<PromoVideoItem | null>(null);

  const hero = data?.hero;
  const tabHeroes = data?.tabHeroes ?? {};
  const brandStoryTab = data?.brandStoryTab;
  const promoVideos = data?.promoVideos;
  const historyTab = data?.historyTab;
  const eras = historyTab?.eras ?? [];
  const certificationsTab = data?.certificationsTab;
  const certs = certificationsTab?.certs ?? [];
  const certSections = certificationsTab?.sections ?? [];
  const processTab = data?.processTab;
  const processSteps = processTab?.steps ?? [];
  const processStats = processTab?.stats ?? [];
  const processGroups = processTab?.processGroups ?? [];
  const processHeroImages = (processTab?.heroImages ?? []).filter(Boolean);

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${storyStyles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '40px' }}>
        {hero?.heroBg && (
          <Image
            src={hero.heroBg}
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
        <div className={storyStyles.wrap}>
          <div className={storyStyles.kicker}>{hero?.sectionTag ?? '브랜드 스토리 · Brand Story'}</div>
          <div className={storyStyles.heroMain}>
            <h1>
              {(() => {
                const t = hero?.titleKr ?? "대라천 '참'침향";
                const en = hero?.titleEn;
                if (en) {
                  return <>{t}<br /><em>{en}</em></>;
                }
                const cut = t.indexOf("'참'");
                if (cut > 0) {
                  return <>{t.slice(0, cut).trim()}<br /><em>{t.slice(cut)}</em></>;
                }
                return t;
              })()}
            </h1>
            <p className={storyStyles.lede}>
              {hero?.subtitle ??
                "조엘라이프의 대라천 '참'침향은 단순한 제품이 아닌, 자연이 허락한 수십 년 이상의 기다림을 선물합니다."}
            </p>
          </div>
        </div>
      </section>

      <StickyTabBar
        tabs={TAB_LIST.map((label, i) => ({ key: String(i), label }))}
        activeKey={String(activeTab)}
        onChange={(k) => setActiveTab(Number(k))}
      />

      {/* TAB 0 — Brand Story + History (통합) */}
      {activeTab === 0 && (
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            {/* 01 — 브랜드 스토리 */}
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>{brandStoryTab?.sourceTag ?? 'THE SOURCE'}</div>
              </div>
              <div>
                <h2 className={styles.chapterTitle}>
                  {brandStoryTab?.headlineTitle ?? '100% 베트남산, 아갈로차 침향나무만!'}
                </h2>
                <p className={styles.chapterSubtitle}>
                  {brandStoryTab?.headlineSubtitle ?? '200ha 부지에 400만 그루 이상의 침향나무가 자라는 생명의 터전'}
                </p>
                {tabHeroes.tab0 && (
                  <div
                    style={{
                      marginTop: 30,
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      border: '1px solid rgba(212,168,67,0.2)',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={tabHeroes.tab0}
                      alt="브랜드 스토리 — 상징 이미지"
                      fill
                      sizes="(max-width: 768px) 100vw, 880px"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}
                <div className={styles.line} style={{ margin: '24px 0' }} />
                <p style={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: 1.95, color: 'rgba(255,255,255,0.72)', fontWeight: 300, marginBottom: 16 }}>
                  {brandStoryTab?.sourceBody ??
                    '베트남 5개 성(하띤·동나이·냐짱·푸국·람동)에 자리한 대라천 직영 농장.\n\n200ha 부지에서 400만 그루 이상의 침향나무를 직접 관리하며 25년 동안 가꿔왔습니다.'}
                </p>
              </div>
            </div>

            {/* 02 — 대라천 침향 역사 (통합 섹션) */}
            <div className={`${styles.chapterGrid} ${styles.subSectionDivider}`}>
              <div>
                <div className={styles.chapterNum}>02</div>
                <div className={styles.chapterTag}>{historyTab?.tag ?? 'HISTORY'}</div>
              </div>
              <div>
                <h2 className={styles.chapterTitle}>{historyTab?.title ?? '대라천 침향 역사'}</h2>
                <div className={styles.line} style={{ margin: '24px 0' }} />
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
                        {era.image && (
                          <figure style={{ margin: 0 }}>
                            <div className={styles.timelineImg}>
                              <Image
                                src={era.image}
                                alt={era.imageCaption ?? `${era.era} 대라천 침향 역사 이미지`}
                                fill
                                sizes="(max-width: 900px) 100vw, 700px"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            {era.imageCaption && (
                              <figcaption className={styles.timelineImgCaption}>
                                {era.imageCaption}
                              </figcaption>
                            )}
                          </figure>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 03 — SHOWROOM (대라천 '참'침향 전시장) */}
            {showroom && (
              <div className={`${styles.chapterGrid} ${styles.subSectionDivider}`}>
                <div>
                  <div className={styles.chapterNum}>03</div>
                  <div className={styles.chapterTag}>SHOWROOM</div>
                </div>
                <div>
                  <h2 className={styles.chapterTitle}>
                    {showroom.intro?.title ?? "대라천 '참'침향 전시장"}
                  </h2>
                  {showroom.intro?.tag && (
                    <p className={styles.chapterSubtitle}>{showroom.intro.tag}</p>
                  )}
                  <div className={styles.line} style={{ margin: '24px 0' }} />
                  {showroom.intro?.body && (
                    <p
                      style={{
                        whiteSpace: 'pre-line',
                        fontSize: '1rem',
                        lineHeight: 1.95,
                        color: 'rgba(255,255,255,0.72)',
                        fontWeight: 300,
                        marginBottom: 16,
                      }}
                    >
                      {showroom.intro.body}
                    </p>
                  )}
                  {showroom.gallery && showroom.gallery.length > 0 && (
                    <ChapterCarousel
                      images={showroom.gallery.map((g) => g.src).filter(Boolean)}
                      alt="대라천 '참'침향 전시장"
                      caption={showroom.visit?.address}
                    />
                  )}
                </div>
              </div>
            )}

            {/* 04 — 대라천 '참'침향 브랜드 홍보영상 */}
            {promoVideos && promoVideos.items.length > 0 && (
              <div className={`${styles.chapterGrid} ${styles.subSectionDivider}`}>
                <div>
                  <div className={styles.chapterNum}>{promoVideos.num ?? '04'}</div>
                  <div className={styles.chapterTag}>{promoVideos.tag ?? 'VIDEOS'}</div>
                </div>
                <div>
                  <h2 className={styles.chapterTitle}>
                    {promoVideos.title ?? "대라천 '참'침향 브랜드 홍보영상"}
                  </h2>
                  {promoVideos.subtitle && (
                    <p className={styles.chapterSubtitle}>{promoVideos.subtitle}</p>
                  )}
                  <div className={styles.line} style={{ margin: '24px 0' }} />
                  {promoVideos.body && (
                    <p
                      style={{
                        whiteSpace: 'pre-line',
                        fontSize: '1rem',
                        lineHeight: 1.95,
                        color: 'rgba(255,255,255,0.72)',
                        fontWeight: 300,
                        marginBottom: 16,
                      }}
                    >
                      {promoVideos.body}
                    </p>
                  )}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 24,
                      marginTop: 30,
                    }}
                  >
                    {promoVideos.items.map((item, vIdx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActivePromoVideo(item)}
                        style={{
                          textAlign: 'left',
                          background: 'transparent',
                          padding: 0,
                          border: 0,
                          cursor: 'pointer',
                          color: 'inherit',
                          display: 'block',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            aspectRatio: '16/9',
                            position: 'relative',
                            overflow: 'hidden',
                            background: '#1a1d29',
                            border: '1px solid rgba(212,168,67,0.18)',
                          }}
                        >
                          {item.thumbnail && (
                            <Image
                              src={item.thumbnail}
                              alt={item.title}
                              fill
                              sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                              priority={vIdx === 0}
                              style={{ objectFit: 'cover' }}
                            />
                          )}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: 'rgba(212,168,67,0.92)',
                                display: 'grid',
                                placeItems: 'center',
                                color: '#0a0b10',
                                fontSize: '1.6rem',
                                paddingLeft: 4,
                                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                              }}
                            >
                              ▶
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: '14px 4px 0', color: 'rgba(255,255,255,0.78)' }}>
                          {(item.source || item.date) && (
                            <div
                              style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.66rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: 'var(--accent)',
                                marginBottom: 6,
                              }}
                            >
                              {[item.source, item.date].filter(Boolean).join(' · ')}
                            </div>
                          )}
                          <div style={{ fontSize: '0.96rem', lineHeight: 1.55, color: '#fff' }}>{item.title}</div>
                          {item.excerpt && (
                            <p style={{ marginTop: 8, fontSize: '0.86rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', fontWeight: 300 }}>
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activePromoVideo && (
        <PromoVideoModal item={activePromoVideo} onClose={() => setActivePromoVideo(null)} />
      )}

      {/* TAB 1 — Certifications */}
      {activeTab === 1 && (
        <section className={`${styles.chapter} ${styles.chapterAlt}`}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>{certificationsTab?.tag ?? 'CERTIFICATIONS'}</div>
              </div>
              <div>
                <h2 className={styles.chapterTitle}>{certificationsTab?.title ?? '신뢰의 지표'}</h2>
                <p className={styles.chapterSubtitle}>{certificationsTab?.subtitle ?? '국제가 인정하는 대라천의 품질'}</p>
                {tabHeroes.tab1 && (
                  <div
                    style={{
                      marginTop: 30,
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      border: '1px solid rgba(212,168,67,0.2)',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={tabHeroes.tab1}
                      alt="다양한 인증 — 상징 이미지"
                      fill
                      sizes="(max-width: 768px) 100vw, 880px"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}
                <div className={styles.line} style={{ margin: '24px 0' }} />

            {/* 인증 카테고리 설명 섹션 (1, 2, 3 번호 카드) */}
            <div className={styles.gridAuto} style={{ marginBottom: 48 }}>
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))',
                gap: 32,
                margin: '0 0 48px',
                alignItems: 'start',
              }}
            >
              {certs.map((cert, i) => {
                const COLOR_MAP: Record<string, string> = {
                  국제인증: '#d4a843', 품질인증: '#6eb5ff', 유기농인증: '#7ecb7e',
                  ISO인증: '#b8a0e8', 특허: '#ff9a6c', 수상: '#ffd166', 사업등록: '#aaa',
                };
                const accentColor = COLOR_MAP[cert.category] ?? '#d4a843';
                return (
                  <div
                    key={i}
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    {/* 액자 최외곽: 프레임 몸체 */}
                    <div
                      style={{
                        position: 'relative',
                        background: `linear-gradient(160deg, #2e2610 0%, #1a1508 40%, #261f0c 70%, #12100a 100%)`,
                        padding: '10px',
                        boxShadow: `
                          0 2px 4px rgba(0,0,0,0.9),
                          0 8px 28px rgba(0,0,0,0.65),
                          inset 0 1px 0 ${accentColor}55,
                          inset 0 -1px 0 rgba(0,0,0,0.6),
                          inset 1px 0 0 ${accentColor}33,
                          inset -1px 0 0 ${accentColor}33
                        `,
                        outline: `1px solid ${accentColor}66`,
                        outlineOffset: '-1px',
                        transition: 'transform 240ms ease, box-shadow 240ms ease',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.transform = 'translateY(-6px)';
                        el.style.boxShadow = `
                          0 2px 4px rgba(0,0,0,0.9),
                          0 16px 40px ${accentColor}28,
                          0 6px 16px rgba(0,0,0,0.7),
                          inset 0 1px 0 ${accentColor}77,
                          inset 0 -1px 0 rgba(0,0,0,0.6),
                          inset 1px 0 0 ${accentColor}44,
                          inset -1px 0 0 ${accentColor}44
                        `;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.transform = 'translateY(0)';
                        el.style.boxShadow = `
                          0 2px 4px rgba(0,0,0,0.9),
                          0 8px 28px rgba(0,0,0,0.65),
                          inset 0 1px 0 ${accentColor}55,
                          inset 0 -1px 0 rgba(0,0,0,0.6),
                          inset 1px 0 0 ${accentColor}33,
                          inset -1px 0 0 ${accentColor}33
                        `;
                      }}
                    >
                      {/* 프레임 테두리 선 — 이중 테두리 효과 */}
                      <div style={{
                        position: 'absolute', inset: 4,
                        border: `1px solid ${accentColor}44`,
                        pointerEvents: 'none',
                      }} />

                      {/* 네 모서리 L자 장식 */}
                      {(['tl','tr','bl','br'] as const).map((pos) => (
                        <span key={pos} style={{
                          position: 'absolute',
                          width: 16, height: 16,
                          top: pos.startsWith('t') ? 2 : undefined,
                          bottom: pos.startsWith('b') ? 2 : undefined,
                          left: pos.endsWith('l') ? 2 : undefined,
                          right: pos.endsWith('r') ? 2 : undefined,
                          borderTop: pos.startsWith('t') ? `2px solid ${accentColor}` : undefined,
                          borderBottom: pos.startsWith('b') ? `2px solid ${accentColor}` : undefined,
                          borderLeft: pos.endsWith('l') ? `2px solid ${accentColor}` : undefined,
                          borderRight: pos.endsWith('r') ? `2px solid ${accentColor}` : undefined,
                          pointerEvents: 'none',
                        }} />
                      ))}

                      {/* 내부 매트 (passe-partout) — 크림색 여백 */}
                      <div style={{
                        border: `1px solid ${accentColor}55`,
                        padding: '6px',
                        background: 'linear-gradient(160deg, #faf7f0, #f2ede3)',
                        boxShadow: `inset 0 0 12px rgba(0,0,0,0.12)`,
                      }}>
                        {/* 인증서 이미지 — 가로세로 비율 자동 유지 */}
                        <Image
                          src={cert.thumb}
                          alt={cert.name}
                          width={0}
                          height={0}
                          sizes="(max-width: 480px) 90vw, (max-width: 768px) 42vw, (max-width: 1200px) 25vw, 220px"
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                          unoptimized
                        />
                      </div>

                      {/* 카테고리 배지 */}
                      <div style={{
                        position: 'absolute', top: 13, right: 13,
                        padding: '2px 7px',
                        background: `rgba(0,0,0,0.7)`,
                        border: `1px solid ${accentColor}88`,
                        borderRadius: 999,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.52rem',
                        letterSpacing: '0.14em',
                        color: accentColor,
                        backdropFilter: 'blur(4px)',
                      }}>
                        {cert.category}
                      </div>
                    </div>

                    {/* 명판 (Nameplate) */}
                    <div style={{
                      marginTop: 0,
                      background: 'linear-gradient(to bottom, #1a1712, #110f0a)',
                      border: `1px solid ${accentColor}44`,
                      borderTop: 'none',
                      padding: '9px 10px 10px',
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}>
                      <div style={{
                        width: 28, height: 1,
                        background: `linear-gradient(to right, transparent, ${accentColor}88, transparent)`,
                        margin: '0 auto 7px',
                      }} />
                      <p style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontSize: '0.78rem',
                        color: '#f0e8d0',
                        fontWeight: 500,
                        lineHeight: 1.5,
                        marginBottom: 4,
                        wordBreak: 'keep-all',
                      }}>
                        {cert.name}
                      </p>
                      <p style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.55rem',
                        letterSpacing: '0.1em',
                        color: `${accentColor}bb`,
                        lineHeight: 1.4,
                      }}>
                        {cert.nameEn}
                      </p>
                      {(cert.certNumber || cert.issuer || cert.validity) && (
                        <div style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: `1px dashed ${accentColor}33`,
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}>
                          {cert.certNumber && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                              <span style={{
                                flexShrink: 0,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.46rem',
                                letterSpacing: '0.16em',
                                color: `${accentColor}99`,
                                textTransform: 'uppercase',
                              }}>NO.</span>
                              <span style={{
                                fontSize: '0.6rem',
                                lineHeight: 1.45,
                                color: '#d4cdb4',
                                wordBreak: 'break-word',
                              }}>{cert.certNumber}</span>
                            </div>
                          )}
                          {cert.issuer && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                              <span style={{
                                flexShrink: 0,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.46rem',
                                letterSpacing: '0.16em',
                                color: `${accentColor}99`,
                                textTransform: 'uppercase',
                              }}>발급</span>
                              <span style={{
                                fontSize: '0.6rem',
                                lineHeight: 1.45,
                                color: '#cfc9b3',
                                wordBreak: 'break-word',
                              }}>{cert.issuer}</span>
                            </div>
                          )}
                          {cert.validity && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                              <span style={{
                                flexShrink: 0,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.46rem',
                                letterSpacing: '0.16em',
                                color: `${accentColor}99`,
                                textTransform: 'uppercase',
                              }}>기간</span>
                              <span style={{
                                fontSize: '0.6rem',
                                lineHeight: 1.45,
                                color: '#cfc9b3',
                                wordBreak: 'break-word',
                              }}>{cert.validity}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2 — Process */}
      {activeTab === 2 && (
        <section className={`${styles.chapter} ${styles.chapterAlt}`}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>{processTab?.tag ?? 'PRODUCTION PROCESS'}</div>
              </div>
              <div>
                <h2 className={styles.chapterTitle}>{processTab?.title ?? '생산 공정'}</h2>
                <p className={styles.chapterSubtitle}>{processTab?.subtitle ?? '베트남 직영 농장에서 완제품까지 — 최소 26년의 기록'}</p>

                {/* Total time — subtitle 바로 아래로 이동 (이전 위치는 Stats 위) */}
                <div className={styles.totalTime} style={{ marginTop: 28 }}>
                  <div className={styles.totalLabel}>{processTab?.totalTimeLabel ?? 'TOTAL PROCESS TIME'}</div>
                  <div className={styles.totalValue}>{processTab?.totalTimeValue ?? '26+ Years'}</div>
                  <div className={styles.totalDesc}>{processTab?.totalTimeDesc ?? '식목부터 최종 출고까지, 최소 26년의 시간이 만드는 가치'}</div>
                </div>

                {processHeroImages.length > 0 ? (
                  <div style={{ marginTop: 30 }}>
                    <ChapterCarousel
                      images={processHeroImages}
                      alt="생산 공정 대표 이미지"
                      aspect="4/3"
                      autoplay={5000}
                    />
                  </div>
                ) : tabHeroes.tab2 ? (
                  <div
                    style={{
                      marginTop: 30,
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      border: '1px solid rgba(212,168,67,0.2)',
                      overflow: 'hidden',
                      background: '#0a0b10',
                    }}
                  >
                    <Image
                      src={tabHeroes.tab2}
                      alt="생산 공정 — 대표 이미지"
                      fill
                      sizes="(max-width: 768px) 100vw, 880px"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                ) : null}
                <div className={styles.line} style={{ margin: '24px 0' }} />

            {/* Stats */}
            {processStats.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, margin: '0 0 64px' }}>
                {processStats.map((s) => (
                  <div key={s.label} style={{ padding: '20px 16px', border: '1px solid rgba(212,168,67,0.25)', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.6rem', color: 'var(--accent)', fontWeight: 400, lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 두 개 공정 섹션 */}
            {processGroups.length > 0 ? (
              processGroups.map((group, gi) => (
                <div key={gi} className={styles.processGroupSection}>
                  {/* 그룹 헤더 */}
                  <div className={styles.processGroupHeaderRow}>
                    <span className={styles.processGroupBadge}>{String(gi + 1).padStart(2, '0')}</span>
                    <h3 className={styles.processGroupTitle}>{group.title}</h3>
                    {group.titleEn && <span className={styles.processGroupTitleEn}>{group.titleEn}</span>}
                  </div>

                  {/* 설명 */}
                  {group.description && (
                    <p className={styles.processGroupDesc}>{group.description}</p>
                  )}

                  {/* 스텝 그리드 — 측면 이미지 제거, 카드 자체에 단계별 이미지 가미 */}
                  <div className={styles.processGroupLayout}>
                    <div className={styles.stepGridDetailed}>
                      {group.steps.map((step, si) => (
                        <div key={si} className={styles.stepCardDetailed}>
                          <div className={styles.stepCardImg}>
                            {step.image ? (
                              <Image
                                src={step.image}
                                alt={`${group.title} ${step.name}`}
                                fill
                                sizes="(max-width: 580px) 50vw, (max-width: 1050px) 33vw, 25vw"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <span className={styles.stepCardImgPlaceholder}>{String(si + 1).padStart(2, '0')}</span>
                            )}
                          </div>
                          <div className={styles.stepCardBody}>
                            <div className={styles.stepNum} style={{ margin: '0 0 6px' }}>{String(si + 1).padStart(2, '0')}</div>
                            <div className={styles.stepCardName}>{step.name}</div>
                            {step.duration && <div className={styles.stepCardDuration}>{step.duration}</div>}
                            {step.desc && <div className={styles.stepCardDesc}>{step.desc}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 공정 사진 갤러리(group.photos) 렌더링은 영구 제거 — 단계별 카드 이미지로 대체.
                      어드민에서도 photos 편집 영역을 삭제했고, 데이터에 잔존하더라도 더 이상 노출되지 않음. */}
                </div>
              ))
            ) : (
              /* fallback: processGroups 미설정 시 기존 단순 스텝 그리드 */
              <div className={styles.stepGrid}>
                {processSteps.map((step, i) => (
                  <div key={i} className={styles.stepCard}>
                    <div className={styles.stepNum}>{i + 1}</div>
                    <div className={styles.stepTxt}>{step}</div>
                  </div>
                ))}
              </div>
            )}

            {/* (Total time 블록은 위로 이동 — subtitle 바로 아래) */}

            {/* Factory Footage 섹션은 /media 갤러리(01 영상 갤러리) 로 이동 */}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
