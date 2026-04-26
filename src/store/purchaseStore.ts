/**
 * 内购状态管理
 * 购买结果持久化到 SQLite settings 表
 */

import { create } from 'zustand';
import { getSetting, setSetting } from '@/db/settings.repo';

type PurchaseStore = {
  hasPurchasedWeightFeature: boolean;
  isLoading: boolean;
  setPurchased: (value: boolean) => void;
  setLoading: (value: boolean) => void;
};

export const usePurchaseStore = create<PurchaseStore>((set) => ({
  hasPurchasedWeightFeature: false,
  isLoading: false,
  setPurchased: (value) => {
    setSetting('purchase_weight', value ? '1' : '0');
    set({ hasPurchasedWeightFeature: value });
  },
  setLoading: (value) => {
    set({ isLoading: value });
  },
}));

/**
 * 从 SQLite 读取已保存的购买状态。
 * 必须在 initDb() 之后调用，确保 settings 表已存在。
 */
export function initPurchaseState(): void {
  try {
    const saved = getSetting('purchase_weight');
    if (saved === '1') {
      usePurchaseStore.setState({ hasPurchasedWeightFeature: true });
    }
  } catch {
    // DB 异常时保持默认（未购买）
  }
}
