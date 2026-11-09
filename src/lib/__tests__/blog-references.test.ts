import { describe, it, expect } from 'vitest';
import { BLOG_REFERENCES } from '@/content/blog-references';
import { buildCitations, doiUrl, referencesForSlug } from '@/lib/blog/references';

describe('blog references', () => {
  it('returns an empty list for posts without verified sources', () => {
    expect(referencesForSlug('no-such-post')).toEqual([]);
  });

  it('keeps every DOI lowercase, well-formed and unique per post', () => {
    for (const [slug, refs] of Object.entries(BLOG_REFERENCES)) {
      const dois = refs.map((r) => r.doi);
      expect(new Set(dois).size, slug).toBe(dois.length);
      for (const r of refs) {
        expect(r.doi, slug).toMatch(/^10\.\d{4,9}\/\S+$/);
        expect(r.doi, slug).toBe(r.doi.toLowerCase());
        expect(r.year, slug).toBeGreaterThan(1900);
        expect(r.title.length, slug).toBeGreaterThan(5);
      }
    }
  });

  it('puts verified references first and drops inline links to the same DOI', () => {
    const refs = [{ doi: '10.3390/nu15041019', title: 'T', authors: 'A 외', journal: 'Nutrients', year: 2023 }];
    const out = buildCitations(refs, [
      'https://www.mdpi.com/2072-6643/15/4/1019',
      'https://doi.org/10.3390/NU15041019',
      'https://pubs.rsc.org/x',
    ]);
    expect(out[0]).toMatchObject({ '@type': 'ScholarlyArticle', url: doiUrl('10.3390/nu15041019') });
    expect(out.map((c) => c.url)).toEqual([
      'https://doi.org/10.3390/nu15041019',
      'https://www.mdpi.com/2072-6643/15/4/1019',
      'https://pubs.rsc.org/x',
    ]);
  });

  it('falls back to inline links only when there are no references', () => {
    expect(buildCitations([], ['https://doi.org/10.1/x'])).toEqual([
      { '@type': 'CreativeWork', url: 'https://doi.org/10.1/x' },
    ]);
  });
});
