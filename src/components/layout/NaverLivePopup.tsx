'use client';

import { Fragment, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { NAVER_LIVE_SESSIONS, formatSessionKst } from '@/lib/naver-live';
import { PROMO_TEASER } from '@/lib/naver-live-promo';
import styles from './NaverLivePopup.module.css';

// 네이버 쇼핑라이브 첫 방송 안내 팝업.
// 1회차 방송 종료 시각이 지나면 자동으로 렌더링되지 않는다 (코드 삭제 전까지 무해).
const FIRST = NAVER_LIVE_SESSIONS[0];
const SHOW_UNTIL = Date.parse(FIRST.endAt);
const DISMISS_KEY = 'zl_naverlive_first_hide_until';

function endOfTodayKst(): number {
  const kstNow = new Date(Date.now() + 9 * 3600_000);
  kstNow.setUTCHours(24, 0, 0, 0);
  return kstNow.getTime() - 9 * 3600_000;
}

export default function NaverLivePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // 움직임 줄이기 설정이면 자동 재생하지 않고 포스터만 보인다.
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (Date.now() >= SHOW_UNTIL) return;
    if (pathname?.startsWith('/naver-live') || pathname?.startsWith('/admin')) return;
    try {
      const hideUntil = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
      if (hideUntil > Date.now()) return;
    } catch {
      // 저장소 접근 불가(사생활 보호 모드 등) — 그냥 노출
    }
    setReduceMotion(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    setOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const hideToday = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(endOfTodayKst()));
    } catch {
      // 무시
    }
    setOpen(false);
  };

  return (
    <div className={styles.backdrop} onClick={() => setOpen(false)}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="naver-live-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <a className={styles.media} href="/naver-live" onClick={() => setOpen(false)} aria-label="홍보 영상 전체 보기">
          <video
            className={styles.video}
            src={PROMO_TEASER.src}
            poster={PROMO_TEASER.poster}
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            preload={reduceMotion ? 'none' : 'auto'}
            aria-hidden="true"
          />
          <span className={styles.mediaBadge}>▶ 홍보 영상 전체 보기</span>
        </a>

        <p className={styles.liveEyebrow}>NAVER SHOPPING LIVE · 첫 방송</p>
        <h2 id="naver-live-popup-title" className={styles.title}>
          대라천 네이버 쇼핑라이브
          <br />
          첫 방송을 시작합니다
        </h2>
        <p className={styles.lead}>
          방송 시간에 들어오시면 실시간으로 묻고 답하며
          <br />
          라이브 혜택을 받으실 수 있습니다.
        </p>

        <dl className={styles.table}>
          <div className={styles.row}>
            <dt>첫 방송</dt>
            <dd className={styles.accent}>
              {/* 좁은 화면에서 "19:" / "00–20:00" 처럼 시각 중간이 끊기지 않게 공백에서만 줄바꿈 */}
              {formatSessionKst(FIRST)
                .split(' ')
                .map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 ? ' ' : ''}
                    <span className={styles.nowrap}>{part}</span>
                  </Fragment>
                ))}
            </dd>
          </div>
          <div className={styles.row}>
            <dt>정규 편성</dt>
            <dd>총 {NAVER_LIVE_SESSIONS.length}회 · 매회 19시</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={hideToday}>
            오늘 하루 보지 않기
          </button>
          <a className={styles.naverPrimary} href="/naver-live" onClick={() => setOpen(false)}>
            방송 일정 보기
          </a>
        </div>
      </div>
    </div>
  );
}
