'use client';

import { useState, type ReactNode, type RefObject } from 'react';
import { WIKI_CATEGORY_ID } from '@/lib/console/categories';
import type { ConsoleListItem } from '@/lib/console/types';
import { categoryName, hostOf, recentItems, safeUrl, searchItems } from '@/lib/console/ui-model';
import { useApp } from './app-context';
import { BrandMark, Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

interface Opt {
  key: string;
  run: (shift: boolean) => void;
  node: ReactNode;
  more?: boolean;
}

// Top-bar search combobox, ported from the prototype: pinned and recent items while empty, grouped
// results while typing, Enter opens in a new tab, Shift+Enter shows the detail panel.
export default function SearchBox({
  inputRef,
  onShowResults,
  onExit,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  onShowResults: (q: string) => void;
  /** Leaves the phone search mode. */
  onExit: () => void;
}) {
  const { lang, t, L } = useUi();
  const app = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const activate = (c: ConsoleListItem, shift: boolean) => {
    const href = safeUrl(c.url);
    close();
    onExit();
    if (href && !shift) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    app.openDetail(c.id, inputRef.current);
  };
  const showAll = (query: string) => {
    close();
    inputRef.current?.blur();
    onExit();
    onShowResults(query);
  };

  const groups: { key: string; label: string; opts: Opt[] }[] = [];
  const opts: Opt[] = [];
  const itemOpt = (c: ConsoleListItem): Opt => ({
    key: c.id,
    run: (shift) => activate(c, shift),
    node: (
      <>
        <BrandMark url={c.url} title={L(c, 'title')} />
        <span className={s.soT}>{L(c, 'title')}</span>
        <span className={s.soH}>{hostOf(c.url) || t('noUrl')}</span>
        <span className={s.soC}>{categoryName(lang, app.categories.find((x) => x.id === c.category))}</span>
      </>
    ),
  });
  const group = (key: string, label: string, its: ConsoleListItem[]) => {
    if (!its.length) return;
    const g = { key, label, opts: its.map(itemOpt) };
    groups.push(g);
    opts.push(...g.opts);
  };
  const query = q.trim();
  let empty: ReactNode = null;
  let tail: Opt | null = null;
  if (open) {
    if (!query) {
      const byId = new Map(app.items.map((i) => [i.id, i]));
      const pinIds = app.pins.length ? app.pins : app.teamPins;
      const pins = pinIds.map((id) => byId.get(id)).filter((x): x is ConsoleListItem => !!x);
      group('p', app.pins.length ? t('gPinned') : t('teamPins'), pins.slice(0, 6));
      group('r', t('gRecent'), recentItems(app.items).filter((c) => !pins.includes(c)).slice(0, 6));
    } else {
      const res = searchItems(query, app.items, { categories: app.categories, people: app.people });
      if (!res.length) {
        empty = <div className={s.sEmpty}>{t('noResults', { q: query })}</div>;
        tail = { key: 'all', run: () => showAll(''), node: <span>{t('seeAll')}</span>, more: true };
      } else {
        const isShared = (c: ConsoleListItem) => c.access_method === 'shared-credential';
        const isWiki = (c: ConsoleListItem) => c.category === WIKI_CATEGORY_ID;
        group('o', t('gOpen'), res.filter((c) => !isShared(c) && !isWiki(c)).slice(0, 6));
        group('s', t('gShared'), res.filter(isShared).slice(0, 6));
        group('w', t('gWiki'), res.filter((c) => !isShared(c) && isWiki(c)).slice(0, 6));
        tail = { key: 'more', run: () => showAll(query), node: <span>{t('allResults', { q: query, n: res.length })}</span>, more: true };
      }
    }
    if (tail) opts.push(tail);
  }

  const optEl = (o: Opt) => {
    const i = opts.indexOf(o);
    return (
      <div
        key={o.key}
        id={`so-${i}`}
        className={cx(s.sopt, o.more && s.more)}
        role="option"
        aria-selected={i === active}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => o.run(e.shiftKey)}
      >
        {o.node}
      </div>
    );
  };

  return (
    <div className={s.search}>
      <button
        type="button"
        className={cx(s.ibtn, s.sClose)}
        aria-label={t('closeSearch')}
        title={t('closeSearch')}
        onClick={() => {
          close();
          onExit();
        }}
      >
        <Icon name="back" />
      </button>
      <Icon name="search" className={s.sIc} />
      <input
        ref={inputRef}
        type="search"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="console-sres"
        aria-activedescendant={active >= 0 ? `so-${active}` : undefined}
        aria-label={t('searchLabel')}
        placeholder={t('searchPh')}
        value={q}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => close(), 0)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!open) setOpen(true);
            if (!opts.length) return;
            setActive((a) => (e.key === 'ArrowDown' ? (a + 1) % opts.length : a <= 0 ? opts.length - 1 : a - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (active >= 0 && opts[active]) opts[active].run(e.shiftKey);
            else if (query) showAll(query);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            if (open) close();
            else if (q) setQ('');
            else {
              inputRef.current?.blur();
              onExit();
            }
          }
        }}
      />
      <kbd className={s.kbd} aria-hidden="true">
        /
      </kbd>
      <div id="console-sres" className={s.sres} role="listbox" hidden={!open}>
        {groups.map((g) => (
          <div key={g.key} role="group" aria-labelledby={`sg-${g.key}`}>
            <div className={s.sgH} id={`sg-${g.key}`} role="presentation">
              {g.label}
            </div>
            {g.opts.map(optEl)}
          </div>
        ))}
        {empty}
        {tail ? optEl(tail) : null}
        <div className={s.sFoot} aria-hidden="true">
          {t('srHint')}
        </div>
      </div>
    </div>
  );
}
