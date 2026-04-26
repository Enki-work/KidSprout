import {
  endConnection,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  verifyPurchase,
  type Purchase,
  type VerifyPurchaseResultIOS,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { usePurchaseStore } from '@/store/purchaseStore';

export const WEIGHT_PRODUCT_ID_IOS = 'com.qiyan.KidSprout.weight';
export const WEIGHT_PRODUCT_ID_ANDROID = 'com.qiyan.kidsprout.weight';

export function getWeightProductId(): string {
  return Platform.OS === 'android' ? WEIGHT_PRODUCT_ID_ANDROID : WEIGHT_PRODUCT_ID_IOS;
}

export type RestoreResult = 'restored' | 'not_found' | 'store_error';
export type SyncResult = 'synced' | 'store_error';

async function verifyWeightEntitlementIos(): Promise<boolean> {
  try {
    const result = await verifyPurchase({ apple: { sku: WEIGHT_PRODUCT_ID_IOS } });
    return (result as VerifyPurchaseResultIOS).isValid;
  } catch {
    return false;
  }
}

async function findWeightPurchases(): Promise<Purchase[]> {
  const productId = getWeightProductId();
  const purchases = await getAvailablePurchases();
  return (purchases ?? []).filter((purchase) => purchase.productId === productId);
}

async function finalizePurchases(purchases: Purchase[]): Promise<void> {
  if (!purchases.length) return;
  await Promise.allSettled(
    purchases.map((purchase) => finishTransaction({ purchase, isConsumable: false })),
  );
}

async function validateWeightPurchases(purchases: Purchase[]): Promise<boolean> {
  if (!purchases.length) return false;
  if (Platform.OS === 'android') {
    return purchases.some((purchase) => !!purchase.purchaseToken);
  }
  return verifyWeightEntitlementIos();
}

async function withStoreConnection<T>(task: () => Promise<T>): Promise<T> {
  await initConnection();
  try {
    return await task();
  } finally {
    await endConnection().catch(() => {});
  }
}

function setPurchaseCache(value: boolean): void {
  usePurchaseStore.getState().setPurchased(value);
}

export async function syncWeightEntitlement(): Promise<SyncResult> {
  usePurchaseStore.getState().setLoading(true);
  try {
    return await withStoreConnection(async () => {
      const purchases = await findWeightPurchases();
      const isValid = await validateWeightPurchases(purchases);

      if (isValid) {
        await finalizePurchases(purchases);
        setPurchaseCache(true);
      } else {
        setPurchaseCache(false);
      }

      return 'synced' as const;
    });
  } catch {
    return 'store_error';
  } finally {
    usePurchaseStore.getState().setLoading(false);
  }
}

export async function restoreWeightPurchases(): Promise<RestoreResult> {
  usePurchaseStore.getState().setLoading(true);
  try {
    return await withStoreConnection(async () => {
      const purchases = await findWeightPurchases();
      if (!purchases.length) {
        setPurchaseCache(false);
        return 'not_found';
      }

      const isValid = await validateWeightPurchases(purchases);
      if (!isValid) {
        setPurchaseCache(false);
        return 'not_found';
      }

      await finalizePurchases(purchases);
      setPurchaseCache(true);
      return 'restored';
    });
  } catch {
    return 'store_error';
  } finally {
    usePurchaseStore.getState().setLoading(false);
  }
}
