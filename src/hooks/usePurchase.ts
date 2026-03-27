/**
 * 内购 Hook（react-native-iap v14 · Nitro 架构）
 * 商品：com.qiyan.KidSprout.weight（非消耗品 · 买断）
 * 收据验证：v14 内置 verifyPurchase（StoreKit 2 本地验证，无需自建服务器）
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  verifyPurchase,
  ErrorCode,
  type Purchase,
  type PurchaseError,
  type VerifyPurchaseResultIOS,
} from 'react-native-iap';
import { usePurchaseStore } from '@/store/purchaseStore';

export const WEIGHT_PRODUCT_ID = 'com.qiyan.KidSprout.weight';

// ─────────────────────────────────────────────
// iOS 本地收据验证（StoreKit 2 通过 react-native-iap v14 内置实现）
// ─────────────────────────────────────────────
async function verifyIosPurchase(): Promise<boolean> {
  try {
    const result = await verifyPurchase({ apple: { sku: WEIGHT_PRODUCT_ID } });
    return (result as VerifyPurchaseResultIOS).isValid;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function usePurchase() {
  const { t } = useTranslation();
  const { hasPurchasedWeightFeature, isLoading, setPurchased } = usePurchaseStore();

  const [displayPrice, setDisplayPrice] = useState<string | undefined>();
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ref 避免监听器捕获过期闭包
  const setPurchasedRef = useRef(setPurchased);
  setPurchasedRef.current = setPurchased;

  useEffect(() => {
    let mounted = true;
    // 用可选类型保存订阅，Expo Go 中原生模块不可用时保持 undefined
    let purchaseSub: { remove: () => void } | undefined;
    let errorSub: { remove: () => void } | undefined;

    async function setup() {
      try {
        // 注册监听器（若原生模块不存在会在此抛出，Expo Go 中安全跳过）
        purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
          if (purchase.productId !== WEIGHT_PRODUCT_ID) return;
          try {
            let valid = false;
            if (Platform.OS === 'ios') {
              valid = await verifyIosPurchase();
            } else {
              valid = !!purchase.purchaseToken;
            }
            if (valid) {
              await finishTransaction({ purchase, isConsumable: false });
              if (mounted) setPurchasedRef.current(true);
            } else {
              Alert.alert(t('purchase.error.title'), t('purchase.error.receiptInvalid'));
            }
          } catch {
            // 验证异常时不修改状态，等用户重试
          }
        });

        errorSub = purchaseErrorListener((error: PurchaseError) => {
          if (error.code !== ErrorCode.UserCancelled) {
            Alert.alert(t('purchase.error.title'), error.message);
          }
        });

        // 初始化连接并获取商品本地化价格
        await initConnection();
        setLoadingProducts(true);
        const products = await fetchProducts({ skus: [WEIGHT_PRODUCT_ID] });
        if (mounted && products && products.length > 0) {
          setDisplayPrice(products[0].displayPrice);
        }
      } catch {
        // Expo Go / 模拟器 / 无网络时静默忽略，不影响 App 运行
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    }

    setup();

    return () => {
      mounted = false;
      purchaseSub?.remove();
      errorSub?.remove();
      endConnection().catch(() => {});
    };
  }, [t]);

  /** 发起购买（结果通过 purchaseUpdatedListener 异步回调处理） */
  const purchase = useCallback(async (): Promise<void> => {
    await requestPurchase({
      type: 'in-app',
      request: Platform.OS === 'ios'
        ? { apple: { sku: WEIGHT_PRODUCT_ID } }
        : { google: { skus: [WEIGHT_PRODUCT_ID] } },
    });
    // 若原生模块不可用（Expo Go）会抛出，由调用方 try-catch 处理
  }, []);

  /** 恢复购买 */
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const purchases = await getAvailablePurchases();
      const found = purchases?.some((p) => p.productId === WEIGHT_PRODUCT_ID) ?? false;
      if (found) setPurchasedRef.current(true);
      return found;
    } catch {
      return false;
    }
  }, []);

  return {
    hasPurchased: hasPurchasedWeightFeature,
    isLoading: isLoading || loadingProducts,
    displayPrice,
    purchase,
    restore,
  };
}
