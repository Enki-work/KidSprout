import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  loadUpgradeProducts,
  type UpgradeProduct,
} from '@/services/purchase/upgradeProducts';

export default function UpgradePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<UpgradeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

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
      const result = await loadUpgradeProducts();
      setProducts(result.products);
    } catch {
      setError(true);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
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
                <Text style={styles.price}>{product.displayPrice}</Text>
              </View>
            </View>
          ))
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
