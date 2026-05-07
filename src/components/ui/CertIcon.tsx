import type { ReactNode } from 'react';

// 12개 인증을 인라인 SVG 메달리온 썸네일로 렌더링.
// 외부 CDN 의존 없음 — 번들에 그대로 포함되어 항상 표시됨.

type ThumbKey =
  | 'cites'
  | 'haccp'
  | 'gmp'
  | 'organic'
  | 'origin'
  | 'mfds'
  | 'iso'
  | 'fda'
  | 'gov'
  | 'aar'
  | 'wildlife'
  | 'patent'
  | 'lab'
  | 'shield'
  | 'leaf';

function pickKey(name: string): ThumbKey {
  const n = name.toLowerCase();
  if (n.includes('cites')) return 'cites';
  if (n.includes('haccp')) return 'haccp';
  if (n.includes('gmp')) return 'gmp';
  if (n.includes('organic') || n.includes('유기농')) return 'organic';
  if (n.includes('원산지')) return 'origin';
  if (n.includes('식약처')) return 'mfds';
  if (n.includes('iso')) return 'iso';
  if (n.includes('fda')) return 'fda';
  if (n.includes('농업') || n.includes('총국') || n.includes('황금') || n.includes('ocop') || n.includes('brand')) return 'gov';
  if (n.includes('aar') || n.includes('품종') || n.includes('학명')) return 'aar';
  if (n.includes('야생') || n.includes('동식물') || n.includes('식재')) return 'wildlife';
  if (n.includes('특허') || n.includes('수지') || n.includes('patent')) return 'patent';
  if (n.includes('성분') || n.includes('검사') || n.includes('유해')) return 'lab';
  if (n.includes('청정') || n.includes('안전')) return 'shield';
  if (n.includes('재배')) return 'leaf';
  return 'shield';
}

// 영문 라벨 (썸네일 상단 카테고리 + 큰 약어)
const META: Record<ThumbKey, { kicker: string; mark: string }> = {
  cites: { kicker: 'CONVENTION · 国际', mark: 'CITES' },
  haccp: { kicker: 'FOOD SAFETY', mark: 'HACCP' },
  gmp: { kicker: 'GOOD MFG.', mark: 'GMP' },
  organic: { kicker: 'CERTIFIED', mark: 'ORG' },
  origin: { kicker: 'ORIGIN · 原産地', mark: 'VN' },
  mfds: { kicker: 'KOREA · 食薬処', mark: 'MFDS' },
  iso: { kicker: 'STANDARD', mark: 'ISO' },
  fda: { kicker: 'U.S. REGISTERED', mark: 'FDA' },
  gov: { kicker: 'GOLDEN BRAND', mark: 'OCOP' },
  aar: { kicker: 'SPECIES · 学名', mark: 'AAR' },
  wildlife: { kicker: 'WILDLIFE', mark: 'WL' },
  patent: { kicker: 'PATENT · 特許', mark: 'PAT' },
  lab: { kicker: 'LAB REPORT', mark: 'LAB' },
  shield: { kicker: 'CERTIFIED', mark: 'CERT' },
  leaf: { kicker: 'CULTIVATED', mark: 'GRW' },
};

