'use client';

/**
 * 대라천 '참'침향 오일 캡슐 — 13섹션 효도선물 트랙 상세페이지.
 *
 * 자사몰 전용 풀스크롤 컴포넌트. 마켓플레이스 1080×18374 PNG 와 동일한
 * 카피·자산을 사용. 단일 소스: docs/detail-page-cham-oil-capsule-COPY.md
 *
 * 적용 조건: product.slug === 'daerachoen-cham-agarwood-oil-capsule'
 */

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Product, ProductVariant } from '@/data/products';
import styles from './DetailPageCham.module.css';

// ============================================================
// 자산 URL (마켓 PNG 와 동일 — zoellife.com 기존 Blob)
// ============================================================
const A = {
  // 제품 컷 (사용자 업로드)
  jar2: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/detail-cham-oil-capsule/jar2-59633b9c.png',
  boxFront: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/detail-cham-oil-capsule/box-front-5f65039f.png',
  boxBack: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/detail-cham-oil-capsule/box-back-a3ceba00.png',
  capsule: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/detail-cham-oil-capsule/capsule-02ed486a.png',
  // 농장 (기존 zoellife.com)
  farmHero: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/brand/twenty-year-proof-hero.png',
  farmHatinh: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1xedUAtI2JRIwwjyLKmHRV_laaOApjEbf.jpg',
  farmDongnai: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1t02AQvPDeUsqjOv-NcUpwiDWrXwZ6mgA.jpg',
  farmNhatrang: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1pCKsRdo3kix6XDUeFgdYHHomS3UJkLDX.jpg',
  farmPhuquoc: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1G7-mche4RToYvtfBkHyLZt_qVxJJtIAs.jpg',
  farmLamdong: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/media/lam-dong-aquilaria-cc0-1778166302982.jpg',
  // VIMECO + 농장 간판
  vimeco: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/factory-footage/vimeco-line-thumb-kFzwLaWlptKjs7cS1aKRiF7nvu9s48.jpg',
  // 공정 6단계
  proc1: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process-steps/ref-farm-01-planting.png',
  proc3: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process-steps/ref-farm-03-resin-induction.png',
  proc4: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process-steps/ref-farm-06-harvest.png',
  proc5: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process-steps/oil-09-%EA%B3%A0%EC%98%A8_%EC%A6%9D%EB%A5%98%EB%B2%95.png',
  proc6: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/pages/process-steps/farm-08-%EC%99%84%EC%A0%9C%ED%92%88.png',
} as const;

