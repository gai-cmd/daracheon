'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNavigation } from '@/data/navigation';
import BrandMark from './BrandMark';

export default function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className="fixed inset-x-0 top-0 z-[1000] flex items-center justify-between
                   px-6 lg:px-16 py-5
                   bg-lx-black/92 backdrop-blur-2xl
                   border-b border-gold-500/14"
        style={{ left: 'var(--ai-panel-width, 0px)' }}
      >
        <BrandMark href="/" />

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex items-center gap-6 list-none">
          {mainNavigation.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-[0.85rem] font-normal py-1.5 border-b transition-all duration-300
                    ${active
                      ? 'text-gold-500 border-gold-500'
                      : 'text-white/70 border-transparent hover:text-gold-400'}
                  `}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <Link
            href="/home-shopping"
            className="px-5 py-2.5 bg-transparent border border-white/30 text-white
                       text-[0.72rem] font-medium tracking-en-nav uppercase no-underline
                       transition-all duration-300
                       hover:bg-gold-500 hover:border-gold-500 hover:text-lx-black"
          >
            Shop Live
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden flex flex-col gap-[5px] cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴 열기"
          aria-expanded={mobileOpen}
        >
          <span className={`block w-[26px] h-[1.5px] bg-gold-500 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
          <span className={`block w-[26px] h-[1.5px] bg-gold-500 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-[26px] h-[1.5px] bg-gold-500 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999] bg-lx-black/98 flex flex-col items-center justify-center gap-6">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-5 right-6 text-gold-500 text-2xl"
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-lg tracking-[0.15em] transition-colors ${
                pathname === item.href ? 'text-gold-500' : 'text-white/70 hover:text-gold-500'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
