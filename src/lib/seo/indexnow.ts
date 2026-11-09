/**
 * IndexNow 알림 — 콘텐츠가 발행·수정되면 네이버 서치어드바이저에 새 URL 을 알려
 * 빠르게 수집되도록 한다. (구글은 대응 수단이 없어 보내지 않는다 — sitemap ping 은 폐지됨.)
 *
 * 프로덕션(VERCEL_ENV=production)에서만 동작하고, INDEXNOW_DISABLED=1 로 끌 수 있다.
 * 어떤 경우에도 예외를 던지지 않는다 — 알림 실패가 저장 응답을 깨면 안 된다.
 */

// 공개 값이다(비밀 아님) — IndexNow 키는 public/<key>.txt 로 누구나 볼 수 있게 두는 것이 규격.
export const INDEXNOW_KEY = 'b5a88f29a5b092c4390f7f4d332171d6';

// 호스트는 정식 주소로 고정한다. 키 파일이 이 호스트에 있어야 제출이 인정된다.
export const INDEXNOW_HOST = 'zoellife.com';
const ORIGIN = `https://${INDEXNOW_HOST}`;

export const INDEXNOW_ENDPOINT = 'https://searchadvisor.naver.com/indexnow';
export const INDEXNOW_MAX_URLS = 100;
const TIMEOUT_MS = 5000;

/**
 * 경로(또는 절대 URL) 목록을 zoellife.com 절대 URL 로 바꾼다.
 * 다른 호스트·http·빈 값은 버리고, 중복을 제거하고, 최대 100개까지만 남긴다.
 */
export function buildIndexNowUrls(paths: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of paths) {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) continue;
    let url: URL;
    try {
      // 'blog' 처럼 앞 슬래시가 빠진 경로도 루트 기준으로 해석한다.
      url = new URL(value, `${ORIGIN}/`);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' || url.host !== INDEXNOW_HOST) continue;
    url.hash = '';
    const href = url.href;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
    if (out.length >= INDEXNOW_MAX_URLS) break;
  }
  return out;
}

/** 발행된 블로그 글 하나가 바뀔 때 알릴 경로 — 글 본문·목록·카테고리. */
export function blogPostPaths(slug: string, categoryId?: string): string[] {
  const paths = [`/blog/${slug}`, '/blog'];
  if (categoryId) paths.push(`/blog/category/${categoryId}`);
  return paths;
}

/** 프로덕션에서만 네이버 IndexNow 로 URL 목록을 보낸다. 절대 throw 하지 않는다. */
export async function notifyIndexNow(paths: string[]): Promise<void> {
  try {
    if (process.env.VERCEL_ENV !== 'production') return;
    if (process.env.INDEXNOW_DISABLED === '1') return;
    const urlList = buildIndexNowUrls(paths);
    if (urlList.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: INDEXNOW_HOST,
          key: INDEXNOW_KEY,
          keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`,
          urlList,
        }),
        signal: controller.signal,
      });
      if (res.ok) {
        console.log(`[indexnow] status=${res.status} urls=${urlList.length}`);
      } else {
        console.warn(`[indexnow] status=${res.status} urls=${urlList.length}`);
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.warn(`[indexnow] failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
