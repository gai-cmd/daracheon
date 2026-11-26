import type { Metadata } from 'next';
import JsonLd from '@/components/ui/JsonLd';
import { NAVER_LIVE_SESSIONS, NAVER_LIVE_URL, formatSessionKst } from '@/lib/naver-live';
import LiveStatus from './LiveStatus';
import PromoFilm from './PromoFilm';
import styles from './page.module.css';

const SITE_URL = 'https://zoellife.com';

export const metadata: Metadata = {
  title: '네이버 쇼핑라이브',
  description:
    '대라천 침향 네이버 쇼핑라이브 정규 방송 편성표입니다. 매회 19시, 네이버 쇼핑라이브에서 만나보세요.',
  alternates: { canonical: `${SITE_URL}/naver-live` },
};

export default function NaverLivePage() {
  const events = NAVER_LIVE_SESSIONS.map((s) => ({
    '@type': 'Event',
    name: `대라천 네이버 쇼핑라이브 ${s.round}회차`,
    startDate: s.startAt,
    endDate: s.endAt,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: { '@type': 'VirtualLocation', url: NAVER_LIVE_URL },
    organizer: { '@id': `${SITE_URL}/#organization` },
  }));

  return (
    <div className={styles.page}>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': events }} />

      <section className={styles.hero}>
        <p className={styles.kicker}>NAVER SHOPPING LIVE</p>
        <h1 className={styles.title}>
          대라천 침향, <em>라이브로 만나다</em>
        </h1>
        <p className={styles.lede}>
          네이버 쇼핑라이브 정규 방송을 시작합니다.
          <br />
          방송 시간에 맞춰 들어오시면 실시간으로 묻고 답하며 라이브 혜택을 받으실 수 있습니다.
        </p>
        <LiveStatus />
      </section>

      <PromoFilm />

      <section className={styles.schedule} aria-labelledby="schedule-title">
        <h2 id="schedule-title" className={styles.sectionTitle}>
          방송 편성표
        </h2>
        <ol className={styles.list}>
          {NAVER_LIVE_SESSIONS.map((s) => (
            <li key={s.round} className={styles.item}>
              <span className={styles.round}>{s.round}회차</span>
              <span className={styles.when}>{formatSessionKst(s)}</span>
              <span className={styles.topic}>{s.topic ?? '주제 추후 공개'}</span>
            </li>
          ))}
        </ol>
        <p className={styles.note}>편성은 사정에 따라 바뀔 수 있으며, 변경 시 이 페이지에 안내드립니다.</p>
      </section>
    </div>
  );
}
