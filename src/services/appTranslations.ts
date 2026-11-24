import {
  AppLanguage,
  AppLanguageMeta,
  APP_LANGUAGES_META,
  UiTranslations,
} from './uiLocales/types.ts';
import { arLocale } from './uiLocales/ar.ts';
import { enLocale } from './uiLocales/en.ts';
import { frLocale } from './uiLocales/fr.ts';
import { esLocale } from './uiLocales/es.ts';
import { deLocale } from './uiLocales/de.ts';
import { trLocale } from './uiLocales/tr.ts';
import { itLocale } from './uiLocales/it.ts';
import { ruLocale } from './uiLocales/ru.ts';
import { zhLocale } from './uiLocales/zh.ts';
import { jaLocale } from './uiLocales/ja.ts';

export type { AppLanguage, AppLanguageMeta, UiTranslations };
export { APP_LANGUAGES_META };

export const UI_LOCALES: Record<AppLanguage, UiTranslations> = {
  ar: arLocale,
  en: enLocale,
  fr: frLocale,
  es: esLocale,
  de: deLocale,
  tr: trLocale,
  it: itLocale,
  ru: ruLocale,
  zh: zhLocale,
  ja: jaLocale,
};

const APP_LANG_KEY = 'tarjuman_app_language';

export function isValidAppLanguage(val: string | null | undefined): val is AppLanguage {
  return Boolean(val && val in UI_LOCALES);
}

export function getStoredAppLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(APP_LANG_KEY);
    if (isValidAppLanguage(saved)) return saved;
    return 'ar';
  } catch {
    return 'ar';
  }
}

export function applyDocumentLanguage(lang: AppLanguage): void {
  if (typeof document === 'undefined') return;
  const meta = APP_LANGUAGES_META.find((m) => m.code === lang);
  const isRtl = meta ? meta.dir === 'rtl' : lang === 'ar';
  const locale = UI_LOCALES[lang] || UI_LOCALES.ar;

  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.title = `${locale.common.appName} — ${locale.common.appTagline}`;
}

export function setStoredAppLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(APP_LANG_KEY, lang);
    applyDocumentLanguage(lang);
  } catch (e) {
    console.error('Failed to set app language', e);
  }
}

export function getLocalizedLangName(
  code: string,
  appLang: AppLanguage,
  fallbackName?: string
): string {
  const dict = UI_LOCALES[appLang] || UI_LOCALES.ar;
  if (code in dict.langNames) {
    return dict.langNames[code as AppLanguage];
  }
  return fallbackName || code.toUpperCase();
}
