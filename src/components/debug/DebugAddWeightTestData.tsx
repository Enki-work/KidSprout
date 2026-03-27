/**
 * [仅 DEV] 体重测试数据生成按钮
 * 为指定孩子批量生成 0~18岁区间的体重测量记录
 */

import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useChildStore } from '@/store/childStore';
import { useMeasurementStore } from '@/store/measurementStore';
import { getAgeInMonths } from '@/services/growth/age';
import { Measurement } from '@/types/measurement';
import { Child } from '@/types/child';

// ── 参考平均体重表（月龄 → kg，男女通用粗略值） ───────────────────────────
const AVG_WEIGHT_BY_MONTH: [number, number][] = [
  [0, 3.3], [3, 6.0], [6, 7.9], [9, 9.0], [12, 9.8],
  [18, 11.1], [24, 12.3], [30, 13.4], [36, 14.3], [48, 16.3],
  [60, 18.3], [72, 20.5], [84, 22.9], [96, 25.6], [108, 28.6],
  [120, 32.0], [132, 36.0], [144, 40.5], [156, 46.0], [168, 51.0],
  [180, 55.0], [192, 58.0], [204, 60.0], [216, 61.0],
];

function lerpWeight(ageMonths: number): number {
  const pts = AVG_WEIGHT_BY_MONTH;
  if (ageMonths <= pts[0][0]) return pts[0][1];
  if (ageMonths >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [m0, w0] = pts[i];
    const [m1, w1] = pts[i + 1];
    if (ageMonths >= m0 && ageMonths <= m1) {
      const t = (ageMonths - m0) / (m1 - m0);
      return w0 + t * (w1 - w0);
    }
  }
  return 20;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function buildTestWeightMeasurements(child: Child, existingMonths: Set<number>): Measurement[] {
  const birthDate = new Date(child.birthDate);
  const maxMonths = 216;
  const step = 6;
  const result: Measurement[] = [];

  for (let m = 0; m <= maxMonths; m += step) {
    if (existingMonths.has(m)) continue;
    const measDate = addMonths(birthDate, m);
    const noise = (Math.random() - 0.5) * 1.0;
    const weightKg = Math.round((lerpWeight(m) + noise) * 10) / 10;
    // 同时生成一个占位身高（0），使记录合法；实际体重页只读 weightKg
    const heightCm = 0;
    const now = new Date().toISOString();
    const y = measDate.getFullYear();
    const mo = String(measDate.getMonth() + 1).padStart(2, '0');
    const d = String(measDate.getDate()).padStart(2, '0');
    result.push({
      id:         genId(),
      childId:    child.id,
      measuredAt: `${y}-${mo}-${d}`,
      heightCm,
      weightKg,
      createdAt:  now,
      updatedAt:  now,
    });
  }
  return result;
}

// ── 组件 ─────────────────────────────────────────────────────────────────────

type Props = { childId: string };

export function DebugAddWeightTestData({ childId }: Props) {
  if (!__DEV__) return null;

  const child = useChildStore(s => s.children.find(c => c.id === childId));
  const { byChild, add: addMeasurement } = useMeasurementStore();
  const measurements = byChild[childId] ?? [];

  if (!child) return null;

  function handlePress() {
    // 以月龄整数为 key，避免重复
    const existingMonths = new Set(
      measurements
        .filter(m => m.weightKg !== undefined)
        .map(m => Math.round(getAgeInMonths(new Date(child!.birthDate), new Date(m.measuredAt))))
    );
    const newItems = buildTestWeightMeasurements(child!, existingMonths);
    newItems.forEach(m => addMeasurement(m));
    Alert.alert('测试数据', `已添加 ${newItems.length} 条体重记录`);
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress}>
      <Text style={styles.text}>测试</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn:  { paddingHorizontal: 8, paddingVertical: 6, alignSelf: 'center' },
  text: { color: '#FF9500', fontSize: 15, fontWeight: '600' },
});
