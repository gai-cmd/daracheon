import { useEffect } from 'react';

/**
 * URL hash (`#tab-<key>`) <-> activeTab 양방향 동기화.
 *
 * 마운트 시 + hashchange 시 hash 읽어 setActiveKey 호출.
 * isValid 가 false 면 무시 (잘못된 key 가 와도 안전).
 */
export function useHashTab(
  setActiveKey: (k: string) => void,
  isValid: (k: string) => boolean
) {
  useEffect(() => {
    function sync() {
      const m = window.location.hash.match(/^#tab-(.+)$/);
      if (!m) return;
      const k = decodeURIComponent(m[1]);
      if (isValid(k)) {
        setActiveKey(k);
        // 햄버거 메뉴에서 같은 페이지로 들어왔을 때 — 탭 바 위치로 부드럽게 스크롤.
        requestAnimationFrame(() => {
          document
            .getElementById('sticky-tab-bar')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * 탭 전환 시 URL 의 hash 도 갱신해 공유 가능한 링크 만들기.
 * pushState 가 아니라 replaceState — 뒤로가기 히스토리 오염 방지.
 */
export function setTabHash(key: string) {
  if (typeof window === 'undefined') return;
  const next = `#tab-${encodeURIComponent(key)}`;
  if (window.location.hash === next) return;
  history.replaceState(null, '', next);
}
