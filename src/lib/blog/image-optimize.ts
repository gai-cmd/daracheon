/**
 * 블로그 이미지 렌더 최적화 — 저장된 본문은 건드리지 않고 공개 렌더 직전에만 적용한다.
 *
 * - 우리 Vercel Blob 호스트의 래스터 이미지를 Next 이미지 최적화기(/_next/image)로 보낸다.
 *   (next.config.ts images.remotePatterns 의 *.public.blob.vercel-storage.com 과 짝)
 * - SVG 는 최적화기가 기본 설정(dangerouslyAllowSVG=false)에서 거절하므로 원본 그대로 둔다.
 * - 첫 번째 본문 이미지는 화면 상단에 걸릴 수 있어 지연 로드에서 제외한다.
 * - alt 등 다른 속성은 그대로 보존한다 — src 값과 loading/decoding 속성만 다룬다.
 */

export const PROJECT_BLOB_HOST = 'xpklzng0qyaecv6i.public.blob.vercel-storage.com';

/** 본문 이미지 최적화 폭 — Next 기본 deviceSizes 에 포함된 값이어야 400 이 나지 않는다. */
const BODY_IMAGE_WIDTH = 1080;
const BODY_IMAGE_QUALITY = 75;

/** 우리 Blob 호스트의 https 래스터 이미지인지 — 최적화기로 보낼 수 있는 대상. */
export function isOptimizableBlobImage(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    if (u.hostname.toLowerCase() !== PROJECT_BLOB_HOST) return false;
    return !/\.svg$/i.test(u.pathname);
  } catch {
    return false;
  }
}

function decodeEntities(v: string): string {
  return v.replace(/&amp;/g, '&');
}

/**
 * 본문 HTML 의 <img> 를 렌더용으로 재작성한다.
 * - Blob 래스터 src → /_next/image?url=…&w=1080&q=75 (이미 최적화된 URL·외부·상대 경로는 그대로)
 * - 두 번째 이미지부터 loading="lazy" decoding="async" 추가 (이미 지정된 속성은 덮어쓰지 않음)
 */
export function optimizeBodyImages(html: string): string {
  if (!html || !/<img\b/i.test(html)) return html;
  let index = 0;
  return html.replace(/<img\b([^>]*?)(\s*\/?)>/gi, (_match, attrs: string, close: string) => {
    const isFirst = index === 0;
    index += 1;

    let next = attrs.replace(
      /(\ssrc\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i,
      (m, prefix: string, dq?: string, sq?: string, bare?: string) => {
        const raw = dq ?? sq ?? bare ?? '';
        const url = decodeEntities(raw);
        if (!isOptimizableBlobImage(url)) return m;
        const optimized = `/_next/image?url=${encodeURIComponent(url)}&amp;w=${BODY_IMAGE_WIDTH}&amp;q=${BODY_IMAGE_QUALITY}`;
        return `${prefix}"${optimized}"`;
      },
    );

    if (!isFirst) {
      if (!/\sloading\s*=/i.test(next)) next += ' loading="lazy"';
      if (!/\sdecoding\s*=/i.test(next)) next += ' decoding="async"';
    }
    return `<img${next}${close}>`;
  });
}
