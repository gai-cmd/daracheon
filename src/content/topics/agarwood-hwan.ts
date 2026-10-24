import type { TopicHubContent } from '@/components/seo/TopicHub';

/* 근거: 이 파일의 사실 문장은 모두 아래 출처에서 가져와 다시 썼다 (2026-10-24 확인, 운영 제품 페이지와 시드 데이터 일치 확인).
 *
 * [제품 분류]
 *  - data/db/productCategories.json:13-14 — 카테고리 id '환' = 라벨 '침향환' (침향단·기보단이 이 분류)
 *  - data/db/products.json:97·100, 129·132 — 침향단(agarwood-chimhyangdan)·기보단(agarwood-gibodan) category '환'
 *
 * [침향단] data/db/products.json (= https://zoellife.com/products/agarwood-chimhyangdan)
 *  - :106 노니엑기스·북방감초·인삼·칵깐(녹용)·콜라겐·표고에 25년산 침향분말 10%를 더한 전통 방식의 환제(丸劑), 일반식품
 *  - :109 성분 / :110 보관 / :111 복용법 1일 1회 1회 1단 식후 천천히 씹어 / :112 주의(12세 미만·임신부·수유부·성분 과민증 사용 금지)
 *  - :113 소비기한 3년 / :114 1단 5g, 1박스 15단, 중량 75g / :115 일반식품, Organic·HACCP·OCOP 인증 / :105 대표 이미지(Blob)
 *
 * [기보단] data/db/products.json (= https://zoellife.com/products/agarwood-gibodan)
 *  - :138 25년산 침향 중심, 동충하초·제비집 등 배합한 복합환, 이름 뜻 "기(氣)를 보하는 보배로운 단(丹)"
 *    (같은 줄의 증상 완화·체력·집중력 문구는 효능 단정이라 옮기지 않았다)
 *  - :141 성분 / :142 보관 / :143 사용법 1일 1회 1회 1포 식후 충분한 물과 함께 / :144 소비기한 3년 / :145 1박스 3병 60포
 *  - :146 일반식품, Organic·HACCP·OCOP 인증
 *
 * [학명]
 *  - https://zoellife.com/about-agarwood Chapter VI — 생규 379p AAR 수간목 정의, 식품공전 AAR + A. malaccensis Lam.,
 *    한약재 관능검사 해설서 708p AAR(인도네시아는 두 품종을 동일종으로 간주해 CITES 수출 허가 — 참고사항), 원색 한약재감별도감(2009) AAR
 *  - https://zoellife.com/blog/mfds-defines-agarwood-as-aquilaria-agallocha — 온라인 판매 침향 대부분 인도네시아산·말라센시스 기록,
 *    식품공전은 식용 원료 목록일 뿐 침향 정의 문서는 아갈로차만 제시, 분류학상 같은 종으로 보는 견해 병기
 *  - https://zoellife.com/blog/real-agarwood-3-criteria — 국제 분류학에서 A. agallocha Roxb.는 A. malaccensis 의 이명으로 정리
 *  - https://zoellife.com/blog/agarwood-resin-content-determines-quality — DNA 종식별 DowGene DA-260507-1(2026-05-14) 100% 일치
 *
 * [원료·증빙]
 *  - /blog/agarwood-resin-content-determines-quality — 원목을 쪼개 수지 침착 부위만 골라 등급별 분류, 선별 원재료가 침향단 등 제품군의 출발점
 *  - https://zoellife.com/blog/3-questions-before-buying-agarwood — 학명·산지·증빙 3가지 질문, 100% 베트남산, 5개 지역 직영 농장
 *  - https://zoellife.com/about-agarwood 'Documents · 증명 서류' — 원산지 증명서·CITES 인증서·정식 수입 증빙·유기농 인증서·
 *    유전자 검사·성분검사서·FDA 식품시설 등록·HACCP·GMP
 *
 * [전통 문헌 — 효능은 단정하지 않고 기록으로만] /about-agarwood '문헌에 실린 침향' (동의보감: 기를 통하게 하고 몸을 따뜻하게 함)
 *
 * [주의·고지]
 *  - data/db/faq.json:47 — 침향단·침향선향 등 일부 제품 12세 미만·임산부·수유부 권장 안 함
 *  - /blog/3-questions-before-buying-agarwood 고지문 — 개인차, 건강 상태에 따라 전문가 상담
 *  - /blog/real-agarwood-3-criteria 고지문 — 침향은 건강기능식품법상 기능성 원료가 아닌 일반식품 원료
 *  - https://zoellife.com/guide — "이 제품은 질병의 예방 및 치료를 위한 의약품이 아닙니다"
 *
 * 뺀 내용(사이트에 출처가 없음): 환과 단의 일반적 차이·제법, 1단당 침향 그램 수(비율×중량 환산 값은 표시사항에 없음),
 * 기보단의 침향 비율과 기보단 전용 주의 문구, 섭취 기간·효과가 나타나는 시점, 다른 회사 침향환 비교.
 */
