/**
 * [仅 DEV] 测试数据生成按钮
 * 为指定孩子批量生成 0~18岁区间的身高测量记录
 */

import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useChildStore } from '@/store/childStore';
import { useMeasurementStore } from '@/store/measurementStore';
import { getAgeInMonths } from '@/services/growth/age';
import { Measurement } from '@/types/measurement';
import { Child } from '@/types/child';

// ── 参考平均身高表（月龄 → cm，男女通用粗略值） ──────────────────────────
const AVG_HEIGHT_BY_MONTH: [number, number][] = [
  [0, 50.0], [3, 61.0], [6, 67.5], [9, 72.0], [12, 75.5],
  [18, 82.0], [24, 87.5], [30, 93.0], [36, 96.5], [48, 103.0],
  [60, 109.5], [72, 116.0], [84, 122.0], [96, 128.0], [108, 133.5],
  [120, 138.5], [132, 144.0], [144, 150.0], [156, 156.5], [168, 162.0],
  [180, 166.0], [192, 169.0], [204, 170.5], [216, 171.0],
];

function lerpHeight(ageMonths: number): number {
  const pts = AVG_HEIGHT_BY_MONTH;
  if (ageMonths <= pts[0][0]) return pts[0][1];
  if (ageMonths >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [m0, h0] = pts[i];
    const [m1, h1] = pts[i + 1];
    if (ageMonths >= m0 && ageMonths <= m1) {
      const t = (ageMonths - m0) / (m1 - m0);
      return h0 + t * (h1 - h0);
    }
  }
  return 100;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function buildTestMeasurements(child: Child, existingMonths: Set<number>): Measurement[] {
  const birthDate = new Date(child.birthDate);
  const today = new Date();
  const maxMonths = Math.min(getAgeInMonths(birthDate, today), 216);
  const step = Math.max(3, Math.floor(maxMonths / 15));
  const result: Measurement[] = [];

  for (let m = 0; m <= maxMonths; m += step) {
    if (existingMonths.has(m)) continue;
    const measDate = addMonths(birthDate, m);
    if (measDate > today) break;
    const noise = (Math.random() - 0.5) * 4;
    const heightCm = Math.round((lerpHeight(m) + noise) * 10) / 10;
    const now = new Date().toISOString();
    result.push({
      id:         genId(),
      childId:    child.id,
      measuredAt: measDate.toISOString().slice(0, 10),
      heightCm,
      createdAt:  now,
      updatedAt:  now,
    });
  }
  return result;
}

// ── 组件 ─────────────────────────────────────────────────────────────────────

type Props = { childId: string };

export function DebugAddTestData({ childId }: Props) {
  if (!__DEV__) return null;

  const child = useChildStore(s => s.children.find(c => c.id === childId));
  const { byChild, add: addMeasurement } = useMeasurementStore();
  const measurements = byChild[childId] ?? [];

  if (!child) return null;

  function handlePress() {
    const existingMonths = new Set(
      measurements.map(m =>
        getAgeInMonths(new Date(child!.birthDate), new Date(m.measuredAt))
      )
    );
    const newItems = buildTestMeasurements(child!, existingMonths);
    newItems.forEach(m => addMeasurement(m));
    Alert.alert('测试数据', `已添加 ${newItems.length} 条记录`);
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress}>
      <Text style={styles.text}>测试</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn:  { paddingHorizontal: 8, paddingVertical: 6 },
  text: { color: '#FF9500', fontSize: 15, fontWeight: '600' },
});
