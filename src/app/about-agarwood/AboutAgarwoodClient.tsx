'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/zoel/story-page.module.css';
import StickyTabBar from '@/components/layout/StickyTabBar';
import { useHashTab, setTabHash } from '@/lib/use-hash-tab';
import type { AboutAgarwoodData, OfficialSourcesSection, AuthenticityTab, UsageTab, Paper, Scripture } from './page';

// 스크롤 기반 reveal 애니메이션 제거 — 71곳의 IntersectionObserver가 랙을 유발하던 문제 해결.
// 외부 호환을 위해 동일 시그니처를 유지하지만 단순 wrapper 로 동작.
function RevealOnScroll({ children }: { children: ReactNode; direction?: string; delay?: number; className?: string }) {
  return <>{children}</>;
}

/**
 * 학명(Latin scientific name) 및 괄호 음역을 한 덩어리로 유지.
 * word-break: keep-all 만으로는 영문 단어 사이 공백에서의 줄바꿈을
 * 막을 수 없으므로 white-space: nowrap 인라인 span 으로 처리.
 * 패턴: 대문자 시작 두 단어 이상 + 선택적으로 뒤따르는 (한국어 음역)
 */
function renderWithNowrap(text: string): ReactNode {
  const re = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s*\([^)]+\))?)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <span key={match.index} style={{ whiteSpace: 'nowrap' }}>
        {match[0]}
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 1 ? nodes : text;
}

/**
 * 본문 안의 "침향" 단어를 골드(var(--accent))로 강조.
 * 한자 沈香 도 함께 처리. 복합어("침향목", "침향나무" 등)에서도 "침향" 부분만 강조.
 */
