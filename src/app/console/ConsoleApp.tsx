'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { WIKI_CATEGORY_ID } from '@/lib/console/categories';
import { LANG_STORAGE_KEY, resolveLang, translate, type ConsoleLang } from '@/lib/console/i18n';
import type { ConsoleListItem } from '@/lib/console/types';
import {
  EMPTY_FILTERS,
  PIN_STORAGE_KEY,
  MAX_PINS,
  buildNav,
  categoryName,
  hashOf,
  itemsForView,
  readPins,
  viewFromHash,
  viewKey,
  writePins,
  type ConsoleView,
  type ListFilters,
  type SortState,
} from '@/lib/console/ui-model';
import AccountMenu, { type AdminAction } from './AccountMenu';
import { AuditDialog, CategoryDialog, ImportDialog, PeopleDialog, downloadExport } from './AdminDialogs';
import { api, type BootstrapData } from './api';
import { AppContext, type AppValue, type FormFocus, type MenuEntry, type RoutePreset, type ToastOptions } from './app-context';
import DetailPanel from './DetailPanel';
import HomeView from './HomeView';
import { Icon } from './Icon';
import ItemForm from './ItemForm';
import ListView, { type ListState } from './ListView';
import { MenuItems, Popover } from './Popover';
import SearchBox from './SearchBox';
import Sidebar, { LangSeg } from './Sidebar';
import Toasts, { useToasts } from './Toasts';
import s from './console.module.css';
import { cx } from './cx';
import { UiProvider } from './ui-context';

const PREFS_KEY = 'zoel-console:prefs:v1';

type Panel = { mode: 'detail'; id: string } | { mode: 'form'; id: string | null; focus?: FormFocus; rev: number } | null;
type DialogState =
  | { kind: 'import'; text: string; count: number }
  | { kind: 'people' }
  | { kind: 'category' }
  | { kind: 'audit' }
  | null;
type LoadState = 'loading' | 'ready' | 'error' | 'unconfigured';

