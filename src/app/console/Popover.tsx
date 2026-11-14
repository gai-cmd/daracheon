'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { MenuEntry } from './app-context';
import { Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';

// Fixed-position popover drawn inside the console root (never portalled to document.body,
// design.md §6.2). Closes on outside press, Escape, Tab (menus), resize and scroll.
export function Popover({
  anchor,
  onClose,
  align = 'end',
  role = 'menu',
  label,
  className,
  children,
}: {
  anchor: HTMLElement;
  onClose: (refocus: boolean) => void;
  align?: 'start' | 'end';
  role?: 'menu' | 'dialog';
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const pop = ref.current;
    if (!pop) return;
    const r = anchor.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    let left = align === 'start' ? r.left : r.right - pw;
    left = Math.min(Math.max(8, left), vw - pw - 8);
    let top = r.bottom + 6;
    if (top + ph > vh - 8 && r.top - ph - 6 >= 8) top = r.top - ph - 6;
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(Math.max(8, Math.min(top, vh - ph - 8)))}px`;
  });

  useEffect(() => {
    anchor.setAttribute('aria-expanded', 'true');
    const first = ref.current?.querySelector<HTMLElement>('[role^="menuitem"],button,a[href],input');
    first?.focus({ preventScroll: true });
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor.contains(t)) onClose(false);
    };
    const away = () => onClose(false);
    const scrolled = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) onClose(false);
    };
    document.addEventListener('pointerdown', down, true);
    window.addEventListener('resize', away);
    document.addEventListener('scroll', scrolled, true);
    return () => {
      anchor.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', down, true);
      window.removeEventListener('resize', away);
      document.removeEventListener('scroll', scrolled, true);
    };
  }, [anchor, onClose]);

  return (
    <div
      ref={ref}
      className={cx(s.pop, className)}
      role={role}
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose(true);
          return;
        }
        if (e.key === 'Tab' && role === 'menu') {
          e.preventDefault();
          onClose(true);
          return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        const list = Array.from(ref.current?.querySelectorAll<HTMLElement>(role === 'menu' ? '[role^="menuitem"]' : 'button') ?? []);
        if (!list.length) return;
        e.preventDefault();
        const i = list.indexOf(document.activeElement as HTMLElement);
        const n = e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
        list[n].focus();
      }}
    >
      {children}
    </div>
  );
}

export function MenuItems({ items, onDone }: { items: MenuEntry[]; onDone: () => void }) {
  return (
    <>
      {items.map((it, i) =>
        it === 'sep' ? (
          <div key={`s${i}`} className={s.msep} role="separator" />
        ) : (
          <button
            key={`${i}-${it.label}`}
            type="button"
            className={cx(s.mi, it.danger && s.danger)}
            role={it.checked == null ? 'menuitem' : 'menuitemradio'}
            aria-checked={it.checked == null ? undefined : it.checked}
            onClick={() => {
              onDone();
              it.run();
            }}
          >
            {it.icon ? <Icon name={it.icon} /> : null}
            <span>{it.label}</span>
            {it.checked ? <Icon name="check" size={16} className={s.ck} /> : null}
          </button>
        )
      )}
    </>
  );
}
