import { GrowthRow } from '@/types/growth';

/** 通用线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 按月龄从标准数据表中线性插值出对应行
 * 处理非整数月龄（如 74.4 月）
 */
export function interpolateGrowthRow(ageMonths: number, rows: GrowthRow[]): GrowthRow {
  const sorted = [...rows].sort((a, b) => a.ageMonths - b.ageMonths);
  const lower = [...sorted].reverse().find(r => r.ageMonths <= ageMonths);
  const upper = sorted.find(r => r.ageMonths > ageMonths);

  if (!lower) return upper!;
  if (!upper) return lower;
  if (lower.ageMonths === upper.ageMonths) return lower;

  const t = (ageMonths - lower.ageMonths) / (upper.ageMonths - lower.ageMonths);

  const interp = (a?: number, b?: number) =>
    a !== undefined && b !== undefined ? lerp(a, b, t) : a ?? b;

  return {
    ageMonths,
    p3:  interp(lower.p3,  upper.p3),
    p15: interp(lower.p15, upper.p15),
    p50: lerp(lower.p50, upper.p50, t),
    p85: interp(lower.p85, upper.p85),
    p97: interp(lower.p97, upper.p97),
    l:   interp(lower.l,   upper.l),
    m:   interp(lower.m,   upper.m),
    s:   interp(lower.s,   upper.s),
  };
}
