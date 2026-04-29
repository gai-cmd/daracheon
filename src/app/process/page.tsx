import type { Metadata } from 'next';
import Image from 'next/image';
import { readSingleSafe } from '@/lib/db';
import JsonLd from '@/components/ui/JsonLd';
import styles from '@/styles/zoel/story-page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '침향 농장 이야기 - 베트남 하띤 200ha | ZOEL LIFE',
  description:
    '베트남 하띤(Ha Tinh) 북위 18°의 직영 침향 농장 200헥타르, 약 400만 그루. 62가구의 현지 공동체 파트너십과 4단계 원산지 검증 체계.',
  alternates: { canonical: 'https://www.daracheon.com/process' },
};

interface ProcessHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  latLabel: string;
  lede: string;
  heroImage?: string;
}

interface ProcessChapter {
  num: string;
  tag: string;
  title: string;
  body: string;
  stats?: { value: string; label: string }[];
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;
}

interface ProductionVideo {
  id: string;
  title: string;
}

interface CertSection {
  title: string;
  items: string[];
}

interface ProcessData {
  hero?: ProcessHero;
  chapters?: ProcessChapter[];
  productionVideos?: { num: string; tag: string; title: string; body: string; items: ProductionVideo[] };
  certifications?: { num: string; tag: string; title: string; body: string; sections: CertSection[]; images: string[] };
}

const DEFAULT_HERO: ProcessHero = {
  kicker: '침향 농장 이야기 · Farm Story',
  titleLine1: '베트남 하띤의',
  titleEmphasis: '200헥타르, 25년의 시간',
  latLabel: 'Lat 18° N · Ha Tinh, Vietnam',
  lede:
    '호치민에서 북쪽으로 500km, 베트남 중부의 하띤(Ha Tinh) — 연평균 습도 84%, 해발 300~600m의 아열대 산림. 침향나무가 가장 깊은 수지를 만드는 유일한 기후. 대라천은 이곳에서 25년째 직영 농장을 운영합니다.',
};

// Farm images sourced from data/db/pages.json brandStory.farms (Google Drive / Cloudinary)
const DEFAULT_CHAPTERS: ProcessChapter[] = [
  {
    num: '01',
    tag: 'Location',
    title: '북위 18° — 침향의 마지막 기후대',
    body: '아퀼라리아 아갈로차(Aquilaria Agallocha Roxburgh)는 북위 10°~22° 사이 아열대 산림에서만 자연 수지를 만듭니다. 베트남 하띤은 그 중에서도 연평균 강수량 2,400mm, 안개일 수 180일 — 수지가 가장 깊게 침착되는 미기후를 갖춘, 세계에서 가장 북쪽 끝 침향 산지입니다.',
    imageSrc: 'https://lh3.googleusercontent.com/d/1xedUAtI2JRIwwjyLKmHRV_laaOApjEbf=w1280',
    imageAlt: '베트남 하띤(Ha Tinh) 직영 농장',
    imageCaption: '하띤 · Ha Tinh · 메인 대규모 농장 (200ha)',
  },
  {
    num: '02',
    tag: 'Scale',
    title: '직영 200ha · 약 400만 그루',
    body: '농장은 CITES(멸종위기종 국제거래협약) 번호 VN-2008-AAR-003으로 등록된 공식 조림지. 평균 수령 18년 이상의 성숙목 400만 그루가 자연 침착 환경에서 자라고 있으며, 매년 평균 180그루만 수확합니다.',
    stats: [
      { value: '200', label: 'ha' },
      { value: '4M', label: 'trees' },
    ],
    imageSrc: 'https://lh3.googleusercontent.com/d/1t02AQvPDeUsqjOv-NcUpwiDWrXwZ6mgA=w1280',
    imageAlt: '동나이(Dong Nai) 전략 재배 거점',
    imageCaption: '동나이 · Dong Nai · 전략 재배 거점',
  },
  {
    num: '03',
    tag: 'Partnership',
    title: '현지 공동체와의 25년',
    body: '농장의 관리는 하띤 지역 62가구의 현지 파트너 가족이 맡고 있습니다. 25년간 함께 일해온 이들에게는 한국 본사와 동일한 의료·교육 복지를 제공합니다. "진짜 침향은 사람과 자연 모두가 건강할 때만 만들어집니다" — 박병주 대표의 원칙.',
    stats: [{ value: '62', label: 'families' }],
    imageSrc: 'https://lh3.googleusercontent.com/d/1pCKsRdo3kix6XDUeFgdYHHomS3UJkLDX=w1280',
    imageAlt: '냐짱(Nha Trang) 고품질 원료 산지',
    imageCaption: '냐짱 · Nha Trang · 고품질 원료 산지',
  },
  {
    num: '04',
    tag: 'Verification',
    title: '4단계 원산지 검증',
    body: 'GPS 좌표로 나무마다 위치를 기록하고, 수확할 때 나무 ID·수지 함량을 DB에 입력합니다. 베트남 농업부 검사증을 받은 뒤 한국 식약처 수입 통관 시 한 번 더 검증합니다. 제품 Lot 번호로 이 모든 이력을 누구나 조회할 수 있습니다.',
    stats: [{ value: '4', label: 'steps' }],
    imageSrc: 'https://res.cloudinary.com/ddsu7fl1o/image/upload/v1765437829/agarwood/27_ch1.png',
    imageAlt: '람동(Lam Dong) 고산지대 특화 농장',
    imageCaption: '람동 · Lam Dong · 고산지대 특화 농장',
  },
];

