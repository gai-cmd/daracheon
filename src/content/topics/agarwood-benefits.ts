import type { TopicHubContent } from '@/components/seo/TopicHub';

/* 근거: 이 파일의 사실 문장은 모두 아래 출처에서 가져와 다시 썼다 (2026-10-24 확인).
 *
 * [정의·학명]
 *  - https://zoellife.com/about-agarwood FAQ "침향이란 무엇인가요?" — 팥꽃나무과 Aquilaria, 수지가 쌓여 굳은 향목,
 *    대한민국약전외한약(생약)규격집 정의 "침향나무의 수지가 침착된 수간목"
 *  - 같은 페이지 FAQ "공식 침향의 학명" — Aquilaria agallocha Roxburgh, 식품공전 AAR + A. malaccensis Lam.
 *  - https://zoellife.com/blog/agarwood-agalloch — A. crassna·A. sinensis 등 종·산지에 따라 향·성분이 다름
 *
 * [전통 문헌] https://zoellife.com/about-agarwood '문헌에 실린 침향' 탭
 *  - 명의별록(약 500년, 도홍경): 상품 약재로 처음 수록
 *  - 동의보감(1613, 허준): 성질이 뜨겁고 맛이 매우며 독이 없음, 기를 통하게 하고 찬 기운을 몰아내며 몸을 따뜻하게 함
 *  - 본초강목(1578, 이시진): 정신 안정, 향기 요법, 위장 관련 기록
 *  - 일화자본초(송): 소화 기능, 기 순환, 복부 팽만 관련 기록
 *  - 경악전서(1624, 장개빈): 기를 아래로 내리고 울체된 기를 풂
 *  - 동의수세보원(1894, 이제마): 태음인 관련 기록
 *  - https://zoellife.com/blog/agarwood-sleep-and-nerve-research — 본초강목 등 정심(定心) 취지 기록
 *  - https://zoellife.com/blog/agarwood-and-sasang-constitution — 문헌은 옛 관점일 뿐 진단·치료 근거가 아님
 *
 * [현대 연구] (실험 대상은 각 글의 서술 기준)
 *  - 정서·수면 리뷰(Molecules 2022, 27(14) 4528): /blog/agarwood-oil-mental-health, /blog/agarwood-anxiety-depression-insomnia
 *    — 마우스 실험 중심, 침향 훈증(취향)을 병행한 소규모 사람 대상 연구 포함, "대부분 동물 실험과 소규모 관찰"
 *  - 진정 성분(Takemoto 2008 마우스 흡입 / Okugawa 1996 동물실험): /blog/agarwood-sleep-and-nerve-research
 *  - 신경세포 보호(Phytochemistry 237, 2025, A. agallocha 신규 세스퀴테르펜 12종, 코르티코스테론 손상 신경세포):
 *    /blog/stress-brain, /blog/new-agarwood-sesquiterpenes-protect-brain-neurons — "배양 접시 속 신경세포" 초기 연구
 *  - 염증 신규 성분(Phytochemistry 192, 2021, A. agallocha 신규 성분 11종, 대식세포 NO): /blog/agarwood-agalloch — 배양 세포
 *  - 나노에멀션 대식세포(Pathology - Research and Practice 251, 2023, RAW264.7):
 *    /blog/agarwood-nanoemulsion-anti-inflammatory-macrophages-lps, /blog/agarwood-oil-nanoemulsion-inflammation — 배양 세포
 *  - 나노에멀션 기도 상피세포(Nutrients 15(4) 1019, 2023, BCi-NS1.1 + 담배 연기 추출물):
 *    /blog/agarwood-nanoemulsion-protects-airway-cells-smoking — 배양 세포
 *  - 저산소 위·소장 손상(AMB Express 15:142, 2025): /blog/agarwood-oil-hypoxia-gut-study — 생쥐 실험
 *  - 당뇨 스코핑 리뷰(Pharmaceuticals 17(11) 1548, 2024, 2008~2024 연구): /blog/agarwood-extract-diabetes-metabolic-health-review
 *    — 시험관·동물 연구 종합, 인체 임상 단계 아님
 *  - 항산화·지방분해효소 저해(대구대, 한국식품저장유통학회지): /blog/agarwood-extract-obesity-antioxidant — 추출물 분획의 효소·라디칼 측정
 *  - 타이로시나제 억제(서울대 약학과 석사논문 2013): /blog/agarwood-skin-whitening-research — 시험관 효소 반응 측정
 *
 * [주의사항]
 *  - https://zoellife.com/guide · src/data/productGuides.ts:69-79 — 성분 민감자·임신/수유 중 섭취 금지, 의약품 아님,
 *    섭취량 초과 금지, 특이·알레르기 체질은 성분 확인, 이상 시 섭취 중지
 *  - data/db/products.json:112 (침향단) — 12세 미만 어린이·임신부·수유부·과민증 있는 사람 사용 금지
 *  - data/db/faq.json:46-47 — 침향단·침향선향 등 일부 제품 12세 미만·임산부·수유부 권장 안 함
 *  - data/db/products.json:33 (오일 캡슐) — 성분 과민증·임산부·수유부 사용 금지
 *  - /blog/agarwood-sleep-and-nerve-research 고지문 — 일반식품, 개인차, 건강 상태에 따라 전문가 상담
 *
 * [일반식품 고지] /guide "이 제품은 질병의 예방 및 치료를 위한 의약품이 아닙니다", data/db/products.json:115 "일반식품"
 *
 * 부작용 사례·안전 용량을 다룬 출처는 사이트에 없어 쓰지 않았다. 효능은 단정하지 않고 보고·기록 형태로만 적는다.
 *
 * [표시·광고 검토 반영 2026-10-24] 일반식품 원료 페이지이므로
 *  - 침향을 '약재'로 부르지 않고, 문헌의 작용·증상·체질 보완 서술은 뺐다(문헌 이름과 '기록이 있다' 수준만).
 *  - 연구 항목에서 질병명을 빼고 측정한 지표만 적었다. 복합 처방(침향곡) 동물 연구는 침향 단독 연구가 아니어서 뺐다.
 *  - 효능 정보 옆에 제품 영역·제품 목록 링크를 두지 않는다(page.tsx·TopicHub 의 productsTitle 생략 참고).
 */