// 각 키별 중앙 엠블럼 SVG (24x24 viewBox 기준 좌표를 transform 으로 확대해 배치)
const EMBLEM: Record<ThumbKey, ReactNode> = {
  cites: (
    <g stroke="url(#gold)" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="0" cy="0" r="9" />
      <ellipse cx="0" cy="0" rx="9" ry="3.5" />
      <ellipse cx="0" cy="0" rx="3.5" ry="9" />
      <path d="M-9 0H9" />
      <path d="M-3.5 -7c2 -1 5 -1 7 0M-7 -3.5c1 -2 6 -2 7 0" opacity="0.5" />
    </g>
  ),
  haccp: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 -9 -7 -6 v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8v-5z" />
      <path d="m-3 0 2.5 2.5L4 -2" strokeWidth="1.1" />
    </g>
  ),
  gmp: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-9 6V-3l3 2V-3l3 2v-3l6 3v7Z" />
      <path d="M-9 6H9" />
      <path d="M-7 4H-5M-2 4h2M5 4h1" strokeWidth="0.7" />
      <path d="M-3 -8l1.5 3M3 -8l-1.5 3" opacity="0.6" />
    </g>
  ),
  organic: (
    <g fill="url(#goldFill)" stroke="url(#gold)" strokeWidth="0.7" strokeLinejoin="round">
      <path d="M-7 7c0-7 5-12 14-12 0 9-5 14-12 14a4 4 0 0 1-2-2Z" opacity="0.85" />
      <path d="M-7 7c2-4 5-7 10-9" stroke="url(#gold)" fill="none" strokeWidth="0.9" />
    </g>
  ),
  origin: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.95" strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 9s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="0" cy="-3" r="2.4" fill="url(#goldFill)" stroke="none" />
      <path d="M-9 11h18" opacity="0.4" />
    </g>
  ),
  mfds: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-6 -9h7l5 5V9h-12Z" />
      <path d="M1 -9v5h5" />
      <path d="M-3 2l2 2 4-4" strokeWidth="1.1" />
      <path d="M-4 -3h4M-4 -6h2" opacity="0.55" />
    </g>
  ),
  iso: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="0" cy="-2" r="6" />
      <path d="M-3 3 -5 11l5-3 5 3-2-8" />
      <path d="M-3 -2h6M0 -5v6" strokeWidth="0.8" />
    </g>
  ),
  fda: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-3 -9h6l-1 6h-4Z" fill="url(#goldFill)" stroke="none" opacity="0.85" />
      <path d="M-6 1.5C-6 -1 -4 -3 -2 -3h4c2 0 4 2 4 4.5L5 4H-5Z" />
      <path d="M-7 7h14M-7 9h14" />
    </g>
  ),
  gov: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="0" cy="2" r="6" />
      <path d="M-4 -3 -6.5 -9h4L0 -4M4 -3l2.5 -6h-4L0 -4" />
      <path d="M-2 2 0 4 3 0" strokeWidth="1.1" />
      <path d="M0 -9v3" opacity="0.5" />
    </g>
  ),
  aar: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-7 -7h11v11h-11Z" />
      <path d="M4 -7h3v11a3 3 0 0 1-3 3H-4a3 3 0 0 0 3-3V-7" />
      <path d="M-4 -3h6M-4 0h6M-4 3h4" />
      <circle cx="-1" cy="9" r="1.4" fill="url(#goldFill)" stroke="none" />
    </g>
  ),
  wildlife: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 9V-3" />
      <path d="M0 -3c0-3 2-5 5-5 0 3-2 5-5 5Z" fill="url(#goldFill)" stroke="url(#gold)" />
      <path d="M0 -1c0-3-2-5-5-5 0 3 2 5 5 5Z" fill="url(#goldFill)" stroke="url(#gold)" />
      <path d="M-4 9h8" />
    </g>
  ),
  patent: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 -9v4M0 5v4M-9 0h4M5 0h4" />
      <path d="M0 -4c.8 2.2 1.8 3.2 4 4-2.2.8-3.2 1.8-4 4-.8-2.2-1.8-3.2-4-4 2.2-.8 3.2-1.8 4-4Z" fill="url(#goldFill)" stroke="url(#gold)" />
    </g>
  ),
  lab: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-3 -9h6" />
      <path d="M-2 -9v6L-7 7a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 7 7L2 -3v-6" />
      <path d="M-4.5 2h9" />
      <circle cx="-2" cy="5" r="0.6" fill="url(#goldFill)" stroke="none" />
      <circle cx="2" cy="6" r="0.6" fill="url(#goldFill)" stroke="none" />
    </g>
  ),
  shield: (
    <g fill="none" stroke="url(#gold)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 -9 -7 -6 v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8v-5z" />
      <path d="M0 -3v6M-3 0h6" />
    </g>
  ),
  leaf: (
    <g fill="url(#goldFill)" stroke="url(#gold)" strokeWidth="0.7" strokeLinejoin="round">
      <path d="M-7 7c0-7 5-12 14-12 0 9-5 14-12 14a4 4 0 0 1-2-2Z" opacity="0.85" />
    </g>
  ),
};

// 코너 장식 (4모서리 L자 골드 라인)
function CornerOrnaments() {
  const len = 18;
  const off = 10;
  const stroke = 'url(#gold)';
  return (
    <g fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="square">
      {/* TL */}
      <path d={`M${off} ${off + len} V${off} H${off + len}`} />
      {/* TR */}
      <path d={`M${200 - off - len} ${off} H${200 - off} V${off + len}`} />
      {/* BL */}
      <path d={`M${off} ${200 - off - len} V${200 - off} H${off + len}`} />
      {/* BR */}
      <path d={`M${200 - off - len} ${200 - off} H${200 - off} V${200 - off - len}`} />
    </g>
  );
}

// 모든 인스턴스가 동일한 그라디언트 정의를 공유. 같은 페이지에 같은 id 가 12번 등장하지만,
// url(#xxx) 는 첫 매칭으로 해석되고 모든 정의가 동일하므로 렌더 결과는 항상 같음.
export default function CertIcon({ name }: { name: string; size?: number }) {
  const key = pickKey(name);
  const meta = META[key];
  const emblem = EMBLEM[key];

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label={`${meta.mark} 인증 썸네일`}>
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8c878" />
          <stop offset="50%" stopColor="#d4a843" />
          <stop offset="100%" stopColor="#9a7a2e" />
        </linearGradient>
        <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a843" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#9a7a2e" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="cert-bg" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#16181f" />
          <stop offset="60%" stopColor="#0c0d13" />
          <stop offset="100%" stopColor="#070810" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="200" height="200" fill="url(#cert-bg)" />
      <rect x="6" y="6" width="188" height="188" fill="none" stroke="url(#gold)" strokeOpacity="0.32" strokeWidth="1" />
      <rect x="11" y="11" width="178" height="178" fill="none" stroke="url(#gold)" strokeOpacity="0.16" strokeWidth="1" />

      <CornerOrnaments />

      <line x1="40" y1="38" x2="80" y2="38" stroke="url(#gold)" strokeOpacity="0.5" />
      <line x1="120" y1="38" x2="160" y2="38" stroke="url(#gold)" strokeOpacity="0.5" />
      <text x="100" y="42" textAnchor="middle" fill="#d4a843" fontFamily="'JetBrains Mono', ui-monospace, monospace" fontSize="9" letterSpacing="2">
        {meta.kicker}
      </text>

      <g transform="translate(100 100) scale(4.2)">{emblem}</g>

      <line x1="56" y1="158" x2="144" y2="158" stroke="url(#gold)" strokeOpacity="0.5" />

      <text x="100" y="178" textAnchor="middle" fill="url(#gold)" fontFamily="'Noto Serif KR', serif" fontSize="20" fontWeight="500" letterSpacing="2">
        {meta.mark}
      </text>
    </svg>
  );
}
