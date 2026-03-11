import { useState } from 'react';
import {
  Text, ScrollView, View, TouchableOpacity,
  useWindowDimensions, StyleSheet,
} from 'react-native';
import { GrowthChart } from '@/components/chart/GrowthChart';
import { STANDARDS, getStandardFile, StandardId, Sex } from '@/constants/standards';

// 示例测量记录（月龄, 身長cm）
const DEMO_MEASUREMENTS = [
  { ageMonths:  0,   heightCm: 49.5 },
  { ageMonths:  3.5, heightCm: 61.0 },
  { ageMonths:  6.5, heightCm: 67.8 },
  { ageMonths: 11.5, heightCm: 74.5 },
  { ageMonths: 15,   heightCm: 79.2 },
  { ageMonths: 21,   heightCm: 84.0 },
  { ageMonths: 27,   heightCm: 88.5 },
  { ageMonths: 33,   heightCm: 93.2 },
  { ageMonths: 39,   heightCm: 97.5 },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = width - 32;

  const [standardId, setStandardId] = useState<StandardId>('japan');
  const [sex, setSex] = useState<Sex>('male');

  const standard = getStandardFile(standardId, sex);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.name}>小花ちゃん · {sex === 'male' ? '男の子' : '女の子'}</Text>
      <Text style={styles.meta}>3歳3ヶ月 · 最新: 97.5 cm</Text>

      {/* 性別切換 */}
      <View style={styles.toggleRow}>
        {(['male', 'female'] as Sex[]).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.toggleBtn, sex === s && styles.toggleBtnActive]}
            onPress={() => setSex(s)}
          >
            <Text style={[styles.toggleText, sex === s && styles.toggleTextActive]}>
              {s === 'male' ? '男の子' : '女の子'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* データソース切換 */}
      <View style={styles.toggleRow}>
        {STANDARDS.map(std => (
          <TouchableOpacity
            key={std.id}
            style={[styles.toggleBtn, standardId === std.id && styles.toggleBtnActive]}
            onPress={() => setStandardId(std.id)}
          >
            <Text style={[styles.toggleText, standardId === std.id && styles.toggleTextActive]}>
              {std.labelShort}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 0〜3歳 乳幼児期 */}
      <Text style={styles.sectionTitle}>乳幼児期（0〜3歳）</Text>
      <GrowthChart
        rows={standard.rows}
        measurements={DEMO_MEASUREMENTS}
        xMin={0}
        xMax={36}
        width={chartWidth}
        height={260}
      />

      {/* 0〜17歳 全体 */}
      <Text style={styles.sectionTitle}>全体（0〜17歳）</Text>
      <GrowthChart
        rows={standard.rows}
        measurements={DEMO_MEASUREMENTS}
        xMin={0}
        xMax={standard.meta.ageMaxMonths}
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
  meta: { fontSize: 13, color: '#888', marginBottom: 12 },

  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF82',
  },
  toggleBtnActive: {
    backgroundColor: '#4CAF82',
  },
  toggleText: {
    fontSize: 13,
    color: '#4CAF82',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF82',
    marginTop: 20,
    marginBottom: 8,
  },
});
