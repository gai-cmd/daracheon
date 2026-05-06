import type { Metadata } from 'next';
import { readDataUncached, readSingleSafe } from '@/lib/db';
import type { Broadcast } from '@/app/api/admin/broadcasts/route';
import { autoSplitMixed } from '@/lib/broadcasts';
import BroadcastCountdown from '@/components/BroadcastCountdown';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

interface HomeShoppingHero {
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
}

const DEFAULT_HOME_SHOPPING_HERO: HomeShoppingHero = {
  titleLine1: 'TV 홈쇼핑',
  titleEmphasis: '편성표 · 다시보기',
  lede: '롯데·현대·CJ·GS 홈쇼핑 정규 편성 중. 실시간 방송은 각 홈쇼핑 앱과 ZOEL LIFE 웹에서 동시 송출됩니다.',
};

export const metadata: Metadata = {
  title: 'On-Air 특별관 — TV 홈쇼핑 편성표·다시보기 | 대라천 ZOEL LIFE',
  description:
    '롯데·현대·CJ·GS 홈쇼핑 정규 편성 중. 대라천 ZOEL LIFE 침향 라이브 방송 시간표, 다시보기, Lot 인증서를 실시간으로 확인하세요.',
  keywords: [
    '침향 홈쇼핑', '침향 TV 홈쇼핑', '대라천 홈쇼핑', 'ZOEL LIFE 홈쇼핑', '조엘라이프 홈쇼핑',
    '롯데홈쇼핑 침향', '현대홈쇼핑 침향', 'CJ온스타일 침향', 'GS홈쇼핑 침향',
    '홈쇼핑 편성표', '침향 방송 편성표', '침향 다시보기',
    '침향 라이브 방송', '침향 생방송',
  ],
  alternates: { canonical: 'https://zoellife.com/home-shopping' },
};

const STATUS_LABEL: Record<Broadcast['status'], string> = {
  scheduled: '예정',
  live: 'ON AIR',
  ended: '종료',
  canceled: '취소',
};

// Fallback broadcasts sourced from data/db/broadcasts.json
// plus additional synthetic entries to cover a realistic schedule spread.
const DEFAULT_BROADCASTS: Broadcast[] = [
  {
    id: 'bc-default-past-1',
    channel: 'CJ온스타일',
    scheduledAt: '2026-04-05T11:00:00.000Z',
    durationMinutes: 60,
    host: '유난희',
    productIds: ['cham-oil-capsule'],
    specialPrice: 218000,
    regularPrice: 248000,
    discountRate: 12,
    description: "대라천 '참'침향 오일 캡슐 런칭 방송 — 지난 방송 다시보기.",
    status: 'ended',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-04-05T12:00:00.000Z',
  },
  {
    id: 'bc-default-past-2',
    channel: 'GS샵',
    scheduledAt: '2026-04-15T21:00:00.000Z',
    durationMinutes: 60,
    host: '김나연',
    productIds: ['cham-pill-gibo'],
    specialPrice: 398000,
    regularPrice: 480000,
    discountRate: 17,
    description: '기보단(氣寶丹) — 25년산 침향·동충하초·제비집 최고급 환.',
    status: 'ended',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-15T22:00:00.000Z',
  },
  {
    id: 'bc-default-1',
    channel: '롯데홈쇼핑',
    scheduledAt: '2026-04-28T14:00:00.000Z',
    durationMinutes: 60,
    host: '박미선',
    productIds: ['cham-oil-capsule'],
    specialPrice: 198000,
    regularPrice: 248000,
    discountRate: 20,
    description: "대라천 '참'침향 오일 캡슐 30캡슐 기프트박스 — 첫 방송 기념 20% 할인.",
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:42:25.782Z',
  },
  {
    id: 'bc-default-2',
    channel: '현대홈쇼핑 +Shop',
    scheduledAt: '2026-05-02T20:00:00.000Z',
    durationMinutes: 60,
    host: '정지영',
    productIds: ['cham-oil-capsule', 'cham-pill-chimhyang'],
    specialPrice: 398000,
    regularPrice: 498000,
    discountRate: 20,
    description: "대라천 '참'침향 오일 캡슐 + 침향단(沈香丹) 더블 세트 한정 구성.",
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:45:00.000Z',
  },
  {
    id: 'bc-default-3',
    channel: 'CJ온스타일',
    scheduledAt: '2026-05-08T11:00:00.000Z',
    durationMinutes: 45,
    host: '유난희',
    productIds: ['cham-water', 'cham-tea-paramignya'],
    specialPrice: 168000,
    regularPrice: 215000,
    discountRate: 22,
    description: '25년산 침향수 500ml + 베트남 전통 파라미냐차 30포 데일리 웰니스 세트.',
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:46:00.000Z',
  },
  {
    id: 'bc-default-4',
    channel: 'GS샵',
    scheduledAt: '2026-05-15T21:00:00.000Z',
    durationMinutes: 60,
    host: '김나연',
    productIds: ['cham-oil-raw'],
    specialPrice: 588000,
    regularPrice: 650000,
    discountRate: 10,
    description: '25년산 침향 에센셜 오일 1ml — 72시간 고온증류 추출 프리미엄 라인.',
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:47:00.000Z',
  },
  {
    id: 'bc-default-5',
    channel: '롯데홈쇼핑',
    scheduledAt: '2026-05-22T15:00:00.000Z',
    durationMinutes: 60,
    host: '박미선',
    productIds: ['cham-pill-gibo'],
    specialPrice: 438000,
    regularPrice: 480000,
    discountRate: 9,
    description: '기보단(氣寶丹) — 25년산 침향·동충하초·제비집 복합 환 한정 방송.',
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:48:00.000Z',
  },
  {
    id: 'bc-default-6',
    channel: '현대홈쇼핑',
    scheduledAt: '2026-05-30T20:00:00.000Z',
    durationMinutes: 60,
    host: '정지영',
    productIds: ['cham-tea-paramignya', 'cham-water'],
    specialPrice: 188000,
    regularPrice: 215000,
    discountRate: 13,
    description: '파라미냐차 + 침향수 데일리 웰니스 세트 — 선물용 프리미엄 구성.',
    status: 'scheduled',
    salesCount: 0,
    feedback: '',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T11:49:00.000Z',
  },
];

