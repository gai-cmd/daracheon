import type { TopicHubContent } from '@/components/seo/TopicHub';

/* 근거: 이 파일의 사실 문장은 모두 아래 출처에서 가져와 다시 썼다 (2026-10-24 확인, 운영 제품 페이지와 시드 데이터 일치 확인).
 *
 * [제품 분류]
 *  - data/db/productCategories.json:23-24 — 카테고리 id '차' = 라벨 '침향차'
 *  - data/db/products.json:194, 301 — 침향 파라미냐차·침향차·수 세트 category '차'
 *
 * [침향 파라미냐차] data/db/products.json (= https://zoellife.com/products/agarwood-paramignya-tea)
 *  - :200 25년산 침향과 베트남 전통차 파라미냐(Paramignya)를 블렌딩한 허브티, 뜨거운 물 90ml에 1포, 먼저 취향한 후 천천히 우려 3탕까지
 *  - :207 Bồ Tát Hương 베트남 전통 약초 / :210 성분 침향 25년산, 파라미냐(베트남 전통차)
 *  - :211 1포 2.5g × 30포(1박스 75g) / :212 소비기한 4년 / :213 음용법 / :214 보관방법 / :215 Organic, HACCP, OCOP / :206 일반식품
 *  - :199 대표 이미지(Blob)
 *
 * [침향차·수 세트] data/db/products.json (= https://zoellife.com/products/agarwood-tea-water-set)
 *  - :307 침향차와 100% 침향수 세트, 침향차 1포에 침향수 10ml를 붓고 충분히 적신 뒤 뜨거운 물 70ml로 우리면 첫 탕의 향이 가장 풍부
 *  - :311 첫 탕 취향 필수 — 3탕까지 / :312 기프트 박스 포장 / :317 성분 침향차(25년산 침향 100%), 침향수 100%
 *  - :318 침향차 1.5g × 10포, 침향수 100ml 1병 / :319 소비기한 2년 / :320 음용법 / :321 보관방법 / :322 인증
 *
 * [침향수 개봉 후 보관] data/db/products.json:173 (침향수 단품, 개봉 후 냉장 보관) · data/db/faq.json:53 (침향수는 개봉 후 냉장 보관)
 *
 * [침향스틱] data/db/products.json (= https://zoellife.com/products/agarwood-stick-100g)
 *  - :237 25년산 침향 원목을 자연 그대로 절단한 100g 스틱, 조금씩 잘라 온열판에 올려 취향하거나 차를 내려 음용
 *  - :242 차로 우려 음용 가능 / :243 오래될수록 풍미가 깊어짐 / :247 성분 침향 100%(25년산) / :248 포장 침향 원목 100g
 *  - :249 소비기한 4년(오래될수록 좋음) / :250 사용법 / :251 보관방법 / :252 인증
 *    (차로 우릴 때의 양·물 온도·시간은 표시사항에 없어 적지 않았다)
 *
 * [입문 추천] data/db/faq.json:41 — 음료로 즐기고 싶다면 침향 파라미냐차 30포 추천
 *
 * [침향을 차로 즐기는 문화]
 *  - https://zoellife.com/blog/agarwood-and-sasang-constitution — 침향은 누구나 향과 문화를 즐기는 방식으로 만날 수 있다(침향차·선향),
 *    고를 땐 학명·산지·인증서 같은 확인 가능한 사실부터
 *  - https://zoellife.com/blog/stress-brain — 침향을 태우거나 달여 쓰던 기록이 남아 있다 (효능 문장은 옮기지 않았다)
 *  - https://zoellife.com/about-agarwood 논문 목록 '침향 성분의 약리학적 개요 및 독성'(EDUCATUM J. Sci. Math. Technol., 2021) 요약
 *    (data/db/pages.json aboutAgarwood.papers[6]) — 잎·줄기·껍질·뿌리 등이 우드 오일·침향차·향 같은 제품에 활용 (같은 요약의 약리 효과 나열은 옮기지 않았다)
 *
 * [원료] data/db/faq.json:11 — 베트남 5개 지역 직영 농장, Aquilaria agallocha Roxburgh / faq.json:17 — 식약처 문서에 등록된 학명
 *
 * [주의·고지]
 *  - data/db/faq.json:47 — 일부 제품은 12세 미만·임산부·수유부 권장 안 함, 침향 성분 과민증, 제품별 주의사항 확인
 *  - https://zoellife.com/blog/3-questions-before-buying-agarwood 고지문 — 개인차, 건강 상태에 따라 전문가 상담
 *  - https://zoellife.com/blog/real-agarwood-3-criteria 고지문 — 침향은 건강기능식품법상 기능성 원료가 아닌 일반식품 원료
 *  - https://zoellife.com/guide — "이 제품은 질병의 예방 및 치료를 위한 의약품이 아닙니다"
 *
 * 뺀 내용(사이트에 출처가 없음): 물 온도(°C)·우리는 시간, 하루 마시는 횟수·양, 침향차 전용 주의 문구, 파라미냐의 성분·효능,
 * 침향차의 효능, 카페인 유무, 다른 회사 침향차 비교. 가격은 바뀌는 값이라 본문에 박지 않고 제품 페이지로 넘겼다.
 * edition 시드(src/content/edition/agarwood.ko.ts:117)의 '25~30개 조각' 음용법은 현재 제품 표시사항(1포 단위)과 달라 쓰지 않았다.
 */
