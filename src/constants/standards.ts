/**
 * 数据源注册表
 * 统一管理所有可用的成长标准数据
 */

import { JAPAN_HEIGHT_BOYS, JAPAN_HEIGHT_GIRLS } from '@/data/standards/japan';
import { WHO_HEIGHT_BOYS, WHO_HEIGHT_GIRLS } from '@/data/standards/who';
import { GrowthStandardFile } from '@/types/growth';

export type StandardId = 'japan' | 'who';
export type Sex = 'male' | 'female';

export type StandardEntry = {
  id: StandardId;
  label: string;         // 显示名称
  labelShort: string;    // 切换按钮用的简称
};

/** 可用数据源列表 */
export const STANDARDS: StandardEntry[] = [
  { id: 'japan', label: '日本 (厚労省)', labelShort: '日本' },
  { id: 'who',   label: 'WHO',           labelShort: 'WHO' },
];

/** 根据数据源 ID 和性别获取对应数据 */
export function getStandardFile(
  standardId: StandardId,
  sex: Sex,
): GrowthStandardFile {
  if (standardId === 'japan') {
    return sex === 'male' ? JAPAN_HEIGHT_BOYS : JAPAN_HEIGHT_GIRLS;
  }
  return sex === 'male' ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
}
