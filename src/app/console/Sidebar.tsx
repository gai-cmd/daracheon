'use client';

import type { ConsoleLang } from '@/lib/console/i18n';
import { categoryName, type NavEntry } from '@/lib/console/ui-model';
import { Icon } from './Icon';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

export function LangSeg({ onLang, wide }: { onLang: (l: ConsoleLang) => void; wide?: boolean }) {
  const { lang, t } = useUi();
  return (
    <div className={cx(s.seg, wide ? s.wide : s.lang)} role="group" aria-label={t('mLang')}>
      {(
        [
          ['ko', '한국어', '한'],
          ['en', 'English', 'EN'],
        ] as const
      ).map(([l, long, short]) => (
        <button key={l} type="button" lang={l} aria-label={long} aria-pressed={l === lang} onClick={() => onLang(l)}>
          {wide ? (
            long
          ) : (
            <>
              <span className={s.lg}>{long}</span>
              <span className={s.sm}>{short}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// Left menu (REQ-CON-020/025): the order and the single Wiki link come from buildNav().
export default function Sidebar({
  nav,
  current,
  onClose,
  onLang,
}: {
  nav: NavEntry[];
  current: string;
  onClose: () => void;
  onLang: (l: ConsoleLang) => void;
}) {
  const { lang, t } = useUi();
  return (
    <nav
      className={s.side}
      id="console-side"
      aria-label={t('navLabel')}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) onClose();
      }}
    >
      <div className={s.sideTop}>
        <span className={s.zMark} aria-hidden="true">
          Z
        </span>
        <span>{t('brand')}</span>
        <span className={s.sp} />
        <button type="button" className={s.ibtn} aria-label={t('closeNav')} title={t('closeNav')} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {nav.map((e, i) => {
        if (e.type === 'sep') return <div key={`sep-${i}`} className={s.sideSep} role="separator" />;
        if (e.type === 'heading') {
          return (
            <div key={`h-${i}`} className={s.sideH} data-nav-heading="true">
              {t(e.labelKey)}
            </div>
          );
        }
        const label = e.category ? categoryName(lang, e.category) : t(e.labelKey ?? '');
        return (
          <a
            key={e.key}
            className={s.sideItem}
            href={e.href}
            aria-current={e.key === current ? 'page' : undefined}
            data-fk={`nav:${e.key}`}
          >
            <Icon name={e.icon} />
            <span className={s.lbl}>{label}</span>
            {e.count == null ? null : <span className={s.n}>{e.count}</span>}
          </a>
        );
      })}
      <div className={s.sideFoot}>
        <LangSeg onLang={onLang} wide />
        <p className={s.sideNote}>
          <Icon name="info" size={15} />
          <span>{t('sideNote')}</span>
        </p>
      </div>
    </nav>
  );
}
