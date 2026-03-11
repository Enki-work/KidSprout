import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildStore } from '@/store/childStore';
import { useMeasurementStore } from '@/store/measurementStore';
import { getStandardFile } from '@/constants/standards';
import { StandardId } from '@/constants/standards';
import { getAgeInMonths, formatAgeMonths } from '@/services/growth/age';
import { GrowthChart } from '@/components/chart/GrowthChart';
import { MeasurementPoint } from '@/components/chart/MeasurementSeries';
import { useWindowDimensions } from 'react-native';

type Tab = 'chart' | 'records';

export default function ChildDetailScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const child = useChildStore(s => s.children.find(c => c.id === childId));
  const { byChild, loadForChild, remove: removeMeasurement } = useMeasurementStore();
  const measurements = byChild[childId ?? ''] ?? [];

  const [tab, setTab] = useState<Tab>('chart');

  useFocusEffect(useCallback(() => {
    if (childId) loadForChild(childId);
  }, [childId]));

  if (!child) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>找不到孩子档案</Text>
      </View>
    );
  }

  const ageMonths = getAgeInMonths(new Date(child.birthDate));
  const standard = getStandardFile(child.standardId as StandardId, child.sex);
  const chartWidth = width - 32;

  // 将测量记录转换为图表数据点
  const chartPoints: MeasurementPoint[] = measurements.map(m => ({
    ageMonths: getAgeInMonths(new Date(child.birthDate), new Date(m.measuredAt)),
    heightCm:  m.heightCm,
  }));

  const latestMeasurement = measurements.length > 0
    ? measurements[measurements.length - 1]
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 顶部摘要 */}
      <View style={styles.summary}>
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childMeta}>
          {child.sex === 'male' ? '男の子' : '女の子'} ·{' '}
          {formatAgeMonths(ageMonths)}
          {latestMeasurement ? ` · 最新 ${latestMeasurement.heightCm} cm` : ''}
        </Text>
      </View>

      {/* Tab 切換 */}
      <View style={styles.tabBar}>
        {([['chart', '成长曲线'], ['records', '测量记录']] as [Tab, string][]).map(([t, label]) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'chart' ? (
        /* ── 曲线页 ── */
        <ScrollView contentContainerStyle={styles.chartContent}>
          <Text style={styles.sectionTitle}>乳幼児期（0〜3歳）</Text>
          <GrowthChart
            rows={standard.rows}
            measurements={chartPoints}
            xMin={0} xMax={36}
            width={chartWidth} height={240}
          />
          <Text style={styles.sectionTitle}>全体（0〜{Math.floor(standard.meta.ageMaxMonths / 12)}歳）</Text>
          <GrowthChart
            rows={standard.rows}
            measurements={chartPoints}
            xMin={0} xMax={standard.meta.ageMaxMonths}
            width={chartWidth} height={240}
          />
        </ScrollView>
      ) : (
        /* ── 记录页 ── */
        <ScrollView contentContainerStyle={styles.recordsContent}>
          {measurements.length === 0 ? (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyText}>还没有测量记录</Text>
            </View>
          ) : (
            [...measurements].reverse().map(m => {
              const mAgeMonths = getAgeInMonths(new Date(child.birthDate), new Date(m.measuredAt));
              return (
                <View key={m.id} style={styles.recordRow}>
                  <View style={styles.recordMain}>
                    <Text style={styles.recordDate}>{m.measuredAt}</Text>
                    <Text style={styles.recordAge}>{formatAgeMonths(mAgeMonths)}</Text>
                  </View>
                  <Text style={styles.recordHeight}>{m.heightCm} cm</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() =>
                      Alert.alert('删除记录', `确认删除 ${m.measuredAt} 的记录？`, [
                        { text: '取消', style: 'cancel' },
                        { text: '删除', style: 'destructive', onPress: () => removeMeasurement(m.id, child.id) },
                      ])
                    }
                  >
                    <Text style={styles.deleteBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* FAB：新增测量 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/children/${childId}/add-measurement` as never)}
      >
        <Text style={styles.fabText}>＋ 添加身高</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F7F8FA' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound:   { color: '#999', fontSize: 16 },

  summary: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  childName: { fontSize: 20, fontWeight: 'bold', color: '#1A1A2E' },
  childMeta: { fontSize: 13, color: '#888', marginTop: 3 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive:  { borderBottomColor: '#4CAF82' },
  tabText:       { fontSize: 14, color: '#999' },
  tabTextActive: { color: '#4CAF82', fontWeight: '600' },

  chartContent:  { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#4CAF82',
    marginTop: 16, marginBottom: 8,
  },

  recordsContent: { padding: 16, gap: 8, paddingBottom: 100 },
  emptyRecords:   { paddingTop: 60, alignItems: 'center' },
  emptyText:      { color: '#999', fontSize: 15 },

  recordRow: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, flexDirection: 'row', alignItems: 'center',
  },
  recordMain:   { flex: 1 },
  recordDate:   { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  recordAge:    { fontSize: 12, color: '#999', marginTop: 2 },
  recordHeight: { fontSize: 18, fontWeight: 'bold', color: '#4CAF82', marginRight: 12 },
  deleteBtn:    { padding: 4 },
  deleteBtnText:{ fontSize: 20, color: '#CCC' },

  fab: {
    position: 'absolute', bottom: 28, right: 20, left: 20,
    backgroundColor: '#4CAF82', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#4CAF82', shadowOpacity: 0.4,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
