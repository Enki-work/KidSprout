import { GrowthRow } from '@/types/growth';
import { interpolateGrowthRow } from './interpolation';
import { rowToBands } from './percentile';

// 18 岁 = 216 月龄
const ADULT_AGE_MONTHS = 216;

/**
 * 按当前 percentile 估算 18 岁身高
 * 假设孩子沿当前 percentile 继续成长
 *
 * 注意：仅供参考，受遗传、营养、睡眠等多种因素影响
 */
export function predictAdultHeight(
  currentPercentile: number,
  rows: GrowthRow[]
): number {
  const adultRow = interpolateGrowthRow(ADULT_AGE_MONTHS, rows);
  const bands = rowToBands(adultRow);
  const sorted = [...bands].sort((a, b) => a.percentile - b.percentile);

  if (currentPercentile <= sorted[0].percentile) return sorted[0].value;
  if (currentPercentile >= sorted.at(-1)!.percentile) return sorted.at(-1)!.value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (currentPercentile >= lo.percentile && currentPercentile <= hi.percentile) {
      const t = (currentPercentile - lo.percentile) / (hi.percentile - lo.percentile);
      return lo.value + t * (hi.value - lo.value);
    }
  }

  return sorted[0].value;
}

/**
 * 根据百分位反向查找指定月龄的身高
 * 与 predictAdultHeight 逻辑相同，但可指定任意月龄
 */
export function getHeightAtPercentile(
  ageMonths: number,
  percentile: number,
  rows: GrowthRow[],
): number | undefined {
  const row = interpolateGrowthRow(ageMonths, rows);
  const bands = rowToBands(row);
  const sorted = [...bands].sort((a, b) => a.percentile - b.percentile);

  if (sorted.length === 0) return undefined;
  if (percentile <= sorted[0].percentile) return sorted[0].value;
  if (percentile >= sorted.at(-1)!.percentile) return sorted.at(-1)!.value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (percentile >= lo.percentile && percentile <= hi.percentile) {
      const t = (percentile - lo.percentile) / (hi.percentile - lo.percentile);
      return lo.value + t * (hi.value - lo.value);
    }
  }
  return undefined;
}
