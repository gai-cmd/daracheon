/**
 * 제품 사용설명서(제품상세) 콘텐츠.
 * QR 스캔으로 들어온 고객(특히 포장 글씨가 작아 보기 어려운 분)을 위해
 * 포장의 「식품 한글표시사항」을 큰 글씨로 그대로 옮겨 보여준다.
 *
 * ⚠️ 이 페이지는 실제 제품 포장의 표시사항을 "있는 그대로" 반영하는 것이 원칙.
 *   효능/기능성 표현은 식약처 광고 규제 대상이므로 임의로 추가하지 말 것.
 * 어드민(/admin/guide)에서 편집 가능 — 저장 시 blob 우선, 미설정 시 이 기본값.
 */

export interface GuideSection {
  title: string;
  /** 각 줄이 한 항목 (• 로 표시) */
  body: string[];
}

export interface ProductGuide {
  slug: string; // 제품 slug 와 일치 (제품 상세 → 가이드 앵커 연결)
  name: string;
  image?: string;
  tagline?: string;
  sections: GuideSection[];
}

export const productGuides: ProductGuide[] = [
  {
    slug: 'daerachoen-cham-agarwood-oil-capsule',
    name: '대라천 참침향 오일 캡슐',
    // 제품 상세(/products/daerachoen-cham-agarwood-oil-capsule)의 대표 이미지와 동일.
    image:
      'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/products/cham-oil-capsule-2026-05/05-1FBgKsB6OO4pEwZ62rbGcKvLyDbNwkZZv.jpg',
    tagline: '침향나무 수지가 침착된 수간목오일 3,000mcg 함유 · 507.5mg × 30캡슐',
    sections: [
      {
        title: '섭취 방법',
        body: [
          '1일 1회, 1회 1캡슐을 충분한 물과 함께 섭취하십시오.',
          '식사와 관계없이 드실 수 있으며, 매일 같은 시간에 꾸준히 드시는 것을 권장합니다.',
        ],
      },
      {
        title: '원재료명 및 함량',
        body: [
          '소나무오일 78.82%',
          '정제어유 (참다랑어오일)',
          '비타민E',
          '침향나무 수지가 침착된 수간목오일 0.59%',
          '캡슐기제: 젤라틴(돼지), 글리세린, D-소비톨(감미료), 에틸바닐린, 파라옥시안식향산메틸(보존료), 식용색소 적색 제102호(착색료)',
          '※ 돼지고기 함유',
        ],
      },
      {
        title: '제품 정보',
        body: [
          '제품명: 대라천 ‘참’ 침향 오일',
          '식품유형: 기타식용유지가공품',
          '내용량: 15.225g (507.5mg × 30캡슐)',
          '포장재질: 유리 (뚜껑 — 폴리프로필렌)',
        ],
      },
      {
        title: '보관 방법',
        body: [
          '직사광선을 피하고 서늘하고 건조한 곳에 보관하십시오.',
          '어린이의 손이 닿지 않는 곳에 보관하십시오.',
        ],
      },
      {
        title: '섭취 시 주의사항',
        body: [
          '제품의 모든 성분에 민감하신 분은 사용하지 마십시오.',
          '임신 또는 수유 중이신 분은 사용하지 마십시오.',
          '이 제품은 질병의 예방 및 치료를 위한 의약품이 아닙니다.',
          '구입 즉시 제품을 확인하시고, 이상이 있을 경우 섭취하지 마십시오.',
          '섭취량을 초과하여 섭취하지 마십시오.',
          '특이체질, 알레르기 체질인 분은 성분을 확인 후 섭취하십시오.',
          '품질 보증 기준에 따라 개봉 후에는 교환 및 환불이 불가합니다.',
          '부정·불량 식품은 국번 없이 1399로 신고할 수 있습니다.',
        ],
      },
      {
        title: '제조 및 수입원',
        body: [
          '수입원: 조엘라이프 주식회사 (서울특별시 금천구 벚꽃로36길 30, 제오 1511호)',
          '소비자상담실: 070-4140-4086',
          '제조국: 베트남',
          '제조원: VIHECO CENTRAL PHARMACEUTICAL JOINT STOCK COMPANY',
          '제조일자: 제품에 별도 표기 (NSX, 읽는 법: 일 / 월 / 년 순)',
          '소비기한: 제품에 별도 표기일까지 (HSD, 읽는 법: 일 / 월 / 년 순)',
        ],
      },
    ],
  },
];

export function getGuide(slug: string): ProductGuide | undefined {
  return productGuides.find((g) => g.slug === slug);
}
