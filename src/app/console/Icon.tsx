'use client';

import { useId } from 'react';
import { ICONS, LETTERS, MARKS, brandOf, firstChar } from '@/lib/console/brand-marks';
import s from './console.module.css';
import { cx } from './cx';

// Inline SVG from the bundled constant markup in brand-marks.ts (REQ-CON-022). The innerHTML is
// always one of those module constants, never user data.

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      className={cx(s.ic, className)}
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? ICONS.globe }}
    />
  );
}

const LETTER_CLASS = { zoel: s.lmZoel, agar: s.lmAgar, ink: s.lmInk } as const;

/** The service mark picked from the address, a brand letter tile, or the title's first letter. */
export function BrandMark({ url, title, size = 16, brand }: { url: string; title: string; size?: number; brand?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const key = brand ?? brandOf(url, title);
  if (key && MARKS[key]) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={s.bmark}
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: MARKS[key].split('{u}').join(`m${uid}`) }}
      />
    );
  }
  const letter = key ? LETTERS[key] : undefined;
  return (
    <span
      className={cx(s.bmark, s.lm, letter ? LETTER_CLASS[letter[1]] : s.lmMono)}
      aria-hidden="true"
      style={{ ['--s' as string]: `${size}px` }}
    >
      {letter ? letter[0] : firstChar(title)}
    </span>
  );
}
