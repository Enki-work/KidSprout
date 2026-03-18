import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import zh from './locales/zh.json';
import zhHant from './locales/zh-Hant.json';
import ja from './locales/ja.json';
import en from './locales/en.json';
import es from './locales/es.json';
import ko from './locales/ko.json';

export type SupportedLanguage = 'zh' | 'zh-Hant' | 'ja' | 'en' | 'es' | 'ko';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['zh', 'zh-Hant', 'ja', 'en', 'es', 'ko'];

/** 从系统语言中提取最佳匹配 */
function detectLanguage(): SupportedLanguage {
  const locales = getLocales();
  for (const locale of locales) {
    const tag = (locale.languageTag ?? locale.languageCode ?? '').toLowerCase();
    // 繁体中文：zh-Hant、zh-TW、zh-HK
    if (tag === 'zh-hant' || tag === 'zh-tw' || tag === 'zh-hk') return 'zh-Hant';
    const code = tag.split('-')[0] as SupportedLanguage;
    if (SUPPORTED_LANGUAGES.includes(code)) return code;
  }
  return 'zh';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      'zh-Hant': { translation: zhHant },
      ja: { translation: ja },
      en: { translation: en },
      es: { translation: es },
      ko: { translation: ko },
    },
    lng: detectLanguage(),
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
  });

export default i18n;
