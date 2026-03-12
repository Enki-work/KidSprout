import { useCallback, useRef, useState } from 'react';
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
import { GrowthChart, PredictionConfig } from '@/components/chart/GrowthChart';
import { MeasurementPoint } from '@/components/chart/MeasurementSeries';
import { useWindowDimensions } from 'react-native';
import { DebugAddTestData } from '@/components/debug/DebugAddTestData';
import { useComputedMeasurements } from '@/hooks/growth/useComputedMeasurements';
import { predictAdultHeight } from '@/services/growth/prediction';
import { ComputedMeasurement } from '@/types/measurement';

type Tab = 'chart' | 'records' | 'analysis';
const TABS: Tab[] = ['chart', 'records', 'analysis'];
const TAB_LABELS: Record<Tab, string> = { chart: '曲线', records: '记录', analysis: '分析' };

/** 百分位显示颜色 */
function percentileColor(p: number): string {
  if (p < 3 || p > 97) return '#FF3B30';
  if (p < 10 || p > 90) return '#FF9500';
  return '#4CAF82';
}

/** 计算最近 N 个月内的身高增长量 */
function growthIn(computed: ComputedMeasurement[], monthsBack: number): number | null {
  if (computed.length < 2) return null;
  const latest = computed[computed.length - 1];
  const cutoffAge = latest.ageMonths - monthsBack;
  const candidates = computed.filter(m => m.ageMonths <= cutoffAge + monthsBack * 0.4 && m.id !== latest.id);
  if (candidates.length === 0) return null;
  const ref = candidates.reduce((best, m) =>
    Math.abs(m.ageMonths - cutoffAge) < Math.abs(best.ageMonths - cutoffAge) ? m : best
  );
  return Math.round((latest.heightCm - ref.heightCm) * 10) / 10;
}

