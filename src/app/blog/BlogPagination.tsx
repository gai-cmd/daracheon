import Link from 'next/link';

/** ?page= 파라미터를 1 이상의 정수로 정규화. 잘못된 값은 1페이지로. */
export function parseBlogPage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

interface BlogPaginationProps {
  current: number;
  totalPages: number;
  /** 예: "/blog" 또는 "/blog/category/agarwood-basics" */
  basePath: string;
}

/**
 * 숫자 페이지네이션 — 크롤러가 따라갈 수 있는 실제 <a> 링크로 렌더한다
 * (무한스크롤·JS 버튼은 색인 사각지대). 1페이지는 쿼리 없는 basePath 로
 * 통일해 /blog 와 /blog?page=1 이 중복 URL 로 갈라지지 않게 한다.
 */
export default function BlogPagination({ current, totalPages, basePath }: BlogPaginationProps) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  // 표시 창: 양 끝 + 현재 ±2, 나머지는 … 로 생략.
  const pages: (number | 'gap')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= 2) pages.push(p);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }

  const baseCls =
    'rounded-full border border-luxury-bronze/40 px-3 py-1 text-sm text-luxury-cream/70 transition hover:border-luxury-gold/60 hover:text-luxury-gold';
  const activeCls =
    'rounded-full border border-luxury-gold/60 bg-luxury-gold/10 px-3 py-1 text-sm text-luxury-gold';

  return (
    <nav aria-label="블로그 페이지 목록" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {current > 1 && (
        <Link href={href(current - 1)} className={baseCls} aria-label="이전 페이지">
          ←
        </Link>
      )}
      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-luxury-cream/40">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === current ? 'page' : undefined}
            className={p === current ? activeCls : baseCls}
          >
            {p}
          </Link>
        )
      )}
      {current < totalPages && (
        <Link href={href(current + 1)} className={baseCls} aria-label="다음 페이지">
          →
        </Link>
      )}
    </nav>
  );
}
