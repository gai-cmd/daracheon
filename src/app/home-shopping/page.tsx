import type { Metadata } from 'next';
import { readDataSafe, readSingleSafe } from '@/lib/db';
import type { Broadcast } from '@/app/api/admin/broadcasts/route';
import BroadcastCountdown from '@/components/BroadcastCountdown';
import styles from './page.module.css';

interface WarningBanner {
  enabled?: boolean;
  alertLabel?: string;
  title?: string;
  body?: string;
  bullets?: string[];
  newsQuote?: string;
  newsNote?: string;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '홈쇼핑 특별관 - TV 편성표 · 다시보기 | ZOEL LIFE',
  description:
    '롯데·현대·CJ·GS 홈쇼핑 정규 편성. ZOEL LIFE 침향 라이브 방송과 다시보기, Lot 인증서를 실시간으로 확인하세요.',
  alternates: { canonical: 'https://www.daracheon.com/home-shopping' },
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
    livestreamUrl: '',
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
    livestreamUrl: '',
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
    livestreamUrl: '',
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
    livestreamUrl: '',
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
    livestreamUrl: '',
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
    livestreamUrl: '',
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
    livestreamUrl: '',
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
    livestreamUrl: '',
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

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    monthYear: d.toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default async function HomeShoppingPage() {
  const dbBroadcasts = await readDataSafe<Broadcast>('broadcasts');
  const pagesData = await readSingleSafe<{ homeShopping?: { warningBanner?: WarningBanner } }>('pages');
  const warning = pagesData?.homeShopping?.warningBanner;
  const all = dbBroadcasts.length > 0 ? dbBroadcasts : DEFAULT_BROADCASTS;
  const sorted = [...all].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const now = Date.now();
  const upcoming = sorted.filter(
    (b) => b.status === 'scheduled' && new Date(b.scheduledAt).getTime() >= now
  );
  const featured = sorted.find((b) => b.status === 'live') ?? upcoming[0];

  return (
    <>
      {/* Consumer Alert — 가짜 침향 경고 (DB: pages.homeShopping.warningBanner) */}
      {warning?.enabled !== false && warning?.title && (
        <section
          style={{
            padding: '48px 24px',
            background: 'linear-gradient(180deg, rgba(212,168,67,0.08) 0%, rgba(10,11,16,0) 100%)',
            borderBottom: '1px solid rgba(212,168,67,0.2)',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            {warning.alertLabel && (
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  marginBottom: 24,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#0a0b10',
                  background: 'var(--accent)',
                  borderRadius: 999,
                }}
              >
                {warning.alertLabel}
              </div>
            )}
            <h2
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                fontWeight: 300,
                color: '#fff',
                marginBottom: 20,
                lineHeight: 1.4,
              }}
            >
              {warning.title}
            </h2>
            {warning.body && (
              <p
                style={{
                  fontSize: '1.02rem',
                  color: 'rgba(255,255,255,0.72)',
                  fontWeight: 300,
                  lineHeight: 1.85,
                  whiteSpace: 'pre-line',
                  marginBottom: warning.bullets?.length ? 32 : 0,
                }}
              >
                {warning.body}
              </p>
            )}
            {warning.bullets && warning.bullets.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginTop: 24,
                  maxWidth: 820,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {warning.bullets.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      color: '#fff',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ color: 'var(--accent)' }}>✓</span>
                    {b}
                  </div>
                ))}
              </div>
            )}
            {warning.newsQuote && (
              <div
                style={{
                  marginTop: 36,
                  padding: '18px 24px',
                  border: '1px solid rgba(212,168,67,0.2)',
                  borderRadius: 12,
                  background: 'rgba(10,11,16,0.6)',
                  maxWidth: 720,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                <p
                  style={{
                    fontSize: '0.98rem',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: warning.newsNote ? 8 : 0,
                    fontWeight: 500,
                  }}
                >
                  &ldquo;{warning.newsQuote}&rdquo;
                </p>
                {warning.newsNote && (
                  <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                    {warning.newsNote}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* HERO + LIVE CARD */}
      <section className={styles.hero} id="live">
        <div className={styles.wrap}>
          <div className={styles.heroHead}>
            <h1>
              TV 홈쇼핑
              <br />
              <em>편성표 · 다시보기</em>
            </h1>
            <p className={styles.lede}>
              롯데·현대·CJ·GS 홈쇼핑 정규 편성 중. 실시간 방송은 각 홈쇼핑 앱과 ZOEL LIFE 웹에서 동시 송출됩니다.
            </p>
          </div>

          {featured ? (
            <div className={styles.live}>
              <div>
                <div className={styles.liveTag}>
                  <span className={styles.liveDot} />
                  {featured.status === 'live' ? 'ON AIR · 지금 방송 중' : 'NEXT LIVE · 다음 방송'}
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
                    <b>일시</b> · {new Date(featured.scheduledAt).toLocaleString('ko-KR')}
                  </span>
                  {featured.discountRate ? <span><b>할인</b> · {featured.discountRate}%</span> : null}
                </div>
                <div className={styles.ctas}>
                  {featured.livestreamUrl ? (
                    <a
                      href={featured.livestreamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnLive}
                    >
                      ● 라이브 시청 →
                    </a>
                  ) : (
                    <a href="tel:070-4140-4086" className={styles.btnLive}>
                      ● 전화 주문 070-4140-4086
                    </a>
                  )}
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
                      {b.status === 'live' && b.livestreamUrl ? (
                        <a
                          href={b.livestreamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.btnLive}
                        >
                          ● LIVE
                        </a>
                      ) : b.status === 'ended' && b.vodUrl ? (
                        <a
                          href={b.vodUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.btnNotify}
                        >
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
    </>
  );
}
