'use client';

import { useEffect, useRef } from 'react';
import type { ConsoleListItem } from '@/lib/console/types';
import { accessLabel, categoryName, hasCredential, ownersText, safeUrl } from '@/lib/console/ui-model';
import { useApp, type AppValue, type MenuEntry } from './app-context';
import { BrandMark, Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi, type UiValue } from './ui-context';

/** 접속 방식 표시 하나. 공개 항목에는 없다 (REQ-CON-020). */
export function AccTag({ item }: { item: ConsoleListItem }) {
  const { lang } = useUi();
  const label = accessLabel(lang, item.access_method);
  return label ? <span className={s.acc}>{label}</span> : null;
}

/** 행과 카드가 함께 쓰는 더 보기 메뉴: 고정, 편집, 링크 복사, 삭제 (SPEC-CONSOLE-001 그대로). */
export function itemMenu(item: ConsoleListItem, app: AppValue, t: UiValue['t'], askDelete: () => void): MenuEntry[] {
  const pinned = app.pins.includes(item.id);
  const entries: MenuEntry[] = [
    { icon: pinned ? 'starFill' : 'star', label: pinned ? t('unpin') : t('pin'), run: () => app.togglePin(item.id) },
    { icon: 'edit', label: t('edit'), run: () => app.requestEdit(item.id) },
  ];
  if (safeUrl(item.url)) entries.push({ icon: 'copy', label: t('copyLink'), run: () => app.copyText(item.url, t('copied')) });
  if (item.canEdit) entries.push('sep', { icon: 'trash', label: t('del'), danger: true, run: askDelete });
  return entries;
}

/** 행·카드 안의 삭제 확인. 열리면 "취소"에 초점, Esc 로 닫는다. */
export function RowConfirm({ item, onClose }: { item: ConsoleListItem; onClose: () => void }) {
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

// 카드 한 장 (SPEC-CONSOLE-002 REQ-CS2-023, design.md §2.8): 아이콘, 제목(두 줄, 누르면 상세), 설명(두 줄),
// 분류·접속 방식, 담당자, 열기(주소가 있을 때)와 더 보기. 별표 고정은 메뉴로만 한다(첫 화면을 단순하게).
export default function ItemCard({
  item,
  showCred,
  confirming,
  setConfirm,
}: {
  item: ConsoleListItem;
  showCred: boolean;
  confirming: boolean;
  setConfirm: (id: string | null) => void;
}) {
  const { lang, t, L } = useUi();
  const app = useApp();
  const title = L(item, 'title');
  const desc = L(item, 'description');
  const href = safeUrl(item.url);
  const owners = ownersText(item.owners ?? [], app.people, lang);
  const cat = categoryName(lang, app.categories.find((c) => c.id === item.category));
  const cred = hasCredential(item);

  return (
    <li className={cx(s.card, app.panelId === item.id && s.sel)} data-id={item.id}>
      <div className={s.cardTop}>
        <BrandMark url={item.url} title={title} size={22} />
        <button type="button" className={s.cardT} data-open={item.id} onClick={(e) => app.openDetail(item.id, e.currentTarget)}>
          {title}
        </button>
      </div>
      <p className={cx(s.cardDesc, !desc && s.cardMuted)}>{desc || (href ? '' : t('noUrl'))}</p>
      <div className={s.cardMeta}>
        {cat ? <span className={s.cardCat}>{cat}</span> : null}
        <AccTag item={item} />
        {showCred ? (
          <span className={cx(s.rCred, cred && s.on)}>
            <Icon name={cred ? 'check' : 'key'} size={13} />
            {cred ? t('credSet') : t('credUnset')}
          </span>
        ) : null}
      </div>
      <div className={s.cardFoot}>
        <span className={s.cardOwner} title={owners}>
          {owners || t('noOwner')}
        </span>
        {href ? (
          <a className={cx(s.btn, s.xs, s.ghost)} href={href} target="_blank" rel="noopener noreferrer" aria-label={t('openX', { t: title })}>
            {t('open')}
          </a>
        ) : null}
        <button
          type="button"
          className={s.ibtn}
          aria-label={t('moreX', { t: title })}
          title={t('moreX', { t: title })}
          aria-haspopup="menu"
          aria-expanded="false"
          onClick={(e) => app.openMenu(e.currentTarget, itemMenu(item, app, t, () => setConfirm(item.id)), 'end')}
        >
          <Icon name="more" />
        </button>
      </div>
      {confirming ? <RowConfirm item={item} onClose={() => setConfirm(null)} /> : null}
    </li>
  );
}