const DEFAULT_VIDEOS: NonNullable<ProcessData['productionVideos']> = {
  num: '05',
  tag: 'Videos',
  title: '생산 영상 — 농장 현장',
  body: '베트남 5개 성 직영 농장에서 식목부터 25년 자연 숙성까지, Aquilaria Agallocha Roxburgh의 하루를 영상으로 공개합니다.',
  items: [
    { id: '1nhqc4UMyUUgBJKwMBX8pPabVgj_M231g', title: '하띤성 대규모 재배지 드론 촬영' },
    { id: '1oKXg0SyCbFy63C8hzQrPBs7THV4xIROE', title: '침향나무 식목·관수 루틴' },
    { id: '1p8OQBwzt57lH6mF8zZFDMuAGttqNATze', title: '동나이성 전략 재배 거점' },
    { id: '1IuUk2qrtyhE831wIZhFZkGngDx_hfON7', title: '냐짱 고품질 원료 산지' },
    { id: '1dBm27G-X2cLWy5ISGCMcpRXRzsFlLlwg', title: '푸국 해양성 기후 재배지' },
    { id: '13zJY7WQ6rVNQVAROdcgle4M5FQhvQ1fJ', title: '람동 고산지대 특화 농장' },
  ],
};

const DEFAULT_CERTS: NonNullable<ProcessData['certifications']> = {
  num: '06',
  tag: 'Certifications',
  title: '신뢰의 지표 — 국제가 인정하는 품질',
  body: 'CITES 국제거래 인증부터 TSL ISO/IEC 17025:2017 안전성 시험, 중금속 8종 전부 불검출까지. 대라천의 모든 제품은 Lot 번호로 이력을 조회할 수 있습니다.',
  sections: [
    {
      title: '국제 거래 및 기술 특허',
      items: ['CITES IIA-DNI-007', '수지유도 특허 #12835'],
    },
    {
      title: '품질 보증',
      items: ['Organic', 'HACCP', 'OCOP', '2025 아시아 10대 브랜드'],
    },
    {
      title: '안전성 시험',
      items: ['TSL ISO/IEC 17025:2017', '중금속 8종 전부 불검출'],
    },
  ],
  images: [
    '/uploads/misc/kfda-doc-1.jpg',
    '/uploads/misc/kfda-doc-2.jpg',
    '/uploads/misc/kfda-doc-3.jpg',
    '/uploads/misc/kfda-doc-4.jpg',
  ],
};