function highlightAgarwood(text: string): ReactNode {
  const re = /(침향|沈香)/g;
  const parts = text.split(re);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part === '침향' || part === '沈香' ? (
      <span key={i} style={{ color: 'var(--accent)', fontWeight: 500 }}>{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/**
 * `*...*` 마커는 별표만 떼어내고 본문 폰트 그대로 렌더 (골드 강조 없음).
 * 학명(라틴 두 단어+한국어 음역 괄호) 부분은 renderWithNowrap 로 nowrap 유지.
 */
function renderMarkedNowrap(text: string, keyPrefix = 'mn'): ReactNode {
  const out: ReactNode[] = [];
  let remaining = text;
  let idx = 0;
  while (remaining.length > 0) {
    const start = remaining.indexOf('*');
    if (start === -1) {
      out.push(<span key={`${keyPrefix}-${idx++}`}>{renderWithNowrap(remaining)}</span>);
      break;
    }
    const end = remaining.indexOf('*', start + 1);
    if (end === -1) {
      out.push(<span key={`${keyPrefix}-${idx++}`}>{renderWithNowrap(remaining)}</span>);
      break;
    }
    if (start > 0) out.push(<span key={`${keyPrefix}-${idx++}`}>{renderWithNowrap(remaining.slice(0, start))}</span>);
    out.push(
      <span key={`${keyPrefix}-${idx++}`}>{renderWithNowrap(remaining.slice(start + 1, end))}</span>,
    );
    remaining = remaining.slice(end + 1);
  }
  return out;
}

/**
 * *...* 마커 → 골드 <em>, \n → <br /> 로 렌더링.
 * 홈에서 옮긴 Solution CTA 의 title 강조용.
 */
function renderMarkedGold(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts: ReactNode[] = [];
    let remaining = line;
    let idx = 0;
    while (remaining.length > 0) {
      const start = remaining.indexOf('*');
      if (start === -1) {
        parts.push(remaining);
        break;
      }
      const end = remaining.indexOf('*', start + 1);
      if (end === -1) {
        parts.push(remaining);
        break;
      }
      if (start > 0) parts.push(remaining.slice(0, start));
      parts.push(
        <em
          key={`em-${li}-${idx++}`}
          style={{
            color: 'var(--accent)',
            fontStyle: 'normal',
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 400,
          }}
        >
          {remaining.slice(start + 1, end)}
        </em>
      );
      remaining = remaining.slice(end + 1);
    }
    return (
      <span key={`l-${li}`}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}


const DEFAULT_AUTHENTICITY: AuthenticityTab = {
  subtitle: '진짜가 아닌 가짜가 판치는 시장, 이 세 가지로 반드시 확인하세요.',
  intro: '한국에도 많은 침향 제품들이 소개됐지만, 중요한 건 오리지널에 대한 정의입니다. 가짜가 아닌 진짜를 찾아야 하는데 이에 대한 기준이 모호한 것이 현실입니다. 진짜 침향은 크게 세 가지 방법 — 학명, 산지, 증빙문서 — 으로 확인할 수 있습니다.',
  check01Title: '학명을 따져봐야 한다',
  check01Body: '대한민국 정부의 공식문서 4곳에서 동일하게 등록된 침향은 Aquilaria Agallocha Roxburgh (아퀼라리아 아갈로차 록스버그)입니다.',
  check01Sources: [
    { label: '대한민국약전외한약(생약)규격집', value: '침향의 학명을 Aquilaria Agallocha Roxburgh로 명확히 정의.' },
    { label: '식약처 식품공전', value: '식용 가능한 침향의 학명 2종 — Aquilaria Agallocha Roxburgh / Aquilaria Malaccensis Lam.' },
    { label: '식약처 한약재 관능검사 해설서', value: '침향나무를 Aquilaria Agallocha Roxburgh로 정의.' },
    { label: '한국한의학연구원 한약자원연구센터', value: '침향을 상록교목 Aquilaria Agallocha Roxburgh로 설명.' },
  ],
  check01Summary: {
    line1: 'VIHECO 중앙제약 성분명세서에는 **Aquilaria agallocha Roxburgh** 학명이 명시되어 있습니다.',
    line2: '제약 등급 원료로 정식 등록된 침향임을 증명하는 공식 문서입니다.',
  },
  check02Title: '산지를 따져봐야 한다',
  check02Body: '고문헌들이 기록한 최고 산지는 역사적으로 베트남산이 가장 높은 품질을 인정받고 있으며, 현재도 가장 비싸게 거래됩니다.',
  check02QuoteSource: '향승(香乘) · 명대 1611년',
  check02QuoteBody: '명대의 주가조가 향에 관해 기록한 책. 침향의 품질을 산지별로 상세히 기록하며 최상품은 진랍(眞臘), 상품은 점성(占城)으로 구분했는데 이는 당시 베트남 중부지역을 말합니다. 이 외에도 교지(交趾), 안남(安南) 등 베트남 원산지를 최상품으로 기록합니다.',
  check02EraIntro: "역사적 기록에서는 *'베트남산'*을 최고로 여기고 있습니다. 수천 년 동안 이어진 문헌들이 그 가치를 증명하고 있습니다.",
  check02Eras: [
    { era: '당나라 시대', body: '침향의 주요 산지를 교지, 임읍으로 기록하고 있는데 이 지역은 현재의 베트남에 해당합니다.' },
    { era: '송나라 시대', body: '교지, 안남, 점성 등 지금의 베트남 지역이 주요 산지로 기록되어 있습니다.' },
    { era: '원나라 시대', body: '안남 지역으로 현재의 베트남에 해당합니다.' },
    { era: '명나라 시대', body: "'대명회전'에서도 역시 안남과 점성이 핵심 산지로 등장합니다." },
    { era: "'향승'", body: '진납을 최상으로, 점성을 그 다음으로 평하고 있는데 이 역시 모두 베트남 지역권입니다.' },
    { era: '조선 시대', body: "조선의 기록에서는 청나라 시대에 베트남이 침향 생산과 무역을 주도했으며 베트남산이 '정품'으로 인정받았다는 내용까지 확인됩니다." },
  ],
  check02EraOutro: '이처럼 시대를 거슬러 올라가도, 그리고 여러 나라의 기록을 살펴봐도 공통적으로 등장하는 중심지는 바로 *지금의 베트남 지역*입니다. 그래서 오늘날에도 베트남산 침향이 높은 가치를 인정받고 있는 것입니다.',
  check03Title: '문서를 따져봐야 한다',
  check03Body: '진짜 침향이라면 아래 증빙 서류를 갖추고 있어야 합니다. 특히 CITES 인증서는 합법 원료 100% 보증 — 가짜 침향은 CITES 통과 불가능합니다.',
  check03Docs: [
    { doc: '원산지 증명서', desc: '베트남 정통 산지임을 확인', highlight: false },
    { doc: '정식 수입 증빙 서류', desc: '정상적인 통관·검역·수입 확인', highlight: false },
    { doc: '유기농 인증서', desc: '식용 가능 여부, 농약·화학물질 관리 확인', highlight: false },
    { doc: 'CITES 인증서', desc: '합법 원료 100% 보증. 가짜 침향은 통과 불가능', highlight: true },
    { doc: '성분검사서', desc: '실제 침향 성분 함량 확인', highlight: false },
    { doc: '유해물질성적서', desc: '중금속·잔류 농약·미생물 등 확인', highlight: false },
  ],
};

// 경전에 실린 침향 — 소스: "불교,성경속 침향.docx" (대라천 자료, 2026-04-17)
// 인용문은 문서 원문을 그대로 보존. admin 에서 scriptures 를 채우면 그 값이 우선되고,
// 비어 있을 때만 이 기본값이 노출된다.
const DEFAULT_SCRIPTURES: Scripture[] = [
  {
    title: '민수기 24:5-6',
    author: '구약성경',
    year: '성경:구약',
    topic: '여호와께서 심으신 침향목',
    description:
      '"야곱이여 네 장막들이, 이스라엘이여 네 거처들이 어찌 그리 아름다운고, 그 벌어짐이 골짜기 같고 강가의 동산 같으며 여호와께서 심으신 침향목들 같고 물가의 백향목들 같도다."',
  },
  {
    title: '시편 45:8',
    author: '구약성경',
    year: '성경:구약',
    topic: '왕의 옷 향기',
    description:
      '"왕의 모든 옷은 몰약과 침향과 육계의 향기가 있으며 상아궁에서 나오는 현악은 왕을 즐겁게 하도다."',
  },
  {
    title: '잠언 7:16-17',
    author: '구약성경',
    year: '성경:구약',
    topic: '침상에 뿌린 침향',
    description:
      '"내 침상에는 요와 애굽의 무늬 있는 이불을 폈고 몰약과 침향과 계피를 뿌렸노라."',
  },
  {
    title: '아가 4:13-14',
    author: '구약성경',
    year: '성경:구약',
    topic: '동산의 각종 향 품',
    description:
      '"네게서 나는 것은 석류나무와 각종 아름다운 과수와 고벨화와 나도풀과 나도와 번홍화와 창포와 계수와 각종 유향과 몰약과 침향과 모든 귀한 향 품이요."',
  },
  {
    title: '요한복음 19:39',
    author: '신약성경',
    year: '성경:신약',
    topic: '예수님 장사에 침향',
    description:
      '"일찍이 예수께 밤에 찾아왔던 니고데모도 몰약과 침향 섞은 것을 백 리트라쯤 가지고 온지라." 예수님이 돌아가신 뒤 시체를 모셔 장사 지내는 데 침향이 등장한다. 이는 침향의 살균과 방부 작용을 뒷받침하며, 실제로 침향은 이집트 미라에서도 주검 보존에 사용했다.',
  },
  {
    title: '약사경 (藥師經)',
    author: '약사여래신앙 경전',
    year: '불교 경전',
    topic: '수행과 공양의 정향',
    description:
      '약사경의 여러 의식서에서 수행 전후 정향으로 침향을 사용한다고 기록되어 있다. 공양을 올릴 때, 최상의 향료로 침향을 사용하니, 마음을 정화하고 병을 치유한다. 향기로운 침향은 수행자의 몸과 마음을 맑게 하는 수단으로 여겨졌으며, 침향은 의식 속에서 정화·치유·명상 집중을 돕는 상징적 향료로 사용되어 특히 약사여래신앙에서 중요한 역할을 한다.',
  },
  {
    title: '법화경 (法華經) — 제19품 설법행자품',
    author: '묘법연화경 (妙法蓮華經)',
    year: '불교 경전',
    topic: '천향(天香)으로의 상징',
    description:
      '"수지호지차경자, 수재세간, 유능변기천향(受持護持此經者, 雖在世間, 猶能辨其天香)" — 이 경을 받들고 지니는 이는, 비록 세상에 있으나 하늘의 향기(天香)를 분별할 수 있으니라. 이 경을 몸에 지니고 실천하는 이는 이 땅에 있으면서도 천국의 고귀한 향기, 즉 침향과 같은 신성한 향기를 맡을 수 있다는 의미로, 침향은 단순한 향료를 넘어 경전을 수행·수호하는 자의 정성을 상징하며 공덕과 성취를 은유하는 신성한 요소로 사용되었다.',
  },
  {
    title: '화엄계경 (華嚴戒經) 및 관련 주석',
    author: '화엄 수행 의례서',
    year: '불교 경전',
    topic: '공덕 회향(回向)의 상징',
    description:
      '화엄계경은 화엄 수행자의 계율과 공덕 회향을 강조한다. 경전 본문에 구체적인 향료 이름이 등장하지 않더라도, 주석과 의례서에서는 침향이 수행 도구로 설명된다. 제사·계향(戒香) 의식에서 침향이 사용되며, 그 연기로 자신의 공덕을 회향하는 상징적 행위로 보인다. 침향은 정성과 공덕의 향기를 상징하며, 이를 피움으로써 수행자는 자신의 공덕을 중생에게 회향하는 의식을 수행한다.',
  },
  {
    title: '침향 송(頌) — 전통 게송',
    author: '대라천 자료집',
    year: '전통 게송',
    topic: '침향에 깃든 선(禪)의 정서',
    description:
      '受創之木 獨立孤峙 — 상처 입은 나무가 외로이 홀로 서니, 傷中生露 滴香成寶 — 상처에서 흐른 수액이 향이 되어 산중 향 중에 보물이 되었다. 生中之死 死中之生, 是謂沈香 — 살아 있음 속의 죽음이요, 죽음 속의 생명이기에 그것이 바로 침향이라 한다. 久生香氣 入人入定 — 불 속에서 피어나는 향연은 사람을 명상으로 이끌고, 一香萬靜 無聲之樂 — 하나의 향기가 만 가지 고요를 부르고 소리 없는 기쁨을 자아내며, 念觀觀音 隨香入定 — 그 향을 따라 관세음보살을 염하면 향 속에 고요함이 깃든다. 唵嘛呢叭咪吽 — 옴 마니반메훔을 염하니, 自滅業障 消盡欲染 — 스스로의 업장이 사라져 욕망의 불꽃이 잦아들어, 氣淸心靜 沈香悠然 — 기운은 맑고 마음은 고요해 침향에 젖어 속세를 잊게 한다.',
  },
];

const DEFAULT_USAGE: UsageTab = {
  tag: 'Dosage & Usage · 복용법',
  title: '복용 및 사용법',
  subtitle: '침향 제품별 올바른 복용법과 사용 방법을 안내합니다.',
  introLines: [
    '침향의 하루 섭취량은 아퀼라리아 아갈로차 록스버그(AAR)에서 추출한 정품일 경우, 오일 기준 3mg, 분말 기준 0.5g이고, 오일은 아침 공복에, 분말은 저녁에 복용하시는 게 좋습니다.',
    '채취된 침향은 그 모양 그대로 사용되는 게 가장 좋기에, 고객의 요청이 있기 전까지는 형태를 변형시키거나 가공하지 않습니다.',
    "대라천 '참'침향은 제품이력제를 도입, 생산부터 유통까지 품질을 보증합니다.",
  ],
  items: [
    { product: '침향캡슐', instruction: '1일 1회 아침식사 후 1캡슐(1일 적정 침향오일 복용량은 3mg)을 권장합니다.' },
    { product: '침향오일(수지)', instruction: '1일 1~2회 손목이나 인중 또는 목 뒷부분에 발라주거나 소량을 복용합니다.' },
    { product: '침향수', instruction: '1일 1회 20ml씩 음용하거나 가습기 등을 이용해 취수 및 취향해도 좋습니다.' },
    { product: '침향스틱', instruction: "조금씩 조각 내 온열판에 올려 취향하시고, 그런 후 '차'처럼 다시 사용해도 좋습니다." },
    { product: '침향차', instruction: '1일 1회 25~30개의 조각을 뜨거운 물에 우려 마십니다. 재탕 삼탕해도 좋습니다. (뜨거운 물을 붓고 처음 올라오는 향은 반드시 취향하시길 권장합니다)' },
    { product: '침향단', instruction: '하루 1회 저녁식사 후 침향단을 천천히 씹어서 복용합니다.' },
    { product: '침향선향', instruction: '취향실을 정해 선향을 충분히 발향시키고 약 30분 후에 들어가 명상하며 취향합니다.' },
  ],
};

interface Props {
  data: AboutAgarwoodData | null;
}

const TABS = ['침향이란?', '진짜 침향 구별', '경전에 실린 침향', '문헌에 실린 침향', '논문에 실린 침향', '복용 및 사용법'] as const;

export default function AboutAgarwoodClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [hoveredDefinitionBox, setHoveredDefinitionBox] = useState<boolean>(false);
  const [paperSummaryOpen, setPaperSummaryOpen] = useState<Paper | null>(null);

  useHashTab(
    (k) => setActiveTab(Number(k)),
    (k) => /^[0-9]+$/.test(k) && Number(k) >= 0 && Number(k) < TABS.length
  );

  // 모달 열린 동안 body 스크롤 락 + ESC 닫기
  useEffect(() => {
    if (!paperSummaryOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPaperSummaryOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [paperSummaryOpen]);

  const hero = data?.hero;
  const definition = data?.definitionSection;
  const formationSteps = data?.formationSteps ?? [];
  const specialReasons = data?.specialReasons ?? [];
  const benefits = data?.benefits ?? [];
  const dosageSection = data?.dosageSection;
  const literatures = data?.literatures ?? [];
  const scriptures: Scripture[] = data?.scriptures && data.scriptures.length > 0 ? data.scriptures : DEFAULT_SCRIPTURES;
  const papers = data?.papers ?? [];
  const usageTab = data?.usageTab ?? DEFAULT_USAGE;
  const officialSources = data?.officialSourcesSection;
  const auth = data?.authenticityTab ?? DEFAULT_AUTHENTICITY;
  const tabHeroes = data?.tabHeroes ?? {};

  return (
    <>
      {/* HERO */}
      <section className={`${styles.hero} orn-grain orn-grain--faint`} style={{ paddingBottom: '40px' }}>
        {hero?.heroImage && (
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
          style={{ right: '4%', bottom: '-80px', opacity: 0.42, zIndex: 1 }}
        />
        <div className={styles.wrap}>
          <div className={styles.kicker}>{hero?.sectionTag ?? '침향 이야기 · Agarwood Story'}</div>
          <div className={styles.heroMain}>
            <h1>
              {hero?.titleKr ?? '이젠 진짜 침향,'}
              <br />
              <em>{hero?.titleEn ?? '학명부터 확인하세요'}</em>
            </h1>
            <p className={styles.lede}>
              {renderWithNowrap(
                hero?.subtitle ??
                  "식약처 고시 '대한민국약전외한약(생약)규격집'과 '식약처 식품공전'. 두 곳에 공식 등재된 바로 그 침향 — Aquilaria Agallocha Roxburgh."
              )}
            </p>
          </div>
        </div>
      </section>

      <StickyTabBar
        tabs={TABS.map((label, i) => ({ key: String(i), label }))}
        activeKey={String(activeTab)}
        onChange={(k) => {
          setActiveTab(Number(k));
          setTabHash(k);
        }}
      />

      {/* ════════════ TAB 0: 침향이란? ════════════ */}
      {activeTab === 0 && (
        <>
          {/* Chapter 01 — Definition */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>01</div>
                  <div className={styles.chapterTag}>Chapter I · Definition</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>{definition?.title ?? '침향(沈香)이란 무엇인가?'}</h3>
                  </RevealOnScroll>
                  <RevealOnScroll delay={100}>
                    <p className={styles.chapterSubtitle}>
                      {definition?.subtitle ?? '자연이 수십 년에 걸쳐 빚어낸 신비의 향, 물에 가라앉는 귀한 향나무 (세계 3대 향 중 하나)'}
                    </p>
                  </RevealOnScroll>
                  {tabHeroes.tab0 && (
                    <RevealOnScroll delay={150}>
                      <div
                        style={{
                          marginTop: 30,
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '16/9',
                          border: '1px solid rgba(212,168,67,0.2)',
                          overflow: 'hidden',
                        }}
                      >
                        <Image
                          src={tabHeroes.tab0}
                          alt="침향이란? — 상징 이미지"
                          fill
                          sizes="(max-width: 768px) 100vw, 880px"
                          style={{ objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    </RevealOnScroll>
                  )}
                  <RevealOnScroll delay={200}>
                    <p>
                      {definition?.body ??
                        '침향(沈香, Agarwood)은 팥꽃나무과 Aquilaria 나무가 외부 상처나 곰팡이 감염에 맞서 분비한 수지(樹脂)가 수십 년간 나무 속에 쌓여 굳은 향목(香木)입니다.'}
                    </p>
                  </RevealOnScroll>
                  {definition?.images && definition.images.filter(Boolean).length > 0 && (
                    <RevealOnScroll delay={250}>
                      <div
                        style={{
                          marginTop: 26,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: 14,
                        }}
                      >
                        {definition.images.filter(Boolean).map((src, i) => (
                          <div
                            key={src + i}
                            style={{
                              position: 'relative',
                              width: '100%',
                              aspectRatio: '4/3',
                              border: '1px solid rgba(212,168,67,0.2)',
                              overflow: 'hidden',
                            }}
                          >
                            <Image
                              src={src}
                              alt={`${definition?.title ?? '침향'} 사진 ${i + 1}`}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              style={{ objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                        ))}
                      </div>
                    </RevealOnScroll>
                  )}
                  <RevealOnScroll delay={300}>
                    <div
                      onMouseEnter={() => setHoveredDefinitionBox(true)}
                      onMouseLeave={() => setHoveredDefinitionBox(false)}
                      style={{
                        marginTop: 26,
                        padding: '20px 20px',
                        border: `2px solid ${hoveredDefinitionBox ? 'var(--accent)' : 'rgba(212,168,67,0.5)'}`,
                        background: hoveredDefinitionBox ? 'rgba(212,168,67,0.15)' : 'rgba(212,168,67,0.08)',
                        transition: 'border-color 300ms ease, background 300ms ease',
                        cursor: 'pointer',
                        boxShadow: hoveredDefinitionBox ? '0 8px 32px rgba(212,168,67,0.15)' : '0 4px 16px rgba(212,168,67,0.05)',
                        overflow: 'hidden',
                      }}
                    >
                      <p style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 'clamp(0.95rem, 3vw, 1.08rem)', color: '#fff', marginBottom: 8, fontWeight: 600, wordBreak: 'keep-all' }}>
                        진짜 침향, 이제는 학명/품종을 반드시 확인하세요.
                      </p>
                      <p style={{ fontSize: 'clamp(0.82rem, 2.5vw, 0.92rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        공식 침향은{' '}
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                          아퀼라리아 아갈로차 록스버그{' '}
                          ({definition?.officialNameCallout ?? 'Aquilaria Agallocha Roxburgh'})
                        </span>
                        입니다.
                      </p>
                    </div>
                  </RevealOnScroll>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 02 — Formation */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>02</div>
                  <div className={styles.chapterTag}>Chapter II · Formation</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>{data?.formationSectionTitle ?? '침향은 어떻게 만들어지나요?'}</h3>
                  </RevealOnScroll>
                  <RevealOnScroll delay={100}>
                    <p className={styles.chapterSubtitle}>
                      자연의 치유 본능이 만든 기적의 향
                    </p>
                  </RevealOnScroll>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 24,
                    }}
                  >
                    {(formationSteps.length > 0
                      ? formationSteps
                      : [
                          { step: '01', title: '외부 자극', description: '침향나무가 외부 상처나 곰팡이 감염 등 자극을 받습니다.' },
                          { step: '02', title: '수지 분비', description: '상처 치유를 위해 나무 스스로 방어 수지를 분비합니다.' },
                          { step: '03', title: '침착', description: '분비된 수지가 수십 년에 걸쳐 나무 내부에 서서히 침착됩니다.' },
                          { step: '04', title: '형성', description: '수지가 충분히 침착된 부분이 향목 — 침향이 됩니다.' },
                        ]
                    ).map((item, i) => (
                      <RevealOnScroll key={item.step + i} delay={i * 90}>
                        <div style={{ textAlign: 'center', border: '1px solid rgba(212,168,67,0.15)', overflow: 'hidden' }}>
                          {item.image && (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
                              <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: 'cover', display: 'block' }} />
                            </div>
                          )}
                          <div style={{ padding: '20px 16px' }}>
                            <div
                              style={{
                                width: 72,
                                height: 72,
                                margin: '0 auto 18px',
                                borderRadius: '50%',
                                border: '1px solid var(--accent)',
                                display: 'grid',
                                placeItems: 'center',
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '1.2rem',
                                fontWeight: 400,
                                color: 'var(--accent)',
                              }}
                            >
                              {item.step}
                            </div>
                            <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.08rem', color: 'var(--accent-soft)', marginBottom: 10, fontWeight: 400 }}>
                              {item.title}
                            </h4>
                            <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, fontWeight: 300 }}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 03 — Why Special (4가지 이유) */}
          <section className={styles.chapter} data-alt="1">
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>03</div>
                  <div className={styles.chapterTag}>Chapter III · Why Special</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>{data?.specialReasonsSectionTitle ?? '침향이 특별한 4가지 이유'}</h3>
                  </RevealOnScroll>
                  <div
                    style={{
                      marginTop: 26,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {(specialReasons.length > 0
                      ? specialReasons
                      : [
                          { title: '수십 년의 시간', description: '20년 이상의 긴 시간이 만들어낸 자연의 결정체입니다.' },
                          { title: '희귀한 수지', description: '전 세계적으로 생산량이 제한된 귀한 향목입니다.' },
                          { title: '학명 기반 품질', description: '식약처 고시 학명 Aquilaria Agallocha Roxburgh.' },
                          { title: '동서양 의학서', description: '동의보감·본초강목 등 수천 년간 약재로 기록.' },
                        ]
                    ).map((card, i) => (
                      <RevealOnScroll key={card.title + i} delay={i * 90}>
                        <div
                          style={{
                            border: '1px solid rgba(212,168,67,0.22)',
                            background: 'rgba(255,255,255,0.02)',
                            height: '100%',
                            overflow: 'hidden',
                          }}
                        >
                          {card.image && (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                              <Image src={card.image} alt={card.title} fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: 'cover', display: 'block' }} />
                            </div>
                          )}
                          <div style={{ padding: 26 }}>
                            <div
                              style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.62rem',
                                letterSpacing: '0.26em',
                                color: 'var(--accent)',
                                textTransform: 'uppercase',
                                marginBottom: 14,
                              }}
                            >
                              {String(i + 1).padStart(2, '0')} — Reason
                            </div>
                            <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.12rem', color: '#fff', marginBottom: 10, fontWeight: 400, lineHeight: 1.4 }}>
                              {card.title}
                            </h4>
                            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, fontWeight: 300 }}>
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 04 — Benefits */}
          <section className={styles.chapter}>
            <div className={styles.wrap}>
              <div className={styles.chapterGrid}>
                <div>
                  <div className={styles.chapterNum}>04</div>
                  <div className={styles.chapterTag}>Chapter IV · Benefits</div>
                </div>
                <div className={styles.chapterBody}>
                  <RevealOnScroll>
                    <h3>{data?.benefitsSectionTitle ?? '침향의 효능에 주목!'}</h3>
                  </RevealOnScroll>
                  <div
                    style={{
                      marginTop: 26,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {(benefits.length > 0
                      ? benefits
                      : [
                          { title: '기혈 순환', description: '막힌 기를 뚫어 오장육부 기능을 정상화합니다.' },
                          { title: '자양강장', description: '찬 기운을 몰아내고 몸을 따뜻하게 보강합니다.' },
                          { title: '신경 안정', description: '예민한 신경을 이완시키고 숙면에 도움.' },
                          { title: '항염 · 혈관', description: '염증 억제와 혈관 건강 증진.' },
                          { title: '뇌 건강', description: '뇌혈류 개선과 뇌세포 보호.' },
                          { title: '소화 · 복통', description: '위를 따뜻하게 하여 소화 기능 개선.' },
                        ]
                    ).map((b, i) => (
                      <RevealOnScroll key={b.title + i} delay={(i % 6) * 70}>
                        <div style={{ borderTop: '1px solid rgba(212,168,67,0.2)', overflow: 'hidden' }}>
                          {b.image && (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', marginBottom: 0 }}>
                              <Image src={b.image} alt={b.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover', display: 'block' }} />
                            </div>
                          )}
                          <div style={{ paddingTop: 18 }}>
                            <div
                              style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '1.3rem',
                                color: 'var(--accent)',
                                fontWeight: 400,
                                marginBottom: 8,
                              }}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </div>
                            <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.02rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                              {b.title}
                            </h4>
                            <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.8, fontWeight: 300 }}>
                              {b.description}
                            </p>
                          </div>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter V — Dosage · 하루 적정 복용량 */}
          {dosageSection && dosageSection.items && dosageSection.items.length > 0 && (
            <section className={styles.chapter}>
              <div className={styles.wrap}>
                <div className={styles.chapterGrid}>
                  <div>
                    <div className={styles.chapterNum}>05</div>
                    <div className={styles.chapterTag}>{dosageSection.tag ?? 'Chapter V · Dosage'}</div>
                  </div>
                  <div className={styles.chapterBody}>
                    <RevealOnScroll>
                      <h3>{dosageSection.title}</h3>
                    </RevealOnScroll>
                    <div style={{ marginTop: 26, display: 'grid', gap: 20 }}>
                      {dosageSection.items.map((item, i) => (
                        <RevealOnScroll key={item.num + i} delay={i * 80}>
                          <div
                            style={{
                              border: '1px solid rgba(212,168,67,0.25)',
                              background: 'rgba(212,168,67,0.04)',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            {item.image && (
                              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 800px"
                                  style={{ objectFit: 'cover', display: 'block' }}
                                />
                              </div>
                            )}
                            <div style={{ padding: '20px 24px' }}>
                            <div
                              style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '1.1rem',
                                color: 'var(--accent)',
                                fontWeight: 400,
                                marginBottom: 10,
                              }}
                            >
                              {item.num}
                            </div>
                            <h4
                              style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: '1.08rem',
                                color: '#fff',
                                marginBottom: 10,
                                fontWeight: 500,
                                lineHeight: 1.5,
                              }}
                            >
                              {item.title}
                            </h4>
                            <p
                              style={{
                                fontSize: '0.94rem',
                                color: 'rgba(255,255,255,0.72)',
                                lineHeight: 1.85,
                                fontWeight: 300,
                                whiteSpace: 'pre-line',
                              }}
                            >
                              {item.body}
                            </p>
                            </div>
                          </div>
                        </RevealOnScroll>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
          {/* Chapter 06 — 공식 근거 문헌 (한국 공식 4대 기준) */}
          {officialSources && (
            <section className={styles.chapter} data-alt="1">
              <div className={styles.wrap}>
                <div className={styles.chapterGrid}>
                  <div>
                    <div className={styles.chapterNum}>06</div>
                    <div className={styles.chapterTag}>Chapter VI · Official Proof</div>
                  </div>
                  <div className={styles.chapterBody}>
                    <RevealOnScroll>
                      <h3>{officialSources.title}</h3>
                    </RevealOnScroll>
                    <RevealOnScroll delay={100}>
                      <p className={styles.chapterSubtitle}>
                        {officialSources.subtitle}
                      </p>
                    </RevealOnScroll>
                    <div style={{ display: 'grid', gap: 20 }}>
                      {officialSources.sources.map((src, i) => (
                        <RevealOnScroll key={src.num} delay={i * 80}>
                          <div
                            style={{
                              padding: '24px 28px',
                              border: `1px solid ${src.highlight ? 'rgba(255,100,80,0.35)' : 'rgba(212,168,67,0.25)'}`,
                              background: src.highlight ? 'rgba(255,100,80,0.04)' : 'rgba(212,168,67,0.04)',
                              borderRadius: 4,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                              <span
                                style={{
                                  flexShrink: 0,
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  border: '1px solid var(--accent)',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontFamily: "'Noto Serif KR', serif",
                                  fontSize: '0.85rem',
                                  color: 'var(--accent)',
                                }}
                              >
                                {src.num}
                              </span>
                              <div>
                                <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.08rem', color: '#fff', marginBottom: 4, fontWeight: 500 }}>
                                  {src.name}
                                </h4>
                                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                                  {src.authority}
                                </p>
                              </div>
                            </div>
                            <div
                              style={{
                                marginBottom: 12,
                                padding: '10px 14px',
                                background: 'rgba(212,168,67,0.1)',
                                borderLeft: '3px solid var(--accent)',
                              }}
                            >
                              <p style={{ fontSize: '0.94rem', color: '#fff', fontWeight: 600, margin: 0 }}>{src.finding}</p>
                            </div>
                            <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.85, fontWeight: 300 }}>
                              {src.detail}
                            </p>
                            {src.highlight && (
                              <div
                                style={{
                                  marginTop: 12,
                                  padding: '8px 14px',
                                  background: 'rgba(255,100,80,0.12)',
                                  borderLeft: '3px solid rgba(255,100,80,0.7)',
                                  borderRadius: 2,
                                }}
                              >
                                <p style={{ fontSize: '0.82rem', color: 'rgba(255,150,130,0.9)', fontWeight: 600, margin: 0 }}>
                                  ⚠ {src.highlight}
                                </p>
                              </div>
                            )}
                          </div>
                        </RevealOnScroll>
                      ))}
                    </div>
                    <RevealOnScroll delay={400}>
                      <div
                        style={{
                          marginTop: 32,
                          padding: '28px 30px',
                          border: '2px solid var(--accent)',
                          background: 'rgba(212,168,67,0.06)',
                        }}
                      >
                        <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.12rem', color: 'var(--accent)', marginBottom: 14, fontWeight: 500 }}>
                          {officialSources.conclusionTitle}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.78)', lineHeight: 2, fontWeight: 300, whiteSpace: 'pre-line' }}>
                          {officialSources.conclusionBody}
                        </p>
                      </div>
                    </RevealOnScroll>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ════════════ TAB 1: 진짜 침향 구별 방법 ════════════ */}
      {activeTab === 1 && (
        <>
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>Authenticity · 감별법</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>진짜 침향 구별 방법</h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p className={styles.chapterSubtitle}>
                    {auth.subtitle}
                  </p>
                </RevealOnScroll>
                {tabHeroes.tab1 && (
                  <RevealOnScroll delay={130}>
                    <div
                      style={{
                        marginTop: 30,
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        border: '1px solid rgba(212,168,67,0.2)',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={tabHeroes.tab1}
                        alt="진짜 침향 구별 방법 — 상징 이미지"
                        fill
                        sizes="(max-width: 768px) 100vw, 880px"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </RevealOnScroll>
                )}

                {/* Solution CTA — 학명·인증·산지 결론 박스. 홈에서 이동(2026-05-17). */}
                {auth.solutionCta && auth.solutionCta.title && (
                  <RevealOnScroll delay={140}>
                    <div
                      style={{
                        marginTop: 36,
                        border: '1px solid rgba(212,168,67,0.35)',
                        background: 'linear-gradient(180deg, rgba(212,168,67,0.05), rgba(212,168,67,0.01))',
                        padding: '32px 28px',
                        textAlign: 'center',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Noto Serif KR', serif",
                          fontSize: 'clamp(1.2rem, 2.4vw, 1.7rem)',
                          fontWeight: 300,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.5,
                          color: '#fff',
                          marginBottom: 26,
                        }}
                      >
                        {renderMarkedGold(auth.solutionCta.title)}
                      </h3>
                      {auth.solutionCta.pillars.length > 0 && (
                        <div
                          style={{
                            display: 'grid',
                            gap: 14,
                            gridTemplateColumns: `repeat(auto-fit, minmax(${auth.solutionCta.pillars.length > 2 ? 200 : 240}px, 1fr))`,
                            marginBottom: auth.solutionCta.buttons.length > 0 ? 24 : 0,
                            textAlign: 'left',
                          }}
                        >
                          {auth.solutionCta.pillars.map((p, i) => (
                            <div
                              key={`${p.label}-${i}`}
                              style={{
                                padding: '16px 18px',
                                border: '1px solid rgba(212,168,67,0.2)',
                                background: 'rgba(255,255,255,0.02)',
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                  fontSize: '0.64rem',
                                  letterSpacing: '0.26em',
                                  textTransform: 'uppercase',
                                  color: 'var(--accent)',
                                  marginBottom: 8,
                                }}
                              >
                                {p.label}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.88rem',
                                  lineHeight: 1.7,
                                  color: 'var(--accent)',
                                  fontWeight: 400,
                                }}
                              >
                                {p.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {auth.solutionCta.buttons.length > 0 && (
                        <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {auth.solutionCta.buttons.map((b, i) => {
                            const baseStyle: React.CSSProperties = {
                              padding: '14px 26px',
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.7rem',
                              letterSpacing: '0.22em',
                              textTransform: 'uppercase',
                              textDecoration: 'none',
                            };
                            const styleVariant: React.CSSProperties = b.variant === 'outline'
                              ? { ...baseStyle, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 500 }
                              : { ...baseStyle, background: 'var(--accent)', color: 'var(--lx-black)', border: '1px solid var(--accent)', fontWeight: 600 };
                            return (
                              <Link key={`${b.label}-${i}`} href={b.href} style={styleVariant}>
                                {b.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </RevealOnScroll>
                )}

                <RevealOnScroll delay={150}>
                  <p style={{ marginTop: 20 }}>{auth.intro}</p>
                </RevealOnScroll>

                {/* Check 01 — 학명 */}
                <RevealOnScroll delay={200}>
                  <div style={{ marginTop: 40, marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.62rem', letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        CHECK · 01
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(212,168,67,0.25)' }} />
                    </div>
                    <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.18rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                      {auth.check01Title}
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, marginBottom: 20, fontWeight: 300 }}>
                      {renderMarkedNowrap(auth.check01Body, 'c01b')}
                    </p>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {auth.check01Sources.map((row, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: 16,
                            padding: '14px 18px',
                            border: '1px solid rgba(212,168,67,0.2)',
                            background: 'rgba(212,168,67,0.03)',
                          }}
                        >
                          <span style={{ flexShrink: 0, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--accent)', paddingTop: 3, textTransform: 'uppercase' }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500, marginBottom: 4 }}>{row.label}</p>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, fontWeight: 300 }}>{renderMarkedNowrap(row.value, `c01s-${i}`)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 성분명세서 텍스트 요약 */}
                    {(() => {
                      const summary = auth.check01Summary ?? DEFAULT_AUTHENTICITY.check01Summary!;
                      // line1 우선 — legacy {prefix, highlight, suffix} 는 합쳐서 동일 포맷으로 변환.
                      const line1 = summary.line1 && summary.line1.length > 0
                        ? summary.line1
                        : [summary.prefix ?? '', summary.highlight ? `**${summary.highlight}**` : '', summary.suffix ?? '']
                            .filter(Boolean).join('').trim();
                      const line2 = summary.line2 ?? '';
                      if (!line1 && !line2) return null;

                      // **...** 마커 파싱 — 골드색 강조로 변환.
                      const renderLine1 = (text: string) => {
                        const parts = text.split(/(\*\*[^*]+\*\*)/g);
                        return parts.map((p, i) => {
                          if (/^\*\*[^*]+\*\*$/.test(p)) {
                            return (
                              <em key={i} style={{ color: 'var(--accent)', fontStyle: 'normal', fontWeight: 500 }}>
                                {p.slice(2, -2)}
                              </em>
                            );
                          }
                          return <span key={i}>{p}</span>;
                        });
                      };

                      return (
                        <div style={{ marginTop: 24, padding: '16px 20px', borderLeft: '2px solid rgba(212,168,67,0.4)', background: 'rgba(212,168,67,0.04)' }}>
                          <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.85, fontWeight: 300 }}>
                            {line1 && renderLine1(line1)}
                            {line1 && line2 && <br />}
                            {line2}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </RevealOnScroll>

                {/* Check 02 — 산지 */}
                <RevealOnScroll delay={250}>
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.62rem', letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        CHECK · 02
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(212,168,67,0.25)' }} />
                    </div>
                    <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.18rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                      {auth.check02Title}
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, marginBottom: 20, fontWeight: 300 }}>
                      {renderWithNowrap(auth.check02Body)}
                    </p>
                    <div
                      style={{
                        padding: '22px 26px',
                        border: '1px solid rgba(212,168,67,0.3)',
                        background: 'rgba(212,168,67,0.05)',
                        borderLeft: '4px solid var(--accent)',
                      }}
                    >
                      <p style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '0.9rem', color: 'var(--accent)', marginBottom: 6, fontWeight: 500 }}>
                        {auth.check02QuoteSource}
                      </p>
                      <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.85, fontWeight: 300 }}>
                        {renderWithNowrap(auth.check02QuoteBody)}
                      </p>
                    </div>

                    {/* 역사적 기록 — 시대별 베트남산 침향 산지 기록 (admin 편집 가능).
                        prod blob 에 신규 필드가 없는 legacy 데이터일 때 DEFAULT 로 자동 폴백.
                        사용자가 admin 에서 명시적으로 비운 경우('' / []) 는 그 의도를 존중. */}
                    {(() => {
                      const eraIntro = auth.check02EraIntro !== undefined ? auth.check02EraIntro : DEFAULT_AUTHENTICITY.check02EraIntro;
                      const eras = auth.check02Eras !== undefined ? auth.check02Eras : DEFAULT_AUTHENTICITY.check02Eras;
                      const eraOutro = auth.check02EraOutro !== undefined ? auth.check02EraOutro : DEFAULT_AUTHENTICITY.check02EraOutro;
                      const hasIntro = !!(eraIntro && eraIntro.trim().length > 0);
                      const hasEras = !!(eras && eras.length > 0);
                      const hasOutro = !!(eraOutro && eraOutro.trim().length > 0);
                      if (!hasIntro && !hasEras && !hasOutro) return null;
                      return (
                        <div style={{ marginTop: 28 }}>
                          {hasIntro && (
                            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.9, marginBottom: 18, fontWeight: 300 }}>
                              {renderMarkedGold(eraIntro!)}
                            </p>
                          )}
                          {hasEras && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {eras!.map((row, i) => (
                                <li
                                  key={`${row.era}-${i}`}
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr',
                                    alignItems: 'baseline',
                                    gap: 14,
                                    paddingLeft: 14,
                                    borderLeft: '2px solid rgba(212,168,67,0.25)',
                                  }}
                                >
                                  <span style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '0.86rem', color: 'var(--accent)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {row.era}
                                  </span>
                                  <span style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontWeight: 300 }}>
                                    {renderWithNowrap(row.body)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {hasOutro && (
                            <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.9, marginTop: 20, fontWeight: 300 }}>
                              {renderMarkedGold(eraOutro!)}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </RevealOnScroll>

                {/* Check 03 — 증빙문서 */}
                <RevealOnScroll delay={300}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.62rem', letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        CHECK · 03
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(212,168,67,0.25)' }} />
                    </div>
                    <h4 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '1.18rem', color: '#fff', marginBottom: 8, fontWeight: 400 }}>
                      {auth.check03Title}
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, marginBottom: 20, fontWeight: 300 }}>
                      {renderWithNowrap(auth.check03Body)}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                      {auth.check03Docs.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '16px 18px',
                            border: `1px solid ${item.highlight ? 'rgba(255,100,80,0.4)' : 'rgba(212,168,67,0.2)'}`,
                            background: item.highlight ? 'rgba(255,100,80,0.05)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <p style={{ fontFamily: "'Noto Serif KR', serif", fontSize: '0.92rem', color: item.highlight ? '#ff9080' : '#fff', fontWeight: 500, marginBottom: 6 }}>
                            {item.doc}
                          </p>
                          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.75, fontWeight: 300 }}>
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* ════════════ TAB 2: 경전에 실린 침향 ════════════ */}
      {activeTab === 2 && (
        <>
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>Scripture · 경전</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>경전에 실린 침향</h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p className={styles.chapterSubtitle}>
                    침향(沈香)은 동서양의 주요 경전에서 신성한 공양물·의례의 향으로 기록되어 온 귀한 향목입니다.
                  </p>
                </RevealOnScroll>
                {tabHeroes.tabScriptures && (
                  <RevealOnScroll delay={150}>
                    <div
                      style={{
                        marginTop: 30,
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        border: '1px solid rgba(212,168,67,0.2)',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={tabHeroes.tabScriptures}
                        alt="경전에 실린 침향 — 상징 이미지"
                        fill
                        sizes="(max-width: 768px) 100vw, 880px"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </RevealOnScroll>
                )}
                {scriptures.length > 0 ? (
                  <div
                    style={{
                      marginTop: 30,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {scriptures.map((scr, i) => (
                      <RevealOnScroll key={scr.title + i} delay={(i % 6) * 60}>
                        <div
                          style={{
                            padding: 22,
                            border: '1px solid rgba(212,168,67,0.2)',
                            background: 'rgba(255,255,255,0.02)',
                            height: '100%',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                border: '1px solid rgba(212,168,67,0.35)',
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.62rem',
                                letterSpacing: '0.22em',
                                color: 'var(--accent)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {scr.year}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{scr.author}</span>
                          </div>
                          <h4
                            style={{
                              fontFamily: "'Noto Serif KR', serif",
                              fontSize: '1.05rem',
                              color: '#fff',
                              marginBottom: 6,
                              fontWeight: 400,
                              lineHeight: 1.4,
                            }}
                          >
                            {highlightAgarwood(scr.title)}
                          </h4>
                          <p
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.62rem',
                              letterSpacing: '0.2em',
                              color: 'var(--accent-soft)',
                              textTransform: 'uppercase',
                              marginBottom: 10,
                            }}
                          >
                            {scr.topic}
                          </p>
                          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontWeight: 300 }}>
                            {highlightAgarwood(scr.description)}
                          </p>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 30,
                      padding: '50px 30px',
                      textAlign: 'center',
                      border: '1px dashed rgba(212,168,67,0.25)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.68rem', letterSpacing: '0.28em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>
                      Coming Soon
                    </div>
                    경전 자료가 곧 업데이트됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* ════════════ TAB 3: 문헌에 실린 침향 ════════════ */}
      {activeTab === 3 && (
        <>
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>Literature · 문헌</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>문헌에 실린 침향</h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p className={styles.chapterSubtitle}>
                    침향(沈香)은 수천 년간 동서양의 의학 문헌에서 그 가치를 인정받아 온 귀중한 약재입니다.
                  </p>
                </RevealOnScroll>
                {tabHeroes.tab2 && (
                  <RevealOnScroll delay={150}>
                    <div
                      style={{
                        marginTop: 30,
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        border: '1px solid rgba(212,168,67,0.2)',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={tabHeroes.tab2}
                        alt="문헌에 실린 침향 — 상징 이미지"
                        fill
                        sizes="(max-width: 768px) 100vw, 880px"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </RevealOnScroll>
                )}
                {literatures.length > 0 ? (
                  <div
                    style={{
                      marginTop: 30,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {literatures.map((lit, i) => (
                      <RevealOnScroll key={lit.title + i} delay={(i % 6) * 60}>
                        <div
                          style={{
                            padding: 22,
                            border: '1px solid rgba(212,168,67,0.2)',
                            background: 'rgba(255,255,255,0.02)',
                            height: '100%',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                border: '1px solid rgba(212,168,67,0.35)',
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: '0.62rem',
                                letterSpacing: '0.22em',
                                color: 'var(--accent)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {lit.year}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{lit.author}</span>
                          </div>
                          <h4
                            style={{
                              fontFamily: "'Noto Serif KR', serif",
                              fontSize: '1.05rem',
                              color: '#fff',
                              marginBottom: 6,
                              fontWeight: 400,
                              lineHeight: 1.4,
                            }}
                          >
                            {lit.title}
                          </h4>
                          <p
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.62rem',
                              letterSpacing: '0.2em',
                              color: 'var(--accent-soft)',
                              textTransform: 'uppercase',
                              marginBottom: 10,
                            }}
                          >
                            {lit.topic}
                          </p>
                          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontWeight: 300 }}>
                            {lit.description}
                          </p>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 30,
                      padding: '50px 30px',
                      textAlign: 'center',
                      border: '1px dashed rgba(212,168,67,0.25)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.68rem', letterSpacing: '0.28em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>
                      Coming Soon
                    </div>
                    문헌 자료가 곧 업데이트됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* ════════════ TAB 4: 논문에 실린 침향 ════════════ */}
      {activeTab === 4 && (
        <>
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>Research · 논문</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>논문에 실린 침향</h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p className={styles.chapterSubtitle}>
                    현대 과학 논문에서 그 가치를 인정받아 온 귀중한 약재입니다.
                  </p>
                </RevealOnScroll>
                {tabHeroes.tab3 && (
                  <RevealOnScroll delay={150}>
                    <div
                      style={{
                        marginTop: 30,
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        border: '1px solid rgba(212,168,67,0.2)',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={tabHeroes.tab3}
                        alt="논문에 실린 침향 — 상징 이미지"
                        fill
                        sizes="(max-width: 768px) 100vw, 880px"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </RevealOnScroll>
                )}
                {papers.length > 0 ? (
                  <>
                    <div
                      style={{
                        marginTop: 30,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: 20,
                      }}
                    >
                      {papers.map((paper, i) => {
                        // 카드에 노출되는 제목은 한글(titleKr) 우선, 없으면 원문 title.
                        const displayTitle = paper.titleKr && paper.titleKr.trim().length > 0 ? paper.titleKr : paper.title;
                        const hasSummary = !!(paper.summaryKr && paper.summaryKr.trim().length > 0);
                        return (
                          <RevealOnScroll key={paper.title + i} delay={(i % 6) * 60}>
                            <div
                              style={{
                                padding: 22,
                                border: '1px solid rgba(212,168,67,0.2)',
                                background: 'rgba(255,255,255,0.02)',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    border: '1px solid rgba(212,168,67,0.35)',
                                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                    fontSize: '0.62rem',
                                    letterSpacing: '0.22em',
                                    color: 'var(--accent)',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {paper.year}
                                </span>
                                {paper.citations && paper.citations !== '-' && (
                                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
                                    인용 {paper.citations}
                                  </span>
                                )}
                              </div>
                              <h4
                                style={{
                                  fontFamily: "'Noto Serif KR', serif",
                                  fontSize: '0.98rem',
                                  color: '#fff',
                                  marginBottom: 8,
                                  fontWeight: 400,
                                  lineHeight: 1.5,
                                  wordBreak: 'keep-all',
                                }}
                              >
                                {displayTitle}
                              </h4>
                              {paper.authors && (
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 6, lineHeight: 1.6 }}>
                                  {paper.authors}
                                </p>
                              )}
                              <p style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--accent-soft)', flex: 1 }}>
                                {paper.journal}
                              </p>

                              {/* 카드 하단 버튼 영역 — 원문 보기 / 요약 보기 */}
                              {(paper.link || hasSummary) && (
                                <div
                                  style={{
                                    marginTop: 16,
                                    paddingTop: 14,
                                    borderTop: '1px solid rgba(212,168,67,0.15)',
                                    display: 'flex',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {paper.link && (
                                    <a
                                      href={paper.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        flex: '1 1 0',
                                        minWidth: 110,
                                        textAlign: 'center',
                                        padding: '8px 12px',
                                        border: '1px solid rgba(212,168,67,0.4)',
                                        background: 'transparent',
                                        color: 'var(--accent)',
                                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                        fontSize: '0.64rem',
                                        letterSpacing: '0.18em',
                                        textTransform: 'uppercase',
                                        textDecoration: 'none',
                                        transition: 'background 200ms, color 200ms',
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.12)';
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                      }}
                                    >
                                      원문 보기 →
                                    </a>
                                  )}
                                  {hasSummary && (
                                    <button
                                      type="button"
                                      onClick={() => setPaperSummaryOpen(paper)}
                                      style={{
                                        flex: '1 1 0',
                                        minWidth: 110,
                                        padding: '8px 12px',
                                        border: '1px solid var(--accent)',
                                        background: 'var(--accent)',
                                        color: 'var(--lx-black)',
                                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                        fontSize: '0.64rem',
                                        letterSpacing: '0.18em',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        transition: 'opacity 200ms',
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.opacity = '0.85';
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.opacity = '1';
                                      }}
                                    >
                                      요약 보기 →
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </RevealOnScroll>
                        );
                      })}
                    </div>
                    <RevealOnScroll>
                      <p style={{ textAlign: 'center', marginTop: 50, fontSize: '0.86rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.85, fontWeight: 300 }}>
                        위 논문은 침향의 전통적·과학적 가치를 뒷받침하는 대표적인 자료입니다.
                      </p>
                    </RevealOnScroll>
                  </>
                ) : (
                  <div
                    style={{
                      marginTop: 30,
                      padding: '50px 30px',
                      textAlign: 'center',
                      border: '1px dashed rgba(212,168,67,0.25)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.68rem', letterSpacing: '0.28em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>
                      Coming Soon
                    </div>
                    논문 자료가 곧 업데이트됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* ════════════ TAB 5: 복용 및 사용법 ════════════ */}
      {activeTab === 5 && (
        <>
        <section className={styles.chapter}>
          <div className={styles.wrap}>
            <div className={styles.chapterGrid}>
              <div>
                <div className={styles.chapterNum}>01</div>
                <div className={styles.chapterTag}>{usageTab.tag ?? 'Dosage & Usage · 복용법'}</div>
              </div>
              <div className={styles.chapterBody}>
                <RevealOnScroll>
                  <h3>{usageTab.title ?? '복용 및 사용법'}</h3>
                </RevealOnScroll>
                <RevealOnScroll delay={100}>
                  <p className={styles.chapterSubtitle}>
                    {usageTab.subtitle ?? '침향 제품별 올바른 복용법과 사용 방법을 안내합니다.'}
                  </p>
                </RevealOnScroll>
                {tabHeroes.tab4 && (
                  <RevealOnScroll delay={130}>
                    <div
                      style={{
                        marginTop: 30,
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        border: '1px solid rgba(212,168,67,0.2)',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={tabHeroes.tab4}
                        alt="복용 및 사용법 — 상징 이미지"
                        fill
                        sizes="(max-width: 768px) 100vw, 880px"
                        style={{ objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </RevealOnScroll>
                )}
                <div style={{ marginTop: 10, marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(usageTab.introLines ?? DEFAULT_USAGE.introLines!).map((line, i) => (
                    <RevealOnScroll key={i} delay={i * 80}>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, fontWeight: 300, paddingLeft: 14, borderLeft: '2px solid rgba(212,168,67,0.35)' }}>
                        {line}
                      </p>
                    </RevealOnScroll>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {(usageTab.items ?? DEFAULT_USAGE.items).map((item, i) => (
                    <RevealOnScroll key={item.product + i} delay={(i % 7) * 60}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 20,
                          padding: '20px 0',
                          borderBottom: '1px solid rgba(212,168,67,0.15)',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flexShrink: 0, minWidth: 100 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              border: '1px solid rgba(212,168,67,0.4)',
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: '0.65rem',
                              letterSpacing: '0.12em',
                              color: 'var(--accent)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.product}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.85, fontWeight: 300, wordBreak: 'keep-all' }}>
                          {item.instruction}
                        </p>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* ════════════ 논문 요약 모달 ════════════ */}
      {paperSummaryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${paperSummaryOpen.titleKr || paperSummaryOpen.title} — 요약`}
          onClick={() => setPaperSummaryOpen(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            animation: 'paperModalFade 200ms ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 640,
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#0e1018',
              border: '1px solid rgba(212,168,67,0.3)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,67,0.05)',
              padding: 'clamp(24px, 4vw, 36px)',
              animation: 'paperModalSlide 240ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setPaperSummaryOpen(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                display: 'grid',
                placeItems: 'center',
                background: 'transparent',
                border: '1px solid rgba(212,168,67,0.3)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                lineHeight: 1,
                fontFamily: 'inherit',
                transition: 'background 200ms, color 200ms, border-color 200ms',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,67,0.3)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              ×
            </button>

            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: '0.62rem',
                letterSpacing: '0.26em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              논문 요약 · Paper Summary
            </div>

            <h3
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: 'clamp(1.05rem, 2.6vw, 1.25rem)',
                color: '#fff',
                marginBottom: 8,
                fontWeight: 500,
                lineHeight: 1.5,
                wordBreak: 'keep-all',
              }}
            >
              {paperSummaryOpen.titleKr && paperSummaryOpen.titleKr.trim().length > 0
                ? paperSummaryOpen.titleKr
                : paperSummaryOpen.title}
            </h3>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 22,
              }}
            >
              <span style={{ fontFamily: "'Noto Serif KR', serif", fontStyle: 'italic', color: 'var(--accent-soft)' }}>
                {paperSummaryOpen.journal}
              </span>
              <span aria-hidden style={{ color: 'rgba(212,168,67,0.4)' }}>·</span>
              <span>{paperSummaryOpen.year}</span>
              {paperSummaryOpen.citations && paperSummaryOpen.citations !== '-' && (
                <>
                  <span aria-hidden style={{ color: 'rgba(212,168,67,0.4)' }}>·</span>
                  <span>인용 {paperSummaryOpen.citations}</span>
                </>
              )}
            </div>

            <p
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: 'clamp(0.92rem, 2.3vw, 1rem)',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 2,
                fontWeight: 300,
                wordBreak: 'keep-all',
                whiteSpace: 'pre-line',
              }}
            >
              {paperSummaryOpen.summaryKr}
            </p>

            {paperSummaryOpen.link && (
              <div style={{ marginTop: 26, paddingTop: 20, borderTop: '1px solid rgba(212,168,67,0.15)' }}>
                <a
                  href={paperSummaryOpen.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 18px',
                    border: '1px solid var(--accent)',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: '0.66rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'background 200ms, color 200ms',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--lx-black)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                  }}
                >
                  원문 보기 (초록 포함) →
                </a>
              </div>
            )}
          </div>

          <style>{`
            @keyframes paperModalFade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes paperModalSlide {
              from { opacity: 0; transform: translateY(12px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
