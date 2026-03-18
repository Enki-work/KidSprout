import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/settingsStore';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n';

/** 语言原生名称（始终用原文，不翻译） */
const LANG_NATIVE: Record<SupportedLanguage, string> = {
  zh: '中文（简体）',
  'zh-Hant': '中文（繁體）',
  ja: '日本語',
  en: 'English',
  es: 'Español',
  ko: '한국어',
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { language, setLanguage } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: t('settings.title') }} />

      <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
      <View style={styles.card}>
        {SUPPORTED_LANGUAGES.map((lang, idx) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.row,
              idx < SUPPORTED_LANGUAGES.length - 1 && styles.rowBorder,
            ]}
            onPress={() => setLanguage(lang)}
            activeOpacity={0.6}
          >
            <Text style={styles.langText}>{LANG_NATIVE[lang]}</Text>
            {language === lang && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFEFEF',
  },
  langText: { fontSize: 16, color: '#1A1A2E' },
  check: { fontSize: 16, color: '#4CAF82', fontWeight: '700' },
});