export default function ChildDetailScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const child = useChildStore(s => s.children.find(c => c.id === childId));
  const { byChild, loadForChild, remove: removeMeasurement } = useMeasurementStore();
  const measurements = byChild[childId ?? ''] ?? [];

  const [tab, setTab] = useState<Tab>('chart');
  const pagerRef = useRef<ScrollView>(null);

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
  const currentPercentile = latestComputed?.percentile ?? 50;

  // 图表数据点（含百分位和日期，用于 Tooltip）
  const chartPoints: MeasurementPoint[] = computed.map(m => ({
    ageMonths:  m.ageMonths,
    heightCm:   m.heightCm,
    date:       m.measuredAt,
    percentile: m.percentile,
  }));

  // 数据源最大月龄（WHO=228, China=216, Japan=204）
  const maxAgeMonths = standard.meta.ageMaxMonths;
  const maxAgeYears  = Math.floor(maxAgeMonths / 12);

  // 预测配置（仅当有测量记录且未超过数据上限）
  const prediction: PredictionConfig | undefined = latestComputed && latestComputed.ageMonths < maxAgeMonths
    ? { startAgeMonths: latestComputed.ageMonths, startHeightCm: latestComputed.heightCm, percentile: currentPercentile }
    : undefined;

  // 预测成年身高（以各数据源的最大月龄为目标）
  const predictedHeight = latestComputed
    ? Math.round(predictAdultHeight(currentPercentile, standard.rows, maxAgeMonths) * 10) / 10
    : null;

  // 增长速度
  const growth6m  = growthIn(computed, 6);
  const growth12m = growthIn(computed, 12);

  function onTabPress(t: Tab) {
    const idx = TABS.indexOf(t);
    setTab(t);
    pagerRef.current?.scrollTo({ x: idx * width, animated: true });
  }

  function onPagerScroll(x: number) {
    const idx = Math.round(x / width);
    if (TABS[idx] && TABS[idx] !== tab) setTab(TABS[idx]);
  }

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
            <Text style={styles.percentileBadgeText}>P{Math.round(latestComputed.percentile)}</Text>
          </View>
        )}
      </View>

      {/* Tab 切換 */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => onTabPress(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {TAB_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 整页 Pager ── */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        onMomentumScrollEnd={e => onPagerScroll(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        {/* Page 0: 曲线 */}
        <ScrollView style={{ width }} contentContainerStyle={styles.chartContent}>
          <Text style={styles.sectionTitle}>乳幼児期（0〜3歳）</Text>
          <GrowthChart
            rows={standard.rows}
            measurements={chartPoints}
            prediction={prediction}
            xMin={0} xMax={36}
            width={chartWidth} height={240}
          />
          <Text style={styles.sectionTitle}>全体（0〜{Math.floor(standard.meta.ageMaxMonths / 12)}歳）</Text>
          <GrowthChart
            rows={standard.rows}
            measurements={chartPoints}
            prediction={prediction}
            xMin={0} xMax={standard.meta.ageMaxMonths}
            width={chartWidth} height={240}
          />
        </ScrollView>

        {/* Page 1: 记录 */}
        <ScrollView style={{ width }} contentContainerStyle={styles.recordsContent}>
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

        {/* Page 2: 分析 */}
        <ScrollView style={{ width }} contentContainerStyle={styles.analysisContent}>
          {!latestComputed ? (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyText}>还没有测量记录</Text>
            </View>
          ) : (
            <>
              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>当前状况</Text>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>身高</Text>
                  <Text style={styles.analysisValue}>{latestComputed.heightCm} cm</Text>
                </View>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>百分位</Text>
                  <Text style={[styles.analysisValue, { color: percentileColor(currentPercentile) }]}>
                    P{Math.round(currentPercentile)}
                  </Text>
                </View>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>与同龄中位数</Text>
                  <Text style={[
                    styles.analysisValue,
                    { color: (latestComputed.medianDeltaCm ?? 0) >= 0 ? '#4CAF82' : '#FF3B30' },
                  ]}>
                    {(latestComputed.medianDeltaCm ?? 0) >= 0 ? '+' : ''}
                    {latestComputed.medianDeltaCm ?? '-'} cm
                  </Text>
                </View>
                <Text style={styles.analysisDesc}>
                  高于同龄约 {Math.round(currentPercentile)}% 的{child.sex === 'male' ? '男' : '女'}孩
                </Text>
              </View>

              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>增长速度</Text>
                {growth6m !== null && (
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>最近 6 个月</Text>
                    <Text style={styles.analysisValue}>+{growth6m} cm</Text>
                  </View>
                )}
                {growth12m !== null && (
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>最近 12 个月</Text>
                    <Text style={styles.analysisValue}>+{growth12m} cm</Text>
                  </View>
                )}
                {growth6m === null && growth12m === null && (
                  <Text style={styles.analysisEmpty}>记录数量不足，无法计算</Text>
                )}
              </View>

              {predictedHeight !== null && latestComputed.ageMonths < maxAgeMonths && (
                <View style={styles.analysisCard}>
                  <Text style={styles.analysisCardTitle}>{maxAgeYears} 岁身高估算</Text>
                  <Text style={styles.predictionHeight}>约 {predictedHeight} cm</Text>
                  <Text style={styles.predictionDisclaimer}>
                    仅供参考，青春期发育、遗传、营养、睡眠与健康状况都会影响最终身高。
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </ScrollView>

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

  // 整页 Pager
  pager: { flex: 1 },

  chartContent:  { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#4CAF82',
    marginTop: 16, marginBottom: 8,
  },

  recordsContent: { padding: 16, gap: 8, paddingBottom: 100 },
  emptyRecords:   { paddingTop: 60, alignItems: 'center' },
  emptyText:      { color: '#999', fontSize: 15 },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 4,
  },
  summaryCardRow:     { flexDirection: 'row', alignItems: 'center' },
  summaryCardItem:    { flex: 1, alignItems: 'center' },
  summaryCardDivider: { width: 1, height: 36, backgroundColor: '#EFEFEF', marginHorizontal: 8 },
  summaryCardLabel:   { fontSize: 11, color: '#999', marginBottom: 4 },
  summaryCardValue:   { fontSize: 22, fontWeight: 'bold' },
  summaryCardDesc:    { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10 },

  recordRow:       { backgroundColor: '#fff', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center' },
  recordMain:      { flex: 1 },
  recordDate:      { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  recordSubRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  recordAge:       { fontSize: 12, color: '#999' },
  recordPercentile:{ fontSize: 12, fontWeight: '600' },
  recordHeight:    { fontSize: 18, fontWeight: 'bold', color: '#4CAF82', marginRight: 12 },
  deleteBtn:       { padding: 4 },
  deleteBtnText:   { fontSize: 20, color: '#CCC' },

  analysisContent:   { padding: 16, gap: 12, paddingBottom: 100 },
  analysisCard:      { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  analysisCardTitle: { fontSize: 13, fontWeight: '700', color: '#4CAF82', marginBottom: 12 },
  analysisRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0',
  },
  analysisLabel: { fontSize: 14, color: '#666' },
  analysisValue: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  analysisDesc:  { fontSize: 12, color: '#999', marginTop: 10, textAlign: 'center' },
  analysisEmpty: { fontSize: 13, color: '#CCC', textAlign: 'center', paddingVertical: 8 },

  predictionHeight: {
    fontSize: 36, fontWeight: 'bold', color: '#4CAF82',
    textAlign: 'center', marginVertical: 12,
  },
  predictionDisclaimer: {
    fontSize: 11, color: '#999', textAlign: 'center', lineHeight: 16,
  },

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
