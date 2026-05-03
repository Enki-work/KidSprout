import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  getAvailablePurchases,
  initConnection,
  type ProductOrSubscription,
  type Purchase,
} from 'react-native-iap';
import {
  WEIGHT_PRODUCT_ID_ANDROID,
  WEIGHT_PRODUCT_ID_IOS,
} from '@/services/purchase/weightEntitlement';

export type UpgradeProduct = ProductOrSubscription & {
  isPurchased: boolean;
};

export type UpgradeProductsResult = {
  products: UpgradeProduct[];
  purchases: Purchase[];
};

function getInAppProductIds(): string[] {
  return [Platform.OS === 'android' ? WEIGHT_PRODUCT_ID_ANDROID : WEIGHT_PRODUCT_ID_IOS];
}

async function fetchUpgradeStoreProducts(): Promise<ProductOrSubscription[]> {
  const inAppProducts = await fetchProducts({ skus: getInAppProductIds(), type: 'in-app' });
  return (inAppProducts ?? []) as ProductOrSubscription[];
}

type LoadUpgradeProductsOptions = {
  manageConnection?: boolean;
};

export async function loadUpgradeProducts(
  options: LoadUpgradeProductsOptions = {},
): Promise<UpgradeProductsResult> {
  const manageConnection = options.manageConnection ?? true;
  if (manageConnection) await initConnection();
  try {
    const [storeProducts, purchases] = await Promise.all([
      fetchUpgradeStoreProducts(),
      getAvailablePurchases(),
    ]);

    const products = storeProducts.map((product) => {
      const isPurchased = (purchases ?? []).some((purchase) => purchase.productId === product.id);

      return {
        ...product,
        isPurchased,
      };
    });

    return {
      products,
      purchases: purchases ?? [],
    };
  } finally {
    if (manageConnection) await endConnection().catch(() => {});
  }
}
