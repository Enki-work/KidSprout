import { Text, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { GrowthChart } from '@/components/chart/GrowthChart';
import { JAPAN_HEIGHT_BOYS } from '@/data/standards/japan';

// 示例测量记录（月龄, 身長cm）
const DEMO_MEASUREMENTS = [
  { ageMonths: 0,   heightCm: 49.5 },
  { ageMonths: 3.5, heightCm: 61.0 },
  { ageMonths: 6.5, heightCm: 67.8 },
  { ageMonths: 11.5,heightCm: 74.5 },
  { ageMonths: 15,  heightCm: 79.2 },
  { ageMonths: 21,  heightCm: 84.0 },
  { ageMonths: 27,  heightCm: 88.5 },
  { ageMonths: 33,  heightCm: 93.2 },
  { ageMonths: 39,  heightCm: 97.5 },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = width - 32;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.name}>小花ちゃん · 女の子</Text>
      <Text style={styles.meta}>3歳3ヶ月 · 最新: 97.5 cm · P50付近</Text>

      {/* 0〜3歳 乳幼児期 */}
      <Text style={styles.sectionTitle}>乳幼児期（0〜3歳）</Text>
      <GrowthChart
        rows={JAPAN_HEIGHT_BOYS.rows}
        measurements={DEMO_MEASUREMENTS}
        xMin={0}
        xMax={36}
        width={chartWidth}
        height={260}
      />

      {/* 0〜17歳 全体 */}
      <Text style={styles.sectionTitle}>全体（0〜17歳）</Text>
      <GrowthChart
        rows={JAPAN_HEIGHT_BOYS.rows}
        measurements={DEMO_MEASUREMENTS}
        xMin={0}
        xMax={204}
        width={chartWidth}
        height={260}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 4 },
  meta: { fontSize: 13, color: '#888', marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#4CAF82', marginTop: 20, marginBottom: 8 },
});
