'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/data/navigation';
import styles from './Header.module.css';

interface HeaderProps {
  mainNav: NavItem[];
}

// Critical positioning enforced via inline style — guarantees nav visibility
// even if CSS Module loading is delayed/failed for any reason.
const NAV_INLINE_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  left: 'var(--ai-panel-width, 0px)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 72,
  padding: '0 28px',
  background: 'rgba(10, 11, 16, 0.96)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderBottom: '1px solid rgba(212, 168, 67, 0.35)',
  boxShadow: '0 8px 24px -16px rgba(0, 0, 0, 0.6)',
};

export default function Header({ mainNav }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header>
      <nav className={styles.nav} style={NAV_INLINE_STYLE} data-zoel-nav="v2">
        <Link href="/" className={styles.navBrand}>
          <span className={styles.brandDot} aria-hidden="true" />
          <span className={styles.brandText}>
            <span className={styles.brandWord}>ZOEL LIFE</span>
            <span className={styles.brandSub}>대라천 · 침향</span>
          </span>
        </Link>

        <ul className={styles.navLinks}>
          {mainNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link href="/home-shopping" className={styles.navCta}>
          Shop Live
        </Link>

        <button
          type="button"
          className={`${styles.hamburger} ${mobileOpen ? styles.open : ''}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="메뉴 열기"
          aria-expanded={mobileOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {mobileOpen && (
        <div className={styles.mobileOverlay}>
          {mainNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
