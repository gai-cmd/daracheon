'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/data/navigation';
import styles from './Header.module.css';

interface HeaderProps {
  mainNav: NavItem[];
  brandLogo?: string;
  /** /products 카테고리 — 햄버거 메뉴 sub-탭으로 노출. admin 편집 즉시 반영. */
  productCategories?: { id: string; label: string }[];
}

/**
 * 페이지별 탭 매핑.
 * 햄버거 메뉴에서 각 메인 메뉴 항목 아래에 sub-list 로 노출.
 * 클릭 시 `/path#tab-<key>` 로 이동 → 페이지 client 컴포넌트(useHashTab)가
 * activeTab 동기화 후 해당 탭 콘텐츠로 스크롤.
 */
const STATIC_PAGE_TABS: Record<string, { key: string; label: string }[]> = {
  '/about-agarwood': [
    { key: '0', label: '침향이란?' },
    { key: '1', label: '진짜 침향 구별' },
    { key: '2', label: '경전에 실린 침향' },
    { key: '3', label: '문헌에 실린 침향' },
    { key: '4', label: '논문에 실린 침향' },
    { key: '5', label: '복용 및 사용법' },
  ],
  '/brand-story': [
    { key: '0', label: '브랜드 스토리' },
    { key: '1', label: '다양한 인증' },
    { key: '2', label: '생산 공정' },
  ],
  '/media': [
    { key: 'story', label: '침향 농장 이야기' },
    { key: 'gallery', label: '영상・사진 갤러리' },
  ],
};

// Paths where the public chrome must never render. Mirrors ChromeGate but
// enforced at the component itself — defensive against hydration timing,
// CSS :has() unsupported browsers, or stale ChromeGate bundles.
const IMMERSIVE_PREFIXES = ['/edition', '/agarwood-edition', '/admin'];

function isImmersivePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return IMMERSIVE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

// Critical positioning enforced via inline style — guarantees nav visibility
// even if CSS Module loading is delayed/failed for any reason.
const NAV_INLINE_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  left: 'var(--ai-panel-width, 0px)',
  zIndex: 9999,
  height: 72,
  background: 'rgba(10, 11, 16, 0.96)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderBottom: '1px solid rgba(212, 168, 67, 0.35)',
  boxShadow: '0 8px 24px -16px rgba(0, 0, 0, 0.6)',
};

export default function Header({ mainNav, brandLogo, productCategories = [] }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // /products 의 sub-탭은 동적 (admin 편집) — STATIC_PAGE_TABS 와 합쳐서 조회.
  const productsTabs = productCategories.map((c) => ({ key: c.id, label: c.label }));
  function tabsFor(href: string): { key: string; label: string }[] | null {
    if (href === '/products' && productsTabs.length > 0) return productsTabs;
    return STATIC_PAGE_TABS[href] ?? null;
  }

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Defensive guard — ChromeGate is the primary owner of this hide, but the
  // public nav bar is fixed/blur/z-9999 and any hydration glitch that lets it
  // through visibly covers the admin sidebar logo. Self-hide regardless.
  if (isImmersivePath(pathname)) return null;

  return (
    <header>
      <nav className={styles.nav} style={NAV_INLINE_STYLE} data-zoel-nav="v2">
        <div className={styles.navInner}>
          <Link href="/" className={styles.navBrand}>
            <img
              src={brandLogo || '/images/logo-brand.png'}
              alt="조엘라이프 ZOEL LIFE"
              style={{ height: 40, width: 'auto', display: 'block', objectFit: 'contain' }}
            />
            <span className={styles.navBrandText}>
              <span className={styles.navBrandKr}>조엘라이프(주)</span>
              <span className={styles.navBrandEn}>ZOEL LIFE</span>
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

          <div className={styles.navActions}>
            {/* 제품상세 — 포장 글씨가 작은 분들을 위한 복용·제품 안내 (문의하기 옆) */}
            <Link
              href="/guide"
              className={styles.navCta}
              aria-label="제품상세"
              style={{ background: 'transparent', borderColor: 'rgba(212,168,67,0.5)', color: '#d4a843' }}
            >
              <span className={styles.navCtaIcon} aria-hidden>📖</span>
              <span className={styles.navCtaLabel}>제품상세</span>
            </Link>

            {/* 문의하기 CTA — PC·모바일 모두 항상 노출.
                회사소개 페이지의 #contact 앵커로 직행. */}
            <Link
              href="/company#contact"
              className={styles.navCta}
              aria-label="문의하기"
            >
              <span className={styles.navCtaIcon} aria-hidden>✉</span>
              <span className={styles.navCtaLabel}>문의하기</span>
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
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className={styles.mobileOverlay}>
          {mainNav.map((item) => {
            const active = pathname === item.href;
            const subTabs = tabsFor(item.href);
            return (
              <div key={item.href} className={styles.mobileNavGroup}>
                <Link
                  href={item.href}
                  className={active ? 'active' : ''}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {subTabs && (
                  <ul className={styles.mobileSubTabs}>
                    {subTabs.map((t) => (
                      <li key={t.key}>
                        <Link
                          href={`${item.href}#tab-${encodeURIComponent(t.key)}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          {t.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