export default async function ProcessPage() {
  const pagesData = await readSingleSafe<{ process?: ProcessData }>('pages');
  const hero = pagesData?.process?.hero ?? DEFAULT_HERO;
  const chapters =
    pagesData?.process?.chapters && pagesData.process.chapters.length > 0
      ? pagesData.process.chapters
      : DEFAULT_CHAPTERS;
  const videos = pagesData?.process?.productionVideos ?? DEFAULT_VIDEOS;
  const certs = pagesData?.process?.certifications ?? DEFAULT_CERTS;

  // HowTo JSON-LD — AI Overview / SGE 가 침향 생산 공정 단계를 직접 인용.
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '대라천 침향 생산 공정',
    description:
      '베트남 하띤 200ha 직영 농장에서 식목부터 수확·검증까지, 25년이 걸리는 대라천 침향의 전 공정.',
    totalTime: 'P25Y',
    step: chapters.map((ch, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: ch.title,
      text: ch.body,
      ...(ch.imageSrc ? { image: ch.imageSrc } : {}),
    })),
  };

  // VideoObject 그룹 — /process 에 embedded Google Drive 영상을 AI 인용 가능하게.
  const videoJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: videos.title,
    itemListElement: videos.items.map((v, i) => ({
      '@type': 'VideoObject',
      position: i + 1,
      name: v.title,
      description: `${videos.title} — ${v.title}`,
      contentUrl: `https://drive.google.com/file/d/${v.id}/view`,
      embedUrl: `https://drive.google.com/file/d/${v.id}/preview`,
      uploadDate: '2026-04-11',
      thumbnailUrl: `https://lh3.googleusercontent.com/d/${v.id}=w1280`,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://www.daracheon.com' },
      { '@type': 'ListItem', position: 2, name: '침향 농장 이야기', item: 'https://www.daracheon.com/process' },
    ],
  };

  return (
    <>
      <JsonLd data={howToJsonLd} />
      <JsonLd data={videoJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '108px' }}>
        {hero.heroImage && (
          <Image
            src={hero.heroImage}
            alt=""
            fill
            sizes="100vw"
            priority
            unoptimized
            aria-hidden
            style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.7 }}
          />
        )}
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-60px', opacity: 0.45, zIndex: 1 }}
        />
        <div
          className="orn-plume"
          aria-hidden
          style={{ left: '8%', bottom: '-120px', opacity: 0.22, transform: 'scaleX(-1)', width: 240, height: 320, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero.kicker}</div>
          <div className={styles.heroMain}>
            <div>
              <h1>
                {hero.titleLine1}
                <br />
                <em>{hero.titleEmphasis}</em>
              </h1>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: '0.72rem',
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-soft)',
                  marginTop: 18,
                  maxWidth: 420,
                }}
              >
                {hero.latLabel}
              </div>
            </div>
            <p className={styles.lede}>{hero.lede}</p>
          </div>
        </div>
      </section>

      {/* CHAPTERS */}
      {chapters.map((ch, i) => (
        <section
          key={ch.num}
          className={styles.chapter}
          data-alt={i % 2 === 1 ? '1' : undefined}
        >
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>{ch.num}</div>
                <div className={styles.chapterTag}>{ch.tag}</div>
                {ch.stats && ch.stats.length > 0 && (
                  <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}>
                    {ch.stats.map((s) => (
                      <div
                        key={s.label}
                        style={{
                          border: '1px solid rgba(212,168,67,0.35)',
                          padding: '10px 14px',
                          minWidth: 70,
                          textAlign: 'center',
                        }}
                      >
                        <b
                          style={{
                            display: 'block',
                            fontFamily: "'Noto Serif KR', serif",
                            fontSize: '1.6rem',
                            fontWeight: 400,
                            color: 'var(--accent)',
                            lineHeight: 1,
                          }}
                        >
                          {s.value}
                        </b>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: '0.6rem',
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: 4,
                            display: 'inline-block',
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.chapterBody}>
                <h3>{ch.title}</h3>
                <p>{ch.body}</p>
                {ch.imageSrc && (
                  <figure style={{ margin: '32px 0 0' }}>
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '16/9',
                        overflow: 'hidden',
                        background: '#1a1d29',
                        border: '1px solid rgba(212,168,67,0.18)',
                      }}
                    >
                      <Image
                        src={ch.imageSrc}
                        alt={ch.imageAlt ?? ''}
                        fill
                        sizes="(max-width: 900px) 100vw, 720px"
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    </div>
                    {ch.imageCaption && (
                      <figcaption
                        style={{
                          marginTop: 12,
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: '0.62rem',
                          letterSpacing: '0.22em',
                          color: 'rgba(255,255,255,0.5)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {ch.imageCaption}
                      </figcaption>
                    )}
                  </figure>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* PRODUCTION VIDEOS */}
      <section className={styles.chapter} data-alt="1">
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>{videos.num}</div>
              <div className={styles.chapterTag}>{videos.tag}</div>
            </div>
            <div className={styles.chapterBody}>
              <h3>{videos.title}</h3>
              <p>{videos.body}</p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 20,
                  marginTop: 30,
                }}
              >
                {videos.items.map((v) => (
                  <figure key={v.id} style={{ margin: 0 }}>
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '16/9',
                        overflow: 'hidden',
                        background: '#1a1d29',
                        border: '1px solid rgba(212,168,67,0.18)',
                      }}
                    >
                      <iframe
                        src={`https://drive.google.com/file/d/${v.id}/preview`}
                        title={v.title}
                        allow="autoplay"
                        allowFullScreen
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                      />
                    </div>
                    <figcaption
                      style={{
                        marginTop: 10,
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.72)',
                        lineHeight: 1.6,
                      }}
                    >
                      {v.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section className={styles.chapter}>
        <div className={styles.wrap}>
          <div className={styles.chapterGrid}>
            <div>
              <div className={styles.chapterNum}>{certs.num}</div>
              <div className={styles.chapterTag}>{certs.tag}</div>
            </div>
            <div className={styles.chapterBody}>
              <h3>{certs.title}</h3>
              <p>{certs.body}</p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 20,
                  marginTop: 30,
                }}
              >
                {certs.sections.map((section) => (
                  <div
                    key={section.title}
                    style={{
                      border: '1px solid rgba(212,168,67,0.25)',
                      padding: '20px 18px',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: '0.6rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        marginBottom: 12,
                      }}
                    >
                      {section.title}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                      {section.items.map((item) => (
                        <li
                          key={item}
                          style={{
                            fontSize: '0.92rem',
                            color: 'rgba(255,255,255,0.82)',
                            lineHeight: 1.5,
                          }}
                        >
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 14,
                  marginTop: 28,
                }}
              >
                {certs.images.map((src, idx) => (
                  <div
                    key={src}
                    style={{
                      position: 'relative',
                      aspectRatio: '3/4',
                      overflow: 'hidden',
                      background: '#1a1d29',
                      border: '1px solid rgba(212,168,67,0.18)',
                    }}
                  >
                    <Image
                      src={src}
                      alt={`인증서 문서 ${idx + 1}`}
                      fill
                      sizes="(max-width: 900px) 50vw, 240px"
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
