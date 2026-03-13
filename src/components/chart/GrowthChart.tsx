import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { GrowthRow } from '@/types/growth';
import { ChartBounds, DEFAULT_PADDING } from './chartUtils';
import { ChartAxes } from './ChartAxes';
import { PercentileLines } from './PercentileLines';
import { MeasurementSeries, MeasurementPoint } from './MeasurementSeries';
import { PredictionLine } from './PredictionLine';

export type PredictionConfig = {
  startAgeMonths: number;
  startHeightCm: number;
  percentile: number;
  maxAgeMonths: number;  // 数据源上限月龄
};

type Props = {
  rows: GrowthRow[];
  measurements?: MeasurementPoint[];
  prediction?: PredictionConfig;
  // 显示的月龄范围
  xMin?: number;
  xMax?: number;
  width?: number;
  height?: number;
  /** 放大页传入，覆盖默认 viewBox 实现双指缩放 */
  viewBox?: string;
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
  prediction,
  xMin = 0,
  xMax = 204,
  width = 360,
  height = 300,
  viewBox,
}: Props) {
  const [tooltip, setTooltip] = useState<MeasurementPoint | null>(null);

  // 范围内数据（用于 Y 轴计算）
  const filtered = rows.filter(r => r.ageMonths >= xMin && r.ageMonths <= xMax);

  // 绘图用数据：额外包含 xMax 之后的第一个点，让曲线延伸至右轴边界
  const sortedRows = [...rows].sort((a, b) => a.ageMonths - b.ageMonths);
  const firstBeyond = sortedRows.find(r => r.ageMonths > xMax);
  const drawRows = firstBeyond ? [...filtered, firstBeyond] : filtered;

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
      <Svg width={width} height={height} viewBox={viewBox}>
        <ChartAxes bounds={bounds} xTicks={xTicks} yTicks={yTicks} />
        <PercentileLines rows={drawRows} bounds={bounds} showLabels={false} />
        {/* 仅当预测线起点在显示范围内时才渲染，避免延伸到 Y 轴左侧 */}
        {prediction && prediction.startAgeMonths >= xMin && (
          <PredictionLine
            startAgeMonths={prediction.startAgeMonths}
            startHeightCm={prediction.startHeightCm}
            percentile={prediction.percentile}
            maxAgeMonths={prediction.maxAgeMonths}
            rows={rows}
            bounds={bounds}
          />
        )}
        {/* 仅渲染 [xMin, xMax] 范围内的测量点，避免落在 Y 轴左侧 */}
        <MeasurementSeries
          points={measurements.filter(m => m.ageMonths >= xMin && m.ageMonths <= xMax)}
          bounds={bounds}
          onPressPoint={p => setTooltip(prev => prev?.ageMonths === p.ageMonths ? null : p)}
        />
      </Svg>

      {/* Tooltip */}
      {tooltip && (
        <View style={styles.tooltip}>
          {tooltip.date && (
            <Text style={styles.tooltipDate}>{tooltip.date}</Text>
          )}
          <Text style={styles.tooltipText}>
            {(tooltip.ageMonths / 12).toFixed(1)} 岁 · {tooltip.heightCm} cm
            {tooltip.percentile !== undefined
              ? `  P${Math.round(tooltip.percentile)}`
              : ''}
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
  tooltipDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginBottom: 2,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
  },
});
