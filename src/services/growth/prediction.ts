import { GrowthRow } from '@/types/growth';
import { interpolateGrowthRow } from './interpolation';
import { normalQuantile, PERCENTILE_ZSCORE, rowToBands } from './percentile';

/**
 * 按当前 percentile 估算成年身高
 * 假设孩子沿当前 percentile 继续成长
 *
 * @param targetAgeMonths 目标月龄（应传入 standard.meta.ageMaxMonths）
 * 注意：仅供参考，受遗传、营养、睡眠等多种因素影响
 */
export function predictAdultHeight(
  currentPercentile: number,
  rows: GrowthRow[],
  targetAgeMonths = 216,
): number {
  const adultRow = interpolateGrowthRow(targetAgeMonths, rows);
  const bands = rowToBands(adultRow);
  const sorted = [...bands].sort((a, b) => a.percentile - b.percentile);

  if (currentPercentile <= sorted[0].percentile) {
    // 低于 P3：向下外推
    const lo2 = sorted[1];
    if (!lo2 || lo2.value === sorted[0].value) return sorted[0].value;
    const zLo  = PERCENTILE_ZSCORE[sorted[0].percentile] ?? -1.8808;
    const zLo2 = PERCENTILE_ZSCORE[lo2.percentile]       ?? -1.2816;
    const slope = (lo2.value - sorted[0].value) / (zLo2 - zLo); // cm/Z
    const z = normalQuantile(currentPercentile / 100);
    return sorted[0].value + slope * (z - zLo);
  }
  if (currentPercentile >= sorted.at(-1)!.percentile) {
    // 高于 P97：向上外推
    const hi  = sorted.at(-1)!;
    const hi2 = sorted[sorted.length - 2];
    if (!hi2 || hi2.value === hi.value) return hi.value;
    const zHi2 = PERCENTILE_ZSCORE[hi2.percentile] ?? 1.2816;
    const zHi  = PERCENTILE_ZSCORE[hi.percentile]  ?? 1.8808;
    const slope = (hi.value - hi2.value) / (zHi - zHi2); // cm/Z
    const z = normalQuantile(currentPercentile / 100);
    return hi.value + slope * (z - zHi);
  }

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
  if (percentile <= sorted[0].percentile) {
    const lo2 = sorted[1];
    if (!lo2 || lo2.value === sorted[0].value) return sorted[0].value;
    const zLo  = PERCENTILE_ZSCORE[sorted[0].percentile] ?? -1.8808;
    const zLo2 = PERCENTILE_ZSCORE[lo2.percentile]       ?? -1.2816;
    const slope = (lo2.value - sorted[0].value) / (zLo2 - zLo);
    return sorted[0].value + slope * (normalQuantile(percentile / 100) - zLo);
  }
  if (percentile >= sorted.at(-1)!.percentile) {
    const hi  = sorted.at(-1)!;
    const hi2 = sorted[sorted.length - 2];
    if (!hi2 || hi2.value === hi.value) return hi.value;
    const zHi2 = PERCENTILE_ZSCORE[hi2.percentile] ?? 1.2816;
    const zHi  = PERCENTILE_ZSCORE[hi.percentile]  ?? 1.8808;
    const slope = (hi.value - hi2.value) / (zHi - zHi2);
    return hi.value + slope * (normalQuantile(percentile / 100) - zHi);
  }

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
