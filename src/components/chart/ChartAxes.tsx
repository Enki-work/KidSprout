import React from 'react';
import { Line, Text as SvgText } from 'react-native-svg';
import { ChartBounds, sx, sy } from './chartUtils';

type Props = {
  bounds: ChartBounds;
  // X 轴刻度月龄（如 [0, 12, 24, ...]）
  xTicks: number[];
  // Y 轴刻度 cm（如 [50, 60, 70, ...]）
  yTicks: number[];
};

/** 月龄 → 显示文字 */
function labelAge(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (months === 0) return '0';
  if (m === 0) return `${y}岁`;
  return `${y}y${m}m`;
}

export function ChartAxes({ bounds, xTicks, yTicks }: Props) {
  const { padding, width, height } = bounds;
  const axisColor = '#CCCCCC';
  const textColor = '#999999';
  const fontSize = 9;

  return (
    <>
      {/* X 轴基线 */}
      <Line
        x1={padding.left} y1={height - padding.bottom}
        x2={width - padding.right} y2={height - padding.bottom}
        stroke={axisColor} strokeWidth={1}
      />
      {/* Y 轴基线 */}
      <Line
        x1={padding.left} y1={padding.top}
        x2={padding.left} y2={height - padding.bottom}
        stroke={axisColor} strokeWidth={1}
      />

      {/* X 轴刻度 + 网格线 */}
      {xTicks.map(m => {
        const x = sx(m, bounds);
        const y = height - padding.bottom;
        return (
          <React.Fragment key={`x-${m}`}>
            <Line x1={x} y1={padding.top} x2={x} y2={y} stroke={axisColor} strokeWidth={0.5} strokeDasharray="2,3" />
            <SvgText x={x} y={y + 12} fontSize={fontSize} fill={textColor} textAnchor="middle">
              {labelAge(m)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Y 轴刻度 + 网格线 */}
      {yTicks.map(cm => {
        const y = sy(cm, bounds);
        return (
          <React.Fragment key={`y-${cm}`}>
            <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={axisColor} strokeWidth={0.5} strokeDasharray="2,3" />
            <SvgText x={padding.left - 4} y={y + 3} fontSize={fontSize} fill={textColor} textAnchor="end">
              {cm}
            </SvgText>
          </React.Fragment>
        );
      })}
    </>
  );
}
