/**
 * 体重曲线功能购买页
 * 以 modal 方式弹出，符合 Apple App Store 审核指南 3.1.1
 *
 * Apple 合规要点：
 * - 明确说明这是一次性买断（非订阅）
 * - 必须提供「恢复购买」入口
 * - 必须显示「将从 Apple ID 账户扣款」法律声明
 * - 包含隐私政策链接
 * - 不使用虚假紧迫感或误导性文字
 * - 价格由 StoreKit 提供（本期占位，接入后替换）
 */

import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePurchase } from '@/hooks/usePurchase';

// 隐私政策 URL（来自 store.config.json）
const PRIVACY_URL = 'https://enki-work.github.io/KidSprout/privacy.html';

/** 功能特性图标映射 */
const FEATURE_ICONS = ['📊', '🎯', '📈', '👨‍👩‍👧‍👦', '♾️'];

/** 安全打开 URL，捕获无法访问时的异常 */
async function openUrl(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  } catch {
    // URL 无法打开时静默处理，不影响 App 运行
  }
}

export default function WeightFeaturePurchasePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasPurchased, isLoading, displayPrice, purchase, restore } = usePurchase();

  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const features: string[] = t('purchase.weightPage.features', { returnObjects: true }) as string[];

  // 购买成功后自动关闭页面
  useEffect(() => {
    if (hasPurchased) router.back();
  }, [hasPurchased, router]);

  /** 发起购买 */
  async function handleBuy() {
    setBuying(true);
    try {
      await purchase();
      // 购买结果通过 purchaseUpdatedListener 异步处理，成功后 hasPurchased 变为 true
    } catch {
      // 原生模块不可用（Expo Go / 模拟器）时静默忽略
    } finally {
      setBuying(false);
    }
  }

  /** 恢复购买 */
  async function handleRestore() {
    setRestoring(true);
    try {
      const result = await restore();
      if (result === 'restored') {
        Alert.alert('', t('purchase.weightFeature.restoreSuccess'));
      } else if (result === 'not_found') {
        Alert.alert('', t('purchase.weightFeature.restoreFail'));
      } else {
        Alert.alert(t('purchase.error.title'), t('purchase.error.restoreFailed'));
      }
    } finally {
      setRestoring(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* 关闭按钮 — modal 不在屏幕顶部，固定 top:12 即可 */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => router.back()}
        activeOpacity={0.6}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero 区域 ── */}
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Text style={styles.heroIcon}>⚖️</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('purchase.weightPage.badge')}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{t('purchase.weightPage.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('purchase.weightPage.subtitle')}</Text>
        </View>

        {/* ── 功能列表 ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('purchase.weightPage.sectionLabel')}</Text>

          {features.map((feat, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{FEATURE_ICONS[idx] ?? '✓'}</Text>
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          ))}
        </View>

        {/* ── 购买按钮 ── */}
        <TouchableOpacity
          style={[styles.buyBtn, (buying || isLoading) && styles.buyBtnDisabled]}
          onPress={handleBuy}
          activeOpacity={0.8}
          disabled={buying || restoring || isLoading}
        >
          {buying || isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buyBtnText}>
              {displayPrice
                ? `${t('purchase.weightPage.buyButton')} ${displayPrice}`
                : t('purchase.weightPage.buyButton')}
            </Text>
          )}
        </TouchableOpacity>

        {/* ── 恢复购买（Apple 审核必须提供） ── */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.6}
          disabled={buying || restoring}
        >
          {restoring ? (
            <ActivityIndicator color="#4CAF82" size="small" />
          ) : (
            <Text style={styles.restoreBtnText}>
              {t('purchase.weightPage.restoreButton')}
            </Text>
          )}
        </TouchableOpacity>

        {/* ── 法律声明（Apple 审核要求） ── */}
        <Text style={styles.legalText}>{t('purchase.weightPage.legalText')}</Text>

        {/* ── 隐私政策链接 ── */}
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => openUrl(PRIVACY_URL)} activeOpacity={0.6}>
            <Text style={styles.linkText}>{t('purchase.weightPage.privacy')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 56,
    alignItems: 'stretch',
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8F8EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF82',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroIcon: { fontSize: 42 },
  badgeRow: { marginBottom: 10 },
  badge: {
    backgroundColor: '#4CAF82',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  // 功能卡片
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  featureIcon: { fontSize: 20, lineHeight: 26 },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 22,
  },

  // 购买按钮
  buyBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4CAF82',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buyBtnDisabled: {
    opacity: 0.65,
  },
  buyBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // 恢复购买
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
    minHeight: 40,
    justifyContent: 'center',
  },
  restoreBtnText: {
    fontSize: 14,
    color: '#4CAF82',
    fontWeight: '500',
  },

  // 法律声明
  legalText: {
    fontSize: 11,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  // 链接
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 12,
    color: '#4CAF82',
    textDecorationLine: 'underline',
  },
  linkSep: {
    fontSize: 12,
    color: '#CCC',
  },
});
