// Iconify CDN의 noto-emoji 세트를 이미지로 사용 — Flaticon 같은 컬러풀한 플랫 아이콘 느낌.
// 새 인증명이 들어와도 키워드 매칭이 안 되면 'sparkles'로 폴백.

const ICON_BASE = 'https://api.iconify.design/noto';

function pickIconName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('cites')) return 'globe-showing-asia-australia';
  if (n.includes('haccp')) return 'shield';
  if (n.includes('gmp')) return 'factory';
  if (n.includes('organic') || n.includes('유기농')) return 'herb';
  if (n.includes('원산지')) return 'round-pushpin';
  if (n.includes('식약처')) return 'scroll';
  if (n.includes('iso')) return '1st-place-medal';
  if (n.includes('fda')) return 'check-mark-button';
  if (n.includes('농업') || n.includes('총국') || n.includes('황금') || n.includes('ocop') || n.includes('brand')) return 'trophy';
  if (n.includes('aar') || n.includes('품종') || n.includes('학명')) return 'page-with-curl';
  if (n.includes('야생') || n.includes('동식물') || n.includes('식재')) return 'deciduous-tree';
  if (n.includes('특허') || n.includes('patent')) return 'sparkles';
  if (n.includes('수지')) return 'test-tube';
  if (n.includes('성분') || n.includes('검사') || n.includes('유해')) return 'microscope';
  if (n.includes('청정') || n.includes('안전')) return 'shield';
  if (n.includes('재배')) return 'seedling';
  return 'sparkles';
}

export default function CertIcon({ name, size = 32 }: { name: string; size?: number }) {
  const iconName = pickIconName(name);
  const src = `${ICON_BASE}/${iconName}.svg`;
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size, display: 'block', objectFit: 'contain' }}
      aria-hidden="true"
    />
  );
}
