// 图表坐标映射工具函数

export type ChartPadding = { top: number; right: number; bottom: number; left: number };

export type ChartBounds = {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
  width: number; height: number;
  padding: ChartPadding;
};

export const DEFAULT_PADDING: ChartPadding = { top: 20, right: 16, bottom: 40, left: 44 };

/** 数据 X（月龄）→ 屏幕 X */
export function sx(ageMonths: number, b: ChartBounds): number {
  const w = b.width - b.padding.left - b.padding.right;
  return b.padding.left + ((ageMonths - b.xMin) / (b.xMax - b.xMin)) * w;
}

/** 数据 Y（cm）→ 屏幕 Y */
export function sy(cm: number, b: ChartBounds): number {
  const h = b.height - b.padding.top - b.padding.bottom;
  return b.padding.top + (1 - (cm - b.yMin) / (b.yMax - b.yMin)) * h;
}

/** 数据点数组 → SVG path 字符串 */
export function toPath(points: { age: number; value: number }[], b: ChartBounds): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.age, b).toFixed(1)},${sy(p.value, b).toFixed(1)}`)
    .join(' ');
}
