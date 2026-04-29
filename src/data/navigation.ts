export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface FooterColumn {
  title: string;
  links: NavItem[];
}

export interface NavigationData {
  main: NavItem[];
  footerColumns: FooterColumn[];
  updatedAt: string;
}

/**
 * Fallback constants used when `data/db/navigation.json` is missing or
 * unreadable. The JSON file is the source of truth and is maintained by
 * direct edit; this snapshot exists only so first-render on an empty DB
 * still shows a navigable site.
 */
export const DEFAULT_MAIN_NAV: NavItem[] = [
  { label: '침향 이야기', href: '/about-agarwood' },
  { label: '브랜드 이야기', href: '/brand-story' },
  { label: '홈쇼핑 특별관', href: '/home-shopping' },
  { label: '회사소개', href: '/company' },
];

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: '고객 지원',
    links: [
      { label: '문의하기', href: '/support' },
      { label: '고객 후기', href: '/reviews' },
    ],
  },
  {
    title: '브랜드',
    links: [
      { label: '침향 이야기', href: '/about-agarwood' },
      { label: '브랜드 이야기', href: '/brand-story' },
      { label: '생산 공정', href: '/process' },
      { label: '회사소개', href: '/company' },
    ],
  },
];

/**
 * Backward-compat: some callers import the legacy shape. Keep them
 * working so migration doesn't have to be atomic across all files.
 */
export const mainNavigation = DEFAULT_MAIN_NAV;
export const footerNavigation = {
  support: DEFAULT_FOOTER_COLUMNS[0],
  brand: DEFAULT_FOOTER_COLUMNS[1],
};
