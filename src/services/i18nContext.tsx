import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppLanguage,
  APP_LANGUAGES_META,
  applyDocumentLanguage,
  getLocalizedLangName,
  getStoredAppLanguage,
  setStoredAppLanguage,
  UI_LOCALES,
  UiTranslations,
} from './appTranslations.ts';

interface I18nContextValue {
  appLang: AppLanguage;
  setAppLang: (lang: AppLanguage) => void;
  t: UiTranslations;
  isRtl: boolean;
  getLangName: (code: string, fallbackName?: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  appLang: 'ar',
  setAppLang: () => {},
  t: UI_LOCALES.ar,
  isRtl: true,
  getLangName: (code, fallback) => getLocalizedLangName(code, 'ar', fallback),
});

export const I18nProvider: React.FC<{
  initialLang?: AppLanguage;
  controlledLang?: AppLanguage;
  onChangeLang?: (lang: AppLanguage) => void;
  children: React.ReactNode;
}> = ({ initialLang, controlledLang, onChangeLang, children }) => {
  const [internalLang, setInternalLang] = useState<AppLanguage>(
    () => controlledLang || initialLang || getStoredAppLanguage()
  );

  const appLang = controlledLang || internalLang;

  useEffect(() => {
    applyDocumentLanguage(appLang);
  }, [appLang]);

  const setAppLang = useCallback(
    (lang: AppLanguage) => {
      setStoredAppLanguage(lang);
      setInternalLang(lang);
      onChangeLang?.(lang);
    },
    [onChangeLang]
  );

  const value = useMemo<I18nContextValue>(() => {
    const t = UI_LOCALES[appLang] || UI_LOCALES.ar;
    const meta = APP_LANGUAGES_META.find((m) => m.code === appLang);
    const isRtl = meta ? meta.dir === 'rtl' : appLang === 'ar';
    return {
      appLang,
      setAppLang,
      t,
      isRtl,
      getLangName: (code: string, fallbackName?: string) =>
        getLocalizedLangName(code, appLang, fallbackName),
    };
  }, [appLang, setAppLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
