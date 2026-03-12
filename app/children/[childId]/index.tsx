import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildStore } from '@/store/childStore';
import { useMeasurementStore } from '@/store/measurementStore';
import { getStandardFile } from '@/constants/standards';
import { StandardId } from '@/constants/standards';
import { getAgeInMonths, formatAgeMonths } from '@/services/growth/age';
import { GrowthChart } from '@/components/chart/GrowthChart';
import { MeasurementPoint } from '@/components/chart/MeasurementSeries';
import { useWindowDimensions } from 'react-native';
import { DebugAddTestData } from '@/components/debug/DebugAddTestData';
import { useComputedMeasurements } from '@/hooks/growth/useComputedMeasurements';

type Tab = 'chart' | 'records';

/** 百分位显示颜色 */
function percentileColor(p: number): string {
  if (p < 3 || p > 97) return '#FF3B30';
  if (p < 10 || p > 90) return '#FF9500';
  return '#4CAF82';
}

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

  // 必须在所有条件返回之前调用 hooks
  const standard = child
    ? getStandardFile(child.standardId as StandardId, child.sex)
    : null;
  const computed = useComputedMeasurements(
    measurements,
    child?.birthDate ?? '',
    standard?.rows ?? [],
  );

  if (!child || !standard) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>找不到孩子档案</Text>
      </View>
    );
  }

  const ageMonths = getAgeInMonths(new Date(child.birthDate));
  const chartWidth = width - 32;
  const latestComputed = computed.length > 0 ? computed[computed.length - 1] : null;

  // 图表数据点（含百分位和日期，用于 Tooltip）
  const chartPoints: MeasurementPoint[] = computed.map(m => ({
    ageMonths:  m.ageMonths,
    heightCm:   m.heightCm,
    date:       m.measuredAt,
    percentile: m.percentile,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: child.name,
          headerRight: () => (
            <View style={styles.headerRight}>
              <DebugAddTestData childId={childId ?? ''} />
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push(`/children/${childId}/edit` as never)}
              >
                <Text style={styles.editBtnText}>编辑</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* 顶部摘要 */}
      <View style={styles.summary}>
        <Text style={styles.childMeta}>
          {child.sex === 'male' ? '男の子' : '女の子'} · {formatAgeMonths(ageMonths)}
          {latestComputed ? ` · ${latestComputed.heightCm} cm` : ''}
        </Text>
        {latestComputed?.percentile !== undefined && (
          <View style={[styles.percentileBadge, { backgroundColor: percentileColor(latestComputed.percentile) }]}>
            <Text style={styles.percentileBadgeText}>
              P{Math.round(latestComputed.percentile)}
            </Text>
          </View>
        )}
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

          {/* 摘要卡片 */}
          {latestComputed && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardRow}>
                <View style={styles.summaryCardItem}>
                  <Text style={styles.summaryCardLabel}>当前百分位</Text>
                  <Text style={[styles.summaryCardValue, { color: percentileColor(latestComputed.percentile ?? 50) }]}>
                    P{Math.round(latestComputed.percentile ?? 50)}
                  </Text>
                </View>
                <View style={styles.summaryCardDivider} />
                <View style={styles.summaryCardItem}>
                  <Text style={styles.summaryCardLabel}>与中位数</Text>
                  <Text style={[
                    styles.summaryCardValue,
                    { color: (latestComputed.medianDeltaCm ?? 0) >= 0 ? '#4CAF82' : '#FF3B30' },
                  ]}>
                    {(latestComputed.medianDeltaCm ?? 0) >= 0 ? '+' : ''}
                    {latestComputed.medianDeltaCm ?? '-'} cm
                  </Text>
                </View>
              </View>
              <Text style={styles.summaryCardDesc}>
                高于 {Math.round(latestComputed.percentile ?? 50)}% 的同龄
                {child.sex === 'male' ? '男' : '女'}孩
              </Text>
            </View>
          )}

          {computed.length === 0 ? (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyText}>还没有测量记录</Text>
            </View>
          ) : (
            [...computed].reverse().map(m => (
              <View key={m.id} style={styles.recordRow}>
                <View style={styles.recordMain}>
                  <Text style={styles.recordDate}>{m.measuredAt}</Text>
                  <View style={styles.recordSubRow}>
                    <Text style={styles.recordAge}>{formatAgeMonths(m.ageMonths)}</Text>
                    {m.percentile !== undefined && (
                      <Text style={[styles.recordPercentile, { color: percentileColor(m.percentile) }]}>
                        · P{Math.round(m.percentile)}
                      </Text>
                    )}
                  </View>
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
            ))
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
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  childMeta:           { fontSize: 13, color: '#888', flex: 1 },
  percentileBadge:     { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  percentileBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

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

  // 摘要卡片
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 4,
  },
  summaryCardRow:     { flexDirection: 'row', alignItems: 'center' },
  summaryCardItem:    { flex: 1, alignItems: 'center' },
  summaryCardDivider: { width: 1, height: 36, backgroundColor: '#EFEFEF', marginHorizontal: 8 },
  summaryCardLabel:   { fontSize: 11, color: '#999', marginBottom: 4 },
  summaryCardValue:   { fontSize: 22, fontWeight: 'bold' },
  summaryCardDesc:    { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10 },

  // 记录行
  recordRow:       { backgroundColor: '#fff', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center' },
  recordMain:      { flex: 1 },
  recordDate:      { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  recordSubRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  recordAge:       { fontSize: 12, color: '#999' },
  recordPercentile:{ fontSize: 12, fontWeight: '600' },
  recordHeight:    { fontSize: 18, fontWeight: 'bold', color: '#4CAF82', marginRight: 12 },
  deleteBtn:       { padding: 4 },
  deleteBtnText:   { fontSize: 20, color: '#CCC' },

  fab: {
    position: 'absolute', bottom: 28, right: 20, left: 20,
    backgroundColor: '#4CAF82', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#4CAF82', shadowOpacity: 0.4,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  headerRight:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
  editBtn:      { paddingHorizontal: 8, paddingVertical: 6 },
  editBtnText:  { color: '#4CAF82', fontSize: 18, fontWeight: '600' },
  debugBtnText: { color: '#FF9500', fontSize: 15, fontWeight: '600' },
});
