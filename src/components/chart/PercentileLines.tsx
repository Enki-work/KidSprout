import React from 'react';
import { Path, Text as SvgText } from 'react-native-svg';
import { GrowthRow } from '@/types/growth';
import { ChartBounds, toPath } from './chartUtils';

type PercentileKey = 'p3' | 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | 'p97';

type CurveConfig = {
  key: PercentileKey;
  label: string;
  color: string;
  strokeWidth: number;
  dashArray?: string;
};

// 显示哪几条曲线及其样式
const CURVES: CurveConfig[] = [
  { key: 'p3',  label: 'P3',  color: '#C8C8D0', strokeWidth: 1 },
  { key: 'p10', label: 'P10', color: '#B0C8E8', strokeWidth: 1 },
  { key: 'p25', label: 'P25', color: '#80AADC', strokeWidth: 1 },
  { key: 'p50', label: 'P50', color: '#3A7EC4', strokeWidth: 2 },
  { key: 'p75', label: 'P75', color: '#80AADC', strokeWidth: 1 },
  { key: 'p90', label: 'P90', color: '#B0C8E8', strokeWidth: 1 },
  { key: 'p97', label: 'P97', color: '#C8C8D0', strokeWidth: 1 },
];

type Props = {
  rows: GrowthRow[];
  bounds: ChartBounds;
  showLabels?: boolean;
};

export function PercentileLines({ rows, bounds, showLabels = true }: Props) {
  const sorted = [...rows].sort((a, b) => a.ageMonths - b.ageMonths);

  return (
    <>
      {CURVES.map(({ key, label, color, strokeWidth }) => {
        // 过滤有该 percentile 值的数据点
        const points = sorted
          .filter(r => r[key] !== undefined)
          .map(r => ({ age: r.ageMonths, value: r[key] as number }));

        if (points.length < 2) return null;

        const d = toPath(points, bounds);
        const lastPt = points[points.length - 1];

        return (
          <React.Fragment key={key}>
            <Path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" />
            {showLabels && (
              <SvgText
                x={bounds.width - bounds.padding.right + 2}
                y={bounds.padding.top + (1 - (lastPt.value - bounds.yMin) / (bounds.yMax - bounds.yMin)) * (bounds.height - bounds.padding.top - bounds.padding.bottom) + 3}
                fontSize={8}
                fill={color}
              >
                {label}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
