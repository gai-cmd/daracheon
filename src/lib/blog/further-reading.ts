import { unstable_cache } from 'next/cache';
import { pickPostsBySlug } from './post-seo';
import { readPostsSafe, BLOG_LATEST_TAG } from './store';

export interface FurtherReadingPost {
  slug: string;
  title: string;
}

/**
 * 허브 페이지 "더 읽어보기" — 고정 슬러그 목록을 블로그 저장소의 실제 제목으로 풀어 준다.
 * 발행되지 않았거나 없는 슬러그는 빠진다(pickPostsBySlug).
 *
 * 요청마다 전체 글을 읽지 않도록 캐시하고(어드민 글 저장 시 BLOG_LATEST_TAG 가 비워져
 * 제목 변경도 곧 반영), 느린 저장소가 페이지를 붙잡지 않게 제한 시간 안에 답이 없으면
 * 빈 목록을 돌려준다. 절대 던지지 않는다.
 */
export async function readFurtherReading(
  cacheKey: string,
  slugs: readonly string[],
  timeoutMs = 2000,
): Promise<FurtherReadingPost[]> {
  const cached = unstable_cache(
    async () => pickPostsBySlug(await readPostsSafe(), slugs),
    // 함수 본문은 허브마다 같으므로 슬러그 목록을 키에 넣어, 목록을 바꾸면 곧바로 새 캐시를 쓴다.
    [cacheKey, ...slugs],
    { revalidate: 300, tags: [BLOG_LATEST_TAG] },
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<FurtherReadingPost[]>((resolve) => {
    timer = setTimeout(() => resolve([]), timeoutMs);
  });
  try {
    return await Promise.race([cached(), timeout]);
  } catch (err) {
    console.error(`[${cacheKey}] further reading read failed`, err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
