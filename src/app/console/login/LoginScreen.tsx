'use client';

import { useEffect, useState } from 'react';
import { LANG_STORAGE_KEY, resolveLang, type ConsoleLang } from '@/lib/console/i18n';
import { BrandMark } from '../Icon';
import { LangSeg } from '../Sidebar';
import s from '../console.module.css';
import { cx } from '../cx';
import { UiProvider, useUi } from '../ui-context';

function Card({ startHref, error, onLang }: { startHref: string; error: string | null; onLang: (l: ConsoleLang) => void }) {
  const { t } = useUi();
  return (
    <div className={s.login}>
      <div className={s.loginCard}>
        <div className={s.loginLang}>
          <LangSeg onLang={onLang} />
        </div>
        <div className={s.siLogo}>
          <span className={s.zMark} aria-hidden="true">
            Z
          </span>
        </div>
        <h1 className={s.siTitle}>{t('login.title')}</h1>
        {error ? (
          <p className={s.formErr} role="alert">
            {t(`login.err.${error}`)}
          </p>
        ) : null}
        <a className={cx(s.btn, s.ghost, s.siBtn)} href={startHref}>
          <BrandMark url="" title="" brand="google" size={18} />
          {t('login.button')}
        </a>
        <p className={s.siLine}>{t('login.line')}</p>
      </div>
    </div>
  );
}

export default function LoginScreen({ startHref, error }: { startHref: string; error: string | null }) {
  const [lang, setLang] = useState<ConsoleLang>('ko');
  useEffect(() => {
    try {
      setLang(resolveLang(JSON.parse(window.localStorage.getItem(LANG_STORAGE_KEY) ?? 'null')));
    } catch {
      // storage unavailable
    }
  }, []);
  const choose = (l: ConsoleLang) => {
    setLang(l);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, JSON.stringify(l));
    } catch {
      // storage unavailable
    }
  };
  return (
    <UiProvider lang={lang}>
      <div className={s.root} data-admin-root="console" lang={lang}>
        <Card startHref={startHref} error={error} onLang={choose} />
      </div>
    </UiProvider>
  );
}
