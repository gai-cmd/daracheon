'use client';

import { useEffect, useState } from 'react';
import styles from './ShippingNoticePopup.module.css';

// 2026 추석 연휴 배송 지연 안내 팝업.
// 노출 기간이 지나면 자동으로 렌더링되지 않는다 (코드 삭제 전까지 무해).
const SHOW_UNTIL = Date.parse('2026-09-29T00:00:00+09:00');
const DISMISS_KEY = 'zl_chuseok2026_notice_hide_until';

function endOfTodayKst(): number {
  const kstNow = new Date(Date.now() + 9 * 3600_000);
  kstNow.setUTCHours(24, 0, 0, 0);
  return kstNow.getTime() - 9 * 3600_000;
}

export default function ShippingNoticePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Date.now() >= SHOW_UNTIL) return;
    try {
      const hideUntil = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
      if (hideUntil > Date.now()) return;
    } catch {
      // 저장소 접근 불가(사생활 보호 모드 등) — 그냥 노출
    }
    setOpen(true);
  }, []);

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
        aria-labelledby="chuseok-notice-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={styles.eyebrow}>NOTICE</p>
        <h2 id="chuseok-notice-title" className={styles.title}>
          추석 연휴 배송 안내
        </h2>
        <p className={styles.lead}>
          풍성하고 따뜻한 한가위 보내세요.
          <br />
          연휴 기간에는 택배사 휴무로 출고가 잠시 멈춥니다.
        </p>

        <dl className={styles.table}>
          <div className={styles.row}>
            <dt>휴무 기간</dt>
            <dd>9월 24일(목) ~ 9월 27일(일)</dd>
          </div>
          <div className={styles.row}>
            <dt>발송 재개</dt>
            <dd className={styles.accent}>9월 28일(월)부터 주문 순서대로</dd>
          </div>
        </dl>

        <ul className={styles.notes}>
          <li>연휴 중에도 주문·결제는 정상적으로 하실 수 있습니다.</li>
          <li>연휴 직후 물량이 몰려 평소보다 1~2일 더 걸릴 수 있습니다.</li>
        </ul>

        <p className={styles.thanks}>기다려 주셔서 감사합니다. — 대라천 ZOEL LIFE</p>

        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={hideToday}>
            오늘 하루 보지 않기
          </button>
          <button type="button" className={styles.primary} onClick={() => setOpen(false)}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
