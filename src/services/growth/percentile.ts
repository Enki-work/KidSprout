import { GrowthRow } from '@/types/growth';

type Band = { percentile: number; value: number };

/**
 * 从 GrowthRow 构建 Band 数组（兼容所有数据源）
 */
export function rowToBands(row: GrowthRow): Band[] {
  return ([
    { percentile: 3,  value: row.p3  },
    { percentile: 10, value: row.p10 },
    { percentile: 15, value: row.p15 },
    { percentile: 25, value: row.p25 },
    { percentile: 50, value: row.p50 },
    { percentile: 75, value: row.p75 },
    { percentile: 85, value: row.p85 },
    { percentile: 90, value: row.p90 },
    { percentile: 97, value: row.p97 },
  ] as { percentile: number; value: number | undefined }[])
    .filter((b): b is Band => b.value !== undefined);
}

/**
 * MVP 算法：基于 percentile 曲线线性插值估算百分位
 */
export function estimatePercentileFromBands(heightCm: number, bands: Band[]): number {
  const sorted = [...bands].sort((a, b) => a.percentile - b.percentile);
  if (sorted.length === 0) return 50;
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
  return 50;
}

/** 在 rows 中对指定月龄进行插值，返回 bands */
function interpolateBands(ageMonths: number, rows: GrowthRow[]): Band[] {
  const sorted = [...rows].sort((a, b) => a.ageMonths - b.ageMonths);
  const loRow = [...sorted].reverse().find(r => r.ageMonths <= ageMonths);
  const hiRow = sorted.find(r => r.ageMonths > ageMonths);

  if (!loRow && !hiRow) return [];
  if (!loRow) return rowToBands(hiRow!);
  if (!hiRow) return rowToBands(loRow);

  const t = (ageMonths - loRow.ageMonths) / (hiRow.ageMonths - loRow.ageMonths);
  const loBands = rowToBands(loRow);
  const hiBands = rowToBands(hiRow);

  return loBands.map(lb => {
    const hb = hiBands.find(b => b.percentile === lb.percentile);
    if (!hb) return lb;
    return { percentile: lb.percentile, value: lb.value + t * (hb.value - lb.value) };
  });
}

/** 计算某月龄、某身高对应的百分位（0-100） */
export function getPercentile(ageMonths: number, heightCm: number, rows: GrowthRow[]): number {
  const bands = interpolateBands(ageMonths, rows);
  if (bands.length === 0) return 50;
  return estimatePercentileFromBands(heightCm, bands);
}

/** 计算某月龄对应的中位数身高（P50，带插值） */
export function getMedianHeight(ageMonths: number, rows: GrowthRow[]): number | undefined {
  const sorted = [...rows].sort((a, b) => a.ageMonths - b.ageMonths);
  const loRow = [...sorted].reverse().find(r => r.ageMonths <= ageMonths);
  const hiRow = sorted.find(r => r.ageMonths > ageMonths);

  if (!loRow && !hiRow) return undefined;
  if (!loRow) return hiRow!.p50;
  if (!hiRow) return loRow.p50;

  const t = (ageMonths - loRow.ageMonths) / (hiRow.ageMonths - loRow.ageMonths);
  return loRow.p50 + t * (hiRow.p50 - loRow.p50);
}