const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

export const AGARWOOD_HWAN_NOTICE =
  '침향 제품은 일반식품이며 질병의 예방·치료를 목적으로 하는 의약품이 아닙니다.';

export const AGARWOOD_HWAN: TopicHubContent = {
  path: '/agarwood-hwan',
  breadcrumbName: '침향환·침향단',
  kicker: '침향환 · Agarwood Pill',
  h1: '침향환 고르는 법,',
  h1Em: '침향단 함량·섭취법 정리',
  lede:
    '침향환은 침향을 다른 원료와 배합해 환(丸)으로 만든 제품입니다. 고를 때는 원재료에 적힌 침향 비율, 원료 침향의 학명과 산지, 이를 뒷받침하는 서류를 차례로 확인하면 됩니다. 대라천 침향단의 표시 정보를 예로 들어 라벨 읽는 법과 섭취법을 정리했습니다. ' +
    AGARWOOD_HWAN_NOTICE,
  heroImage: {
    src: `${BLOB}/uploads/products/p2-pill-chimhyang-T1-product-1778027637350.png`,
    alt: '침향단(沈香丹) — 25년산 침향분말 10%를 배합한 대라천 침향환',
  },
  headline: '침향환 고르는 법 — 침향단 함량·섭취법 정리',
  description:
    '침향환(침향단)이 어떤 제품인지, 라벨에서 침향 함량·1단 중량을 읽는 법, 원료 학명(Aquilaria agallocha Roxburgh)과 증빙 서류를 확인하는 이유, 침향단·기보단 섭취법과 주의사항.',
  about: {
    name: '침향환',
    alternateName: ['침향단', '沈香丹', '침향 환', 'Agarwood pill'],
  },
  datePublished: '2026-10-24',
  dateModified: '2026-10-24',
  sections: [
    {
      id: 'what',
      num: '01',
      tag: 'Definition',
      title: '침향환·침향단은 어떤 제품인가요?',
      lead: '침향을 다른 원료와 배합해 환으로 빚은 일반식품입니다.',
      paragraphs: [
        '대라천은 침향을 원료로 한 환 제품을 \'침향환\'으로 분류하며, 여기에 침향단(沈香丹)과 기보단(氣寶丹)이 있습니다. 두 제품 모두 일반식품입니다.',
      ],
      blocks: [
        {
          title: '침향단(沈香丹)',
          paragraphs: [
            '노니엑기스·북방감초·인삼·칵깐(녹용)·콜라겐·표고에 25년산 침향분말 10%를 더해 전통 방식으로 만든 환제(丸劑)입니다. 한 번에 1단씩 식후에 천천히 씹어 먹도록 안내합니다.',
          ],
        },
        {
          title: '기보단(氣寶丹)',
          paragraphs: [
            '25년산 침향을 중심으로 동충하초·제비집 등을 배합한 복합환입니다. 이름에는 "기(氣)를 보하는 보배로운 단(丹)"이라는 뜻이 담겨 있습니다. 한 번에 1포씩 물과 함께 먹는 방식입니다.',
          ],
        },
      ],
      links: [
        { href: '/products/agarwood-chimhyangdan', label: '침향단 제품 정보 보기' },
        { href: '/products/agarwood-gibodan', label: '기보단 제품 정보 보기' },
      ],
    },
    {
      id: 'label',
      num: '02',
      tag: 'Label',
      title: '라벨에서 침향 함량 읽는 법',
      lead: '침향이 몇 % 들었는지, 어떤 침향인지, 한 번에 얼마를 먹는지를 봅니다.',
      paragraphs: [
        '침향환은 여러 원료를 섞어 만들기 때문에, 제품 이름에 \'침향\'이 들어 있어도 실제로 침향이 차지하는 몫은 원재료 표시를 봐야 알 수 있습니다. 아래는 대라천 침향단과 기보단의 제품 정보를 같은 항목으로 나란히 놓은 것입니다.',
      ],
      table: {
        caption: '대라천 침향환 제품 정보 비교 (제품 소개 표시 기준)',
        head: ['항목', '침향단', '기보단'],
        rows: [
          ['침향 원료', '25년산 침향분말 10%', '25년산 침향'],
          ['함께 배합한 원료', '노니엑기스, 북방감초, 인삼, 칵깐(녹용), 콜라겐, 표고', '동충하초, 제비집 등'],
          ['1회 섭취 단위', '1단 (1단 5g)', '1포'],
          ['포장', '1박스 15단, 중량 75g', '1박스 3병 60포'],
          ['소비기한', '3년', '3년'],
          ['식품 유형·인증', '일반식품 · Organic, HACCP, OCOP', '일반식품 · Organic, HACCP, OCOP'],
        ],
      },
      blocks: [
        {
          title: '확인할 세 가지',
          bullets: [
            '침향 비율 — 원재료 목록에 침향이 몇 % 들었는지 적혀 있는지 봅니다. 침향단은 침향분말 10%로 표시돼 있습니다.',
            '원료 침향의 이력 — \'25년산\'처럼 원목의 수령이 적혀 있는지, 원료 학명과 산지가 밝혀져 있는지 확인합니다.',
            '1회 섭취 단위와 총량 — 1단·1포의 중량과 한 박스에 든 개수를 보면 표시된 섭취법대로 먹을 때 얼마나 가는지 가늠할 수 있습니다.',
          ],
        },
      ],
      links: [{ href: '/products/agarwood-chimhyangdan', label: '침향단 원재료·중량 자세히' }],
    },
    {
      id: 'species',
      num: '03',
      tag: 'Species',
      title: '원료 침향의 학명을 확인해야 하는 이유',
      lead: '같은 \'침향\'이라도 품종이 다를 수 있습니다.',
      paragraphs: [
        '식약처 고시 대한민국약전외한약(생약)규격집은 침향을 Aquilaria agallocha Roxburgh(아퀼라리아 아갈로차 록스버그)의 수지가 침착된 수간목으로 정의합니다. 식약처가 발간한 한약재 관능검사 해설서와 원색 한약재감별도감에도 같은 학명이 실려 있습니다.',
        '식용 원료 목록인 식품공전에는 Aquilaria agallocha Roxburgh와 Aquilaria malaccensis Lam. 두 품종이 함께 올라 있습니다. 대라천 블로그는 온라인에서 판매되는 침향 상당수가 인도네시아산이며 말라센시스로 기록돼 있다고 소개합니다. 국제 식물분류학에서는 두 이름을 같은 종으로 보는 견해도 있으므로, 제품에 어떤 학명이 적혀 있는지를 직접 확인하는 것이 가장 확실합니다.',
        '대라천 침향환에 쓰는 침향은 Aquilaria agallocha Roxburgh이며, 원목 \'각침향\'은 DNA 종 식별 검사(DowGene DA-260507-1, 2026년 5월 14일)에서 아갈로차 유전자형과 100% 일치했습니다.',
      ],
      links: [
        { href: '/blog/mfds-defines-agarwood-as-aquilaria-agallocha', label: '식약처 문서에 정의된 침향 품종' },
        { href: '/blog/why-aquilaria-agallocha-roxburgh-matters', label: '학명 Aquilaria agallocha Roxburgh가 중요한 이유' },
        { href: '/blog/agarwood-species-herbal-vs-food-standards', label: '한약재 규격과 식품 원료의 침향 품종 구분' },
      ],
    },
    {
      id: 'origin',
      num: '04',
      tag: 'Origin',
      title: '원료의 산지와 증빙 서류',
      lead: '산지와 품종은 말이 아니라 서류로 확인합니다.',
      paragraphs: [
        '대라천 침향은 100% 베트남산이며 베트남 5개 지역의 직영 농장에서 자랍니다. 가공 현장에서는 원목을 쪼개 수지가 침착된 부위만 골라 등급별로 나누고, 이렇게 선별한 원재료가 침향단을 비롯한 제품의 출발점이 됩니다.',
        '대라천이 \'침향이란?\' 페이지에서 진짜 침향을 확인하는 근거로 공개하는 서류는 다음과 같습니다. 침향환을 고를 때도 판매처에 같은 서류를 요청해 볼 수 있습니다.',
      ],
      blocks: [
        {
          bullets: [
            '원산지 증명서 — 원산지가 베트남임을 증명',
            'CITES 인증서 — 국제 거래 협약에 따라 정식으로 수입 통관됐음을 증명',
            '정식 수입 증빙 서류 — 통관·검역·수입 확인',
            '유기농 인증서 — 식용 가능 여부 확인',
            '유전자 검사 — DNA 분석으로 아갈로차 품종 확인',
            '성분검사서 — 성분 종류와 함량 분석',
            'FDA 식품시설 등록, HACCP·GMP',
          ],
        },
      ],
      links: [
        { href: '/vietnam-agarwood', label: '베트남 침향과 5개 직영 농장' },
        { href: '/blog/3-questions-before-buying-agarwood', label: '침향 살 때 물어볼 3가지' },
        { href: '/blog/agarwood-resin-content-determines-quality', label: '침향의 가치는 수지 함량이 결정한다' },
      ],
    },
    {
      id: 'how',
      num: '05',
      tag: 'How to take',
      title: '침향단·기보단 섭취법',
      lead: '제품에 표시된 섭취법 그대로 옮겼습니다.',
      blocks: [
        {
          title: '침향단',
          bullets: [
            '1일 1회, 1회 1단을 식후에 천천히 씹어 드세요.',
            '직사광선을 피해 서늘하고 건조한 곳에 보관하세요.',
          ],
        },
        {
          title: '기보단',
          bullets: [
            '1일 1회, 1회 1포를 식후에 충분한 물과 함께 드세요.',
            '직사광선을 피해 서늘하고 건조한 곳에 보관하세요.',
          ],
        },
      ],
      links: [
        { href: '/products/agarwood-chimhyangdan', label: '침향단 보러 가기' },
        { href: '/products/agarwood-gibodan', label: '기보단 보러 가기' },
      ],
    },
    {
      id: 'caution',
      num: '06',
      tag: 'Caution',
      title: '섭취 전 주의사항',
      lead: '침향단 제품 표시사항의 주의 문구입니다.',
      blocks: [
        {
          title: '침향단을 드시면 안 되는 분',
          bullets: [
            '12세 미만 어린이',
            '임신부와 수유부',
            '제품 성분에 과민증이 있는 분',
          ],
        },
        {
          paragraphs: [
            '다른 제품도 섭취 전에 포장의 주의사항을 확인하세요. 건강 상태에 따라 반응에는 개인차가 있으니, 질환이 있거나 약을 복용 중이라면 전문가와 먼저 상담하는 것이 좋습니다.',
          ],
        },
      ],
      links: [{ href: '/agarwood-benefits', label: '침향 효능·주의사항 총정리' }],
    },
    {
      id: 'notice',
      num: '07',
      tag: 'Notice',
      title: '침향환은 의약품이 아닙니다',
      lead: AGARWOOD_HWAN_NOTICE,
      paragraphs: [
        '침향은 「건강기능식품에 관한 법률」상 기능성 원료로 인정된 원료가 아닌 일반식품 원료입니다. 동의보감 등 옛 의서에는 침향이 기를 통하게 하고 몸을 따뜻하게 하는 약재로 기록돼 있으나, 이는 문헌의 기록이며 침향환의 특정 효과를 뜻하지 않습니다.',
      ],
      links: [
        { href: '/about-agarwood', label: '침향이란? 학명·문헌 자세히' },
        { href: '/agarwood-benefits', label: '전통 문헌과 현대 연구로 본 침향' },
      ],
    },
  ],
  productsTitle: '대라천 침향환',
  productsLead: 'Aquilaria agallocha Roxburgh 25년산 침향으로 만든 대라천의 환 제품입니다.',
  faqTitle: '침향환 자주 묻는 질문',
  faq: [
    {
      q: '침향환과 침향단은 같은 건가요?',
      a: '대라천에서 \'침향환\'은 침향을 넣은 환 제품의 분류 이름이고, 침향단(沈香丹)은 그 분류에 속한 제품입니다. 같은 분류에 25년산 침향과 동충하초·제비집 등을 배합한 기보단(氣寶丹)도 있습니다.',
    },
    {
      q: '침향단에는 침향이 얼마나 들어 있나요?',
      a: '대라천 침향단은 25년산 침향분말 10%에 노니엑기스·북방감초·인삼·칵깐(녹용)·콜라겐·표고를 배합했습니다. 1단은 5g이고, 1박스에 15단(75g)이 들어 있습니다.',
    },
    {
      q: '침향단은 어떻게 먹나요?',
      a: '1일 1회, 1회 1단을 식후에 천천히 씹어 드시면 됩니다. 직사광선을 피해 서늘하고 건조한 곳에 보관하세요. 소비기한은 3년입니다.',
    },
    {
      q: '침향환을 먹으면 안 되는 사람이 있나요?',
      a: '침향단 표시사항에 따르면 12세 미만 어린이, 임신부와 수유부, 제품 성분에 과민증이 있는 분은 드시지 않아야 합니다. 질환이 있거나 약을 복용 중이라면 전문가와 먼저 상담하세요.',
    },
    {
      q: '좋은 침향환은 어떻게 고르나요?',
      a: '원재료에 침향 비율이 적혀 있는지, 원료 침향의 학명이 식약처 규격집에 등록된 Aquilaria agallocha Roxburgh인지, 산지와 원산지 증명·CITES·유전자 검사 같은 증빙 서류를 확인할 수 있는지 차례로 살펴보세요.',
    },
    {
      q: '침향환은 의약품인가요?',
      a: '아닙니다. 대라천 침향단과 기보단은 일반식품이며, 질병의 예방이나 치료를 목적으로 하는 의약품이 아닙니다.',
    },
  ],
  related: [
    { href: '/products/agarwood-chimhyangdan', label: '침향단', desc: '25년산 침향분말 10% 배합 전통 환' },
    { href: '/products/agarwood-gibodan', label: '기보단', desc: '25년산 침향·동충하초·제비집 복합환' },
    { href: '/agarwood-benefits', label: '침향 효능', desc: '전통 문헌과 현대 연구로 나눠 본 침향' },
    { href: '/about-agarwood', label: '침향이란?', desc: '학명·형성 과정·문헌으로 보는 침향' },
  ],
};
