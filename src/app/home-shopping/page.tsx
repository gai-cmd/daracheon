import type { Metadata } from 'next';
import { readData } from '@/lib/db';
import type { Broadcast } from '@/app/api/admin/broadcasts/route';
import BroadcastCountdown from '@/components/BroadcastCountdown';
import styles from './page.module.css';

export const revalidate = 60;

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
  const all = await readData<Broadcast>('broadcasts');
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
                  <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, fontWeight: 300, maxWidth: 520 }}>
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
