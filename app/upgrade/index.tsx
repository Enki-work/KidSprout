import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ErrorCode,
  finishTransaction,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import {
  loadUpgradeProducts,
  type UpgradeProduct,
} from '@/services/purchase/upgradeProducts';
import { getWeightProductId } from '@/services/purchase/weightEntitlement';

export default function UpgradePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [products, setProducts] = useState<UpgradeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);
  const productId = getWeightProductId();

  const hasPurchasedPlan = useMemo(
    () => products.some((product) => product.isPurchased),
    [products],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(false);

    try {
      await initConnection();
      const result = await loadUpgradeProducts({ manageConnection: false });
      setProducts(result.products);
    } catch {
      setError(true);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      hasLoadedRef.current = true;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(hasLoadedRef.current);
    }, [load]),
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      let purchaseSub: { remove: () => void } | undefined;
      let errorSub: { remove: () => void } | undefined;

      async function setupPurchaseConnection() {
        try {
          purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
            if (purchase.productId === productId) return;

            try {
              const valid = Platform.OS === 'android' ? !!purchase.purchaseToken : true;
              if (!valid) {
                if (mounted) setPurchasingProductId(null);
                Alert.alert(t('purchase.error.title'), t('purchase.error.receiptInvalid'));
                return;
              }

              await finishTransaction({ purchase, isConsumable: false });

              if (mounted) {
                setProducts((currentProducts) => (
                  currentProducts.map((product) => (
                    product.id === purchase.productId
                      ? { ...product, isPurchased: true }
                      : product
                  ))
                ));
                setPurchasingProductId(null);
                await load(true);
              }
            } catch {
              if (mounted) setPurchasingProductId(null);
              Alert.alert(t('purchase.error.title'), t('purchase.error.receiptInvalid'));
            }
          });

          errorSub = purchaseErrorListener((purchaseError: PurchaseError) => {
            if (purchaseError.code !== ErrorCode.UserCancelled) {
              Alert.alert(t('purchase.error.title'), purchaseError.message);
            }
            if (mounted) setPurchasingProductId(null);
          });

          await initConnection();
        } catch {
          // 商品一覧の読み込み側でエラー表示するため、ここでは何もしない
        }
      }

      setupPurchaseConnection();

      return () => {
        mounted = false;
        purchaseSub?.remove();
        errorSub?.remove();
      };
    }, [load, productId, t]),
  );

  async function purchasePlan(product: UpgradeProduct) {
    setPurchasingProductId(product.id);

    try {
      await initConnection();
      await requestPurchase({
        type: product.type === 'subs' ? 'subs' : 'in-app',
        request: Platform.OS === 'ios'
          ? { apple: { sku: product.id } }
          : { google: { skus: [product.id] } },
      });
    } catch (purchaseError) {
      const errorCode = (purchaseError as PurchaseError)?.code;
      if (errorCode !== ErrorCode.UserCancelled) {
        Alert.alert(t('purchase.error.title'), String((purchaseError as Error)?.message ?? purchaseError));
      }
    } finally {
      setPurchasingProductId(null);
      initConnection().catch(() => {});
    }
  }

  async function handlePlanPress(product: UpgradeProduct) {
    if (product.isPurchased) return;
    if (product.id === productId) {
      router.push('/purchase/weight-feature' as never);
      return;
    }
    await purchasePlan(product);
  }
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: t('upgrade.title') }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        <View style={styles.statusPanel}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={hasPurchasedPlan ? 'checkmark-circle' : 'ellipse-outline'}
              size={28}
              color={hasPurchasedPlan ? '#2E9D67' : '#8A8F98'}
            />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusLabel}>{t('upgrade.purchaseStatus')}</Text>
            <Text style={styles.statusValue}>
              {hasPurchasedPlan ? t('upgrade.purchased') : t('upgrade.notPurchased')}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('upgrade.availableProducts')}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => load(true)} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color="#4CAF82" />
            <Text style={styles.refreshText}>{t('upgrade.refresh')}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#4CAF82" />
            <Text style={styles.loadingText}>{t('upgrade.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cloud-offline-outline" size={34} color="#B2B7BF" />
            <Text style={styles.emptyTitle}>{t('upgrade.loadFailed')}</Text>
            <Text style={styles.emptyText}>{t('upgrade.loadFailedHint')}</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="bag-outline" size={34} color="#B2B7BF" />
            <Text style={styles.emptyTitle}>{t('upgrade.noProducts')}</Text>
            <Text style={styles.emptyText}>{t('upgrade.noProductsHint')}</Text>
          </View>
        ) : (
          products.map((product) => {
            const isPurchasing = purchasingProductId === product.id;
            return (
              <TouchableOpacity
                key={product.id}
                style={[styles.productCard, product.isPurchased && styles.productCardPurchased]}
                onPress={() => handlePlanPress(product)}
                activeOpacity={0.78}
                disabled={product.isPurchased || !!purchasingProductId}
              >
                <View style={styles.productTopRow}>
                  <View style={styles.productTitleWrap}>
                    <Text style={styles.productTitle}>{product.displayName || product.title}</Text>
                    <Text style={styles.productId}>{product.id}</Text>
                  </View>
                  <View style={[styles.badge, product.isPurchased && styles.badgeActive]}>
                    <Text style={[styles.badgeText, product.isPurchased && styles.badgeTextActive]}>
                      {product.isPurchased ? t('upgrade.purchased') : t('upgrade.available')}
                    </Text>
                  </View>
                </View>

                {product.description ? (
                  <Text style={styles.productDescription}>{product.description}</Text>
                ) : null}

                <View style={styles.productBottomRow}>
                  <Text style={styles.productType}>
                    {t('upgrade.oneTimePurchase')}
                  </Text>
                  {isPurchasing ? (
                    <ActivityIndicator color="#4CAF82" size="small" />
                  ) : (
                    <Text style={styles.price}>{product.displayPrice}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 16, gap: 16 },
  statusPanel: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextWrap: { flex: 1 },
  statusLabel: { fontSize: 13, color: '#777', marginBottom: 3 },
  statusValue: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E8F8EF',
  },
  refreshText: { fontSize: 13, fontWeight: '700', color: '#2E9D67' },
  loadingBox: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 14, color: '#777' },
  emptyBox: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#444', textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#888', lineHeight: 19, textAlign: 'center' },
  productCard: {
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
  productCardPurchased: { opacity: 0.78 },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  productTitleWrap: { flex: 1, gap: 3 },
  productTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  productId: { fontSize: 11, color: '#999', fontFamily: 'monospace' },
  badge: {
    borderRadius: 999,
    backgroundColor: '#F0F1F3',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeActive: { backgroundColor: '#E8F8EF' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#777' },
  badgeTextActive: { color: '#2E9D67' },
  productDescription: { fontSize: 14, lineHeight: 20, color: '#666' },
  productBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  productType: { fontSize: 13, color: '#777' },
  price: { fontSize: 17, fontWeight: '800', color: '#4CAF82' },
});