const store = {
  get(k: string): unknown {
    try {
      const v = window.localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(k: string, v: unknown) {
    try {
      window.localStorage.setItem(k, JSON.stringify(v));
    } catch {
      // storage unavailable
    }
  },
};

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

// @MX:ANCHOR: [AUTO] Root of the /console screen: data load, routing, panel and every shared action.
// @MX:REASON: every view and dialog reads AppContext from here; credential values never pass through
// this component (the detail panel asks the server per click, REQ-CON-017).
// The team console screen (SPEC-CONSOLE-001 REQ-CON-020..023). Data comes only from the
// authenticated console API after mount (REQ-CON-009); nothing is server-rendered.
export default function ConsoleApp() {
  const [lang, setLangState] = useState<ConsoleLang>('ko');
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const [load, setLoad] = useState<LoadState>('loading');
  const [data, setData] = useState<BootstrapData | null>(null);
  const [pinStore, setPinStore] = useState<unknown>(null);
  const [hash, setHash] = useState('');
  const [routeTick, setRouteTick] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [filters, setFilters] = useState<ListFilters>({ ...EMPTY_FILTERS });
  const [sort, setSortState] = useState<SortState>({ key: null, dir: 1 });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<Panel>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; items: MenuEntry[]; align: 'start' | 'end' } | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [drawer, setDrawer] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toasts, push: toast, remove: dropToast } = useToasts();
  const opener = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const navBtn = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const preset = useRef<RoutePreset | null>(null);
  const booted = useRef(false);
  const phone = useMedia('(max-width: 719.98px)');
  const wide = useMedia('(min-width: 1280px)');

  /* ---------- data ---------- */
  const reload = useCallback(async () => {
    const r = await api<BootstrapData>('GET', '/api/console/bootstrap');
    if (r.ok) {
      setData(r.data);
      setLoad('ready');
    } else if (r.status !== 401) {
      setLoad(r.status === 503 ? 'unconfigured' : 'error');
    }
  }, []);

  useEffect(() => {
    setLangState(resolveLang(store.get(LANG_STORAGE_KEY)));
    setPinStore(store.get(PIN_STORAGE_KEY));
    const prefs = store.get(PREFS_KEY) as { collapsed?: unknown } | null;
    if (Array.isArray(prefs?.collapsed)) setCollapsed(new Set(prefs.collapsed.filter((x): x is string => typeof x === 'string').slice(0, 50)));
    setHash(window.location.hash);
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    void reload();
    return () => window.removeEventListener('hashchange', onHash);
  }, [reload]);

  const setLang = useCallback((l: ConsoleLang) => {
    setLangState(l);
    store.set(LANG_STORAGE_KEY, l);
  }, []);

  const items = useMemo(() => data?.items ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const categoryIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);
  const view: ConsoleView = useMemo(() => viewFromHash(hash, categoryIds, !!searchQ), [hash, categoryIds, searchQ]);
  const live = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const pins = useMemo(() => (data ? readPins(pinStore, data.me.email, live) : []), [data, pinStore, live]);

  /** Replaces an item in place, or inserts it (at `index` when given, else at the end). */
  const upsert = useCallback((item: ConsoleListItem, index?: number) => {
    setData((d) => {
      if (!d) return d;
      if (d.items.some((i) => i.id === item.id)) return { ...d, items: d.items.map((i) => (i.id === item.id ? item : i)) };
      const next = [...d.items];
      next.splice(index == null ? next.length : Math.min(Math.max(index, 0), next.length), 0, item);
      return { ...d, items: next };
    });
  }, []);

  /* ---------- routing ---------- */
  useEffect(() => {
    // Apply the preset passed with go(), reset per-view state on every route change.
    const p = preset.current;
    preset.current = null;
    setFilters({ ...EMPTY_FILTERS, ...(p?.filters ?? {}) });
    setSortState(p?.sort ?? { key: null, dir: 1 });
    setExpanded(new Set());
    setMenu(null);
    setDrawer(false);
    mainRef.current?.scrollTo?.({ top: 0 });
    if (booted.current) {
      requestAnimationFrame(() => mainRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }));
    }
    booted.current = true;
  }, [hash, searchQ, routeTick]);

  const go = useCallback((v: ConsoleView, p?: RoutePreset) => {
    preset.current = p ?? null;
    const target = hashOf(v);
    if (window.location.hash === target || (target === '#/' && !window.location.hash)) setRouteTick((n) => n + 1);
    else window.location.hash = target;
  }, []);

  /* ---------- feedback ---------- */
  const copyText = useCallback(
    (text: string, okMsg: string) => {
      const fallback = () => {
        const host = document.querySelector<HTMLElement>('dialog[open]') ?? document.querySelector<HTMLElement>('[data-admin-root="console"]');
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.setAttribute('aria-hidden', 'true');
        ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
        host?.append(ta);
        ta.select();
        let ok = false;
        try {
          ok = document.execCommand('copy');
        } catch {
          ok = false;
        }
        ta.remove();
        toast(ok ? okMsg : t('copyFail'));
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast(okMsg), fallback);
      else fallback();
    },
    [t, toast]
  );

  /* ---------- panel ---------- */
  const panelRef = useRef<Panel>(null);
  panelRef.current = panel;
  const closePanel = useCallback((restore = true) => {
    const id = panelRef.current?.id ?? null;
    setPanel(null);
    if (!restore) return;
    requestAnimationFrame(() => {
      const f = opener.current?.isConnected ? opener.current : id ? document.querySelector<HTMLElement>(`[data-open="${CSS.escape(id)}"]`) : null;
      (f ?? mainRef.current)?.focus({ preventScroll: true });
      opener.current = null;
    });
  }, []);

  const openDetail = useCallback((id: string, from?: HTMLElement | null) => {
    if (from) opener.current = from;
    setPanel({ mode: 'detail', id });
    requestAnimationFrame(() => document.getElementById('pn-title')?.focus({ preventScroll: true }));
  }, []);

  const openForm = useCallback((id: string | null, focus?: FormFocus) => {
    if (!opener.current) opener.current = document.activeElement as HTMLElement | null;
    setPanel({ mode: 'form', id, focus, rev: Date.now() });
  }, []);

  const requestEdit = useCallback(
    (id: string, focus?: FormFocus) => {
      const item = data?.items.find((i) => i.id === id);
      if (!item || !data) return;
      if (!item.canEdit) {
        const owners = item.owners.map((o) => o.name).join(', ');
        const title = lang === 'en' && item.title_en ? item.title_en : item.title;
        toast(owners ? t('editOnlyOwner', { o: owners }) : t('editNoOwner'), {
          action: t('copyReq'),
          onAction: () => copyText(t('reqText', { t: title }), t('reqCopied')),
        });
        return;
      }
      openForm(id, focus);
    },
    [data, lang, t, toast, copyText, openForm]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const index = data?.items.findIndex((i) => i.id === id) ?? -1;
      const removed = index >= 0 ? data!.items[index] : null;
      const r = await api<{ ok: boolean }>('DELETE', `/api/console/items/${encodeURIComponent(id)}`);
      if (!r.ok || !removed) {
        toast(r.status === 0 ? t('errNetwork') : t('deleteFail'));
        return;
      }
      setData((d) => (d ? { ...d, items: d.items.filter((i) => i.id !== id) } : d));
      setPanel((p) => (p && p.id === id ? null : p));
      toast(t('deleted'), {
        action: t('undo'),
        duration: 6000,
        onAction: () => {
          void api<{ item: ConsoleListItem }>('POST', `/api/console/items/${encodeURIComponent(id)}/restore`, {}).then((res) => {
            if (res.ok) {
              upsert(res.data.item, index);
              toast(t('restored'));
            } else toast(t('restoreFail'));
          });
        },
      });
    },
    [data, t, toast, upsert]
  );

  const setPins = useCallback(
    (ids: string[]) => {
      if (!data) return;
      setPinStore((st: unknown) => {
        const next = writePins(st, data.me.email, ids);
        store.set(PIN_STORAGE_KEY, next);
        return next;
      });
    },
    [data]
  );

  const togglePin = useCallback(
    (id: string) => {
      if (pins.includes(id)) {
        setPins(pins.filter((x) => x !== id));
        toast(t('unpinnedT'));
      } else if (pins.length >= MAX_PINS) toast(t('pinFull'));
      else {
        setPins([...pins, id]);
        toast(t('pinnedT'));
      }
    },
    [pins, setPins, t, toast]
  );

  const openMenu = useCallback((anchor: HTMLElement, list: MenuEntry[], align: 'start' | 'end' = 'end') => setMenu({ anchor, items: list, align }), []);
  const closeMenu = useCallback((refocus: boolean) => {
    setMenu((m) => {
      if (refocus) m?.anchor.focus();
      return null;
    });
  }, []);

  const defaultCategory = view.name === 'cat' ? view.cat : categories.find((c) => c.id !== WIKI_CATEGORY_ID)?.id ?? WIKI_CATEGORY_ID;
  const startAdd = useCallback(() => openForm(null), [openForm]);

  const app: AppValue | null = useMemo(
    () =>
      data
        ? {
            me: data.me,
            categories,
            people: data.people,
            items,
            teamPins: data.settings.teamPins.filter((id) => live.has(id)),
            pins,
            panelId: panel?.id ?? null,
            togglePin,
            setPins,
            openDetail,
            requestEdit,
            startAdd,
            deleteItem,
            go,
            toast: (msg: string, opts?: ToastOptions) => toast(msg, opts),
            copyText,
            openMenu,
          }
        : null,
    [data, categories, items, live, pins, panel, togglePin, setPins, openDetail, requestEdit, startAdd, deleteItem, go, toast, copyText, openMenu]
  );

  /* ---------- keyboard ---------- */
  const focusSearch = useCallback(() => {
    if (phone) setSearching(true);
    requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
  }, [phone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) {
        e.preventDefault();
        setMenu(null);
        focusSearch();
        return;
      }
      if (e.key === 'Escape') {
        if (e.defaultPrevented) return;
        if (drawer) {
          setDrawer(false);
          navBtn.current?.focus();
          return;
        }
        // A form never closes on Escape, so typing is not lost.
        if (panel?.mode === 'detail') closePanel(true);
        return;
      }
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const tg = e.target as HTMLElement | null;
      if (tg?.closest?.('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      focusSearch();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer, panel, closePanel, focusSearch]);

  /* ---------- admin ---------- */
  const onAdmin = useCallback(
    async (a: AdminAction) => {
      if (a === 'export') toast((await downloadExport()) ? t('exported') : t('actionFail'));
      else if (a === 'import') fileRef.current?.click();
      else if (a === 'people') setDialog({ kind: 'people' });
      else if (a === 'category') setDialog({ kind: 'category' });
      else if (a === 'audit') setDialog({ kind: 'audit' });
      else if (a === 'teamPins') {
        if (!pins.length) {
          toast(t('teamPinsNeedPins'));
          return;
        }
        const r = await api<{ settings: { teamPins: string[] } }>('PUT', '/api/console/settings', { teamPins: pins });
        if (r.ok) {
          setData((d) => (d ? { ...d, settings: r.data.settings } : d));
          toast(t('teamPinsSaved', { n: r.data.settings.teamPins.length }));
        } else toast(t('actionFail'));
      }
    },
    [pins, t, toast]
  );

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    let obj: unknown;
    try {
      obj = JSON.parse(text);
    } catch {
      toast(t('imp.errJson'));
      return;
    }
    const o = (Array.isArray(obj) ? { cards: obj } : obj) as { cards?: unknown; items?: unknown } | null;
    const list = Array.isArray(o?.cards) ? o.cards : Array.isArray(o?.items) ? o.items : null;
    if (!list) {
      toast(t('imp.errShape'));
      return;
    }
    setDialog({ kind: 'import', text, count: list.length });
  };

  const signOut = async () => {
    const r = await api<{ ok: boolean }>('POST', '/api/console/auth/logout');
    if (r.ok) window.location.assign('/console/login');
    else toast(t('signOutFail'));
  };

  /* ---------- render ---------- */
  const toastOffsets = {
    ['--t-l' as string]: phone ? '0px' : 'var(--side-w)',
    ['--t-r' as string]: !phone && wide && panel ? 'var(--panel-w)' : '0px',
    ['--t-b' as string]: phone && panel ? '84px' : '20px',
  } as CSSProperties;
  const toastLayer = <Toasts toasts={toasts} onDone={dropToast} offsets={toastOffsets} />;

  if (!app) {
    return (
      <UiProvider lang={lang}>
        <div className={s.root} data-admin-root="console" lang={lang}>
          <header className={s.top}>
            <span className={s.brand}>
              <span className={s.zMark} aria-hidden="true">
                Z
              </span>
              <span>{t('brand')}</span>
            </span>
          </header>
          <div className={s.state} role={load === 'loading' ? 'status' : 'alert'}>
            <p>{load === 'loading' ? t('loading') : load === 'unconfigured' ? t('notConfigured') : t('loadFail')}</p>
            {load === 'error' ? (
              <button type="button" className={cx(s.btn, s.ghost)} onClick={() => void reload()}>
                {t('retry')}
              </button>
            ) : null}
          </div>
        </div>
      </UiProvider>
    );
  }

  const list: ListState = {
    filters,
    setFilter: (k, v) => {
      setFilters((f) => ({ ...f, [k]: v }));
      setExpanded(new Set());
    },
    clearFilters: () => setFilters({ ...EMPTY_FILTERS }),
    sort,
    setSort: setSortState,
    expanded,
    toggleExpanded: (id) =>
      setExpanded((e) => {
        const n = new Set(e);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    collapsed,
    toggleCollapsed: (id) =>
      setCollapsed((c) => {
        const n = new Set(c);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        store.set(PREFS_KEY, { collapsed: [...n] });
        return n;
      }),
  };

  const viewItems = itemsForView(view, items, { me: data!.me, searchQ, categories, people: data!.people });
  let body;
  if (view.name === 'home') body = <HomeView />;
  else {
    const cat = view.name === 'cat' ? categories.find((c) => c.id === view.cat) : undefined;
    const title =
      view.name === 'cat'
        ? categoryName(lang, cat, true)
        : view.name === 'shared'
          ? t('nav.shared')
          : view.name === 'mine'
            ? t('nav.mine')
            : view.name === 'search'
              ? t('searchView', { q: searchQ })
              : t('nav.all');
    const desc = view.name === 'cat' && cat ? (lang === 'en' && cat.description_en ? cat.description_en : cat.description) : view.name === 'shared' ? t('sharedDesc') : undefined;
    body = (
      <ListView
        key={viewKey(view)}
        view={view}
        title={title}
        desc={desc}
        items={viewItems}
        showCat={view.name !== 'cat'}
        grouped={view.name === 'all'}
        list={list}
        searchQ={searchQ}
      />
    );
  }

  const panelItem = panel?.id ? items.find((i) => i.id === panel.id) : undefined;
  let panelBody = null;
  if (panel?.mode === 'detail' && panelItem) panelBody = <DetailPanel key={panelItem.id} item={panelItem} onClose={() => closePanel(true)} />;
  else if (panel?.mode === 'form' && (panel.id === null || panelItem)) {
    panelBody = (
      <ItemForm
        key={`${panel.id ?? 'new'}:${panel.rev}`}
        item={panelItem ?? null}
        defaultCategory={defaultCategory}
        focus={panel.focus}
        onCancel={() => (panelItem ? openDetail(panelItem.id) : closePanel(true))}
        onSaved={(saved, isNew) => {
          upsert(saved);
          openDetail(saved.id);
          toast(isNew ? t('added') : t('saved'));
        }}
        onConflict={(latest) => {
          upsert(latest);
          setPanel({ mode: 'form', id: latest.id, rev: Date.now() });
        }}
      />
    );
  }

  const dialogEl =
    dialog?.kind === 'import' ? (
      <ImportDialog text={dialog.text} count={dialog.count} onClose={() => setDialog(null)} onDone={() => void reload()} overlay={toastLayer} />
    ) : dialog?.kind === 'people' ? (
      <PeopleDialog onClose={() => setDialog(null)} onSaved={() => void reload()} overlay={toastLayer} />
    ) : dialog?.kind === 'category' ? (
      <CategoryDialog
        onClose={() => setDialog(null)}
        overlay={toastLayer}
        onAdded={(id) => {
          setDialog(null);
          void reload().then(() => {
            toast(t('cat.added'));
            go({ name: 'cat', cat: id });
          });
        }}
      />
    ) : dialog?.kind === 'audit' ? (
      <AuditDialog onClose={() => setDialog(null)} overlay={toastLayer} />
    ) : null;

  const nav = buildNav({ categories, items, me: data!.me });

  return (
    <UiProvider lang={lang}>
      <AppContext.Provider value={app}>
        <div
          className={cx(s.root, drawer && s.drawerOpen, searching && s.searching)}
          data-admin-root="console"
          lang={lang}
        >
          <button type="button" className={s.skip} onClick={() => mainRef.current?.focus()}>
            {t('skip')}
          </button>
          <header className={s.top} inert={phone && (drawer || !!panel) ? true : undefined}>
            <button
              ref={navBtn}
              type="button"
              className={cx(s.ibtn, s.navTg)}
              aria-controls="console-side"
              aria-expanded={drawer}
              aria-label={t('openNav')}
              title={t('openNav')}
              onClick={() => setDrawer((d) => !d)}
            >
              <Icon name="menu" />
            </button>
            <a className={s.brand} href="#/">
              <span className={s.zMark} aria-hidden="true">
                Z
              </span>
              <span className={s.lg}>{t('brand')}</span>
              <span className={s.sm}>{t('brandShort')}</span>
            </a>
            <SearchBox
              inputRef={searchRef}
              onExit={() => setSearching(false)}
              onShowResults={(q) => {
                if (!q) {
                  go({ name: 'all' });
                  return;
                }
                setSearchQ(q);
                go({ name: 'search' });
              }}
            />
            <span className={s.sp} />
            <button type="button" className={cx(s.ibtn, s.searchTg)} aria-label={t('openSearch')} title={t('openSearch')} onClick={focusSearch}>
              <Icon name="search" />
            </button>
            <LangSeg onLang={setLang} />
            <button type="button" className={cx(s.btn, s.primary, s.add)} onClick={startAdd}>
              <Icon name="plus" />
              <span className={s.lbl}>{t('addItem')}</span>
            </button>
            <AccountMenu onLang={setLang} onAdmin={(a) => void onAdmin(a)} onSignOut={() => void signOut()} />
          </header>
          <div className={s.frame}>
            <Sidebar nav={nav} current={viewKey(view)} onClose={() => setDrawer(false)} onLang={setLang} />
            <div className={s.main} id="console-main" ref={mainRef} tabIndex={-1} inert={phone && (drawer || !!panel) ? true : undefined}>
              <div className={s.content}>{body}</div>
            </div>
            {panelBody ? (
              <aside className={s.panel} aria-labelledby="pn-title">
                {panelBody}
              </aside>
            ) : null}
          </div>
          {drawer ? <div className={s.scrim} onClick={() => setDrawer(false)} /> : null}
          {menu ? (
            <Popover anchor={menu.anchor} onClose={closeMenu} align={menu.align}>
              <MenuItems items={menu.items} onDone={() => closeMenu(true)} />
            </Popover>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              void onFile(f);
            }}
          />
          {dialogEl}
          {dialogEl ? null : toastLayer}
        </div>
      </AppContext.Provider>
    </UiProvider>
  );
}
