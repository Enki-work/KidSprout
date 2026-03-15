import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import zh from './locales/zh.json';
import ja from './locales/ja.json';
import en from './locales/en.json';
import es from './locales/es.json';
import ko from './locales/ko.json';

export type SupportedLanguage = 'zh' | 'ja' | 'en' | 'es' | 'ko';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['zh', 'ja', 'en', 'es', 'ko'];

/** 从系统语言中提取最佳匹配 */
function detectLanguage(): SupportedLanguage {
  const locales = getLocales();
  for (const locale of locales) {
    const tag = locale.languageTag ?? locale.languageCode ?? '';
    const code = tag.split('-')[0].toLowerCase() as SupportedLanguage;
    if (SUPPORTED_LANGUAGES.includes(code)) return code;
  }
  return 'zh';
}

i18n
  .use(initReactI18next)
  .init({
    resources: { zh: { translation: zh }, ja: { translation: ja }, en: { translation: en }, es: { translation: es }, ko: { translation: ko } },
    lng: detectLanguage(),
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
  });

export default i18n;
