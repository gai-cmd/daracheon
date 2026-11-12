/**
 * sitemap 이 어드민 편집 페이지(pages 레코드)에서 읽는 값 — 저장 시각과 이미지.
 *
 * - 저장 시각: 어드민 pages 저장 경로가 키별 저장 시각을 pages 레코드의 `pageUpdatedAt` 에 적는다.
 *   sitemap lastmod 는 이 값만 쓴다. 한 번도 저장되지 않아 값이 없으면 lastmod 를 생략한다(날짜를 지어내지 않는다).
 * - 이미지: 저장된 페이지 데이터 안의 이미지 주소. 우리 인프라 주소만 남기는 일은 sitemap-images 가 한다.
 */

/** pages 레코드 안에서 키별 저장 시각을 담는 자리. */
export const PAGE_UPDATED_AT_KEY = 'pageUpdatedAt';

/** pages 레코드에 `key` 의 저장 시각을 적은 새 객체를 돌려준다(다른 키의 시각은 그대로). */
export function stampPageUpdatedAt<T extends Record<string, unknown>>(pages: T, key: string, at: Date): T {
  const prev = pages[PAGE_UPDATED_AT_KEY];
  const map = prev && typeof prev === 'object' && !Array.isArray(prev) ? (prev as Record<string, unknown>) : {};
  return { ...pages, [PAGE_UPDATED_AT_KEY]: { ...map, [key]: at.toISOString() } };
}

/**
 * 주어진 키들 중 가장 최근 저장 시각. 기록이 없거나 깨졌으면 undefined.
 * 한 공개 페이지가 여러 키의 데이터를 함께 보여 줄 때(예: /brand-story = brandStory + showroom) 키를 여러 개 넘긴다.
 */
export function pageUpdatedAt(pages: unknown, ...keys: string[]): Date | undefined {
  if (!pages || typeof pages !== 'object') return undefined;
  const map = (pages as Record<string, unknown>)[PAGE_UPDATED_AT_KEY];
  if (!map || typeof map !== 'object') return undefined;
  let latest: Date | undefined;
  for (const key of keys) {
    const v = (map as Record<string, unknown>)[key];
    if (typeof v !== 'string') continue;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

/**
 * Article.dateModified 용 값 — 주어진 키들의 최근 저장 시각(ISO). 기록이 없으면 fallback(기존 상수) 그대로.
 * 렌더 시각은 쓰지 않는다.
 */
export function pageDateModified(pages: unknown, fallback: string, ...keys: string[]): string {
  return pageUpdatedAt(pages, ...keys)?.toISOString() ?? fallback;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)(\?|#|$)/i;

/**
 * 저장된 페이지 데이터(임의 깊이의 객체·배열)에서 이미지 주소처럼 보이는 문자열을 나온 순서대로 모은다.
 * 호스트 검사는 하지 않는다 — collectSitemapImages 가 Blob·/public 원본만 남긴다.
 */
export function collectRecordImages(record: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const walk = (v: unknown, depth: number) => {
    if (depth > 12) return;
    if (typeof v === 'string') {
      const s = v.trim();
      if (IMAGE_EXT.test(s) && !/\s/.test(s) && !seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    } else if (Array.isArray(v)) {
      for (const x of v) walk(x, depth + 1);
    } else if (v && typeof v === 'object') {
      for (const x of Object.values(v)) walk(x, depth + 1);
    }
  };
  walk(record, 0);
  return out;
}
