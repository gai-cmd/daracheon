'use client';

import { useCallback, useRef, useState } from 'react';
import type { ConsoleLang } from '@/lib/console/i18n';
import { initials, personName } from '@/lib/console/ui-model';
import { useApp } from './app-context';
import { Icon } from './Icon';
import { Popover } from './Popover';
import { LangSeg } from './Sidebar';
import s from './console.module.css';
import { cx } from './cx';
import { useUi } from './ui-context';

export type AdminAction = 'export' | 'import' | 'people' | 'category' | 'teamPins' | 'channels' | 'audit';

const LEGEND_KEYS = ['sso', 'invite', 'shared-credential', 'internal-login'] as const;

/**
 * Account popover body: who is signed in, language on a phone, the label legend, the autofill guide
 * (SPEC-CONSOLE-002 REQ-CS2-018), admin tools for console admins, and sign-out. Exported for the
 * static render test; `close` closes the popover before an entry runs.
 */
export function AccountMenuBody({
  onLang,
  onAdmin,
  onSignOut,
  close,
}: {
  onLang: (l: ConsoleLang) => void;
  onAdmin: (a: AdminAction) => void;
  onSignOut: () => void;
  close: (refocus: boolean) => void;
}) {
  const { lang, t } = useUi();
  const app = useApp();
  const [legend, setLegend] = useState(false);
  // 영어 화면은 영문 이름 → 한국어 이름 → email (SPEC-CONSOLE-002 REQ-CS2-026). me 자체는 바꾸지 않는다.
  const name = personName(app.me.email, app.me.name, app.people, lang);
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
      {item('lock', t('guide.menu'), app.openAutofillGuide)}
      {app.me.isAdmin ? (
        <>
          <div className={s.msep} />
          {item('download', t('mExport'), () => onAdmin('export'))}
          {item('upload', t('mImport'), () => onAdmin('import'))}
          {item('user', t('mPeople'), () => onAdmin('people'))}
          {item('plus', t('mAddCat'), () => onAdmin('category'))}
          {item('star', t('mTeamPins'), () => onAdmin('teamPins'))}
          {item('video', t('mChannels'), () => onAdmin('channels'))}
          {item('list', t('mAudit'), () => onAdmin('audit'))}
        </>
      ) : null}
      <div className={s.msep} />
      {item('logout', t('signOut'), onSignOut)}
    </>
  );
}

// Account button + popover (prototype openAccount). No theme menu (light only) and no reset.
export default function AccountMenu({ onLang, onAdmin, onSignOut }: { onLang: (l: ConsoleLang) => void; onAdmin: (a: AdminAction) => void; onSignOut: () => void }) {
  const { lang, t } = useUi();
  const app = useApp();
  const btn = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = !!anchor;
  const close = useCallback((refocus: boolean) => {
    setAnchor(null);
    if (refocus) btn.current?.focus();
  }, []);
  // 영어 화면은 영문 이름 → 한국어 이름 → email (SPEC-CONSOLE-002 REQ-CS2-026). me 자체는 바꾸지 않는다.
  const name = personName(app.me.email, app.me.name, app.people, lang);

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
          <AccountMenuBody onLang={onLang} onAdmin={onAdmin} onSignOut={onSignOut} close={close} />
        </Popover>
      ) : null}
    </>
  );
}
