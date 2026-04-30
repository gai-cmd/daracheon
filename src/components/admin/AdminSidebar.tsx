'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badgeKey?: keyof NotificationCounts;
  superAdminOnly?: boolean;
}

interface NotificationCounts {
  inquiries_new: number;
  reviews_pending: number;
  broadcasts_upcoming: number;
  products_out_of_stock: number;
}

const navItems: NavItem[] = [
  { label: '대시보드', href: '/admin', icon: '◉' },
  { label: '침향 이야기', href: '/admin/pages/about-agarwood', icon: '◎' },
  { label: '브랜드 이야기', href: '/admin/pages/brand-story', icon: '◈' },
  { label: '침향 농장 이야기', href: '/admin/media', icon: '▣' },
  { label: '제품 소개', href: '/admin/products', icon: '◈', badgeKey: 'products_out_of_stock' },
  { label: '디지털 에디션', href: '/admin/pages/edition-agarwood', icon: '◐' },
  { label: '에디션 리드', href: '/admin/leads', icon: '✉' },
  { label: '홈쇼핑 특별관', href: '/admin/broadcasts', icon: '▶', badgeKey: 'broadcasts_upcoming' },
  { label: '회사소개', href: '/admin/pages/company', icon: '▦' },
  { label: '문의하기', href: '/admin/inquiries', icon: '◆', badgeKey: 'inquiries_new' },
  { label: 'FAQ 관리', href: '/admin/faq', icon: '▤' },
  { label: '리뷰 관리', href: '/admin/reviews', icon: '◇', badgeKey: 'reviews_pending' },
  { label: '홈편집', href: '/admin/pages/home', icon: '⌂' },
  { label: '계정 관리', href: '/admin/users', icon: '⦿', superAdminOnly: true },
  { label: '감사 로그', href: '/admin/audit-log', icon: '⎌' },
  { label: 'DB 관리', href: '/admin/db', icon: '▦', superAdminOnly: true },
  { label: '백업 & 복원', href: '/admin/backup', icon: '⎔', superAdminOnly: true },
  { label: '설정', href: '/admin/settings', icon: '⚙' },
];

const BADGE_COLORS: Record<keyof NotificationCounts, string> = {
  inquiries_new:        'bg-[#B4452F]',   // 테라코타 — 신규 문의 (주의 신호)
  reviews_pending:      'bg-[#7A5F1F]',   // 딥 골드 — 검토 대기
  broadcasts_upcoming:  'bg-[#3D5570]',   // 스카이그레이 — 예정 방송
  products_out_of_stock:'bg-[#4B4845]',   // 차콜 — 품절 재고
};

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

const REFRESH_INTERVAL_MS = 30_000;

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      try {
        const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.counts) setCounts(data.counts);
      } catch {
        /* silent — sidebar badges are non-critical */
      }
    }

    async function fetchSession() {
      try {
        const res = await fetch('/api/admin/session', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.role) setRole(data.role);
      } catch {
        /* silent */
      }
    }

    fetchCounts();
    fetchSession();
    const timer = setInterval(fetchCounts, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);

  const visibleItems = navItems.filter((item) => {
    if (item.superAdminOnly && role && role !== 'super_admin') return false;
    return true;
  });

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a1a17] text-gold-500 shadow-lg lg:hidden"
        aria-label={mobileOpen ? '사이드바 닫기' : '사이드바 열기'}
      >
        <span className="text-xl leading-none">{mobileOpen ? '✕' : '☰'}</span>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#1a1a17]
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 border-b border-gold-900/40 px-6 py-8">
          <span className="font-display text-3xl tracking-wider text-gold-500">大羅天</span>
          <span className="text-xs font-medium tracking-[0.3em] text-gold-700">ADMIN</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const active = isActive(pathname, item.href);
              const badge = item.badgeKey && counts ? counts[item.badgeKey] : 0;
              const showBadge = badge > 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium
                      transition-all duration-200
                      ${
                        active
                          ? 'bg-gold-500/15 text-gold-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }
                    `}
                  >
                    <span className={`text-base ${active ? 'text-gold-500' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {showBadge && item.badgeKey && (
                      <span
                        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[0.65rem] font-semibold text-white ${BADGE_COLORS[item.badgeKey]}`}
                        aria-label={`${badge}건`}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                    {!showBadge && active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gold-900/40 px-3 py-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
          >
            <span className="text-base">↗</span>
            사이트 보기
          </a>
        </div>
      </aside>
    </>
  );
}
