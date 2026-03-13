import { GrowthRow } from '@/types/growth';

type Band = { percentile: number; value: number };

// ── Z 分数工具 ─────────────────────────────────────────────────────────────

/** 标准百分位对应的 Z 分数（Φ⁻¹(p/100)） */
export const PERCENTILE_ZSCORE: Record<number, number> = {
  3:  -1.8808,
  10: -1.2816,
  15: -1.0364,
  25: -0.6745,
  50:  0,
  75:  0.6745,
  85:  1.0364,
  90:  1.2816,
  97:  1.8808,
};

/**
 * 标准正态 CDF（Abramowitz & Stegun，精度 ~1e-7）
 * 返回 P(X ≤ z)
 */
export function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (0.319381530 + t * (-0.356563782 +
    t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const pdf = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const cdf = 1 - pdf * poly;
  return z >= 0 ? cdf : 1 - cdf;
}

/**
 * 标准正态逆 CDF（Peter Acklam 有理逼近，精度 ~1e-9）
 */
export function normalQuantile(p: number): number {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02,
             -2.759285104469687e+02, 1.383577518672690e+02,
             -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02,
             -1.556989798598866e+02, 6.680131188771972e+01,
             -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01,
             -2.400758277161838e+00, -2.549732539343734e+00,
              4.374664141464968e+00,  2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01,
             2.445134137142996e+00, 3.754408661907416e+00];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])
         / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if (p <= 1 - pLow) {
    const q = p - 0.5, r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q
         / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])
          / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

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
 * 基于百分位曲线估算身高对应的百分位。
 * 范围内：线性插值；超出 P3/P97 时：用相邻两曲线斜率外推 Z 分数后换算，
 * 可得到 P98、P99、P99.5 等超出数据范围的真实百分位。
 */
export function estimatePercentileFromBands(heightCm: number, bands: Band[]): number {
  const sorted = [...bands].sort((a, b) => a.percentile - b.percentile);
  if (sorted.length === 0) return 50;

  const lo = sorted[0];
  const hi = sorted.at(-1)!;

  if (heightCm <= lo.value) {
    // 低于最低曲线：用最低两条曲线的斜率向下外推 Z 分数
    const lo2 = sorted[1];
    if (!lo2 || lo2.value === lo.value) return 0.01;
    const zLo  = PERCENTILE_ZSCORE[lo.percentile]  ?? -1.8808;
    const zLo2 = PERCENTILE_ZSCORE[lo2.percentile] ?? -1.2816;
    const slope = (zLo2 - zLo) / (lo2.value - lo.value); // Z/cm
    const z = zLo + slope * (heightCm - lo.value);
    return Math.max(0.01, normalCDF(z) * 100);
  }

  if (heightCm >= hi.value) {
    // 高于最高曲线：用最高两条曲线的斜率向上外推 Z 分数
    const hi2 = sorted[sorted.length - 2];
    if (!hi2 || hi2.value === hi.value) return 99.99;
    const zHi2 = PERCENTILE_ZSCORE[hi2.percentile] ?? 1.2816;
    const zHi  = PERCENTILE_ZSCORE[hi.percentile]  ?? 1.8808;
    const slope = (zHi - zHi2) / (hi.value - hi2.value); // Z/cm
    const z = zHi + slope * (heightCm - hi.value);
    return Math.min(99.99, normalCDF(z) * 100);
  }

  // 正常范围：在相邻百分位之间线性插值
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (heightCm >= a.value && heightCm <= b.value) {
      const t = (heightCm - a.value) / (b.value - a.value);
      return a.percentile + t * (b.percentile - a.percentile);
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
