// 봉랍 인장(Wax Seal) 메달리온.
// 깊은 와인-블랙 단색, 약자만 표시. feTurbulence 로 가장자리 미세 균열 표현.

type SealKey =
  | 'cites'
  | 'haccp'
  | 'gmp'
  | 'organic'
  | 'farming'
  | 'product'
  | 'origin'
  | 'mfds'
  | 'iso'
  | 'fda'
  | 'gov'
  | 'aar'
  | 'wildlife'
  | 'patent'
  | 'lab'
  | 'safe'
  | 'pure'
  | 'shield'
  | 'leaf';

function pickKey(name: string): SealKey {
  const n = name.toLowerCase();
  if (n.includes('cites')) return 'cites';
  if (n.includes('haccp')) return 'haccp';
  if (n.includes('gmp')) return 'gmp';
  if (n.includes('완제품')) return 'product';
  if (n.includes('재배')) return 'farming';
  if (n.includes('organic') || n.includes('유기농')) return 'organic';
  if (n.includes('원산지')) return 'origin';
  if (n.includes('식약처')) return 'mfds';
  if (n.includes('iso')) return 'iso';
  if (n.includes('fda')) return 'fda';
  if (n.includes('농업') || n.includes('총국') || n.includes('황금') || n.includes('ocop') || n.includes('brand')) return 'gov';
  if (n.includes('aar') || n.includes('품종') || n.includes('학명')) return 'aar';
  if (n.includes('야생') || n.includes('동식물') || n.includes('식재')) return 'wildlife';
  if (n.includes('특허') || n.includes('수지') || n.includes('patent')) return 'patent';
  if (n.includes('성분') || n.includes('검사')) return 'lab';
  if (n.includes('유해')) return 'safe';
  if (n.includes('청정')) return 'pure';
  if (n.includes('안전')) return 'safe';
  return 'shield';
}

const ABBR: Record<SealKey, string> = {
  cites: 'CITES',
  haccp: 'HACCP',
  gmp: 'GMP',
  organic: 'ORG',
  farming: 'RAW',
  product: 'ECO',
  origin: 'ORIGIN',
  mfds: 'MFDS',
  iso: 'ISO',
  fda: 'FDA',
  gov: 'OCOP',
  aar: 'AAR',
  wildlife: 'WL',
  patent: 'PAT',
  lab: 'LAB',
  safe: 'SAFE',
  pure: 'PURE',
  shield: 'CERT',
  leaf: 'GRW',
};

// 약자 길이별 폰트 크기 — 6글자(ORIGIN) 까지 한 줄로 들어가게.
function fontSizeFor(abbr: string): number {
  const len = abbr.length;
  if (len <= 2) return 28;
  if (len === 3) return 24;
  if (len === 4) return 21;
  if (len === 5) return 17;
  return 14;
}

// 키별로 turbulence seed 를 다르게 줘서 12 개 인장이 미세하게 다르게 깨지도록.
const SEED: Record<SealKey, number> = {
  cites: 3, haccp: 7, gmp: 11, organic: 17, farming: 19, product: 23,
  origin: 29, mfds: 31, iso: 37, fda: 41, gov: 43, aar: 47,
  wildlife: 53, patent: 59, lab: 61, safe: 67, pure: 71, shield: 73, leaf: 79,
};

export default function CertIcon({ name }: { name: string; size?: number }) {
  const key = pickKey(name);
  const abbr = ABBR[key];
  const id = `seal-${key}`;
  const fontSize = fontSizeFor(abbr);

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label={`${abbr} 봉랍 인장`}>
      <defs>
        <radialGradient id={`${id}-wax`} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#5a1422" />
          <stop offset="40%" stopColor="#3a0a14" />
          <stop offset="80%" stopColor="#1a040a" />
          <stop offset="100%" stopColor="#0a0205" />
        </radialGradient>
        <radialGradient id={`${id}-sheen`} cx="32%" cy="22%" r="40%">
          <stop offset="0%" stopColor="#ffd0b8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffd0b8" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-rough`} x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={SEED[key]} />
          <feDisplacementMap in="SourceGraphic" scale="1.8" />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="2" seed={SEED[key] + 1} />
          <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.18 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* 외곽 봉랍 — turbulence 로 가장자리 살짝 깨짐 */}
      <g filter={`url(#${id}-rough)`}>
        <circle cx="50" cy="50" r="42" fill={`url(#${id}-wax)`} />
      </g>

      {/* 좌상단 빛 반사 */}
      <circle cx="50" cy="50" r="40" fill={`url(#${id}-sheen)`} />

      {/* 표면 미세 입자 */}
      <g filter={`url(#${id}-grain)`}>
        <circle cx="50" cy="50" r="40" fill="#000" />
      </g>

      {/* 인장 안쪽 두 줄 링 — 도장 자국 */}
      <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="33.5" fill="none" stroke="rgba(255,210,180,0.08)" strokeWidth="0.4" />

      {/* 위/아래 작은 점 (인장 장식) */}
      <circle cx="50" cy="20.5" r="0.9" fill="rgba(255,215,190,0.25)" />
      <circle cx="50" cy="79.5" r="0.9" fill="rgba(255,215,190,0.25)" />

      {/* 약자 — 살짝 음각된 듯한 효과 */}
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,225,210,0.82)"
        fontFamily="'Noto Serif KR', 'EB Garamond', Georgia, serif"
        fontWeight="500"
        fontSize={fontSize}
        letterSpacing="0.06em"
        style={{
          filter:
            'drop-shadow(0 0.6px 0 rgba(0,0,0,0.7)) drop-shadow(0 -0.4px 0 rgba(255,200,170,0.18))',
        }}
      >
        {abbr}
      </text>
    </svg>
  );
}