const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

export const AGARWOOD_TEA_NOTICE =
  '침향 제품은 일반식품이며 질병의 예방·치료를 목적으로 하는 의약품이 아닙니다.';

export const AGARWOOD_TEA: TopicHubContent = {
  path: '/agarwood-tea',
  breadcrumbName: '침향차',
  kicker: '침향차 · Agarwood Tea',
  h1: '침향차 우리는 법,',
  h1Em: '고르는 법까지 한 번에',
  lede:
    '침향차는 침향을 뜨거운 물에 우려 향과 함께 즐기는 차입니다. 대라천에는 침향 파라미냐차와 침향차·수 세트 두 가지 침향차가 있고, 원목 침향스틱도 차로 우려 마실 수 있습니다. 제품마다 물 양과 우리는 방식이 다르니, 아래에 제품 표시사항 그대로 정리했습니다. ' +
    AGARWOOD_TEA_NOTICE,
  heroImage: {
    src: `${BLOB}/uploads/products/p5-tea-paramignya-T1-product-1778032778675.png`,
    alt: '침향 파라미냐차(沈香茶) — 25년산 침향과 베트남 전통차 파라미냐를 블렌딩한 대라천 침향차',
  },
  headline: '침향차 우리는 법·고르는 법',
  description:
    '대라천 침향차 종류(침향 파라미냐차·침향차·수 세트·침향스틱), 제품별 물 양과 3탕까지 우리는 법, 중량·구성·소비기한 비교, 보관법과 주의사항.',
  about: {
    name: '침향차',
    alternateName: ['沈香茶', '침향 차', 'Agarwood tea'],
  },
  datePublished: '2026-10-24',
  dateModified: '2026-10-24',
  sections: [
    {
      id: 'what',
      num: '01',
      tag: 'Definition',
      title: '침향차는 어떤 차인가요?',
      lead: '침향을 우려 향과 맛을 함께 즐기는 일반식품입니다.',
      paragraphs: [
        '침향은 예부터 태우거나 달여 쓰던 기록이 남아 있는 재료입니다. 오늘날에도 우드 오일·향과 함께 차로 만들어 쓰이며, 대라천 블로그는 침향을 \'약\'으로 찾기보다 침향차나 선향처럼 향과 문화를 즐기는 방식으로 만나 보길 권합니다.',
        '대라천은 침향을 넣은 차 제품을 \'침향차\'로 분류하며, 여기에 침향 파라미냐차와 침향차·수 세트가 있습니다. 두 제품 모두 Organic·HACCP·OCOP 인증을 받은 일반식품입니다.',
      ],
      blocks: [
        {
          title: '침향 파라미냐차(沈香茶)',
          paragraphs: [
            '25년산 침향에 베트남 전통차 파라미냐(Paramignya)를 블렌딩한 허브티입니다. 제품 정보에는 파라미냐가 \'Bồ Tát Hương\'이라는 베트남 전통 약초로 소개돼 있습니다. 1포 2.5g으로, 한 박스에 30포(총 75g)가 들어 있습니다.',
          ],
        },
        {
          title: '침향차·수 세트(沈香茶·水)',
          paragraphs: [
            '25년산 침향 100%로 만든 침향차 10포와 침향수(100%) 100ml 1병을 함께 담은 기프트 세트입니다. 침향수로 침향차를 먼저 적신 뒤 우리는 방식이 특징입니다.',
          ],
        },
        {
          title: '침향스틱(沈香片)',
          paragraphs: [
            '25년산 침향 원목을 자연 그대로 잘라 만든 100g 스틱입니다. 차 전용 제품은 아니지만, 조금씩 잘라 온열판에 올려 향을 즐기거나 차로 우려 마실 수 있다고 안내합니다.',
          ],
        },
      ],
      links: [
        { href: '/products/agarwood-paramignya-tea', label: '침향 파라미냐차 제품 정보 보기' },
        { href: '/products/agarwood-tea-water-set', label: '침향차·수 세트 제품 정보 보기' },
        { href: '/products/agarwood-stick-100g', label: '침향스틱 100g 제품 정보 보기' },
      ],
    },
    {
      id: 'brew',
      num: '02',
      tag: 'How to brew',
      title: '침향차 우리는 법',
      lead: '제품마다 물 양이 다릅니다. 표시된 음용법을 그대로 옮겼습니다.',
      steps: [
        {
          label: '파라미냐차',
          title: '뜨거운 물 90ml에 1포',
          desc: '뜨거운 물 90ml에 1포를 넣습니다. 먼저 향을 즐긴 뒤 천천히 우려 마시고, 같은 1포로 3탕까지 우릴 수 있습니다.',
        },
        {
          label: '차·수 세트 ①',
          title: '침향수 10ml로 적시기',
          desc: '침향차 1포에 침향수 10ml를 붓고 충분히 적십니다.',
        },
        {
          label: '차·수 세트 ②',
          title: '뜨거운 물 70ml로 우리기',
          desc: '적신 침향차에 뜨거운 물 70ml를 부어 우립니다. 첫 탕의 향이 가장 풍부하므로 첫 탕은 꼭 향을 먼저 즐기도록 안내하며, 3탕까지 우릴 수 있습니다.',
        },
        {
          label: '침향스틱',
          title: '조금 잘라 차로',
          desc: '원목을 소량 잘라 차로 우려 마실 수 있습니다. 물 양과 우리는 시간은 제품 표시사항에 따로 적혀 있지 않습니다.',
        },
      ],
      links: [
        { href: '/products/agarwood-paramignya-tea', label: '파라미냐차 음용법 자세히' },
        { href: '/products/agarwood-tea-water-set', label: '침향차·수 세트 음용법 자세히' },
      ],
    },
    {
      id: 'compare',
      num: '03',
      tag: 'Compare',
      title: '대라천 침향차 비교',
      lead: '중량·구성·소비기한을 같은 항목으로 나란히 놓았습니다.',
      table: {
        caption: '대라천 침향차·침향스틱 제품 정보 비교 (제품 소개 표시 기준)',
        head: ['항목', '침향 파라미냐차', '침향차·수 세트', '침향스틱'],
        rows: [
          ['원료', '침향 25년산 + 파라미냐(베트남 전통차)', '침향차(25년산 침향 100%) + 침향수(100%)', '침향 100%(25년산 원목)'],
          ['구성', '1포 2.5g × 30포 (1박스 75g)', '침향차 1.5g × 10포 + 침향수 100ml 1병', '침향 원목 100g'],
          ['1회 물 양', '뜨거운 물 90ml', '침향수 10ml + 뜨거운 물 70ml', '표시 없음'],
          ['우리는 횟수', '1포로 3탕까지', '3탕까지', '표시 없음'],
          ['소비기한', '4년', '2년', '4년 (오래될수록 좋음)'],
          ['포장·용도', '박스', '기프트 박스', '취향·차 겸용'],
          ['인증', 'Organic, HACCP, OCOP', 'Organic, HACCP, OCOP', 'Organic, HACCP, OCOP'],
        ],
      },
      blocks: [
        {
          title: '어떤 걸 고를까요?',
          bullets: [
            '매일 편하게 마시려면 — 30포가 든 침향 파라미냐차. 대라천도 음료로 침향을 처음 즐기는 분께 이 제품을 권합니다.',
            '선물하거나 침향 100% 차를 원하면 — 침향차와 침향수를 함께 담은 침향차·수 세트.',
            '향과 차를 함께 쓰려면 — 원목을 잘라 온열판 취향과 차에 모두 쓸 수 있는 침향스틱 100g.',
          ],
        },
        {
          paragraphs: ['가격과 재고는 바뀔 수 있어 각 제품 페이지에서 확인해 주세요.'],
        },
      ],
      links: [
        { href: '/products/agarwood-paramignya-tea', label: '침향 파라미냐차 보러 가기' },
        { href: '/products/agarwood-tea-water-set', label: '침향차·수 세트 보러 가기' },
        { href: '/products/agarwood-stick-100g', label: '침향스틱 100g 보러 가기' },
      ],
    },
    {
      id: 'choose',
      num: '04',
      tag: 'How to choose',
      title: '침향차 고를 때 확인할 것',
      lead: '이름보다 표시사항과 원료 정보를 봅니다.',
      blocks: [
        {
          bullets: [
            '원재료 구성 — 침향만 쓴 차인지, 다른 차와 블렌딩한 차인지 성분 표시를 봅니다. 파라미냐차는 침향과 파라미냐 블렌드, 세트의 침향차는 25년산 침향 100%입니다.',
            '원료 침향의 학명과 산지 — 식약처 문서에 등록된 학명은 Aquilaria agallocha Roxburgh입니다. 대라천 침향은 이 품종을 베트남 5개 지역 직영 농장에서 기릅니다.',
            '1포 중량과 음용법 — 1포가 몇 g인지, 물을 얼마나 붓고 몇 탕까지 우리는지 적혀 있는지 확인합니다.',
            '인증과 소비기한 — 인증 표시와 소비기한이 함께 적혀 있는지 봅니다.',
          ],
        },
      ],
      links: [
        { href: '/blog/3-questions-before-buying-agarwood', label: '침향 살 때 물어볼 3가지' },
        { href: '/blog/mfds-defines-agarwood-as-aquilaria-agallocha', label: '식약처 문서에 정의된 침향 품종' },
        { href: '/vietnam-agarwood', label: '베트남 침향과 5개 직영 농장' },
      ],
    },
    {
      id: 'storage',
      num: '05',
      tag: 'Storage',
      title: '보관법과 소비기한',
      lead: '세 제품 모두 직사광선을 피해 서늘하고 건조한 곳에 둡니다.',
      blocks: [
        {
          bullets: [
            '침향 파라미냐차 — 소비기한 4년.',
            '침향차·수 세트 — 소비기한 2년. 함께 든 침향수는 개봉한 뒤 냉장 보관하도록 안내합니다.',
            '침향스틱 — 소비기한 4년이며, 제품 정보에는 오래될수록 풍미가 깊어진다고 적혀 있습니다.',
          ],
        },
      ],
    },
    {
      id: 'caution',
      num: '06',
      tag: 'Caution',
      title: '마시기 전 주의사항',
      lead: '제품별 포장의 주의사항을 먼저 확인하세요.',
      blocks: [
        {
          bullets: [
            '대라천은 일부 침향 제품을 12세 미만 어린이, 임산부와 수유부에게 권하지 않습니다.',
            '침향 성분에 과민증이 있다면 드시지 마세요.',
            '건강 상태에 따라 반응에는 개인차가 있습니다. 질환이 있거나 약을 복용 중이라면 전문가와 먼저 상담하세요.',
          ],
        },
      ],
      links: [{ href: '/agarwood-benefits#caution', label: '침향 섭취 시 주의사항 더 보기' }],
    },
    {
      id: 'notice',
      num: '07',
      tag: 'Notice',
      title: '침향차는 의약품이 아닙니다',
      lead: AGARWOOD_TEA_NOTICE,
      paragraphs: [
        '침향은 「건강기능식품에 관한 법률」상 기능성 원료로 인정된 원료가 아닌 일반식품 원료입니다. 침향차는 향과 맛을 즐기는 차로 드시고, 건강이 걱정된다면 전문가와 상담하세요.',
      ],
      links: [
        { href: '/about-agarwood', label: '침향이란? 학명·문헌 자세히' },
      ],
    },
  ],
  productsTitle: '대라천 침향차',
  productsLead: 'Aquilaria agallocha Roxburgh 25년산 침향으로 만든 대라천의 차 제품과 차로도 쓰는 침향스틱입니다.',
  faqTitle: '침향차 자주 묻는 질문',
  faq: [
    {
      q: '대라천 침향차에는 어떤 종류가 있나요?',
      a: '25년산 침향과 베트남 전통차 파라미냐를 블렌딩한 침향 파라미냐차(2.5g × 30포), 25년산 침향 100% 침향차 10포와 침향수 100ml를 함께 담은 침향차·수 세트가 있습니다. 원목 침향스틱 100g도 차로 우려 마실 수 있습니다.',
    },
    {
      q: '침향 파라미냐차는 어떻게 우리나요?',
      a: '1포를 뜨거운 물 90ml에 넣고 먼저 향을 즐긴 뒤 천천히 우려 마십니다. 같은 1포로 3탕까지 우릴 수 있습니다.',
    },
    {
      q: '침향차·수 세트는 어떻게 마시나요?',
      a: '침향차 1포에 침향수 10ml를 붓고 충분히 적신 다음, 뜨거운 물 70ml로 우립니다. 첫 탕의 향이 가장 풍부하고, 3탕까지 우릴 수 있습니다.',
    },
    {
      q: '침향스틱으로도 차를 만들 수 있나요?',
      a: '네. 침향스틱은 25년산 침향 원목 100g으로, 소량 잘라 온열판에서 향을 즐기거나 차로 우려 마실 수 있습니다. 차로 쓸 때의 물 양과 우리는 시간은 표시사항에 따로 적혀 있지 않습니다.',
    },
    {
      q: '침향차는 어떻게 보관하나요?',
      a: '직사광선을 피해 서늘하고 건조한 곳에 보관합니다. 소비기한은 파라미냐차 4년, 침향차·수 세트 2년이며, 세트의 침향수는 개봉 후 냉장 보관해 주세요.',
    },
    {
      q: '침향차는 의약품인가요?',
      a: '아닙니다. 대라천 침향차는 일반식품이며, 질병의 예방이나 치료를 목적으로 하는 의약품이 아닙니다.',
    },
  ],
  related: [
    { href: '/products/agarwood-paramignya-tea', label: '침향 파라미냐차', desc: '25년산 침향 + 베트남 전통차 파라미냐, 30포' },
    { href: '/products/agarwood-tea-water-set', label: '침향차·수 세트', desc: '침향차 10포 + 침향수 100ml 기프트 세트' },
    { href: '/products/agarwood-stick-100g', label: '침향스틱 100g', desc: '25년산 침향 원목 — 취향·차 겸용' },
    { href: '/agarwood-benefits#caution', label: '침향 섭취 주의사항', desc: '섭취하지 않아야 하는 경우와 지켜야 할 점' },
  ],
};