function formatChannelLogo(channel: string): string {
  const c = channel.toUpperCase();
  if (c.includes('롯데') || c.includes('LOTTE')) return 'L';
  if (c.includes('현대') || c.includes('HYUNDAI')) return 'H';
  if (c.includes('CJ')) return 'C';
  if (c.includes('GS')) return 'G';
  return c.slice(0, 1);
}

const KST = 'Asia/Seoul';

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat('en-US', { day: '2-digit', timeZone: KST }).format(d),
    monthYear: new Intl.DateTimeFormat('ko-KR', { year: '2-digit', month: 'short', timeZone: KST })
      .format(d)
      .toUpperCase(),
    time: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: KST }),
  };
}

export default async function HomeShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  // Uncached read — 어드민에서 vodUrl 등을 비웠을 때 즉시 반영. 캐시 태그
  // 전파 지연으로 stale 가 보이는 사고를 막는다. 트래픽 낮으니 OK.
  const dbBroadcasts = await readDataUncached<Broadcast>('broadcasts');
  const pagesData = await readSingleSafe<{ homeShopping?: { hero?: HomeShoppingHero } }>('pages');
  const hero: HomeShoppingHero = { ...DEFAULT_HOME_SHOPPING_HERO, ...pagesData?.homeShopping?.hero };
  const allRawBeforeSplit = dbBroadcasts.length > 0 ? dbBroadcasts : DEFAULT_BROADCASTS;
  // mixed 레코드(홈쇼핑+협찬방송 동거)를 in-memory 로 분리. 어드민 GET 에서
  // 영구 저장하므로 첫 어드민 방문 후엔 멱등 no-op.
  const { list: allRaw } = autoSplitMixed(allRawBeforeSplit);
  // 비공개 제외. published 미설정은 공개로 간주(기존 데이터 호환).
  const all = allRaw.filter((b) => b.published !== false);
  // 홈쇼핑(가격 카드) vs 협찬방송(프로그램 카드) 분리. 미지정 → 'home-shopping'.
  const hs = all.filter((b) => (b.broadcastType ?? 'home-shopping') === 'home-shopping');
  const sponsored = all.filter((b) => b.broadcastType === 'sponsored');

  const sorted = [...hs].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const sponsoredSorted = [...sponsored].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  const now = Date.now();
  const upcoming = sorted.filter(
    (b) => b.status === 'scheduled' && new Date(b.scheduledAt).getTime() >= now
  );
  // 우선순위: 라이브 → 다음 예정 → 가장 최근 종료(다시보기 노출용)
  const live = sorted.find((b) => b.status === 'live');
  const recentEnded = [...sorted]
    .reverse()
    .find((b) => b.status === 'ended');
  let featured = live ?? upcoming[0] ?? recentEnded;

  // 디자인 미리보기 — ?preview=ended 쿼리로 다시보기 UI 강제 노출.
  // 임시 데이터 주입(상태만 변경, 더미 URL 은 넣지 않음 — 실제 VOD 가 입력될 때까지 포스터 풀백 사용).
  if (preview === 'ended' && featured) {
    featured = { ...featured, status: 'ended' };
  }

  return (
    <>
      {/* HERO + LIVE CARD */}
      <section className={styles.hero} id="live">
        <div className={styles.wrap}>
          <div className={styles.heroHead}>
            <h1>
              {hero.titleLine1}
              <br />
              <em>{hero.titleEmphasis}</em>
            </h1>
            <p className={styles.lede}>
              {hero.lede}
            </p>
          </div>

          {featured ? (
            <div className={styles.live}>
              <div>
                <div className={styles.liveTag}>
                  <span className={styles.liveDot} />
                  {featured.status === 'live'
                    ? 'ON AIR · 지금 방송 중'
                    : featured.status === 'ended'
                      ? 'REPLAY · 지난 방송 다시보기'
                      : 'NEXT LIVE · 다음 방송'}
                </div>
                <h2>
                  {featured.channel}
                  {featured.specialPrice ? (
                    <>
                      {' — '}
                      <em>특별가 {featured.specialPrice.toLocaleString()}원</em>
                    </>
                  ) : null}
                </h2>
                {featured.description && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, fontWeight: 300, maxWidth: 720 }}>
                    {featured.description}
                  </p>
                )}
                <div className={styles.liveMeta}>
                  {featured.host && <span><b>MC</b> · {featured.host}</span>}
                  <span>
                    <b>일시</b> ·{' '}
                    {new Date(featured.scheduledAt).toLocaleString('ko-KR', {
                      timeZone: KST,
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  {featured.discountRate ? <span><b>할인</b> · {featured.discountRate}%</span> : null}
                </div>
                <div className={styles.ctas}>
                  <a href="tel:070-4140-4086" className={styles.btnLive}>
                    ● 전화 주문 070-4140-4086
                  </a>
                  <a href="#sched" className={styles.btnNotify}>
                    편성표 보기 →
                  </a>
                </div>
              </div>
              <div>
                <BroadcastCountdown
                  scheduledAt={featured.scheduledAt}
                  channel={featured.channel}
                  status={featured.status}
                  vodUrl={featured.vodUrl}
                  showTitle={featured.showInfo?.title}
                  showEpisode={featured.showInfo?.episode}
                  showLogo={featured.showInfo?.logo || undefined}
                />
              </div>
            </div>
          ) : (
            <div className={styles.live}>
              <div>
                <div className={styles.liveTag}>
                  <span className={styles.liveDot} />
                  Coming Soon · 다음 방송 준비 중
                </div>
                <h2>곧 다음 편성을 공개합니다</h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontWeight: 300 }}>
                  편성 일정이 확정되는 대로 이곳에 안내드립니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SHOW SYNOPSIS — 다음 방송의 프로그램 개요 (showInfo 가 있는 경우만) */}
      {featured?.showInfo && (
        (() => {
          const si = featured.showInfo!;
          const hasCast = (si.hosts?.length || 0) + (si.panels?.length || 0) + (si.guests?.length || 0) + (si.experts?.length || 0) > 0;
          if (!si.title && !si.synopsis && !hasCast) return null;
          return (
            <section className={styles.synopsis}>
              <div className={styles.wrap}>
                <div className={styles.synopsisHead}>
                  <div className={styles.synopsisKicker}>Programme · 방송 개요</div>
                  <h2>
                    {si.title ?? '프로그램 안내'}
                    {si.episode && <em> · {si.episode}</em>}
                  </h2>
                </div>

                <div className={styles.synopsisGrid}>
                  {si.synopsis && (
                    <div className={styles.synopsisBody}>
                      <p>{si.synopsis}</p>
                    </div>
                  )}

                  {hasCast && (
                    <dl className={styles.synopsisCast}>
                      {si.hosts && si.hosts.length > 0 && (
                        <div className={styles.synopsisRow}>
                          <dt>진행</dt>
                          <dd>{si.hosts.join(' · ')}</dd>
                        </div>
                      )}
                      {si.panels && si.panels.length > 0 && (
                        <div className={styles.synopsisRow}>
                          <dt>패널</dt>
                          <dd>{si.panels.join(' · ')}</dd>
                        </div>
                      )}
                      {si.guests && si.guests.length > 0 && (
                        <div className={styles.synopsisRow}>
                          <dt>게스트</dt>
                          <dd>{si.guests.join(' · ')}</dd>
                        </div>
                      )}
                      {si.experts && si.experts.length > 0 && (
                        <div className={styles.synopsisRow}>
                          <dt>전문가</dt>
                          <dd>{si.experts.join(' · ')}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              </div>
            </section>
          );
        })()
      )}

      {/* SCHEDULE */}
      <section className={styles.sched} id="sched">
        <div className={styles.wrap}>
          <div className={styles.schedHead}>
            <h2>
              방송 <em>편성표</em>
            </h2>
          </div>

          <div className={styles.schedList}>
            {sorted.length === 0 ? (
              <div className={styles.empty}>등록된 방송 일정이 없습니다.</div>
            ) : (
              sorted.map((b) => {
                const logo = formatChannelLogo(b.channel);
                const dt = formatDate(b.scheduledAt);
                return (
                  <div key={b.id} className={styles.schedRow}>
                    <div className={styles.schedDate}>
                      <span className={styles.schedDateDay}>{dt.day}</span>
                      {dt.monthYear}
                    </div>
                    <div className={styles.schedCh}>
                      <div className={styles.schedChLogo}>{logo}</div>
                      <div className={styles.schedChInfo}>
                        <span className={styles.schedChName}>{b.channel}</span>
                        <span className={styles.schedChTime}>{dt.time}</span>
                      </div>
                    </div>
                    <div>
                      <div className={styles.schedProdTitle}>{b.description ?? '대라천 침향 특별 방송'}</div>
                      <div className={styles.schedProdOffer}>
                        {b.specialPrice ? (
                          <>
                            특별가 <b>₩{b.specialPrice.toLocaleString()}</b>
                            {b.discountRate ? ` · −${b.discountRate}%` : ''}
                          </>
                        ) : (
                          '방송 중 특별가 공개'
                        )}
                      </div>
                    </div>
                    <div className={styles.schedHost}>
                      {b.host ? (
                        <>
                          <b>{b.host}</b>
                          쇼호스트
                        </>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                    <div className={styles.schedAction}>
                      {b.status === 'live' && b.vodUrl ? (
                        <a href="#live" className={styles.btnLive}>
                          ● LIVE
                        </a>
                      ) : b.status === 'ended' && b.vodUrl ? (
                        <a href="#live" className={styles.btnNotify}>
                          다시보기 →
                        </a>
                      ) : (
                        <span className={styles.schedStatus}>{STATUS_LABEL[b.status]}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* SPONSORED · 협찬방송 — 한 행 2열(설명 좌 · 영상 우) 으로 정렬,
          홈쇼핑의 LIVE 카드 골격을 차용하되 보라 액센트로 차별화. */}
      {sponsoredSorted.length > 0 && (
        <section className={styles.sponsored} id="sponsored">
          <div className={styles.wrap}>
            <div className={styles.sponsoredHead}>
              <div className={styles.sponsoredKicker}>SPONSORED · 협찬방송</div>
              <h2>
                조엘라이프가 <em>출연한 방송</em>
              </h2>
              <p className={styles.sponsoredLede}>
                협찬·정보교양 프로그램에 등장한 대라천 침향. 진행자·전문가 패널이 직접
                소개한 회차를 모아 보세요.
              </p>
            </div>

            <div className={styles.spList}>
              {sponsoredSorted.map((b) => {
                const si = b.showInfo ?? {};
                const cast: Array<{ label: string; names: string[] }> = [];
                if (si.hosts?.length) cast.push({ label: '진행', names: si.hosts });
                if (si.panels?.length) cast.push({ label: '패널', names: si.panels });
                if (si.guests?.length) cast.push({ label: '게스트', names: si.guests });
                if (si.experts?.length) cast.push({ label: '전문가', names: si.experts });

                const yt = b.vodUrl ? extractEmbed(b.vodUrl) : null;
                return (
                  <article key={b.id} className={styles.spRow}>
                    <div className={styles.spInfo}>
                      <div className={styles.spChannelTag}>
                        <span className={styles.spChannelDot} />
                        {b.channel}
                      </div>
                      <h3 className={styles.spTitle}>
                        {si.title ?? b.channel}
                        {si.episode && <em> · {si.episode}</em>}
                      </h3>
                      {si.synopsis && <p className={styles.spSynopsis}>{si.synopsis}</p>}
                      {cast.length > 0 && (
                        <dl className={styles.spCast}>
                          {cast.map((c) => (
                            <div key={c.label} className={styles.spCastRow}>
                              <dt>{c.label}</dt>
                              <dd>{c.names.join(' · ')}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <div className={styles.spMeta}>
                        <span>
                          <b>방송</b> ·{' '}
                          {new Date(b.scheduledAt).toLocaleString('ko-KR', {
                            timeZone: KST,
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            weekday: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className={styles.spStatus} data-status={b.status}>
                          {STATUS_LABEL[b.status]}
                        </span>
                      </div>
                    </div>
                    <div className={styles.spVideo}>
                      {yt ? (
                        <iframe
                          src={yt}
                          title={si.title ?? b.channel}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.spVideoEmpty}>
                          <span className={styles.spVideoEmptyDot}>●</span>
                          영상 준비 중
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/** YouTube/Vimeo URL 을 임베드 가능한 src 로 변환. 실패 시 null. */
function extractEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // youtube.com/watch?v=<id> / shorts/<id> / embed/<id>
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
    // vimeo.com/<id>
    if (u.hostname.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}
