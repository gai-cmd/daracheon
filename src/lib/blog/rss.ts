/**
 * RSS 피드 순수 유틸 — content:encoded 본문 래핑, 상대 URL 절대화, enclosure MIME 판별.
 * src/app/rss.xml/route.ts 에서 쓰며 단위 테스트로 고정한다.
 */

/**
 * 문자열을 CDATA 섹션으로 감싼다. 본문 안의 ']]>' 는 CDATA 를 닫아 버리므로
 * ']]]]><![CDATA[>' 로 쪼개 두 섹션에 나눠 담는다(이어 붙이면 원문과 같다).
 */
export function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/** 루트 상대(/a)·프로토콜 상대(//h/a) URL 을 절대 URL 로. 나머지는 그대로. */
export function absolutize(url: string, base: string): string {
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${base}${url}`;
  return url;
}

/**
 * 본문 HTML 의 루트 상대 경로(/uploads/…)와 프로토콜 상대 경로(//host/…)를 절대 URL 로 바꾼다.
 * 피드 리더는 문서 주소를 기준으로 상대 경로를 풀지 않을 수 있다. 대상 속성: src·href·poster·srcset.
 * '#앵커', 'mailto:', 이미 절대인 URL 은 그대로 둔다.
 */
export function absolutizeHtmlUrls(html: string, base: string): string {
  const root = base.replace(/\/+$/, '');
  return html
    .replace(
      /(\s(?:src|href|poster)\s*=\s*)(["'])(\/[^"']*)\2/gi,
      (_m, attr: string, q: string, url: string) => `${attr}${q}${absolutize(url, root)}${q}`,
    )
    .replace(/(\ssrcset\s*=\s*)(["'])([^"']*)\2/gi, (_m, attr: string, q: string, list: string) => {
      const fixed = list
        .split(',')
        .map((part) => {
          const trimmed = part.trim();
          if (!trimmed) return trimmed;
          const [url, ...desc] = trimmed.split(/\s+/);
          return [absolutize(url, root), ...desc].join(' ');
        })
        .join(', ');
      return `${attr}${q}${fixed}${q}`;
    });
}

const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

/** 이미지 URL 확장자로 enclosure type 을 정한다. 모르는 확장자면 null(enclosure 생략). */
export function imageMimeType(url: string): string | null {
  const path = url.split(/[?#]/)[0];
  const m = path.match(/\.([a-z0-9]+)$/i);
  return m ? (IMAGE_MIME[m[1].toLowerCase()] ?? null) : null;
}
