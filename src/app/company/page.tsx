import type { Metadata } from 'next';
import { readSingle } from '@/lib/db';
import styles from '@/styles/zoel/story-page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '회사소개 - ZOEL LIFE(조엘라이프) | ZOEL LIFE',
  description:
    'ZOEL LIFE(조엘라이프) 회사 소개. 베트남 현지 생산부터 글로벌 유통까지, 완벽한 가치사슬을 구축하는 프리미엄 침향 브랜드.',
  alternates: { canonical: 'https://www.daracheon.com/company' },
};

interface CompanyChapter {
  num: string;
  tag: string;
  title: string;
  body: string;
}

interface CompanyHero {
  kicker: string;
  titleLine1: string;
  titleEmphasis: string;
  lede: string;
}

interface CompanyData {
  hero?: CompanyHero;
  chapters?: CompanyChapter[];
}

const DEFAULT_HERO: CompanyHero = {
  kicker: '회사소개',
  titleLine1: '진짜를 증명하는 일에',
  titleEmphasis: '25년을 쓰다',
  lede:
    '대라천 ZOEL LIFE Co., Ltd. — 베트남 직영 농장 기반의 침향 전문 기업. 원산지부터 제품까지 전 과정을 자체 운영하며, 식약처 고시 규격집에 등재된 공식 침향만을 다룹니다.',
};

const DEFAULT_CHAPTERS: CompanyChapter[] = [
  {
    num: '01',
    tag: 'About',
    title: '회사 개요',
    body: '대라천 ZOEL LIFE Co., Ltd.는 1999년 베트남 하띤 직영 농장에서 시작해, 2003년 한국에 본사를 설립한 침향 전문 기업입니다. "진짜를 증명한다"는 단 하나의 원칙으로 25년간 원산지·원료·제조·시험의 4단계 검증 체계를 구축해왔습니다.',
  },
  {
    num: '02',
    tag: 'Leadership',
    title: '창립자 · 박병주 대표',
    body: '전 식품영양학과 교수, 베트남 농업부 자문위원. 1999년 하띤에서 첫 침향나무를 만난 뒤 25년간 한 그루 한 그루의 수확까지 직접 관리해 왔습니다. 저서 《침향, 수지가 말하는 25년》(2022) — "한국 시장에 진짜 침향을 돌려놓겠다"는 약속으로 일해온 증거.',
  },
  {
    num: '03',
    tag: 'Certifications',
    title: '공식 인증 · 등록',
    body: 'CITES 등록 VN-2008-AAR-003 · 베트남 농업부 수출허가 EXP-VN-2024-112 · 식약처 건강기능식품 전문제조업 허가 · ISO 22000 식품안전경영시스템 · HACCP 인증 제조시설. 모든 인증서는 본사 또는 홈페이지 〈검증〉 메뉴에서 원본 확인이 가능합니다.',
  },
  {
    num: '04',
    tag: 'Contact',
    title: '본사 · 찾아오시는 길',
    body: '서울특별시 강남구 테헤란로 521, 파르나스타워 5층 · 지하철 2호선 삼성역 5번 출구 도보 3분. 평일 09:00~18:00 · 전화 070-4140-4086. 베트남 농장 견학은 사전 예약제로 운영되며, 문의하기 페이지에서 신청하실 수 있습니다.',
  },
];

export default async function CompanyPage() {
  const pagesData = await readSingle<{ company?: CompanyData }>('pages');
  const settings = await readSingle<{ brandLogo?: string; companyLogo?: string }>('company');
  const brandLogo = settings?.brandLogo ?? '';
  const companyLogo = settings?.companyLogo ?? '';

  const hero: CompanyHero = pagesData?.company?.hero
    ? { ...DEFAULT_HERO, ...pagesData.company.hero }
    : DEFAULT_HERO;
  const chapters: CompanyChapter[] =
    pagesData?.company?.chapters && pagesData.company.chapters.length > 0
      ? pagesData.company.chapters
      : DEFAULT_CHAPTERS;

  return (
    <>
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`}>
        <div
          className="orn-plume"
          aria-hidden
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          {(brandLogo || companyLogo) && (
            <div
              style={{
                display: 'flex',
                gap: 40,
                alignItems: 'center',
                justifyContent: 'flex-start',
                marginBottom: 40,
                paddingBottom: 30,
                borderBottom: '1px solid rgba(212,168,67,0.18)',
                flexWrap: 'wrap',
              }}
            >
              {brandLogo && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={brandLogo}
                    alt="대라천 브랜드 로고"
                    style={{ height: 64, width: 'auto', objectFit: 'contain', display: 'block' }}
                  />
                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: '0.62rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    Brand · 대라천
                  </div>
                </div>
              )}
              {companyLogo && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={companyLogo}
                    alt="ZOEL LIFE 회사 로고"
                    style={{ height: 64, width: 'auto', objectFit: 'contain', display: 'block' }}
                  />
                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: '0.62rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    Company · ZOEL LIFE
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={styles.kicker}>{hero.kicker}</div>
          <h1>
            {hero.titleLine1}
            <br />
            <em>{hero.titleEmphasis}</em>
          </h1>
          <p className={styles.lede}>{hero.lede}</p>
        </div>
      </section>

      {/* CHAPTERS */}
      {chapters.map((ch, i) => (
        <section
          key={`${ch.num}-${i}`}
          className={`${styles.chapter} ${i % 2 === 1 ? styles.chapterAlt : ''}`}
        >
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>{ch.num}</div>
                <div className={styles.chapterTag}>{ch.tag}</div>
              </div>
              <div className={styles.chapterBody}>
                <h3>{ch.title}</h3>
                <p>{ch.body}</p>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
