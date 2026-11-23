'use client';

import { useEffect, useState } from 'react';
import {
  NAVER_LIVE_URL,
  currentOrNextSession,
  formatSessionKst,
  sessionState,
} from '@/lib/naver-live';
import styles from './page.module.css';

const pad = (n: number) => String(n).padStart(2, '0');

export default function LiveStatus() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now === null) return <div className={styles.card} aria-busy="true" />;

  const s = currentOrNextSession(now);
  if (!s) {
    return (
      <div className={styles.card}>
        <p className={styles.cardLabel}>방송 안내</p>
        <p className={styles.cardTitle}>다음 편성은 확정되는 대로 안내드립니다.</p>
      </div>
    );
  }

  const state = sessionState(s, now);
  const diff = Math.max(0, Date.parse(s.startAt) - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000) % 24;
  const m = Math.floor(diff / 60_000) % 60;
  const sec = Math.floor(diff / 1000) % 60;

  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>
        {state === 'live' ? <span className={styles.liveBadge}>● LIVE 방송 중</span> : `다음 방송 · ${s.round}회차`}
        {s.round === 1 && state === 'upcoming' ? <span className={styles.firstBadge}>첫 방송</span> : null}
      </p>
      <p className={styles.cardTitle}>{formatSessionKst(s)}</p>
      {s.topic ? <p className={styles.cardTopic}>{s.topic}</p> : null}
      {state === 'upcoming' ? (
        <p className={styles.countdown} aria-label="방송까지 남은 시간">
          {d > 0 ? <span>{d}일 </span> : null}
          {pad(h)}:{pad(m)}:{pad(sec)}
        </p>
      ) : null}
      <a className={styles.cta} href={NAVER_LIVE_URL} target="_blank" rel="noopener noreferrer">
        {state === 'live' ? '지금 바로 시청하기' : '네이버에서 알림받기'}
      </a>
    </div>
  );
}
