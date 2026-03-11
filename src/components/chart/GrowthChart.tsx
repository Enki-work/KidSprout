import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { GrowthRow } from '@/types/growth';
import { ChartBounds, DEFAULT_PADDING } from './chartUtils';
import { ChartAxes } from './ChartAxes';
import { PercentileLines } from './PercentileLines';
import { MeasurementSeries, MeasurementPoint } from './MeasurementSeries';

type Props = {
  rows: GrowthRow[];
  measurements?: MeasurementPoint[];
  // 显示的月龄范围
  xMin?: number;
  xMax?: number;
  width?: number;
  height?: number;
};

/** 生成 Y 轴刻度（每 10cm 一格） */
function makeYTicks(min: number, max: number): number[] {
  const start = Math.ceil(min / 10) * 10;
  const ticks: number[] = [];
  for (let v = start; v <= max; v += 10) ticks.push(v);
  return ticks;
}

/** 生成 X 轴刻度（按年） */
function makeXTicks(xMin: number, xMax: number): number[] {
  const ticks: number[] = [];
  for (let m = 0; m <= xMax; m += 12) {
    if (m >= xMin) ticks.push(m);
  }
  return ticks;
}

export function GrowthChart({
  rows,
  measurements = [],
  xMin = 0,
  xMax = 204,
  width = 360,
  height = 300,
}: Props) {
  const [tooltip, setTooltip] = useState<MeasurementPoint | null>(null);

  // 根据数据范围计算 Y 轴范围
  const filtered = rows.filter(r => r.ageMonths >= xMin && r.ageMonths <= xMax);
  const allValues = filtered.flatMap(r =>
    [r.p3, r.p10, r.p25, r.p50, r.p75, r.p90, r.p97].filter((v): v is number => v !== undefined)
  );
  const rawYMin = allValues.length > 0 ? Math.min(...allValues) : 40;
  const rawYMax = allValues.length > 0 ? Math.max(...allValues) : 200;
  const yMin = Math.floor((rawYMin - 5) / 10) * 10;
  const yMax = Math.ceil((rawYMax + 5) / 10) * 10;

  const bounds: ChartBounds = {
    xMin, xMax, yMin, yMax,
    width, height,
    padding: DEFAULT_PADDING,
  };

  const xTicks = makeXTicks(xMin, xMax);
  const yTicks = makeYTicks(yMin, yMax);

  return (
    <View>
      <Svg width={width} height={height}>
        <ChartAxes bounds={bounds} xTicks={xTicks} yTicks={yTicks} />
        <PercentileLines rows={filtered} bounds={bounds} showLabels={false} />
        <MeasurementSeries
          points={measurements}
          bounds={bounds}
          onPressPoint={p => setTooltip(prev => prev?.ageMonths === p.ageMonths ? null : p)}
        />
      </Svg>

      {/* Tooltip */}
      {tooltip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {(tooltip.ageMonths / 12).toFixed(1)} 岁 · {tooltip.heightCm} cm
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    top: 8,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
  },
});
