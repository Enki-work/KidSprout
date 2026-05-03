import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  getActiveSubscriptions,
  getAvailablePurchases,
  initConnection,
  type ActiveSubscription,
  type ProductOrSubscription,
  type Purchase,
} from 'react-native-iap';
import {
  WEIGHT_PRODUCT_ID_ANDROID,
  WEIGHT_PRODUCT_ID_IOS,
} from '@/services/purchase/weightEntitlement';

export const REMOTE_ADS_SUBSCRIPTION_ID_IOS = 'com.qiyan.KidSprout.remote_ads';
export const REMOTE_ADS_SUBSCRIPTION_ID_ANDROID = 'com.qiyan.kidsprout.remote_ads';

export type UpgradeProduct = ProductOrSubscription & {
  isPurchased: boolean;
  activeSubscription?: ActiveSubscription;
};

export type UpgradeProductsResult = {
  products: UpgradeProduct[];
  purchases: Purchase[];
  activeSubscriptions: ActiveSubscription[];
};

function getInAppProductIds(): string[] {
  return [Platform.OS === 'android' ? WEIGHT_PRODUCT_ID_ANDROID : WEIGHT_PRODUCT_ID_IOS];
}

function getSubscriptionProductIds(): string[] {
  return [
    Platform.OS === 'android'
      ? REMOTE_ADS_SUBSCRIPTION_ID_ANDROID
      : REMOTE_ADS_SUBSCRIPTION_ID_IOS,
  ];
}

async function fetchUpgradeStoreProducts(): Promise<ProductOrSubscription[]> {
  const [inAppProducts, subscriptionProducts] = await Promise.all([
    fetchProducts({ skus: getInAppProductIds(), type: 'in-app' }),
    fetchProducts({ skus: getSubscriptionProductIds(), type: 'subs' }),
  ]);

  return [
    ...((inAppProducts ?? []) as ProductOrSubscription[]),
    ...((subscriptionProducts ?? []) as ProductOrSubscription[]),
  ];
}

export async function loadUpgradeProducts(): Promise<UpgradeProductsResult> {
  await initConnection();
  try {
    const [storeProducts, purchases, activeSubscriptions] = await Promise.all([
      fetchUpgradeStoreProducts(),
      getAvailablePurchases(),
      getActiveSubscriptions(getSubscriptionProductIds()),
    ]);

    const products = storeProducts.map((product) => {
      const activeSubscription = activeSubscriptions.find(
        (subscription) => subscription.productId === product.id && subscription.isActive,
      );
      const isPurchased = product.type === 'subs'
        ? !!activeSubscription
        : (purchases ?? []).some((purchase) => purchase.productId === product.id);

      return {
        ...product,
        isPurchased,
        activeSubscription,
      };
    });

    return {
      products,
      purchases: purchases ?? [],
      activeSubscriptions,
    };
  } finally {
    await endConnection().catch(() => {});
  }
}
