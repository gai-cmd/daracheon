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
 * 탭 클릭 시 페이지를 스크롤해서 탭바가 글로벌 nav 바로 아래에 위치하도록 정렬.
 *
 * Why sentinel: 탭바 자체는 sticky 라서 항상 화면 상단에 떠 있고,
 *   getBoundingClientRect().top 이 늘 navH 와 같다 (delta ≈ 0). 그래서
 *   탭바 좌표 기반 스크롤은 작동하지 않는다. 대신 탭바 바로 *위*에 둔
 *   sticky 가 아닌 sentinel(높이 0 div) 의 절대 위치를 기준으로 잡으면
 *   탭바의 *자연 위치(sticky activation point)* 를 정확히 알 수 있다.
 *
 * rAF: setActiveTab 으로 React 가 새 탭 콘텐츠를 마운트 → DOM 높이가 변하기
 *   직전이라 같은 frame 의 scrollTo 가 잘못된 위치로 갈 수 있어, 다음 frame
 *   에서 실행해 정확한 좌표를 얻는다.
 */
function snapScrollToTabBar() {
  requestAnimationFrame(() => {
    const sentinel = document.getElementById('sticky-tab-bar-sentinel');
    if (!sentinel) return;
    const navH =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-bar-h'),
        10,
      ) || 72;
    const rect = sentinel.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const target = Math.max(0, absoluteTop - navH);
    if (Math.abs(window.scrollY - target) > 1) {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  });
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
    <>
      {/* sentinel: sticky 가 아닌 normal-flow div. 탭바의 sticky activation
          좌표를 측정하기 위한 anchor. 시각적으론 0 높이라 보이지 않음. */}
      <div id="sticky-tab-bar-sentinel" aria-hidden style={{ height: 0 }} />
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
    </>
  );
}
