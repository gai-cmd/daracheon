import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readDataSafe } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import styles from '@/styles/zoel/story-page.module.css';
import type { MediaItem } from '../MediaGallery';

const SITE_URL = 'https://zoellife.com';

export const dynamic = 'force-dynamic';

function ytIdFromUrl(url: string): string | null {
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(url);
  return m ? m[1] : null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const items = await readDataSafe<MediaItem>('media');
  const item = items.find((m) => m.id === id);
  if (!item) return { title: '미디어 | ZOEL LIFE' };
  return {
    title: `${item.title} — ${item.source} | ZOEL LIFE`,
    description: item.excerpt ?? `${item.source} (${item.date})`,
    alternates: { canonical: `https://zoellife.com/media/${id}` },
    openGraph: item.image ? { images: [item.image] } : undefined,
  };
}

const TYPE_LABEL: Record<MediaItem['type'], string> = {
  video: '영상',
  photo: '사진',
};

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await readDataSafe<MediaItem>('media');
  const item = items.find((m) => m.id === id);
  if (!item) notFound();

  // 같은 타입의 다른 항목 — 추천
  const related = items.filter((m) => m.id !== item.id && m.type === item.type).slice(0, 3);

  // 미디어 항목 타입에 맞춰 JSON-LD 분기 — Google 영상 캐러셀 / 뉴스 / 사진 가이드
  // 모두 BreadcrumbList 와 함께 emit.
  const pageUrl = `${SITE_URL}/media/${item.id}`;
  const ytId = item.url ? ytIdFromUrl(item.url) : null;
  const itemJsonLd: Record<string, unknown> =
    item.type === 'video'
      ? {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: item.title,
          description: item.excerpt ?? item.title,
          thumbnailUrl: item.image,
          uploadDate: item.date,
          contentUrl: item.url ?? pageUrl,
          ...(ytId ? { embedUrl: `https://www.youtube.com/embed/${ytId}` } : {}),
          publisher: { '@id': `${SITE_URL}/#organization` },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'ImageObject',
          contentUrl: item.image,
          name: item.title,
          description: item.excerpt ?? item.title,
          datePublished: item.date,
          creditText: item.source ?? '대라천 ZOEL LIFE',
          creator: { '@id': `${SITE_URL}/#organization` },
        };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '미디어', item: `${SITE_URL}/media` },
      { '@type': 'ListItem', position: 3, name: item.title, item: pageUrl },
    ],
  };

  return (
    <>
      <JsonLd data={itemJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '40px' }}>
        <div className={styles.wrap}>
          <div className={styles.kicker}>
            <Link href="/media" style={{ color: 'inherit', textDecoration: 'none' }}>
              ← 미디어 갤러리로
            </Link>
          </div>
          <div className={styles.heroMain}>
            <div
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: '0.72rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 12,
              }}
            >
              {TYPE_LABEL[item.type]} · {item.source} · {item.date}
            </div>
            <h1 style={{ marginBottom: 18 }}>{item.title}</h1>
            {item.excerpt && <p className={styles.lede}>{item.excerpt}</p>}
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className={styles.chapter}>
        <div className={styles.wrap} style={{ maxWidth: 980 }}>
          {item.image && (
            <div
              style={{
                aspectRatio: item.type === 'photo' ? '4/3' : '16/9',
                position: 'relative',
                overflow: 'hidden',
                background: '#1a1d29',
                border: '1px solid rgba(212,168,67,0.18)',
                marginBottom: 32,
              }}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 980px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}

          {/* 본문 영역 — excerpt 가 짧으면 안내문 + 외부 링크 */}
          <div
            style={{
              fontSize: '1.02rem',
              color: 'rgba(255,255,255,0.82)',
              lineHeight: 1.95,
              fontWeight: 300,
              whiteSpace: 'pre-line',
            }}
          >
            {item.excerpt ?? `${item.source} 에서 다룬 ${item.title}`}
          </div>

          {item.url && (
            <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(212,168,67,0.18)' }}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  border: '1px solid rgba(212,168,67,0.5)',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                }}
              >
                원문 보기 →
              </a>
              <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                {item.source} 의 원문 페이지로 이동합니다 (새 탭).
              </p>
            </div>
          )}

          {/* 관리자가 본문을 더 채우면 여기에 표시될 자리 — 추후 admin 에서
              MediaItem 에 body? 필드 추가 시 이 자리에 렌더 */}
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className={`${styles.chapter} ${styles.chapterAlt}`}>
          <div className={styles.wrap}>
            <h3 style={{ marginBottom: 20 }}>같은 카테고리의 다른 미디어</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 18,
              }}
            >
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/media/${r.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid rgba(212,168,67,0.18)',
                    background: 'rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                    display: 'block',
                  }}
                >
                  {r.image && (
                    <div style={{ aspectRatio: '16/9', position: 'relative', background: '#1a1d29' }}>
                      <Image src={r.image} alt={r.title} fill sizes="320px" style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: 14 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono), ui-monospace, monospace",
                        fontSize: '0.62rem',
                        letterSpacing: '0.22em',
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      {r.source} · {r.date}
                    </div>
                    <div style={{ fontSize: '0.96rem', color: '#fff', lineHeight: 1.55 }}>{r.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
