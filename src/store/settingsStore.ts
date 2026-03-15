import { create } from 'zustand';
import i18n, { SupportedLanguage } from '@/i18n';

type SettingsState = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  language: i18n.language as SupportedLanguage,
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
