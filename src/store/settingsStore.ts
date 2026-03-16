import { create } from 'zustand';
import i18n, { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { getSetting, setSetting } from '@/db/settings.repo';

type SettingsState = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
};

/** 从 SQLite 读取已保存的语言，若无则使用当前 i18n 检测结果 */
function loadSavedLanguage(): SupportedLanguage {
  try {
    const saved = getSetting('language');
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      return saved as SupportedLanguage;
    }
  } catch {
    // DB 尚未初始化时静默降级
  }
  return i18n.language as SupportedLanguage;
}

const initialLang = loadSavedLanguage();
if (initialLang !== i18n.language) {
  i18n.changeLanguage(initialLang);
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: initialLang,
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    setSetting('language', lang);
    set({ language: lang });
  },
}));
