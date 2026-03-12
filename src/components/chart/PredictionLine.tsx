/**
 * 预测虚线
 * 从最新测量点出发，沿当前百分位延伸至 18 岁（216 月龄）
 */

import React from 'react';
import { Circle, Path } from 'react-native-svg';
import { GrowthRow } from '@/types/growth';
import { getHeightAtPercentile } from '@/services/growth/prediction';
import { ChartBounds, sx, sy, toPath } from './chartUtils';

type Props = {
  startAgeMonths: number;
  startHeightCm: number;
  percentile: number;
  rows: GrowthRow[];
  bounds: ChartBounds;
  color?: string;
};

export function PredictionLine({
  startAgeMonths,
  startHeightCm,
  percentile,
  rows,
  bounds,
  color = '#F5A623',
}: Props) {
  const maxAge = Math.min(bounds.xMax, 216);
  if (startAgeMonths >= maxAge) return null;

  // 每 6 个月采样一个点
  const points: { age: number; value: number }[] = [
    { age: startAgeMonths, value: startHeightCm },
  ];

  for (let age = startAgeMonths + 6; age < maxAge; age += 6) {
    const h = getHeightAtPercentile(age, percentile, rows);
    if (h !== undefined) points.push({ age, value: h });
  }

  // 确保终点
  const endH = getHeightAtPercentile(maxAge, percentile, rows);
  if (endH !== undefined) points.push({ age: maxAge, value: endH });

  if (points.length < 2) return null;

  const d = toPath(points, bounds);
  const endPt = points[points.length - 1];

  return (
    <>
      <Path
        d={d}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="5,4"
        fill="none"
        opacity={0.85}
      />
      {/* 终点空心圆 */}
      <Circle
        cx={sx(endPt.age, bounds)}
        cy={sy(endPt.value, bounds)}
        r={4}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.85}
      />
    </>
  );
}
