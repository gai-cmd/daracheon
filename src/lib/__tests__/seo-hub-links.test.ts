import { describe, it, expect } from 'vitest';
import { BLOG_REFERENCES } from '@/content/blog-references';
import { AGARWOOD_BENEFITS } from '@/content/topics/agarwood-benefits';
import { AGARWOOD_HWAN } from '@/content/topics/agarwood-hwan';
import { AGARWOOD_OIL } from '@/content/topics/agarwood-oil';
import { AGARWOOD_TEA } from '@/content/topics/agarwood-tea';
import { VIETNAM_AGARWOOD } from '@/content/topics/vietnam-agarwood';
import { BENEFITS_REFERENCE_DOIS, pickVerifiedReferences } from '@/content/topics/benefits-references';
import {
  applyNeutralLabels,
  BENEFITS_FURTHER_READING_LABELS,
  BENEFITS_FURTHER_READING_SLUGS,
  OIL_FURTHER_READING_LABELS,
  OIL_FURTHER_READING_SLUGS,
} from '@/content/topics/further-reading';
import { productNameLinks, productTopicLink } from '@/components/seo/product-topic-link';
import { broadcastEventStatus, isBroadcastPast } from '@/app/home-shopping/event-status';

const HUBS = [AGARWOOD_BENEFITS, AGARWOOD_HWAN, AGARWOOD_OIL, AGARWOOD_TEA, VIETNAM_AGARWOOD];

describe('topic hub mesh', () => {
  it('links every hub to the four other topic hubs and to /about-agarwood', () => {
    const targets = [...HUBS.map((h) => h.path), '/about-agarwood'];
    for (const hub of HUBS) {
      const hrefs = new Set(
        [...hub.sections.flatMap((s) => s.links ?? []), ...hub.related].map((l) => l.href.split('#')[0]),
      );
      for (const t of targets) {
        if (t === hub.path) continue;
        expect(hrefs.has(t), `${hub.path} -> ${t}`).toBe(true);
      }
    }
  });

  it('keeps related links unique per hub (React key = href)', () => {
    for (const hub of HUBS) {
      const hrefs = hub.related.map((l) => l.href);
      expect(new Set(hrefs).size, hub.path).toBe(hrefs.length);
    }
  });

  it('carries a date-only dateModified that is not before datePublished', () => {
    for (const hub of HUBS) {
      expect(hub.dateModified, hub.path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(hub.dateModified >= hub.datePublished, hub.path).toBe(true);
    }
  });

  it('keeps product links off the efficacy hub', () => {
    const all = [...AGARWOOD_BENEFITS.sections.flatMap((s) => s.links ?? []), ...AGARWOOD_BENEFITS.related];
    expect(all.filter((l) => l.href.startsWith('/products'))).toEqual([]);
    expect(AGARWOOD_BENEFITS.productsTitle).toBeUndefined();
  });
});

describe('further reading labels', () => {
  it('replaces only the titles that have a neutral label', () => {
    const posts = [
      { slug: 'a', title: '원제목 A' },
      { slug: 'b', title: '원제목 B' },
    ];
    expect(applyNeutralLabels(posts, { b: '중립 라벨' })).toEqual([
      { slug: 'a', title: '원제목 A' },
      { slug: 'b', title: '중립 라벨' },
    ]);
    expect(posts[1].title).toBe('원제목 B');
  });

  it('labels only slugs that are in the list, without disease or proof wording', () => {
    const banned = /불안|우울|불면|당뇨|염증|비만|질환|치료|예방|입증|효과|효능|개선/;
    for (const [labels, slugs] of [
      [OIL_FURTHER_READING_LABELS, OIL_FURTHER_READING_SLUGS],
      [BENEFITS_FURTHER_READING_LABELS, BENEFITS_FURTHER_READING_SLUGS],
    ] as const) {
      for (const [slug, label] of Object.entries(labels)) {
        expect((slugs as readonly string[]).includes(slug), slug).toBe(true);
        expect(label, slug).not.toMatch(banned);
      }
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe('benefits hub references', () => {
  it('resolves every listed DOI from the verified blog reference data', () => {
    const refs = pickVerifiedReferences(BENEFITS_REFERENCE_DOIS);
    expect(refs.map((r) => r.doi)).toEqual([...BENEFITS_REFERENCE_DOIS]);
    const known = new Set(Object.values(BLOG_REFERENCES).flat().map((r) => r.doi));
    for (const r of refs) expect(known.has(r.doi), r.doi).toBe(true);
  });

  it('drops unknown DOIs and repeats', () => {
    const source = { p: [{ doi: '10.1000/abc', title: 'T', authors: 'A 외', journal: 'J', year: 2020 }] };
    expect(pickVerifiedReferences(['10.1000/ABC', '10.1000/abc', '10.9999/none'], source)).toEqual(source.p);
    expect(pickVerifiedReferences([], source)).toEqual([]);
  });
});

describe('product links', () => {
  const products = [
    { slug: 'daerachoen-cham-agarwood-oil-capsule', name: ' 캡슐 ', shortDescription: '짧은 설명' },
    { slug: 'agarwood-water-500ml', name: '침향수', published: false },
    { slug: 'agarwood-stick-100g', name: '침향스틱' },
    { slug: 'agarwood-stick-100g', name: '침향스틱 중복' },
    { slug: '', name: '슬러그 없음' },
  ];

  it('builds a card for a published product under its canonical slug', () => {
    expect(productTopicLink(products, 'daeracheon-cham-agarwood-oil-capsule')).toEqual({
      href: '/products/daeracheon-cham-agarwood-oil-capsule',
      label: '캡슐',
      desc: '짧은 설명',
    });
  });

  it('returns null for unpublished or missing products', () => {
    expect(productTopicLink(products, 'agarwood-water-500ml')).toBeNull();
    expect(productTopicLink(products, 'no-such-product')).toBeNull();
  });

  it('lists published products once each, in stored order', () => {
    expect(productNameLinks(products)).toEqual([
      { href: '/products/daeracheon-cham-agarwood-oil-capsule', label: '캡슐' },
      { href: '/products/agarwood-stick-100g', label: '침향스틱' },
    ]);
  });
});

describe('home-shopping eventStatus', () => {
  const now = new Date('2026-11-12T03:00:00.000Z');
  const past = '2026-11-01T02:00:00.000Z';
  const future = '2026-12-01T02:00:00.000Z';

  it('never emits EventCompleted and omits the status for past broadcasts', () => {
    expect(broadcastEventStatus('ended', past, now)).toBeUndefined();
    expect(broadcastEventStatus('scheduled', past, now)).toBeUndefined();
    expect(broadcastEventStatus('ended', future, now)).toBeUndefined();
  });

  it('keeps scheduled and cancelled states', () => {
    expect(broadcastEventStatus('scheduled', future, now)).toBe('https://schema.org/EventScheduled');
    expect(broadcastEventStatus('live', future, now)).toBe('https://schema.org/EventScheduled');
    expect(broadcastEventStatus('canceled', past, now)).toBe('https://schema.org/EventCancelled');
  });

  it('treats an unreadable end time as past', () => {
    expect(isBroadcastPast('not-a-date', now)).toBe(true);
    expect(isBroadcastPast(future, now)).toBe(false);
  });
});
