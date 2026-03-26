import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';

const version = Constants.expoConfig?.version ?? '1.0.0';

// 替换为实际的 App Store / Google Play 链接
const APP_STORE_URL = 'https://apps.apple.com/app/idXXXXXXXXX';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.qiyan.KidSprout';

export default function AboutScreen() {
  const { t } = useTranslation();

  async function handleRate() {
    // 优先使用原生评价弹窗（仅在生产包中可用）
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return;
    }
    // 降级：直接打开商店页面
    const url = Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
    Linking.openURL(url);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: t('about.title') }} />

      {/* 主体内容 */}
      <View style={styles.body}>
        {/* 图标 */}
        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          resizeMode="cover"
        />

        {/* 应用名 */}
        <Text style={styles.appName}>{t('app.title')}</Text>
        <Text style={styles.appSub}>KidSprout</Text>

        {/* 版本 */}
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>
            {t('about.version')} {version}
          </Text>
        </View>
      </View>

      {/* 评分按钮 */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.rateBtn} onPress={handleRate} activeOpacity={0.8}>
          <Text style={styles.rateBtnText}>{t('about.rate')}</Text>
        </TouchableOpacity>
      </View>

      {/* 版权 */}
      <Text style={styles.copyright}>{t('about.copyright')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 40,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 22,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  appSub: {
    fontSize: 15,
    color: '#888',
  },
  versionBadge: {
    marginTop: 8,
    backgroundColor: '#E8F8EF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  versionText: {
    fontSize: 13,
    color: '#4CAF82',
    fontWeight: '600',
  },

  actions: {
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  rateBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: '#BBB',
    paddingBottom: 16,
  },
});
