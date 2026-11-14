'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { localized, translate, type ConsoleLang, type TranslateVars } from '@/lib/console/i18n';

export interface UiValue {
  lang: ConsoleLang;
  t: (key: string, vars?: TranslateVars) => string;
  /** The `<field>_en` value in the English view when filled in, else the Korean field. */
  L: (obj: object, field: string) => string;
}

function makeUi(lang: ConsoleLang): UiValue {
  return {
    lang,
    t: (key, vars) => translate(lang, key, vars),
    L: (obj, field) => localized(lang, obj, field),
  };
}

const UiContext = createContext<UiValue>(makeUi('ko'));

export function UiProvider({ lang, children }: { lang: ConsoleLang; children?: ReactNode }) {
  const value = useMemo(() => makeUi(lang), [lang]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export const useUi = () => useContext(UiContext);
