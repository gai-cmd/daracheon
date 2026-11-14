'use client';

import { useEffect, useRef, useState } from 'react';
import { CONSOLE_ACCESS_METHODS, CONSOLE_TEAMS, type ConsoleListItem } from '@/lib/console/types';
import {
  GROUP_ROWS,
  absTime,
  accessLabel,
  applyFilters,
  categoryName,
  emptyStateKey,
  hasActiveFilter,
  hostOf,
  noOwner,
  ownerOptions,
  ownersText,
  relTime,
  safeUrl,
  sortItems,
  type ConsoleView,
  type ListFilters,
  type SortKey,
  type SortState,
} from '@/lib/console/ui-model';
import { useApp, type MenuEntry } from './app-context';
import { AccTag } from './HomeView';
import { BrandMark, Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

export interface ListState {
  filters: ListFilters;
  setFilter: <K extends keyof ListFilters>(k: K, v: ListFilters[K]) => void;
  clearFilters: () => void;
  sort: SortState;
  setSort: (s: SortState) => void;
  expanded: ReadonlySet<string>;
  toggleExpanded: (id: string) => void;
  collapsed: ReadonlySet<string>;
  toggleCollapsed: (id: string) => void;
}

function SelChip({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: [string, string][];
  value: string | null;
  onPick: (v: string | null) => void;
}) {
  const { t } = useUi();
  const app = useApp();
  const found = value != null ? options.find((o) => o[0] === value) : undefined;
  return (
    <button
      type="button"
      className={cx(s.fchip, value != null && s.on)}
      aria-haspopup="menu"
      aria-expanded="false"
      onClick={(e) =>
        app.openMenu(
          e.currentTarget,
          [
            { label: t('fAny'), checked: value == null, run: () => onPick(null) },
            'sep',
            ...options.map(([v, l]) => ({ label: l, checked: value === v, run: () => onPick(v) })),
          ],
          'start'
        )
      }
    >
      <span>{value != null ? `${label}: ${found ? found[1] : value}` : label}</span>
      <Icon name="chevron" size={14} />
    </button>
  );
}

function Toolbar({ view, list, items }: { view: ConsoleView; list: ListState; items: ConsoleListItem[] }) {
  const { lang, t } = useUi();
  const app = useApp();
  const f = list.filters;
  const sortOpts: [SortKey | null, string][] = [
    [null, t('sortDefault')],
    ['name', t('colName')],
    ['owner', t('colOwner')],
    ['updated', t('colUpdated')],
  ];
  return (
    <div className={s.toolbar}>
      <div className={s.fchips} role="group" aria-label={t('filters')}>
        {view.name !== 'cat' ? (
          <SelChip
            label={t('fCat')}
            options={app.categories.map((c) => [c.id, categoryName(lang, c)])}
            value={f.cat}
            onPick={(v) => list.setFilter('cat', v)}
          />
        ) : null}
        {view.name !== 'shared' ? (
          <SelChip
            label={t('fAccess')}
            options={CONSOLE_ACCESS_METHODS.map((a) => [a, t(`access.${a}`)])}
            value={f.access}
            onPick={(v) => list.setFilter('access', v as ListFilters['access'])}
          />
        ) : null}
        <SelChip
          label={t('fOwner')}
          options={[['__none', t('noOwner')], ...ownerOptions(items, app.people, lang)]}
          value={f.owner}
          onPick={(v) => list.setFilter('owner', v)}
        />
        <SelChip
          label={t('fTeam')}
          options={CONSOLE_TEAMS.map((x) => [x, t(`teams.${x}`)])}
          value={f.team}
          onPick={(v) => list.setFilter('team', v as ListFilters['team'])}
        />
        {view.name !== 'mine' ? (
          <button type="button" className={cx(s.fchip, s.tog)} aria-pressed={f.mine} onClick={() => list.setFilter('mine', !f.mine)}>
            {t('fMine')}
          </button>
        ) : null}
        <button type="button" className={cx(s.fchip, s.tog)} aria-pressed={!!f.attn} onClick={() => list.setFilter('attn', f.attn ? null : 'any')}>
          {f.attn === 'owner' ? `${t('fAttn')}: ${t('attnOwner')}` : f.attn === 'url' ? `${t('fAttn')}: ${t('attnUrl')}` : t('fAttn')}
        </button>
        {hasActiveFilter(f) ? (
          <button type="button" className={s.linkbtn} onClick={list.clearFilters}>
            {t('clear')}
          </button>
        ) : null}
      </div>
      <div className={s.tbRight}>
        <button
          type="button"
          className={cx(s.fchip, s.sortchip, list.sort.key && s.on)}
          aria-haspopup="menu"
          aria-expanded="false"
          onClick={(e) =>
            app.openMenu(
              e.currentTarget,
              sortOpts.map(([k, l]) => ({ label: l, checked: list.sort.key === k, run: () => list.setSort({ key: k, dir: k === 'updated' ? -1 : 1 }) })),
              'end'
            )
          }
        >
          <span>{`${t('sort')}: ${sortOpts.find((o) => o[0] === list.sort.key)?.[1]}`}</span>
          <Icon name="chevron" size={14} />
        </button>
      </div>
    </div>
  );
}

function HeadRow({ showCat, list }: { showCat: boolean; list: ListState }) {
  const { t } = useUi();
  const sb = (key: SortKey, label: string) => {
    const on = list.sort.key === key;
    return (
      <button
        type="button"
        className={cx(s.sortbtn, on && s.on)}
        aria-label={on ? `${label}, ${list.sort.dir > 0 ? t('sortAsc') : t('sortDesc')}` : label}
        onClick={() => list.setSort(on ? { key, dir: list.sort.dir > 0 ? -1 : 1 } : { key, dir: key === 'updated' ? -1 : 1 })}
      >
        {label}
        {on ? <Icon name={list.sort.dir > 0 ? 'sortUp' : 'sortDown'} size={14} /> : null}
      </button>
    );
  };
  return (
    <div className={s.rhead}>
      <div className={cx(s.c, s.cStar)} />
      <div className={cx(s.c, s.cName)}>{sb('name', t('colName'))}</div>
      {showCat ? <div className={cx(s.c, s.cCat)}>{t('colCat')}</div> : null}
      <div className={cx(s.c, s.cAcc)}>{t('colAccess')}</div>
      <div className={cx(s.c, s.cOwner)}>{sb('owner', t('colOwner'))}</div>
      <div className={cx(s.c, s.cTime)}>{sb('updated', t('colUpdated'))}</div>
      <div className={cx(s.c, s.cAct)}>
        <span className={s.sr}>{t('colActions')}</span>
      </div>
    </div>
  );
}

function RowConfirm({ item, onClose }: { item: ConsoleListItem; onClose: () => void }) {
  const { t } = useUi();
  const app = useApp();
  const noRef = useRef<HTMLButtonElement>(null);
  useEffect(() => noRef.current?.focus(), []);
  return (
    <div
      className={s.rConfirm}
      role="group"
      aria-label={t('delAsk')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <span>{t('delAsk')}</span>
      <button type="button" className={cx(s.btn, s.xs, s.dangerSolid)} onClick={() => void app.deleteItem(item.id)}>
        {t('del')}
      </button>
      <button ref={noRef} type="button" className={cx(s.btn, s.xs, s.ghost)} onClick={onClose}>
        {t('cancel')}
      </button>
    </div>
  );
}

function Row({ item, showCat, confirming, setConfirm }: { item: ConsoleListItem; showCat: boolean; confirming: boolean; setConfirm: (id: string | null) => void }) {
  const { lang, t, L } = useUi();
  const app = useApp();
  const title = L(item, 'title');
  const href = safeUrl(item.url);
  const pinned = app.pins.includes(item.id);
  const host = hostOf(item.url);
  const team = item.team === '공통' ? '' : t(`teamShort.${item.team}`);
  const acc = accessLabel(lang, item.access_method);
  const owners = ownersText(item.owners ?? [], app.people, lang);

  const more = (anchor: HTMLElement) => {
    const entries: MenuEntry[] = [
      { icon: pinned ? 'starFill' : 'star', label: pinned ? t('unpin') : t('pin'), run: () => app.togglePin(item.id) },
      { icon: 'edit', label: t('edit'), run: () => app.requestEdit(item.id) },
    ];
    if (href) entries.push({ icon: 'copy', label: t('copyLink'), run: () => app.copyText(item.url, t('copied')) });
    if (item.canEdit) entries.push('sep', { icon: 'trash', label: t('del'), danger: true, run: () => setConfirm(item.id) });
    app.openMenu(anchor, entries, 'end');
  };

  return (
    <li className={cx(s.row, app.panelId === item.id && s.sel)} data-id={item.id}>
      <div className={cx(s.c, s.cStar)}>
        <button
          type="button"
          className={cx(s.star, pinned && s.on)}
          aria-pressed={pinned}
          aria-label={t('pinOn', { t: title })}
          title={pinned ? t('unpin') : t('pin')}
          onClick={() => app.togglePin(item.id)}
        >
          <Icon name={pinned ? 'starFill' : 'star'} size={17} />
        </button>
      </div>
      <div className={cx(s.c, s.cName)}>
        <BrandMark url={item.url} title={title} />
        <span className={s.rText}>
          <span className={s.rL1}>
            <button type="button" className={s.rOpen} data-open={item.id} onClick={(e) => app.openDetail(item.id, e.currentTarget)}>
              {title}
            </button>
            {href ? (
              <a className={s.rExt} href={href} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-label={t('openX', { t: title })} title={t('openX', { t: title })}>
                <Icon name="external" size={14} />
              </a>
            ) : null}
          </span>
          <span className={s.rL2}>
            {href ? (
              <span className={s.rHost}>{host || item.url}</span>
            ) : (
              <span className={s.rMiss}>
                <span className={s.dot} aria-hidden="true" />
                {t('noUrl')}
              </span>
            )}
            {team ? <span className={s.rTeam}>{team}</span> : null}
            {acc ? <span className={s.rAcc2}>{acc}</span> : null}
          </span>
        </span>
      </div>
      {showCat ? <div className={cx(s.c, s.cCat)}>{categoryName(lang, app.categories.find((c) => c.id === item.category))}</div> : null}
      <div className={cx(s.c, s.cAcc)}>
        <AccTag item={item} />
      </div>
      <div className={cx(s.c, s.cOwner)}>
        {noOwner(item) ? (
          <button type="button" className={s.noowner} onClick={() => app.requestEdit(item.id, 'owner')}>
            {t('noOwner')}
          </button>
        ) : (
          <span title={owners}>{owners}</span>
        )}
      </div>
      <div className={cx(s.c, s.cTime)} title={absTime(lang, item.updatedAt)}>
        {relTime(lang, item.updatedAt, true)}
      </div>
      <div className={cx(s.c, s.cAct)}>
        {href ? (
          <a className={cx(s.btn, s.xs, s.ghost)} href={href} target="_blank" rel="noopener noreferrer" aria-label={t('openX', { t: title })}>
            {t('open')}
          </a>
        ) : (
          <span className={s.btnPh} aria-hidden="true" />
        )}
        <button type="button" className={cx(s.ibtn, s.rPen)} aria-label={t('editX', { t: title })} title={t('editX', { t: title })} onClick={() => app.requestEdit(item.id)}>
          <Icon name="edit" />
        </button>
        <button
          type="button"
          className={s.ibtn}
          aria-label={t('moreX', { t: title })}
          title={t('moreX', { t: title })}
          aria-haspopup="menu"
          aria-expanded="false"
          onClick={(e) => more(e.currentTarget)}
        >
          <Icon name="more" />
        </button>
      </div>
      {confirming ? <RowConfirm item={item} onClose={() => setConfirm(null)} /> : null}
    </li>
  );
}

// List views (REQ-CON-020): roomy one-line rows only (no density toggle), filters with the
// category chip first, a pencil edit action on every row, rows open the right-side detail panel.
export default function ListView({
  view,
  title,
  desc,
  items,
  showCat,
  grouped,
  list,
  searchQ,
}: {
  view: ConsoleView;
  title: string;
  desc?: string;
  items: ConsoleListItem[];
  showCat: boolean;
  grouped: boolean;
  list: ListState;
  searchQ: string;
}) {
  const { lang, t } = useUi();
  const app = useApp();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const shown = sortItems(applyFilters(items, list.filters, app.me), list.sort, lang, app.people);
  const filtered = hasActiveFilter(list.filters);
  const rows = (its: ConsoleListItem[]) => (
    <ul className={s.rows}>
      {its.map((c) => (
        <Row key={c.id} item={c} showCat={showCat} confirming={confirmId === c.id} setConfirm={setConfirmId} />
      ))}
    </ul>
  );

  return (
    <>
      <div className={s.pageH}>
        <h1 className={s.pageT} tabIndex={-1}>
          {title}
        </h1>
        <span className={s.pageN}>{t('itemsN', { n: shown.length })}</span>
        {desc ? <p className={s.pageD}>{desc}</p> : null}
      </div>
      <Toolbar view={view} list={list} items={items} />
      <div className={cx(s.listwrap, !showCat && s.nocat)}>
        {!shown.length ? (
          <div className={s.empty}>
            <p>{t(emptyStateKey(view, filtered), { q: searchQ })}</p>
            {filtered ? (
              <button type="button" className={cx(s.btn, s.ghost)} onClick={list.clearFilters}>
                {t('clear')}
              </button>
            ) : view.name === 'search' ? (
              <a className={cx(s.btn, s.ghost)} href="#/all">
                {t('seeAll')}
              </a>
            ) : null}
          </div>
        ) : (
          <>
            <HeadRow showCat={showCat} list={list} />
            {grouped && list.sort.key !== 'updated'
              ? app.categories.map((cat) => {
                  const its = shown.filter((c) => c.category === cat.id);
                  if (!its.length) return null;
                  const collapsed = list.collapsed.has(cat.id);
                  const all = list.expanded.has(cat.id);
                  return (
                    <section key={cat.id} className={s.group} aria-labelledby={`g-${cat.id}`}>
                      <h2 className={s.gH}>
                        <button type="button" className={s.gBtn} id={`g-${cat.id}`} aria-expanded={!collapsed} onClick={() => list.toggleCollapsed(cat.id)}>
                          <Icon name="chevron" size={16} className={s.gChev} />
                          <span>{categoryName(lang, cat, true)}</span>
                          <span className={s.n}>{its.length}</span>
                        </button>
                      </h2>
                      {collapsed ? null : (
                        <>
                          {rows(all ? its : its.slice(0, GROUP_ROWS))}
                          {its.length > GROUP_ROWS ? (
                            <button type="button" className={s.gMore} onClick={() => list.toggleExpanded(cat.id)}>
                              {all ? t('showLess') : t('showMoreN', { n: its.length - GROUP_ROWS })}
                            </button>
                          ) : null}
                        </>
                      )}
                    </section>
                  );
                })
              : rows(shown)}
          </>
        )}
      </div>
    </>
  );
}
