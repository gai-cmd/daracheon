import { BLOG_REFERENCES, type BlogReference } from '@/content/blog-references';

/** 글 슬러그에 연결된 검증된 1차 출처 목록. 없으면 빈 배열. */
export function referencesForSlug(slug: string): BlogReference[] {
  return BLOG_REFERENCES[slug] ?? [];
}

export function doiUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}

/**
 * BlogPosting.citation 항목을 만든다.
 * 검증된 참고 문헌(DOI)을 먼저 넣고, 본문 인라인 인용 링크 중 같은 DOI 를 가리키지 않는 것만 덧붙인다.
 */
export function buildCitations(
  refs: BlogReference[],
  inlineUrls: string[],
): Array<Record<string, unknown>> {
  const fromRefs = refs.map((r) => ({
    '@type': 'ScholarlyArticle',
    name: r.title,
    url: doiUrl(r.doi),
    datePublished: String(r.year),
    isPartOf: { '@type': 'Periodical', name: r.journal },
  }));
  const dois = refs.map((r) => r.doi.toLowerCase());
  const rest = inlineUrls
    .filter((u) => !dois.some((d) => decodeSafe(u).toLowerCase().includes(d)))
    .map((url) => ({ '@type': 'CreativeWork', url }));
  return [...fromRefs, ...rest];
}

function decodeSafe(u: string): string {
  try {
    return decodeURIComponent(u);
  } catch {
    return u;
  }
}
