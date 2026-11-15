'use client';

import { useState } from 'react';
import type { ConsoleListItem } from '@/lib/console/types';
import { attentionCounts, categoryName, homeSummary, recentItems, safeUrl } from '@/lib/console/ui-model';
import { useApp } from './app-context';
import { AccTag } from './ItemCard';
import { BrandMark, Icon } from './Icon';
import { ItemList } from './ListView';
import ViewToggle from './ViewToggle';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

function PinChip({ item }: { item: ConsoleListItem }) {
  const { t, L } = useUi();
  const app = useApp();
  const title = L(item, 'title');
  const href = safeUrl(item.url);
  const inner = (
    <>
      <BrandMark url={item.url} title={title} size={20} />
      <span className={s.pcN}>{title}</span>
      <AccTag item={item} />
    </>
  );
  return href ? (
    <a className={s.pchip} href={href} target="_blank" rel="noopener noreferrer" title={t('openX', { t: title })}>
      {inner}
    </a>
  ) : (
    <button type="button" className={s.pchip} title={title} onClick={(e) => app.openDetail(item.id, e.currentTarget)}>
      {inner}
    </button>
  );
}

function PinEditList({ items }: { items: ConsoleListItem[] }) {
  const { t, L } = useUi();
  const app = useApp();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const move = (id: string, delta: number) => {
    const ids = [...app.pins];
    const i = ids.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    app.setPins(ids);
  };
  return (
    <ul className={s.pinEdit} aria-describedby="pin-hint">
      {items.map((c, i) => {
        const title = L(c, 'title');
        return (
          <li
            key={c.id}
            className={cx(s.peRow, dragId === c.id && s.dragging, overId === c.id && s.over)}
            draggable
            onDragStart={(e) => {
              setDragId(c.id);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', c.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              if (!dragId || dragId === c.id) return;
              e.preventDefault();
              setOverId(c.id);
            }}
            onDragLeave={() => setOverId((o) => (o === c.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (!dragId || dragId === c.id) return;
              const ids = [...app.pins];
              const from = ids.indexOf(dragId);
              const to = ids.indexOf(c.id);
              if (from < 0 || to < 0) return;
              ids.splice(from, 1);
              ids.splice(to, 0, dragId);
              app.setPins(ids);
              setDragId(null);
              setOverId(null);
            }}
          >
            <Icon name="grip" size={16} className={s.grip} />
            <BrandMark url={c.url} title={title} size={18} />
            <span className={s.peN}>{title}</span>
            <button type="button" className={s.ibtn} aria-label={`${t('moveUp')} · ${title}`} title={t('moveUp')} aria-disabled={i === 0} onClick={() => move(c.id, -1)}>
              <Icon name="up" />
            </button>
            <button
              type="button"
              className={s.ibtn}
              aria-label={`${t('moveDown')} · ${title}`}
              title={t('moveDown')}
              aria-disabled={i === items.length - 1}
              onClick={() => move(c.id, 1)}
            >
              <Icon name="down" />
            </button>
            <button type="button" className={s.ibtn} aria-label={`${t('unpin')} · ${title}`} title={t('unpin')} onClick={() => app.togglePin(c.id)}>
              <Icon name="close" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Home (REQ-CON-020): pinned or team essentials, recently updated, the per-category summary of the
// regular categories (never the wiki, REQ-CON-025), and one needs-attention line only when needed.
// SPEC-CONSOLE-002 M3: 최근 수정 목록은 "최근 수정한 카드 보기" 펼침 안에서 목록·카드 보기로 그린다
// (REQ-CS2-022/037). M4 에서 이 구역 위에 채널 새 소식이 들어온다. recentOpen 은 처음 펼침 상태(테스트용).
export default function HomeView({ recentOpen = false }: { recentOpen?: boolean }) {
  const { lang, t, L } = useUi();
  const app = useApp();
  const [pinEdit, setPinEdit] = useState(false);
  const [showRecent, setShowRecent] = useState(recentOpen);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const byId = new Map(app.items.map((i) => [i.id, i]));
  const usingTeam = !app.pins.length;
  const pinItems = (usingTeam ? app.teamPins : app.pins).map((id) => byId.get(id)).filter((x): x is ConsoleListItem => !!x);
  const recent = recentItems(app.items).slice(0, 6);
  const summary = homeSummary(app.categories, app.items, app.teamPins);
  const attn = attentionCounts(app.items);

  return (
    <>
      <h1 className={cx(s.sr, s.pageT)} tabIndex={-1}>
        {t('nav.home')}
      </h1>
      <section className={s.hsec} aria-labelledby="h-pins">
        <div className={s.hsecH}>
          <h2 id="h-pins">{usingTeam ? t('teamPins') : t('pinned')}</h2>
          <span className={s.sp} />
          {usingTeam ? null : (
            <button type="button" className={s.linkbtn} aria-pressed={pinEdit} onClick={() => setPinEdit((v) => !v)}>
              {pinEdit ? t('done') : t('reorder')}
            </button>
          )}
        </div>
        {usingTeam ? (
          <div className={s.pinEmpty}>
            <p className={s.hint}>{pinItems.length ? t('pinEmpty') : `${t('teamPinsNone')} ${t('pinEmpty')}`}</p>
            {pinItems.length ? (
              <button
                type="button"
                className={s.linkbtn}
                onClick={() => {
                  app.setPins(pinItems.map((i) => i.id));
                  app.toast(t('pinAdopted', { n: pinItems.length }));
                }}
              >
                {t('pinAdopt')}
              </button>
            ) : null}
          </div>
        ) : null}
        {pinEdit && !usingTeam ? (
          <>
            <p className={s.hint} id="pin-hint" style={{ margin: '-2px 0 8px' }}>
              {t('dragHint')}
            </p>
            <PinEditList items={pinItems} />
          </>
        ) : (
          <ul className={s.pins}>
            {pinItems.map((c) => (
              <li key={c.id}>
                <PinChip item={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.hsec} aria-labelledby="h-recent">
        <div className={s.hsecH}>
          <h2 id="h-recent">{t('recent')}</h2>
          <span className={s.sp} />
          {app.items.length > 6 ? (
            <a
              className={s.linkbtn}
              href="#/all"
              onClick={(e) => {
                e.preventDefault();
                app.go({ name: 'all' }, { sort: { key: 'updated', dir: -1 } });
              }}
            >
              {t('seeMore')}
            </a>
          ) : null}
        </div>
        <button
          type="button"
          className={cx(s.btn, s.ghost, s.moreTg)}
          aria-expanded={showRecent}
          aria-controls="h-recent-list"
          onClick={() => setShowRecent((v) => !v)}
        >
          <span>{t('recentToggle')}</span>
          <Icon name="chevron" size={16} />
        </button>
        <div id="h-recent-list" hidden={!showRecent}>
          {showRecent ? (
            recent.length ? (
              <>
                <div className={s.recentBar}>
                  <ViewToggle />
                </div>
                <div className={s.listwrap}>
                  <ItemList items={recent} showCat={true} showCred={false} confirmId={confirmId} setConfirm={setConfirmId} />
                </div>
              </>
            ) : (
              <p className={s.hint}>{t('emptyList')}</p>
            )
          ) : null}
        </div>
      </section>

      <section className={s.hsec} aria-labelledby="h-sum">
        <div className={s.hsecH}>
          <h2 id="h-sum">{t('summary')}</h2>
        </div>
        <div className={s.sum}>
          {summary.map(({ category, count, reps }) => (
            <div key={category.id} className={s.scell}>
              <a className={s.sHead} href={`#/cat/${category.id}`}>
                <Icon name={category.icon} size={16} />
                <span className={s.lbl}>{categoryName(lang, category)}</span>
                <span className={s.n}>{count}</span>
              </a>
              <ul className={s.sLinks}>
                {reps.map((c) => {
                  const href = safeUrl(c.url);
                  const title = L(c, 'title');
                  const inner = (
                    <>
                      <BrandMark url={c.url} title={title} size={14} />
                      <span className={s.sLinkT}>{title}</span>
                    </>
                  );
                  return (
                    <li key={c.id}>
                      {href ? (
                        <a className={s.sLink} href={href} target="_blank" rel="noopener noreferrer" title={title}>
                          {inner}
                        </a>
                      ) : (
                        <button type="button" className={s.sLink} onClick={(e) => app.openDetail(c.id, e.currentTarget)}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {count ? (
                <a className={cx(s.linkbtn, s.sAll)} href={`#/cat/${category.id}`}>
                  {t('viewAllN', { n: count })}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {attn.noOwner || attn.noUrl ? (
        <div className={s.attn} role="group" aria-labelledby="h-attn">
          <Icon name="flag" size={16} />
          <span className={s.attnLb} id="h-attn">
            {t('attention')}
          </span>
          {attn.noOwner ? (
            <button type="button" onClick={() => app.go({ name: 'all' }, { filters: { attn: 'owner' } })}>
              {t('noOwnerN', { n: attn.noOwner })}
            </button>
          ) : null}
          {attn.noOwner && attn.noUrl ? (
            <span className={s.attnSep} aria-hidden="true">
              ·
            </span>
          ) : null}
          {attn.noUrl ? (
            <button type="button" onClick={() => app.go({ name: 'all' }, { filters: { attn: 'url' } })}>
              {t('noUrlN', { n: attn.noUrl })}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export { AccTag };
