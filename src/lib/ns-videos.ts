/** /home-shopping 에 노출할 NS 제작 영상 목록을 정한다.
 *  - hidden=true: 전부 숨김 (어드민 '영상 노출' 스위치 OFF)
 *  - 저장 목록이 없거나 빈 배열: 코드 fallback
 *  - 저장 목록이 있으면 URL 이 빈 카드는 제외 — URL 만 비워 저장해도 빈 카드가 남지 않게 한다. */
export function resolveNsVideos<T extends { url: string }>(
  saved: T[] | undefined,
  hidden: boolean | undefined,
  fallback: T[],
): T[] {
  if (hidden) return [];
  if (!Array.isArray(saved) || saved.length === 0) return fallback;
  return saved.filter((v) => typeof v.url === 'string' && v.url.trim() !== '');
}
