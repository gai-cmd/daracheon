'use client';

import { useCallback, useRef, useState } from 'react';
import type { ConsoleLang } from '@/lib/console/i18n';
import { initials } from '@/lib/console/ui-model';
import { useApp } from './app-context';
import { Icon } from './Icon';
import { Popover } from './Popover';
import { LangSeg } from './Sidebar';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

export type AdminAction = 'export' | 'import' | 'people' | 'category' | 'teamPins' | 'audit';

const LEGEND_KEYS = ['sso', 'invite', 'shared-credential', 'internal-login'] as const;

// Account popover (prototype openAccount): who is signed in, language on a phone, the label legend,
// admin tools for console admins, and sign-out. No theme menu (light only) and no reset.
export default function AccountMenu({ onLang, onAdmin, onSignOut }: { onLang: (l: ConsoleLang) => void; onAdmin: (a: AdminAction) => void; onSignOut: () => void }) {
  const { t } = useUi();
  const app = useApp();
  const btn = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [legend, setLegend] = useState(false);
  const open = !!anchor;
  const close = useCallback((refocus: boolean) => {
    setAnchor(null);
    setLegend(false);
    if (refocus) btn.current?.focus();
  }, []);
  const name = app.me.name || app.me.email;
  const item = (icon: string, label: string, run: () => void, extra?: { danger?: boolean }) => (
    <button
      type="button"
      className={cx(s.mi, extra?.danger && s.danger)}
      onClick={() => {
        close(true);
        run();
      }}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={s.user}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t('accountMenu')} · ${t('signedInAs', { n: name })}`}
        onClick={(e) => (open ? close(true) : setAnchor(e.currentTarget))}
      >
        <span className={s.av} aria-hidden="true">
          {initials(name)}
        </span>
        <span className={s.uname}>{name}</span>
      </button>
      {anchor ? (
        <Popover anchor={anchor} onClose={close} role="dialog" label={t('accountMenu')} className={s.acct}>
          <div className={s.acctH}>
            <span className={s.av} aria-hidden="true">
              {initials(name)}
            </span>
            <span className={s.acctT}>
              <span className={s.acctN}>{name}</span>
              <span className={s.acctE}>{app.me.email}</span>
            </span>
            {app.me.isAdmin ? <span className={s.role}>{t('admin')}</span> : null}
          </div>
          <div className={s.mLang}>
            <div className={s.msep} />
            <div className={s.mh}>{t('mLang')}</div>
            <div className={s.mPad}>
              <LangSeg onLang={onLang} wide />
            </div>
          </div>
          <div className={s.msep} />
          <button type="button" className={s.mi} aria-expanded={legend} onClick={() => setLegend((v) => !v)}>
            <Icon name="help" />
            <span>{t('mLegend')}</span>
          </button>
          {legend ? (
            <ul className={s.legend}>
              {LEGEND_KEYS.map((k) => (
                <li key={k}>
                  <span className={s.legendK}>
                    <span className={s.acc}>{t(`access.${k}`)}</span>
                  </span>
                  <span>{t(`legend.${k}`)}</span>
                </li>
              ))}
              <li>
                <span className={s.legendK}>
                  <span className={cx(s.flag, s.warn)}>
                    <span className={s.dot} aria-hidden="true" />
                    {t('noUrl')}
                  </span>
                </span>
                <span>{t('legendNoUrl')}</span>
              </li>
              <li>
                <span className={s.legendK}>
                  <span className={cx(s.flag, s.warn)}>{t('noOwner')}</span>
                </span>
                <span>{t('legendNoOwner')}</span>
              </li>
            </ul>
          ) : null}
          {app.me.isAdmin ? (
            <>
              <div className={s.msep} />
              {item('download', t('mExport'), () => onAdmin('export'))}
              {item('upload', t('mImport'), () => onAdmin('import'))}
              {item('user', t('mPeople'), () => onAdmin('people'))}
              {item('plus', t('mAddCat'), () => onAdmin('category'))}
              {item('star', t('mTeamPins'), () => onAdmin('teamPins'))}
              {item('list', t('mAudit'), () => onAdmin('audit'))}
            </>
          ) : null}
          <div className={s.msep} />
          {item('logout', t('signOut'), onSignOut)}
        </Popover>
      ) : null}
    </>
  );
}
