/**
 * [仅 DEV] 调试工具页
 * 汇集各种测试数据生成功能，不在生产构建中显示
 */

import { Stack, Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
  type PurchaseError,
  ErrorCode,
} from 'react-native-iap';
import { useChildStore } from '@/store/childStore';
import { DebugAddTestData } from '@/components/debug/DebugAddTestData';
import { DebugAddWeightTestData } from '@/components/debug/DebugAddWeightTestData';

const SUB_PRODUCT_ID = 'com.qiyan.KidSprout.remote_ads';

// ── 订阅测试组件 ──────────────────────────────────────────────────────────────

function DebugSubscription() {
  const [busy, setBusy] = useState(false);
  const [subInfo, setSubInfo] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let purchaseSub: { remove: () => void } | undefined;
    let errorSub: { remove: () => void } | undefined;

    async function setup() {
      try {
        purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
          // 打印完整 transaction 信息
          console.log('[Debug/Subscription] purchaseUpdatedListener fired:');
          console.log(JSON.stringify(purchase, null, 2));

          if (purchase.productId !== SUB_PRODUCT_ID) return;
          try {
            await finishTransaction({ purchase, isConsumable: false });
            console.log('[Debug/Subscription] finishTransaction OK');
            Alert.alert('订阅成功', `transactionId: ${purchase.transactionId ?? '-'}\n已在控制台打印完整 transaction 信息`);
          } catch (e) {
            console.warn('[Debug/Subscription] finishTransaction error:', e);
          }
        });

        errorSub = purchaseErrorListener((error: PurchaseError) => {
          if (error.code !== ErrorCode.UserCancelled) {
            console.error('[Debug/Subscription] purchaseErrorListener:', error);
          }
        });

        await initConnection();
      } catch (e) {
        console.warn('[Debug/Subscription] IAP setup failed (Expo Go / simulator):', e);
      }
    }

    setup();

    cleanupRef.current = () => {
      purchaseSub?.remove();
      errorSub?.remove();
      endConnection().catch(() => {});
    };

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  /** 发起订阅购买 */
  async function handleSubscribe() {
    setBusy(true);
    try {
      // 先获取订阅商品信息
      const products = await fetchProducts({ skus: [SUB_PRODUCT_ID] });
      console.log('[Debug/Subscription] fetchProducts result:', JSON.stringify(products, null, 2));

      // 发起订阅购买（type: 'subs'）
      await requestPurchase({
        type: 'subs',
        request: Platform.OS === 'ios'
          ? { apple: { sku: SUB_PRODUCT_ID } }
          : { google: { skus: [SUB_PRODUCT_ID] } },
      });
      // 结果通过 purchaseUpdatedListener 异步回调
    } catch (e: unknown) {
      const err = e as PurchaseError;
      if (err?.code !== ErrorCode.UserCancelled) {
        console.error('[Debug/Subscription] requestPurchase error:', e);
        Alert.alert('订阅失败', String((e as Error)?.message ?? e));
      }
    } finally {
      setBusy(false);
    }
  }

  /** 打印当前所有有效购买（含订阅） */
  async function handleShowSubscriptionInfo() {
    try {
      const purchases = await getAvailablePurchases();
      const filtered = purchases?.filter(p => p.productId === SUB_PRODUCT_ID) ?? [];
      console.log('[Debug/Subscription] getAvailablePurchases (remote_ads):');
      console.log(JSON.stringify(filtered, null, 2));
      setSubInfo(`共 ${filtered.length} 条，详见控制台`);
      Alert.alert('订阅信息', filtered.length > 0
        ? `找到 ${filtered.length} 条订阅记录，详见控制台`
        : '未找到有效订阅记录'
      );
    } catch (e) {
      console.error('[Debug/Subscription] getAvailablePurchases error:', e);
      Alert.alert('错误', String((e as Error)?.message ?? e));
    }
  }

  return (
    <View style={styles.subCard}>
      <Text style={styles.subTitle}>订阅测试</Text>
      <Text style={styles.subId}>{SUB_PRODUCT_ID}</Text>

      <TouchableOpacity
        style={[styles.subBtn, busy && styles.subBtnDisabled]}
        onPress={handleSubscribe}
        disabled={busy}
        activeOpacity={0.75}
      >
        {busy
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.subBtnText}>购买订阅</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.infoBtn}
        onPress={handleShowSubscriptionInfo}
        activeOpacity={0.75}
      >
        <Text style={styles.infoBtnText}>显示订阅信息（打印到控制台）</Text>
      </TouchableOpacity>

      {subInfo && <Text style={styles.subHint}>{subInfo}</Text>}
    </View>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────

export default function DebugScreen() {
  if (!__DEV__) return <Redirect href="/" />;

  const children = useChildStore(s => s.children);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Debug' }} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* 订阅测试 */}
        <Text style={styles.sectionTitle}>内购 / 订阅</Text>
        <DebugSubscription />

        {/* 测试数据生成 */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>测试数据生成</Text>

        {children.length === 0 && (
          <Text style={styles.empty}>暂无孩子档案，请先创建档案</Text>
        )}

        {children.map(child => (
          <View key={child.id} style={styles.childCard}>
            <Text style={styles.childName}>{child.name}</Text>
            <View style={styles.btnRow}>
              <View style={styles.btnWrap}>
                <Text style={styles.btnLabel}>身高数据</Text>
                <DebugAddTestData childId={child.id} />
              </View>
              <View style={styles.btnWrap}>
                <Text style={styles.btnLabel}>体重数据</Text>
                <DebugAddWeightTestData childId={child.id} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F7F8FA' },
  content:      { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  empty:        { color: '#AAA', fontSize: 15, textAlign: 'center', marginTop: 40 },

  // 订阅测试卡片
  subCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  subTitle:       { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  subId:          { fontSize: 12, color: '#999', fontFamily: 'monospace' },
  subBtn: {
    backgroundColor: '#4CAF82',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  subBtnDisabled: { opacity: 0.6 },
  subBtnText:     { color: '#fff', fontSize: 15, fontWeight: '600' },
  infoBtn: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  infoBtnText:  { color: '#555', fontSize: 15, fontWeight: '500' },
  subHint:      { fontSize: 12, color: '#999', textAlign: 'center' },

  // 测试数据卡片
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  childName:  { fontSize: 17, fontWeight: '600', color: '#1A1A2E' },
  btnRow:     { flexDirection: 'row', gap: 12 },
  btnWrap:    { flex: 1, alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: 8, paddingVertical: 10 },
  btnLabel:   { fontSize: 12, color: '#888', marginBottom: 4 },
});
