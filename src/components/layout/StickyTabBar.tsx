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
 * 모바일/데스크탑 공용 sticky tab bar.
 * - 헤더(`--nav-bar-h`) 아래에 sticky
 * - 항상 1줄, 가로 스크롤 (모바일에서 줄바꿈으로 nav 가 두꺼워지지 않도록)
 * - 활성 탭은 자동으로 가운데로 스크롤
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
                onClick={() => onChange(t.key)}
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
