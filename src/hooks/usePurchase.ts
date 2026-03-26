/**
 * 内购 Hook
 * 本期实现：本地状态模拟购买流程
 * 下期接入真实支付时，只需修改此文件，外部接口不变
 */

import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { usePurchaseStore } from '@/store/purchaseStore';

export function usePurchase() {
  const { t } = useTranslation();
  const { hasPurchasedWeightFeature, isLoading, setPurchased } = usePurchaseStore();

  /**
   * 触发购买流程（本期直接模拟成功）
   */
  async function purchase(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        t('purchase.weightFeature.alertTitle'),
        t('purchase.weightFeature.alertMessage'),
        [
          {
            text: t('purchase.weightFeature.cancel'),
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: t('purchase.weightFeature.buy'),
            onPress: () => {
              // 本期：模拟购买成功
              setPurchased(true);
              resolve();
            },
          },
        ],
      );
    });
  }

  /**
   * 恢复购买（本期：提示未找到记录）
   */
  async function restore(): Promise<void> {
    // 本期：仅提示，不做真实恢复
    Alert.alert('', t('purchase.weightFeature.restoreFail'));
  }

  return {
    hasPurchased: hasPurchasedWeightFeature,
    isLoading,
    purchase,
    restore,
  };
}
