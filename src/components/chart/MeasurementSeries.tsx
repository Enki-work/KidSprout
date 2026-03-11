import React from 'react';
import { Circle, Path } from 'react-native-svg';
import { ChartBounds, sx, sy, toPath } from './chartUtils';

export type MeasurementPoint = {
  ageMonths: number;
  heightCm: number;
};

type Props = {
  points: MeasurementPoint[];
  bounds: ChartBounds;
  color?: string;
  onPressPoint?: (point: MeasurementPoint) => void;
};

export function MeasurementSeries({
  points,
  bounds,
  color = '#4CAF82',
  onPressPoint,
}: Props) {
  if (points.length === 0) return null;

  const sorted = [...points].sort((a, b) => a.ageMonths - b.ageMonths);
  const linePath = toPath(
    sorted.map(p => ({ age: p.ageMonths, value: p.heightCm })),
    bounds
  );

  return (
    <>
      {/* 连线 */}
      <Path d={linePath} stroke={color} strokeWidth={2} fill="none" />

      {/* 测量点 */}
      {sorted.map((p, i) => (
        <Circle
          key={i}
          cx={sx(p.ageMonths, bounds)}
          cy={sy(p.heightCm, bounds)}
          r={5}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
          onPress={() => onPressPoint?.(p)}
        />
      ))}
    </>
  );
}
