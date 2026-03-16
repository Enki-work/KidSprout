import { create } from 'zustand';
import i18n, { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { getSetting, setSetting } from '@/db/settings.repo';

type SettingsState = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  language: i18n.language as SupportedLanguage,
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    setSetting('language', lang);
    set({ language: lang });
  },
}));

/**
 * 从 SQLite 读取已保存的语言并应用。
 * 必须在 initDb() 之后调用，确保 settings 表已存在。
 */
export function initLanguage(): void {
  try {
    const saved = getSetting('language');
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      i18n.changeLanguage(saved);
      useSettingsStore.setState({ language: saved as SupportedLanguage });
    }
  } catch {
    // DB 异常时保持当前语言
  }
}
