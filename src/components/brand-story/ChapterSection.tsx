'use client';

import type { ReactNode } from 'react';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

interface Props {
  tag?: string;
  title: string;
  titleEm?: string;
  subtitle?: string;
  tone?: 'dark' | 'light';
  children: ReactNode;
  anchorId?: string;
}

/**
 * ChapterSection — shared wrapper for each brand-story chapter.
 * Provides consistent section header: Chapter tag, H2 with em accent, gold divider, subtitle.
 */
export default function ChapterSection({
  tag,
  title,
  titleEm,
  subtitle,
  tone = 'dark',
  children,
  anchorId,
}: Props) {
  const isDark = tone === 'dark';
  return (
    <section
      id={anchorId}
      className={
        isDark
          ? 'relative py-20 md:py-[110px] px-7 lg:px-16 bg-lx-black text-lx-ivory'
          : 'relative py-20 md:py-[110px] px-7 lg:px-16 bg-lx-ivory text-lx-ink'
      }
    >
      <div className="max-w-page mx-auto">
        <header className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          {tag && (
            <RevealOnScroll>
              <p
                className={
                  'font-mono text-[0.7rem] tracking-en-tag uppercase mb-4 ' +
                  (isDark ? 'text-gold-500' : 'text-gold-700')
                }
              >
                {tag}
              </p>
            </RevealOnScroll>
          )}
          <RevealOnScroll delay={100}>
            <h2 className="text-[clamp(1.9rem,4vw,3.2rem)] font-extralight tracking-kr-tight leading-[1.15]">
              {title}
              {titleEm && (
                <>
                  {' '}
                  <em className="not-italic font-serif font-normal text-gold-500">
                    {titleEm}
                  </em>
                </>
              )}
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <span
              className={
                'block w-12 h-px mx-auto my-6 ' +
                (isDark ? 'bg-gold-500' : 'bg-gold-700')
              }
            />
          </RevealOnScroll>
          {subtitle && (
            <RevealOnScroll delay={300}>
              <p
                className={
                  'text-base leading-[1.9] font-light ' +
                  (isDark ? 'text-white/65' : 'text-lx-ink/70')
                }
              >
                {subtitle}
              </p>
            </RevealOnScroll>
          )}
        </header>
        {children}
      </div>
    </section>
  );
}
