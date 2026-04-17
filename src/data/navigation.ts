export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const mainNavigation: NavItem[] = [
  {
    label: '침향 이야기',
    href: '/about-agarwood',
  },
  {
    label: '브랜드 이야기',
    href: '/brand-story',
  },
  {
    label: '침향 농장 이야기',
    href: '/media',
  },
  {
    label: '제품 소개',
    href: '/products',
  },
  {
    label: '홈쇼핑 특별관',
    href: '/home-shopping',
  },
  {
    label: '회사소개',
    href: '/company',
  },
  {
    label: '문의하기',
    href: '/support',
  },
];

export const footerNavigation = {
  support: {
    title: '고객 지원',
    links: [
      { label: '공지사항', href: '/support' },
      { label: 'FAQ', href: '/support' },
      { label: '배송/반품 안내', href: '/support' },
      { label: '고객 후기', href: '/reviews' },
    ],
  },
  brand: {
    title: '브랜드',
    links: [
      { label: '침향이란?', href: '/about-agarwood' },
      { label: '브랜드 이야기', href: '/brand-story' },
      { label: '생산 공정', href: '/process' },
      { label: '회사 소개', href: '/company' },
    ],
  },
};
