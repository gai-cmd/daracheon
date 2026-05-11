'use client';

import { useEffect, useRef } from 'react';
import styles from './StickyTabBar.module.css';

export interface StickyTab {
  key: string;
  label: string;
}

export interface StickyTabBarProps {
  tabs: StickyTab[];
  activeKey: string;
  onChange: (key: string) => void;
  ariaLabel?: string;
}

/**
 * 페이지를 스크롤해서 탭바가 글로벌 nav(=`--nav-bar-h`) 바로 아래에 위치하도록 정렬.
 * 현재 스크롤이 탭바 sticky 시작점보다 위(=히어로 노출 상태)일 때만 동작.
 * 이미 sticky 가 적용된 상태(스크롤이 더 아래)면 점프시키지 않는다.
 */
function snapScrollToTabBar() {
  const tabBar = document.getElementById('sticky-tab-bar');
  if (!tabBar) return;
  const navH =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-bar-h'),
      10,
    ) || 72;
  const rect = tabBar.getBoundingClientRect();
  // 탭바 top 이 nav 아래(=navH) 보다 더 아래에 있으면 그만큼 더 스크롤.
  const delta = rect.top - navH;
  if (delta > 1) {
    window.scrollTo({
      top: window.scrollY + delta,
      behavior: 'smooth',
    });
  }
}

/**
 * 모바일/데스크탑 공용 sticky tab bar.
 * - 헤더(`--nav-bar-h`) 아래에 sticky
 * - 항상 1줄, 가로 스크롤 (모바일에서 줄바꿈으로 nav 가 두꺼워지지 않도록)
 * - 활성 탭은 자동으로 가운데로 스크롤
 * - 탭 클릭 시 페이지도 자동 스크롤해 탭바를 nav 바로 아래로 정렬
 */
export default function StickyTabBar({
  tabs,
  activeKey,
  onChange,
  ariaLabel = '페이지 탭',
}: StickyTabBarProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const btn = buttonRefs.current[activeKey];
    const scroller = scrollerRef.current;
    if (!btn || !scroller) return;
    const btnRect = btn.getBoundingClientRect();
    const scRect = scroller.getBoundingClientRect();
    const offset =
      btn.offsetLeft - scroller.clientWidth / 2 + btnRect.width / 2;
    scroller.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    // 참고: scrollIntoView 는 sticky bar 자체도 스크롤시키는 문제가 있어 사용 안 함.
    void scRect;
  }, [activeKey]);

  return (
    <nav id="sticky-tab-bar" className={styles.nav} aria-label={ariaLabel}>
      <div className={styles.inner}>
        <div className={styles.scroller} ref={scrollerRef} role="tablist">
          {tabs.map((t) => {
            const active = t.key === activeKey;
            return (
              <button
                key={t.key}
                ref={(el) => {
                  buttonRefs.current[t.key] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  onChange(t.key);
                  snapScrollToTabBar();
                }}
                className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
