/**
 * 数据源注册表
 * 统一管理所有可用的成长标准数据
 */

import { JAPAN_HEIGHT_BOYS, JAPAN_HEIGHT_GIRLS } from '@/data/standards/japan';
import { WHO_HEIGHT_BOYS, WHO_HEIGHT_GIRLS } from '@/data/standards/who';
import { CHINA_HEIGHT_BOYS, CHINA_HEIGHT_GIRLS } from '@/data/standards/china';
import { GrowthStandardFile } from '@/types/growth';

export type StandardId = 'japan' | 'who' | 'china';
export type Sex = 'male' | 'female';

export type StandardEntry = {
  id: StandardId;
  label: string;         // 显示名称
  labelShort: string;    // 切换按钮用的简称
};

/** 可用数据源列表 */
export const STANDARDS: StandardEntry[] = [
  { id: 'japan', label: '日本 (厚労省)', labelShort: '日本' },
  { id: 'who',   label: 'WHO',           labelShort: 'WHO'  },
  { id: 'china', label: '中国 (卫健委)', labelShort: '中国' },
];

/** 根据数据源 ID 和性别获取对应数据 */
export function getStandardFile(
  standardId: StandardId,
  sex: Sex,
): GrowthStandardFile {
  if (standardId === 'japan') {
    return sex === 'male' ? JAPAN_HEIGHT_BOYS : JAPAN_HEIGHT_GIRLS;
  }
  if (standardId === 'china') {
    return sex === 'male' ? CHINA_HEIGHT_BOYS : CHINA_HEIGHT_GIRLS;
  }
  return sex === 'male' ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
}
