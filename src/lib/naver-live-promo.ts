// /naver-live 홍보 영상과 장면 스토리보드 데이터 — 페이지(PromoFilm)·JSON-LD·sitemap 이 함께 쓴다.
// 장면 캡션·설명은 영상 자막에 나온 내용만 옮긴다 (임의 효능 문구 추가 금지).

/** 페이지 내용(영상·장면·편성)을 고치는 커밋에서 함께 올린다 — sitemap lastmod·IndexNow 근거. */
export const NAVER_LIVE_PAGE_UPDATED = '2026-11-26';

const BASE = '/naver-live';

export const PROMO_VIDEO = {
  src: `${BASE}/daracheon-oil-promo.mp4`,
  poster: `${BASE}/poster.jpg`,
  title: '대라천 참 침향오일 — 한 알에 담기까지',
  description:
    '베트남 직영농장의 침향나무에서 수지 부위를 골라 72시간 연속 증류하고, 재배시설·DNA 수종·식품안전 인증을 거쳐 캡슐 한 알에 담기까지를 담은 90초 영상입니다.',
  durationSec: 90,
  uploadDate: '2026-11-26',
};

export interface PromoScene {
  src: string;
  /** 영상 속 시점 (초) */
  at: number;
  caption: string;
}

export interface PromoChapter {
  title: string;
  desc: string;
  scenes: PromoScene[];
}

const scene = (file: string, at: number, caption: string): PromoScene => ({
  src: `${BASE}/${file}`,
  at,
  caption,
});

export const PROMO_CHAPTERS: PromoChapter[] = [
  {
    title: '원료',
    desc: '베트남산 아갈로차(Aquilaria agallocha Roxb.) 가운데 수지가 밴 부위만 씁니다.',
    scenes: [
      scene('agallocha.jpg', 6, '베트남산 아갈로차'),
      scene('resin.jpg', 30, '수지가 밴 침향 부위'),
    ],
  },
  {
    title: '직영 농장',
    desc: '베트남 직영농장 5곳에서 침향나무를 한 그루씩 번호를 붙여 이력을 관리합니다.',
    scenes: [
      scene('farm.jpg', 20, '베트남 직영농장 5곳'),
      scene('trace.jpg', 24, '침향나무 개체별 이력 관리'),
    ],
  },
  {
    title: '추출',
    desc: '목질을 걷어내고 수지 부위만 골라 72시간 연속 증류해 오일을 얻습니다.',
    scenes: [
      scene('select.jpg', 33, '목질 제거 · 수지 부위 선별'),
      scene('distill.jpg', 36, '72시간 연속 증류'),
      scene('oil.jpg', 39, '침향 오일'),
    ],
  },
  {
    title: '검증',
    desc: '재배시설 등록부터 DNA 수종 분석, 식품안전관리 인증까지 서류로 확인합니다.',
    scenes: [
      scene('facility.jpg', 48, '등록·관리되는 침향 재배시설'),
      scene('dna.jpg', 57, 'DNA 분석을 통한 침향 수종 확인'),
      scene('haccp.jpg', 63, 'HACCP · ISO 22000 · OCOP 4성'),
    ],
  },
  {
    title: '제품',
    desc: '그렇게 얻은 침향오일을 한 알에 담았습니다. 1캡슐당 침향오일 3mg.',
    scenes: [
      scene('capsule.jpg', 15, '한 알에 담기까지'),
      scene('dose.jpg', 75, '1캡슐당 침향오일 3mg'),
      scene('pack.jpg', 81, '대라천 참 침향오일'),
    ],
  },
];

/** sitemap 이미지 항목용 — 포스터 + 장면 스틸 전부. */
export const PROMO_IMAGES: string[] = [
  PROMO_VIDEO.poster,
  ...PROMO_CHAPTERS.flatMap((c) => c.scenes.map((s) => s.src)),
];