// ============================================================
// 인증서 12장 (brandStory.certificationsTab 와 동일)
// ============================================================
const CERTS: Array<{ name: string; category: string; certNumber: string; thumb: string }> = [
  { name: '유기농 제품 인증서', category: '유기농인증', certNumber: 'TQC.19.1082-B', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1S2u4KwYtRvoafIznbwBEf_JX_lNB0HRq.jpg' },
  { name: '유기농 원료 생산지역', category: '유기농인증', certNumber: 'TQC.19.1082-A', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/136xmgMvuaxhaqEJGvzm7GXqh9IzS3YvR.jpg' },
  { name: '수지유도제 특허', category: '특허', certNumber: '특허번호 12835', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1MUoMBCcX4ZZNNtLOH2fwgUv5pul1_Pgw.jpg' },
  { name: '야생동·식물 식재시설', category: '품질인증', certNumber: '00.38/2016/GCN', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1Qmq5y3WmvMt-8QbD-IRbQ3l757Px8HGT.jpg' },
  { name: 'ISO 22000:2018', category: 'ISO인증', certNumber: 'HA 616', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1GYua-DQynYN5kR_r_rrwDFWsYg5g57t0.jpg' },
  { name: 'VN OCOP 4-Star', category: '품질인증', certNumber: '결정 68/QĐ-UBND', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1iv8RgnBL5Xdt_qxzpgRcdxXtdH6vFRta.jpg' },
  { name: '미국 FDA 등록', category: '품질인증', certNumber: 'FDA 12466836220', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/pages/1777298375658-04e70813406b8d69b9d0.webp' },
  { name: 'ISO 13485:2016', category: 'ISO인증', certNumber: 'YT 562', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1nj020odeHZHfwdE_PCsQk4xT6rARu4EG.jpg' },
  { name: '베트남 황금브랜드 2025', category: '수상', certNumber: 'Vietnam Golden Brand', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1xpiojAGQAFwMOBoiudCNIwV_1ArK6a6A.jpg' },
  { name: 'AAR 품종확인서', category: '품질인증', certNumber: 'VIHECO 발행', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/pages/1777298508022-192490b725d892d8bf60.webp' },
  { name: 'HACCP', category: '품질인증', certNumber: 'TQC.05.1082', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/1_58va33_QyYOIH_wD0BDTpxCNEyrqiT5.jpg' },
  { name: '아시아 Top 10 브랜드', category: '수상', certNumber: 'Asia Excellent No. XI', thumb: 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/migrated/12W4V2LVy0Fj4biFyIyOu-GdkqEEbHhC_.jpg' },
];

const FARMS = [
  { ko: '하띤', vi: 'Hà Tĩnh', img: A.farmHatinh },
  { ko: '동나이', vi: 'Đồng Nai', img: A.farmDongnai },
  { ko: '냐짱', vi: 'Nha Trang', img: A.farmNhatrang },
  { ko: '푸꾸옥', vi: 'Phú Quốc', img: A.farmPhuquoc },
  { ko: '람동', vi: 'Lâm Đồng', img: A.farmLamdong },
];

// ============================================================
// 메인 컴포넌트
// ============================================================
interface Props {
  product: Product;
}

export default function DetailPageCham({ product }: Props) {
  const variants = product.variants ?? [];
  const v90 = variants.find((v) => v.id === 'v-cap-90') ?? variants[1];
  const v30 = variants.find((v) => v.id === 'v-cap-30') ?? variants[0];
  const [selected, setSelected] = useState<ProductVariant | undefined>(v90 ?? v30);

  return (
    <article className={styles.page}>
      {/* §1 HERO */}
      <Section n={1} id="hero" tag="HERO" className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroText}>
            <span className={styles.brandMark}>大羅天 · 대라천 ZOEL LIFE</span>
            <h1 className={styles.headline}>
              부모님께<br />25년을 드립니다
            </h1>
            <div className={styles.divider} />
            <p className={styles.subhead}>
              베트남 우리 농장에서 시작된 한 세대의 시간,<br />
              하루 한 알의 정성으로.
            </p>
            <div className={styles.priceCardRow}>
              <div className={styles.priceTile}>
                <span className={styles.priceTileLabel}>90캡슐 · 한 분기의 선물</span>
                <strong className={styles.priceTileValue}>하루 7,556원</strong>
              </div>
              <a href="#cta" className={styles.ctaPrimary}>
                선물 포장 함께 보기 →
              </a>
            </div>
            <p className={styles.certLine}>
              CITES · 식약처 공정서 · Organic · HACCP · OCOP 4-Star
            </p>
          </div>
          <div className={styles.heroImg}>
            <Image src={A.jar2} alt="대라천 침향 캡슐 기프트 박스" width={940} height={627} priority />
          </div>
        </div>
      </Section>

      {/* §2 PAIN */}
      <Section n={2} id="pain" tag="PAIN" className={styles.pain}>
        <h2 className={styles.h2}>이번에도, 또</h2>
        <div className={styles.divider} />
        <div className={styles.painBody}>
          <p>명절 전 마트에서, 백화점 9층 식품관에서, 결국 작년과 비슷한 상자를 들고 나옵니다.</p>
          <p>
            부모님은 늘 "있는 거 안 사도 돼" 라고 하시고,<br />
            식탁 옆 영양제 박스 두세 개는 절반쯤 남은 채 멈춰 있고,<br />
            외식 상품권은 서랍 어디쯤에 있습니다.
          </p>
          <p className={styles.painQuote}>
            무엇을 드려도 드린 것 같지가 않은 그 막막함.<br />
            선물이 아니라 시간을 드릴 수는 없을까,<br />
            한 번쯤 그런 생각을 해보셨을 겁니다.
          </p>
        </div>
      </Section>

      {/* §3 PROBLEM */}
      <Section n={3} id="problem" tag="PROBLEM" className={styles.problem}>
        <h2 className={styles.h2}>'침향' 두 글자,<br />정말 침향일까</h2>
        <div className={styles.divider} />
        <p className={styles.subhead}>
          시장의 침향 캡슐은 보통 3~5만원. 가격이 8배씩 차이 나는 이유는,<br />
          학명이 모호하거나 함량이 적혀 있지 않기 때문입니다.
        </p>
        <div className={styles.compareGrid}>
          <div className={styles.compareCardMuted}>
            <div className={styles.compareMark}>?</div>
            <h3>일반 침향 캡슐</h3>
            <dl className={styles.compareList}>
              <dt>학명</dt><dd>"침향 추출물"</dd>
              <dt>침향오일 함량</dt><dd>미공개</dd>
              <dt>숙성 기간</dt><dd>미공개</dd>
              <dt>CITES</dt><dd>미인증</dd>
              <dt>가격 (30일)</dt><dd>3~5만원</dd>
            </dl>
          </div>
          <div className={styles.compareCardAccent}>
            <div className={styles.compareImg}>
              <Image src={A.boxBack} alt="대라천 침향 박스 후면 라벨" width={280} height={395} />
            </div>
            <div className={styles.compareMark}>✓</div>
            <h3>대라천 '참'침향</h3>
            <dl className={styles.compareList}>
              <dt>학명</dt><dd><em>Aquilaria agallocha Roxburgh</em></dd>
              <dt>침향오일 함량</dt><dd>0.59%</dd>
              <dt>숙성 기간</dt><dd>25년</dd>
              <dt>CITES</dt><dd>인증</dd>
              <dt>가격 (30일)</dt><dd>249,000원</dd>
            </dl>
          </div>
        </div>
      </Section>

      {/* §4 STORY */}
      <Section n={4} id="story" tag="STORY" className={styles.story}>
        <p className={styles.lead}>침향은 비싼 것이 중요한 게 아닙니다.</p>
        <h2 className={styles.h2}>확인 가능한<br />침향인지가 중요합니다.</h2>
        <div className={styles.divider} />
        <p className={styles.subhead}>
          1999년, 베트남 다섯 지역에 침향나무를 심었습니다.<br />
          20년을 기다린 나무에만, 수지를 내립니다.
        </p>
        <div className={styles.storyHero}>
          <Image src={A.farmHero} alt="20년을 넘긴 침향나무 숲" width={952} height={620} />
          <p className={styles.storyCaption}>20년을 넘긴 침향나무 — 수지를 축적할 준비가 끝납니다.</p>
        </div>
        <h3 className={styles.h3}>5개 직영 농장 · 200헥타르 · 400만 그루</h3>
        <p className={styles.specSub}>— Aquilaria agallocha Roxburgh</p>
        <div className={styles.farmGrid}>
          {FARMS.map((f) => (
            <div key={f.vi} className={styles.farmCard}>
              <div className={styles.farmImg}>
                <Image src={f.img} alt={`${f.ko} 농장`} width={200} height={180} />
              </div>
              <div className={styles.farmLabel}>
                <strong>{f.ko}</strong>
                <small>{f.vi}</small>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* §5 SOLUTION */}
      <Section n={5} id="solution" tag="SOLUTION" className={styles.solution}>
        <h2 className={styles.h2}>대라천<br />'참'침향 오일 캡슐</h2>
        <div className={styles.divider} />
        <p className={styles.subhead}>
          25년 숙성 침향 수지 오일 0.59%,<br />
          한 알 507.5mg 에 담았습니다.
        </p>
        <div className={styles.solutionImgRow}>
          <Image src={A.boxFront} alt="대라천 침향 박스 정면" width={760} height={950} className={styles.solutionBox} />
          <div className={styles.solutionCaps}>
            <Image src={A.capsule} alt="" width={140} height={90} />
            <Image src={A.capsule} alt="" width={180} height={115} />
            <Image src={A.capsule} alt="" width={130} height={84} />
          </div>
        </div>
        <dl className={styles.specStrip}>
          <dt>학명</dt><dd><em>Aquilaria agallocha Roxburgh</em> (식약처 공정서 등재)</dd>
          <dt>침향오일</dt><dd>0.59% 함유</dd>
          <dt>한 알</dt><dd>507.5mg</dd>
          <dt>한 박스</dt><dd>30캡슐 · 15.225g</dd>
          <dt>제조</dt><dd>베트남 VIMECO (위탁)</dd>
          <dt>인증</dt><dd>Organic · HACCP · OCOP 4-Star · ISO 22000 · 식약처 검사적합</dd>
        </dl>
      </Section>

      {/* §6 HOW */}
      <Section n={6} id="how" tag="HOW" className={styles.how}>
        <h2 className={styles.h2}>25년이 한 알이 되기까지,<br />여섯 단계.</h2>
        <div className={styles.divider} />
        <div className={styles.howGrid}>
          {[
            { n: '01', t: '1999년 · 식재', d: '베트남 5개 직영 농장', img: A.proc1 },
            { n: '02', t: '2000~2024 · 자연 숙성', d: '25년에 걸친 수지 침착', img: A.proc1 },
            { n: '03', t: '2024~ · 수지 유도', d: '특허 #12835 수지유도제', img: A.proc3 },
            { n: '04', t: '채취', d: '손수 수간목 선별', img: A.proc4 },
            { n: '05', t: '고온 증류 72시간', d: 'VIMECO 위탁', img: A.proc5 },
            { n: '06', t: '한국 통관 · 기프트', d: '식약처 검사 후 출고', img: A.proc6 },
          ].map((s) => (
            <div key={s.n} className={styles.howCard}>
              <span className={styles.howBadge}>{s.n}</span>
              <div className={styles.howImg}>
                <Image src={s.img} alt={s.t} width={460} height={260} />
              </div>
              <strong>{s.t}</strong>
              <small>{s.d}</small>
            </div>
          ))}
        </div>
      </Section>

      {/* §7 PROOF */}
      <Section n={7} id="proof" tag="PROOF" className={styles.proof}>
        <h2 className={styles.h2}>증명할 수 없는 향은,<br />향이 아닙니다.</h2>
        <div className={styles.divider} />
        <p className={styles.subhead}>
          대라천 '참'침향이 받은 12개의 인증·특허·수상<br />
          <span className={styles.proofTagline}>
            Organic · ISO 22000 · OCOP 4-Star · FDA · HACCP · 베트남 황금브랜드 2025
          </span>
        </p>
        <div className={styles.certGrid}>
          {CERTS.map((c, i) => (
            <div key={i} className={styles.certCard}>
              <div className={styles.certImg}>
                <Image src={c.thumb} alt={c.name} width={220} height={310} />
              </div>
              <strong>{c.name}</strong>
              <span className={styles.certCat}>[{c.category}]</span>
              <small>{c.certNumber}</small>
            </div>
          ))}
        </div>
        <p className={styles.proofFooter}>
          <Link href="/brand-story#tab-1">모든 인증서 원본 확인 →</Link><br />
          <span className={styles.muted}>
            ※ 본 제품(DAERACHEON AGARWOOD ESSENTIAL OIL)은 OCOP 4-Star 인증서에 직접 명시
          </span>
        </p>
      </Section>

      {/* §8 AUTHORITY */}
      <Section n={8} id="authority" tag="AUTHORITY" className={styles.authority}>
        <h2 className={styles.h2}>베트남 정부가 인정한 농장,<br />VIMECO 가 만든 캡슐.</h2>
        <div className={styles.divider} />
        <div className={styles.authorityGrid}>
          <Image src={A.vimeco} alt="VIMECO 라인 — 大羅天沈香 배너 앞 작업자" width={480} height={853} className={styles.authorityHero} />
          <div className={styles.authorityBadges}>
            <div className={styles.badgePrimary}>
              <strong>베트남 황금브랜드 2025</strong>
              <small>VN Agriculture Golden Brand</small>
            </div>
            <div className={styles.badgeSecondary}>
              <strong>아시아 Top 10 브랜드 2025</strong>
              <small>Asia Excellent Brand No. XI</small>
            </div>
            <div className={styles.authorityBody}>
              <p><strong>VIMECO Central Pharmaceutical Joint Stock Company.</strong></p>
              <p>베트남 중앙 의약 합자회사. 한국 식약처와 거래해 온 정식 위탁 파트너.</p>
              <p>농장은 베트남 정부 OCOP (One Commune One Product) 4-Star 등급 인증.</p>
              <p>대라천 5개 직영 농장 모두 이 등급을 통과했습니다.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* §9 BENEFITS */}
      <Section n={9} id="benefits" tag="BENEFITS" className={styles.benefits}>
        <h2 className={styles.h2}>매일 한 알, 25년의 풍미.</h2>
        <div className={styles.divider} />
        <p className={styles.subhead}>
          약처럼 무엇을 말씀드리지 않습니다. 부모님이 매일 누리실 경험 다섯 가지입니다.
        </p>
        <ol className={styles.benefitsList}>
          {[
            { n: '하나', t: '식후의 짧은 의례', d: '하루 한 알, 한 달이면 30번의 작은 의식.' },
            { n: '둘', t: '캡슐을 열면 배어나오는 향', d: '0.59%의 침향오일에서 전해지는 깊은 풍미.' },
            { n: '셋', t: '한국 식약처 공정서 학명', d: '"진짜 침향이에요?" 에 한 줄로 답할 안심.' },
            { n: '넷', t: '25년이라는 시간을 손에', d: '1999년 베트남에 심긴 나무가 부모님 손에 닿음.' },
            { n: '다섯', t: '30일 = 한 달의 정성', d: '90캡슐이면 한 분기. 시간의 길이 = 정성의 길이.' },
          ].map((b) => (
            <li key={b.n}>
              <span className={styles.benefitBadge}>{b.n}</span>
              <div>
                <strong>{b.t}</strong>
                <p>{b.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* §10 RISK */}
      <Section n={10} id="risk" tag="RISK" className={styles.risk}>
        <h2 className={styles.h2}>혹시 마음에 들지 않으시면.</h2>
        <div className={styles.divider} />
        <p className={styles.riskQuote}>"괜찮습니다. 다시 가져오세요."</p>
        <div className={styles.riskBlocks}>
          <div>
            <h4>미개봉 30일 무조건 환불</h4>
            <p>드린 박스를 부모님이 부담스러워 하시면 자녀분께서 다시 들고 오셔도 됩니다. 배송비는 저희가 부담합니다.</p>
          </div>
          <div>
            <h4>처음 드시는 분께</h4>
            <p>침향은 향이 강한 식품입니다. 처음에는 캡슐 하나에서 향이 진하다고 느끼실 수 있습니다. 이 향이 25년 숙성의 특징입니다.</p>
          </div>
          <div>
            <h4>12세 미만 · 임산부 · 수유부</h4>
            <p>일반식품이지만, 안전을 위해 섭취를 권장하지 않습니다.</p>
          </div>
        </div>
      </Section>

      {/* §11 COMPARE */}
      <Section n={11} id="compare" tag="COMPARE" className={styles.compare}>
        <h2 className={styles.h2}>왜 24만 9천원인지,<br />한 번에 보시도록.</h2>
        <div className={styles.divider} />
        <p className={styles.subhead}>
          시장의 침향 캡슐은 보통 3~5만원. 약 8배 차이가 나는 이유를 표로 정리했습니다.
        </p>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th>항목</th>
              <th>일반 침향 캡슐</th>
              <th>대라천 '참'침향</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['학명 표기', '"침향 추출물"', 'Aquilaria agallocha Roxburgh'],
              ['침향오일 함량', '미공개', '0.59%'],
              ['숙성 기간', '미공개', '25년'],
              ['CITES 협약', '미인증', '인증'],
              ['식약처 등재 학명', '미사용', '공정서 학명 사용'],
              ['자가품질검사', '미공개', '적합'],
              ['제조', '다양', 'VIMECO 베트남'],
              ['가격 (30일)', '3~5만원', '249,000원'],
              ['하루 단가', '1,000~1,700원', '8,300원 (90일이면 7,556원)'],
            ].map(([k, l, r]) => (
              <tr key={k}><td>{k}</td><td>{l}</td><td>{r}</td></tr>
            ))}
          </tbody>
        </table>
        <p className={styles.compareConclusion}>
          8배 비싼 것이 아니라,<br />
          <strong>없던 25년이 있는 침향</strong>입니다.
        </p>
      </Section>

      {/* §12 FILTER */}
      <Section n={12} id="filter" tag="FILTER" className={styles.filter}>
        <h2 className={styles.h2}>어떤 분께 보내시나요.</h2>
        <div className={styles.divider} />
        <p className={styles.subhead}>받으실 분에 따라 권해드리는 구성이 다릅니다.</p>
        <div className={styles.filterGrid}>
          {[
            { who: '어머니께', desc: '늘 자식 끼니부터 챙기시는 분', rec: '30캡슐 · 처음 한 달' },
            { who: '아버지께', desc: '"괜찮다"가 입버릇이신 분', rec: '90캡슐 · 자녀가 직접 봐드릴 한 분기' },
            { who: '장인·장모께', desc: '무엇을 드려야 할지 가장 막막한 분', rec: '90캡슐 + 기프트 포장' },
            { who: '시부모께', desc: '이미 여러 선물이 오갔을 분', rec: '90캡슐 + 인증서 동봉' },
          ].map((r) => (
            <div key={r.who} className={styles.filterCard}>
              <div className={styles.filterIcon}>
                <div className={styles.silhouette} />
              </div>
              <strong>{r.who}</strong>
              <p>{r.desc}</p>
              <div className={styles.filterRec}>
                <span>권장 →</span>
                <strong>{r.rec}</strong>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* §13 CTA */}
      <Section n={13} id="cta" tag="CTA" className={styles.cta}>
        <h2 className={styles.h2}>한 달의 정성,<br />혹은 한 분기의 정성.</h2>
        <div className={styles.divider} />
        <p className={styles.subhead}>받으실 분과 보내드릴 기간에 따라 두 가지 옵션이 있습니다.</p>
        <div className={styles.ctaCards}>
          {/* 30캡슐 카드 */}
          <button
            type="button"
            className={`${styles.ctaCard} ${selected?.id === v30?.id ? styles.ctaCardActive : ''}`}
            onClick={() => v30 && setSelected(v30)}
          >
            <div className={styles.ctaImg}>
              <Image src={A.boxFront} alt="30캡슐" width={300} height={400} />
            </div>
            <strong>30캡슐</strong>
            <small>처음 드리는 한 달</small>
            <hr />
            <p>한 박스 · 30일 분 · 15.225g</p>
            <div className={styles.ctaPrice}>{v30?.priceDisplay ?? '249,000원'}</div>
            <small className={styles.ctaPerDay}>하루 8,300원</small>
          </button>

          {/* 90캡슐 카드 (권장) */}
          <button
            type="button"
            className={`${styles.ctaCardPrimary} ${selected?.id === v90?.id ? styles.ctaCardActive : ''}`}
            onClick={() => v90 && setSelected(v90)}
          >
            <span className={styles.ctaBadge}>권장</span>
            <div className={styles.ctaImg}>
              <Image src={A.boxFront} alt="90캡슐 세트" width={300} height={400} />
            </div>
            <strong>90캡슐 세트</strong>
            <small>한 분기의 정성</small>
            <hr />
            <p>세 박스 · 90일 분 · 45.675g</p>
            <div className={styles.ctaPrice}>{v90?.priceDisplay ?? '680,000원'}</div>
            <small className={styles.ctaPerDay}>하루 7,556원 · 11% 절감</small>
          </button>
        </div>

        <div className={styles.ctaActions}>
          <Link href="/company#contact" className={styles.ctaBuyPrimary}>
            {selected?.label ?? '90캡슐 세트'} 보내드리기  →
          </Link>
          <Link href="/home-shopping" className={styles.ctaBuySecondary}>
            홈쇼핑 방송 확인
          </Link>
        </div>

        <p className={styles.ctaFooter}>
          선물 포장 무료 · 정성 카드 동봉 · 미개봉 30일 환불 · 평일 14시 이전 주문 당일 출고
        </p>
      </Section>
    </article>
  );
}

// ============================================================
// 섹션 래퍼
// ============================================================
function Section({
  n, id, tag, className, children,
}: { n: number; id: string; tag: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`${styles.section} ${className ?? ''}`}>
      <div className={styles.sectionInner}>
        <span className={styles.sectionTag}>SECTION {String(n).padStart(2, '0')} / 13 · {tag}</span>
        {children}
      </div>
    </section>
  );
}
