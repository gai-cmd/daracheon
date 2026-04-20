'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/data/navigation';
import styles from './Header.module.css';

interface HeaderProps {
  mainNav: NavItem[];
}

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
      <nav className={styles.nav}>
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
