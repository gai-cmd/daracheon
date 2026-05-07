import type { ReactNode } from 'react';

type IconKey =
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

const STROKE = 1.4;

function pickIcon(name: string): IconKey {
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

const PATHS: Record<IconKey, ReactNode> = {
  cites: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 3 2.6 15 0 18" />
      <path d="M12 3c-2.6 3-2.6 15 0 18" />
      <path d="m9 13 2 2 4-4" />
    </>
  ),
  haccp: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.4 7.8 8 9 4.6-1.2 8-4.5 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  gmp: (
    <>
      <path d="M3 21V10l5 3V10l5 3V8l8 4v9" />
      <path d="M3 21h18" />
      <path d="M8 17h2M13 17h2M18 17h0" />
    </>
  ),
  organic: (
    <>
      <path d="M5 19c0-7 5-12 14-12 0 9-5 14-12 14a4 4 0 0 1-2-2Z" />
      <path d="M5 19c2-4 5-7 10-9" />
    </>
  ),
  origin: (
    <>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.4" />
    </>
  ),
  mfds: (
    <>
      <path d="M7 3h7l5 5v13H7Z" />
      <path d="M14 3v5h5" />
      <path d="m10 14 2 2 4-4" />
    </>
  ),
  iso: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5 7.5 21l4.5-2.5L16.5 21 15 13.5" />
      <path d="M9.5 9h5M12 6.5v5" />
    </>
  ),
  fda: (
    <>
      <path d="M9 3h6l-1 6h-4Z" />
      <path d="M6 13.5C6 11 8 9 10 9h4c2 0 4 2 4 4.5L17 16H7Z" />
      <path d="M5 19h14" />
      <path d="M5 21h14" />
    </>
  ),
  gov: (
    <>
      <circle cx="12" cy="14" r="5" />
      <path d="M8 9 5.5 3h4L12 8M16 9l2.5-6h-4L12 8" />
      <path d="m10 14 1.5 1.5L14 13" />
    </>
  ),
  aar: (
    <>
      <path d="M5 5h11v11H5Z" />
      <path d="M16 5h3v11a3 3 0 0 1-3 3H8a3 3 0 0 0 3-3V5" />
      <path d="M8 9h6M8 12h6" />
      <circle cx="11" cy="16.5" r="1.4" />
    </>
  ),
  wildlife: (
    <>
      <path d="M12 21V11" />
      <path d="M12 11c0-3 2-5 5-5 0 3-2 5-5 5Z" />
      <path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5Z" />
      <path d="M8 21h8" />
    </>
  ),
  patent: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8c.8 2.2 1.8 3.2 4 4-2.2.8-3.2 1.8-4 4-.8-2.2-1.8-3.2-4-4 2.2-.8 3.2-1.8 4-4Z" />
    </>
  ),
  lab: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19l-5-10V3" />
      <path d="M7.5 14h9" />
      <circle cx="10" cy="17" r="0.6" />
      <circle cx="14" cy="18" r="0.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.4 7.8 8 9 4.6-1.2 8-4.5 8-9V6l-8-3Z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-7 5-12 14-12 0 9-5 14-12 14a4 4 0 0 1-2-2Z" />
    </>
  ),
};

export default function CertIcon({ name, size = 22 }: { name: string; size?: number }) {
  const key = pickIcon(name);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {PATHS[key]}
    </svg>
  );
}
