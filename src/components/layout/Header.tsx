'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNavigation } from '@/data/navigation';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navBg = scrolled || !isHome
    ? 'bg-[rgba(10,10,8,0.95)] backdrop-blur-[30px] shadow-[0_2px_40px_rgba(0,0,0,0.2)]'
    : 'bg-transparent';

  return (
    <header>
      <nav
        className={`fixed top-0 right-0 z-[1000] flex items-center justify-between transition-all duration-500 ${navBg} ${
          scrolled ? 'py-3 px-6 lg:px-16' : 'py-5 px-6 lg:px-16'
        }`}
        style={{ left: 'var(--ai-panel-width, 0px)' }}
      >
        {/* Logo */}
        <Link href="/" className="group">
          <span className="font-serif text-xl font-medium text-gold-500 tracking-[0.15em] group-hover:opacity-80 transition-opacity">
            大羅天
          </span>
          <span className="block font-display text-[0.6rem] text-gold-300 tracking-[0.3em] font-light mt-0.5">
            ZOEL LIFE
          </span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex items-center gap-8">
          {mainNavigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative text-[0.75rem] font-normal tracking-[0.2em] uppercase transition-colors duration-300
                  ${pathname === item.href ? 'text-gold-500' : 'text-white/75 hover:text-gold-500'}
                  after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:h-px after:bg-gold-500 after:transition-all after:duration-400
                  ${pathname === item.href ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
                `}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

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
        <div className="fixed inset-0 z-[999] bg-[rgba(10,10,8,0.98)] flex flex-col items-center justify-center gap-6">
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
    </header>
  );
}