const BLOB = 'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com';

export const AGARWOOD_BENEFITS_NOTICE =
  '대라천 침향 식품은 일반식품이며 질병의 예방·치료를 목적으로 하는 의약품이 아닙니다.';

export const AGARWOOD_BENEFITS: TopicHubContent = {
  path: '/agarwood-benefits',
  breadcrumbName: '침향 효능',
  kicker: '침향 효능 · Agarwood Benefits',
  h1: '침향 효능 총정리,',
  h1Em: '전통 문헌과 현대 연구로 나눠 보기',
  lede:
    '침향의 효능으로 알려진 내용은 크게 두 갈래입니다. 옛 의서에 남은 기록, 그리고 세포·동물 실험을 중심으로 한 현대 연구입니다. 두 가지를 섞지 않고 나눠서, 각 연구가 무엇을 대상으로 했는지까지 정리했습니다. ' +
    AGARWOOD_BENEFITS_NOTICE,
  heroImage: {
    src: `${BLOB}/pages/hero/agarwood-definition.png`,
    alt: '침향 효능 — 식약처 고시 학명 Aquilaria agallocha Roxburgh 침향',
  },
  headline: '침향 효능 총정리 — 과학 연구와 전통 문헌으로 본 침향의 효과',
  description:
    '동의보감·본초강목 등 전통 문헌에 실린 침향 기록과, 세포·동물 실험 중심의 현대 연구를 실험 대상(세포·동물·사람)별로 나눠 정리. 섭취 시 주의사항과 자주 묻는 질문.',
  about: {
    name: '침향',
    alternateName: ['침향 효능', '沈香', 'Agarwood', 'Aquilaria agallocha Roxburgh'],
  },
  datePublished: '2026-10-24',
  dateModified: '2026-10-24',
  sections: [
    {
      id: 'what',
      num: '01',
      tag: 'Definition',
      title: '침향이란 무엇인가요?',
      lead: '나무가 상처에 맞서 만든 수지가 오랜 세월 쌓여 굳은 향목입니다.',
      paragraphs: [
        '침향(沈香)은 팥꽃나무과 Aquilaria 나무가 외부 상처나 곰팡이 감염에 맞서 분비한 수지가 나무 속에 오랫동안 쌓여 굳은 것입니다. 식약처 고시 대한민국약전외한약(생약)규격집은 침향을 "침향나무의 수지가 침착된 수간목"으로 정의합니다.',
        '이 규격집에 침향으로 올라 있는 학명은 Aquilaria agallocha Roxburgh(아퀼라리아 아갈로차 록스버그)이며, 식품공전에는 이 품종과 Aquilaria malaccensis Lam.이 식용 원료로 등록돼 있습니다. 침향을 만드는 Aquilaria 나무는 여러 종이 있고 종과 산지에 따라 향과 성분이 다르기 때문에, 효능을 다룬 연구를 읽을 때도 어떤 품종을 썼는지 함께 살펴볼 필요가 있습니다.',
      ],
      links: [{ href: '/about-agarwood', label: '침향이란? 학명·형성 과정 자세히' }],
    },
    {
      id: 'classics',
      num: '02',
      tag: 'Classics',
      title: '전통 문헌에는 어떻게 기록돼 있나요?',
      lead: '한국과 중국의 옛 의서에는 침향의 성질과 쓰임에 관한 기록이 남아 있습니다.',
      paragraphs: [
        '침향은 한국과 중국의 여러 옛 의서에 이름이 올라 있습니다. 아래는 대라천이 \'침향이란?\' 페이지에 정리한 문헌 가운데 대표적인 기록입니다.',
      ],
      steps: [
        { label: '약 500년', title: '명의별록(名醫別錄) — 도홍경', desc: '침향이 처음 수록된 문헌으로 소개됩니다.' },
        { label: '1578년', title: '본초강목(本草綱目) — 이시진', desc: '침향의 향과 쓰임에 관한 기록이 실려 있습니다.' },
        { label: '1613년', title: '동의보감(東醫寶鑑) — 허준', desc: '성질이 뜨겁고 맛이 매우며 독이 없다고 적혀 있습니다.' },
        { label: '1624년', title: '경악전서(景岳全書) — 장개빈', desc: '침향에 관한 기록이 있습니다.' },
        { label: '송나라', title: '일화자본초(日華子本草)', desc: '송나라 때의 문헌으로, 침향에 관한 기록이 있습니다.' },
        { label: '1894년', title: '동의수세보원(東醫壽世保元) — 이제마', desc: '사상의학 문헌에서 태음인과 관련해 언급됩니다.' },
      ],
      blocks: [
        {
          title: '문헌 기록을 읽을 때',
          paragraphs: [
            '이 기록들은 옛 의학이 침향을 어떻게 이해했는지 보여 주는 자료이며, 현대 의학의 진단이나 치료 기준과는 다릅니다. 체질이나 건강 상태에 대한 판단은 한의사 등 전문가에게 맡기는 것이 바람직합니다.',
          ],
        },
      ],
      links: [
        { href: '/about-agarwood', label: '문헌에 실린 침향 전체 보기' },
        { href: '/blog/agarwood-and-sasang-constitution', label: '사상의학이 바라본 침향' },
      ],
    },
    {
      id: 'research',
      num: '03',
      tag: 'Research',
      title: '현대 연구에서는 무엇이 보고됐나요?',
      lead: '대부분 세포·동물 단계의 연구이며, 사람 대상 근거는 아직 제한적입니다.',
      paragraphs: [
        '최근 국제 학술지에는 침향의 성분과 생리활성을 다룬 논문이 꾸준히 실리고 있습니다. 다만 배양 세포나 동물에서 관찰된 결과가 사람에게도 똑같이 나타난다는 뜻은 아닙니다. 아래에서는 대라천 블로그가 소개한 연구를 분야별로 묶고, 각 연구가 무엇을 대상으로 했는지 함께 적었습니다.',
      ],
      blocks: [
        {
          title: '신경·수면·정서',
          bullets: [
            '향기 성분과 행동 지표 리뷰 (Molecules, 2022) — 마우스의 행동 지표를 중심으로 침향 오일 향 성분 연구를 정리한 논문입니다. 마우스 실험이 중심이고, 침향 훈증을 병행한 소규모 사람 대상 연구도 포함돼 있으나 아직 동물 실험과 소규모 관찰에 기대고 있다고 소개됐습니다.',
            '진정 작용 성분 (Journal of Natural Medicines, 2008 / Planta Medica, 1996) — 침향 정유 성분인 벤질아세톤은 마우스 흡입 실험에서, 아가로스피롤은 동물실험에서 진정과 관련된 작용이 보고됐습니다.',
            '신경세포 보호 (Phytochemistry, 2025) — Aquilaria agallocha 침향에서 새로 분리한 세스퀴테르펜 12종 가운데 일부가, 스트레스 호르몬(코르티코스테론)으로 손상시킨 배양 신경세포의 생존을 도운 것으로 보고됐습니다. 배양 세포 단계의 초기 연구입니다.',
          ],
        },
        {
          title: '염증·호흡기',
          bullets: [
            '신규 성분의 염증 지표 억제 (Phytochemistry, 2021) — Aquilaria agallocha 침향 수지에서 새 성분 11종을 분리했고, 그중 2종이 자극한 면역세포(대식세포)의 산화질소 생성을 줄였다고 보고됐습니다. 배양 세포 실험입니다.',
            '침향 오일 나노에멀션과 면역세포 (Pathology - Research and Practice, 2023) — 침향 오일을 나노 크기로 만든 제형이, 세균 독소(LPS)로 자극한 마우스 대식세포에서 활성산소와 염증 관련 유전자 발현을 낮췄다고 보고됐습니다. 배양 세포 실험입니다.',
            '침향 오일 나노에멀션과 기도 세포 (Nutrients, 2023) — 담배 연기 추출물로 손상시킨 사람 기도 상피세포주(BCi-NS1.1)에서 염증 지표를 낮추고 항산화 관련 유전자 발현을 높였다고 보고됐습니다. 사람에게서 얻은 세포를 배양한 실험이며, 사람 대상 시험은 아닙니다.',
          ],
        },
        {
          title: '소화·장',
          bullets: [
            '저산소 환경의 위·소장 지표 (AMB Express, 2025) — 고산과 비슷한 저산소 환경에 둔 생쥐를 대상으로 위·소장 점막 상태, 산화 지표, 장내 세균 다양성을 측정한 동물 실험입니다.',
          ],
        },
        {
          title: '대사',
          bullets: [
            '탄수화물 분해효소·항산화 지표 연구 종합 (Pharmaceuticals, 2024) — 시험관·동물 연구에서 측정된 효소 억제·항산화 지표를 정리한 리뷰이며, 인체 연구는 포함되지 않았습니다.',
            '항산화·지방분해효소 저해 (한국식품저장유통학회지, 대구대 연구팀) — 침향 추출물을 분획해 활성산소 제거 능력과 췌장 지방분해효소 저해 활성을 측정한 실험실 연구입니다.',
          ],
        },
        {
          title: '피부',
          bullets: [
            '색소 효소 억제 (서울대 약학과 석사 학위논문, 2013) — 침향에서 분리한 크로몬 유도체 6종이 멜라닌 생성에 관여하는 효소 타이로시나제를 억제하는 특성을 보였습니다. 시험관에서 효소 반응을 측정한 연구로, 침향을 바르면 미백이 된다는 뜻은 아닙니다.',
          ],
        },
        {
          paragraphs: [AGARWOOD_BENEFITS_NOTICE],
        },
      ],
      links: [
        { href: '/blog/category/agarwood-science', label: '침향 과학·연구 글 전체 보기' },
        { href: '/blog/agarwood-sleep-and-nerve-research', label: '침향과 잠 — 수면·신경 연구' },
        { href: '/blog/agarwood-oil-hypoxia-gut-study', label: '침향 오일과 위·장 연구' },
        { href: '/blog/agarwood-extract-diabetes-metabolic-health-review', label: '침향과 대사 연구 리뷰' },
      ],
    },
    {
      id: 'caution',
      num: '04',
      tag: 'Caution',
      title: '부작용·주의사항 — 이런 분은 확인하세요',
      lead: '대라천 제품 표시사항에 적힌 섭취 시 주의사항입니다.',
      blocks: [
        {
          title: '섭취하지 않아야 하는 경우',
          bullets: [
            '임신 중이거나 수유 중인 분',
            '제품 성분에 과민증이 있거나 민감한 분',
            '침향단 등 일부 제품은 12세 미만 어린이에게 권장하지 않습니다.',
          ],
        },
        {
          title: '섭취할 때 지켜야 할 점',
          bullets: [
            '제품에 표시된 섭취량을 넘기지 마세요.',
            '특이체질이거나 알레르기 체질이라면 성분을 먼저 확인하세요.',
            '구입 후 제품에 이상이 있으면 섭취하지 마세요.',
            '건강 상태에 따라 효과와 반응에는 개인차가 있으니, 질환이 있거나 약을 복용 중이라면 전문가와 먼저 상담하세요.',
          ],
        },
      ],
      links: [{ href: '/guide', label: '제품별 섭취·보관 가이드' }],
    },
    {
      id: 'notice',
      num: '05',
      tag: 'Notice',
      title: '침향 식품은 의약품이 아닙니다',
      lead: AGARWOOD_BENEFITS_NOTICE,
      paragraphs: [
        '이 페이지는 침향에 관한 전통 문헌과 공개된 학술 연구를 소개하기 위한 정보 콘텐츠입니다. 소개한 문헌과 연구 내용은 각 출처의 기록이며, 특정 효과를 보장하지 않습니다.',
      ],
      links: [
        { href: '/about-agarwood', label: '침향이란?' },
        { href: '/agarwood-oil', label: '침향 오일 — 만드는 법·고르는 법' },
      ],
    },
  ],
  faqTitle: '침향 효능 자주 묻는 질문',
  faq: [
    {
      q: '침향의 효능은 무엇인가요?',
      a: '전통 문헌에는 침향의 성질과 쓰임에 관한 기록이 있고, 현대 연구는 침향 성분을 세포·동물 수준에서 다루고 있습니다. 사람 대상 근거는 제한적입니다.',
    },
    {
      q: '침향 효능은 과학적으로 입증됐나요?',
      a: '아직 입증됐다고 말하기는 어렵습니다. 현재 보고된 연구는 배양 세포와 동물 실험이 대부분이고, 사람을 대상으로 한 연구는 소규모에 그칩니다. 세포·동물에서 관찰된 결과가 사람에게 그대로 나타난다는 뜻은 아닙니다.',
    },
    {
      q: '침향과 수면에 관한 기록과 연구가 있나요?',
      a: '본초강목 등 일부 문헌에 침향에 관한 기록이 있고, 침향 정유 성분인 벤질아세톤은 마우스 흡입 실험에서 진정 작용이 보고됐습니다. 다만 동물 실험과 소규모 관찰 단계의 결과이며, 사람에게 같은 결과가 나타난다는 뜻은 아닙니다.',
    },
    {
      q: '침향을 먹으면 안 되는 사람이 있나요?',
      a: '대라천 제품 표시사항에 따르면 임신·수유 중인 분, 제품 성분에 과민증이 있는 분은 섭취하지 않아야 합니다. 침향단 등 일부 제품은 12세 미만 어린이에게 권장하지 않으며, 특이체질·알레르기 체질이라면 성분을 먼저 확인하세요.',
    },
    {
      q: '연구에 쓰인 침향과 시중 침향은 같은 품종인가요?',
      a: '연구마다 다릅니다. 침향을 만드는 Aquilaria 나무는 여러 종이 있고 종과 산지에 따라 성분이 다릅니다. 식약처 고시 규격집의 학명은 Aquilaria agallocha Roxburgh이며, 2021년·2025년 Phytochemistry 연구는 이 아갈로차 침향을 시료로 썼습니다. 제품을 고를 때는 원료 학명 표기를 확인하세요.',
    },
    {
      q: '침향 제품은 의약품인가요?',
      a: '아닙니다. 대라천 침향 식품은 일반식품이며, 질병의 예방이나 치료를 목적으로 하는 의약품이 아닙니다.',
    },
  ],
  related: [
    { href: '/about-agarwood', label: '침향이란?', desc: '학명·형성 과정·문헌·논문으로 보는 침향' },
    { href: '/agarwood-oil', label: '침향 오일', desc: '72시간 증류로 만드는 침향 오일, 고르는 법과 사용법' },
    { href: '/vietnam-agarwood', label: '베트남 침향', desc: '고문헌이 기록한 침향의 주산지와 5개 직영 농장' },
  ],
};
