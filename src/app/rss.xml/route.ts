import { readPostsSafe, readCategoriesSafe } from '@/lib/blog/store';

// RSS 2.0 피드 — 네이버 서치어드바이저 "RSS 제출"·구글·피드 리더용.
// 공개(published) 블로그 글 최신 50건. 데이터 소스는 sitemap.ts 와 동일(readPostsSafe).
// 정규 도메인은 zoellife.com (no www) — sitemap.ts / robots.ts 와 동일 정규화.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zoellife.com')
  .replace(/\\[nrt]/g, '')
  .replace(/\s+/g, '')
  .replace(/^['"]+|['"]+$/g, '')
  .replace(/\/+$/, '');

const MAX_ITEMS = 50;

export const dynamic = 'force-dynamic';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 잘못된 날짜가 toUTCString 에서 "Invalid Date" 로 새지 않도록 방어.
function rfc822(iso: string | undefined, fallback: Date): string {
  const d = iso ? new Date(iso) : fallback;
  return (Number.isNaN(d.getTime()) ? fallback : d).toUTCString();
}

export async function GET() {
  const now = new Date();
  let items = '';
  let lastBuild = now;

  try {
    const [posts, categories] = await Promise.all([readPostsSafe(), readCategoriesSafe()]);
    const categoryName = new Map(categories.map((c) => [c.id, c.name]));
    const published = posts
      .filter((p) => p.status === 'published' && p.slug)
      .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))
      .slice(0, MAX_ITEMS);

    if (published[0]) {
      const d = new Date(published[0].updatedAt);
      if (!Number.isNaN(d.getTime())) lastBuild = d;
    }

    items = published
      .map((p) => {
        const url = `${SITE_URL}/blog/${p.slug}`;
        const cat = categoryName.get(p.categoryId);
        return [
          '    <item>',
          `      <title>${esc(p.title)}</title>`,
          `      <link>${esc(url)}</link>`,
          `      <guid isPermaLink="true">${esc(url)}</guid>`,
          `      <pubDate>${rfc822(p.publishedAt ?? p.createdAt, now)}</pubDate>`,
          p.author ? `      <dc:creator>${esc(p.author)}</dc:creator>` : '',
          cat ? `      <category>${esc(cat)}</category>` : '',
          `      <description>${esc(p.excerpt || p.title)}</description>`,
          p.coverImage ? `      <enclosure url="${esc(p.coverImage)}" type="image/jpeg" length="0" />` : '',
          '    </item>',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');
  } catch (err) {
    // 데이터 조회 실패 시에도 빈 채널을 200 으로 내보내 크롤러 재시도 대상으로 남긴다.
    console.error('[rss] blog read failed', err);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    "    <title>대라천 ZOEL LIFE 침향 이야기</title>",
    `    <link>${esc(`${SITE_URL}/blog`)}</link>`,
    "    <description>조엘라이프 대라천 '참'침향 블로그 — 침향의 역사·감별·활용과 베트남 직영 농장 소식.</description>",
    '    <language>ko-KR</language>',
    `    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${esc(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}
