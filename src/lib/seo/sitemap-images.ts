/**
 * sitemap 이미지 확장(<image:image>) 항목 생성기.
 *
 * - 우리 인프라 이미지만 넣는다: Vercel Blob(https) 또는 /public 정적 자산(절대 URL 로 변환).
 * - /_next/image 같은 렌더용 최적화 URL·외부 CDN URL 은 제외한다 (원본 주소만 색인 대상).
 * - Next 15 sitemap 직렬화는 <image:loc> 값을 XML 이스케이프하지 않으므로 '&' 는 여기서 &amp; 로 바꾼다.
 * - URL 하나당 최대 20개(Google 권장 상한 대비 여유)로 자른다.
 */

export const SITEMAP_BLOB_HOST = 'xpklzng0qyaecv6i.public.blob.vercel-storage.com';

/** URL 하나에 붙이는 이미지 최대 개수. */
export const SITEMAP_IMAGE_CAP = 20;

/** 블로그 본문에서 뽑는 Blob 이미지 최대 개수. */
export const BODY_IMAGE_LIMIT = 5;

function xmlSafe(href: string): string | undefined {
  // URL 직렬화 후에도 XML 을 깨는 문자가 남으면 버린다 ('&' 만 이스케이프 대상).
  if (/[<>"']/.test(href)) return undefined;
  return href.replace(/&/g, '&amp;');
}

/**
 * 원본 이미지 주소를 sitemap 용 절대 URL 로. 넣을 수 없는 주소면 undefined.
 * - '/uploads/a.jpg' → `${baseUrl}/uploads/a.jpg`
 * - Blob https URL → 그대로 (정규화만)
 * - /_next/…, '//host/…', 외부 호스트, data:, http: → undefined
 */
export function toSitemapImageUrl(raw: unknown, baseUrl: string): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim().replace(/&amp;/g, '&');
  if (!value) return undefined;

  if (value.startsWith('/') && !value.startsWith('//')) {
    if (/^\/_next\//i.test(value)) return undefined;
    try {
      const u = new URL(value, `${baseUrl}/`);
      return xmlSafe(u.href);
    } catch {
      return undefined;
    }
  }

  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return undefined;
    if (u.hostname.toLowerCase() !== SITEMAP_BLOB_HOST) return undefined;
    if (/^\/_next\//i.test(u.pathname)) return undefined;
    return xmlSafe(u.href);
  } catch {
    return undefined;
  }
}

/** 후보 주소들을 걸러 중복 제거 후 상한까지 자른다. */
export function collectSitemapImages(
  candidates: readonly unknown[],
  baseUrl: string,
  cap: number = SITEMAP_IMAGE_CAP,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (out.length >= cap) break;
    const url = toSitemapImageUrl(c, baseUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/**
 * 저장된 블로그 본문 HTML 에서 <img src> 중 Blob 원본 주소만 앞에서부터 limit 개 뽑는다.
 * 본문은 읽기만 한다 (수정하지 않음).
 */
export function extractBodyBlobImages(html: unknown, limit: number = BODY_IMAGE_LIMIT): string[] {
  if (typeof html !== 'string' || !/<img\b/i.test(html)) return [];
  const out: string[] = [];
  const re = /<img\b[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < limit) {
    const src = (m[1] ?? m[2] ?? m[3] ?? '').trim().replace(/&amp;/g, '&');
    try {
      const u = new URL(src);
      if (u.protocol === 'https:' && u.hostname.toLowerCase() === SITEMAP_BLOB_HOST && !out.includes(src)) {
        out.push(src);
      }
    } catch {
      /* 상대경로·깨진 주소는 건너뜀 */
    }
  }
  return out;
}
