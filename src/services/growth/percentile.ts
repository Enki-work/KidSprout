import { GrowthRow } from '@/types/growth';

type Band = { percentile: number; value: number };

/**
 * 从 GrowthRow 构建 Band 数组（过滤掉 undefined）
 */
export function rowToBands(row: GrowthRow): Band[] {
  return ([
    { percentile: 3,  value: row.p3  },
    { percentile: 15, value: row.p15 },
    { percentile: 50, value: row.p50 },
    { percentile: 85, value: row.p85 },
    { percentile: 97, value: row.p97 },
  ] as { percentile: number; value: number | undefined }[])
    .filter((b): b is Band => b.value !== undefined);
}

/**
 * MVP 算法：基于 percentile 曲线线性插值估算百分位
 * @param heightCm 身高（cm）
 * @param bands    当前月龄对应的 percentile-value 映射
 * @returns 0-100 百分位数值
 */
export function estimatePercentileFromBands(heightCm: number, bands: Band[]): number {
  const sorted = [...bands].sort((a, b) => a.percentile - b.percentile);

  if (heightCm <= sorted[0].value) return sorted[0].percentile;
  if (heightCm >= sorted.at(-1)!.value) return sorted.at(-1)!.percentile;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (heightCm >= lo.value && heightCm <= hi.value) {
      const t = (heightCm - lo.value) / (hi.value - lo.value);
      return lo.percentile + t * (hi.percentile - lo.percentile);
    }
  }

  return sorted[0].percentile;
}
