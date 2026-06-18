/**
 * 제품 사용설명서(복용 가이드) 콘텐츠.
 * QR 스캔으로 들어온 고객(특히 포장 글씨가 작아 보기 어려운 분)을 위해
 * 복용법·원재료·보관·주의사항을 큰 글씨로 한곳에 모아 보여준다.
 *
 * ⚠️ 효능/기능성 표현은 식약처 광고 규제 대상이라 사실 정보 위주로 작성.
 *   기능성 문구를 넣으려면 승인된 표현만 사용할 것.
 * 향후 어드민 편집(제품 필드 연동)으로 확장 가능. 우선 캡슐부터.
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
    image:
      'https://xpklzng0qyaecv6i.public.blob.vercel-storage.com/uploads/products/cham-oil-capsule-2026-05/01-1i2ZoP2rT3PhgGMtyTXA8A8D6bh7AJPTk.jpg',
    tagline: '100% 아갈로차 침향오일 원액 3mL 함유',
    sections: [
      {
        title: '섭취 방법',
        body: [
          '1일 1회, 1캡슐을 충분한 물과 함께 그대로 삼켜 드세요.',
          '캡슐 1정에는 침향오일 원액이 정확히 3mL 들어 있습니다. (1일 권장 섭취량 2~3mL)',
          '식사와 관계없이 드실 수 있으며, 매일 같은 시간에 꾸준히 드시는 것을 권장합니다.',
        ],
      },
      {
        title: '주요 원재료',
        body: [
          '100% 유기농 침향오일 원액 (아갈로차 품종 · Aquilaria Agallocha Roxburgh)',
          '적송오일',
          '오메가3',
          '비타민E',
        ],
      },
      {
        title: '보관 방법',
        body: [
          '직사광선을 피하고 서늘하고 건조한 곳에 보관하세요.',
          '어린이의 손이 닿지 않는 곳에 보관하세요.',
          '개봉 후에는 가능한 빨리 드시고, 캡슐이 변색·변형된 경우 드시지 마세요.',
        ],
      },
      {
        title: '섭취 시 주의사항',
        body: [
          '특정 원재료에 알레르기가 있으신 분은 원재료를 확인하신 후 드세요.',
          '임신·수유 중이거나 질환으로 약을 복용 중이신 경우 전문가와 상담 후 드세요.',
          '섭취 중 이상 반응이 나타나면 섭취를 중단하고 전문가와 상담하세요.',
          '본 제품은 의약품이 아니며, 질병의 예방·치료를 위한 것이 아닙니다.',
        ],
      },
      {
        title: '제품 특징',
        body: [
          '100% 유기농 침향오일 원액에 적송오일·오메가3·비타민E를 더해, 체내 흡수와 일상 건강 관리에 맞춰 설계한 프리미엄 제품입니다.',
          '베트남 하띤성 직영 농장에서 25년간 직접 재배·관리한 아갈로차 품종 침향에서 추출한 원액을 사용합니다.',
        ],
      },
    ],
  },
];

export function getGuide(slug: string): ProductGuide | undefined {
  return productGuides.find((g) => g.slug === slug);
}
