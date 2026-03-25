/**
 * 数据源注册表
 * 统一管理所有可用的成长标准数据
 */

import { CHINA_HEIGHT_BOYS, CHINA_HEIGHT_GIRLS } from '@/data/standards/china';
import { JAPAN_HEIGHT_BOYS, JAPAN_HEIGHT_GIRLS } from '@/data/standards/japan';
import { WHO_HEIGHT_BOYS, WHO_HEIGHT_GIRLS } from '@/data/standards/who';
import { CHINA_WEIGHT_BOYS, CHINA_WEIGHT_GIRLS } from '@/data/standards/china_weight';
import { JAPAN_WEIGHT_BOYS, JAPAN_WEIGHT_GIRLS } from '@/data/standards/japan_weight';
import { WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS } from '@/data/standards/who_weight';
import { GrowthStandardFile } from '@/types/growth';

export type StandardId = 'japan' | 'who' | 'china';
export type Sex = 'male' | 'female';

export type StandardEntry = {
  id: StandardId;
  label: string;         // 显示名称
  labelShort: string;    // 切换按钮用的简称
  description: string;   // 数据源说明
};

/** 可用数据源列表 */
export const STANDARDS: StandardEntry[] = [
  { id: 'japan', label: '日本标准', labelShort: '日本标准', description: '根据日本政府統計の総合窓口（e-Stat）统计数据推算结果绘制曲线' },
  { id: 'who',   label: 'WHO标准',  labelShort: 'WHO标准',  description: '根据WHO公布Length/height-for-age数据推算结果绘制曲线'           },
  { id: 'china', label: '中国标准', labelShort: '中国标准', description: '根据 中国国家卫生健康委员会 发布的数据推算结果绘制曲线'           },
];

/** 根据数据源 ID 和性别获取对应身高数据 */
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

/** 根据数据源 ID 和性别获取对应体重数据 */
export function getWeightStandardFile(
  standardId: StandardId,
  sex: Sex,
): GrowthStandardFile {
  if (standardId === 'japan') {
    return sex === 'male' ? JAPAN_WEIGHT_BOYS : JAPAN_WEIGHT_GIRLS;
  }
  if (standardId === 'china') {
    return sex === 'male' ? CHINA_WEIGHT_BOYS : CHINA_WEIGHT_GIRLS;
  }
  return sex === 'male' ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
}
