import { GrowthChart } from "@/components/chart/GrowthChart";
import { MeasurementPoint } from "@/components/chart/MeasurementSeries";
import { getWeightStandardFile, StandardId } from "@/constants/standards";
import { useFormatAge } from "@/hooks/useFormatAge";
import { getAgeInMonths } from "@/services/growth/age";
import { getPercentile, getMedianHeight } from "@/services/growth/percentile";
import { useChildStore } from "@/store/childStore";
import { useMeasurementStore } from "@/store/measurementStore";
import { Measurement } from "@/types/measurement";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "chart" | "records" | "analysis";
const TABS: Tab[] = ["chart", "records", "analysis"];

/** 年龄段定义（与身高页对称） */
const AGE_SEGMENTS = [
  { key: "infant",  xMin: 0,   xMax: 36  },
  { key: "toddler", xMin: 36,  xMax: 72  },
  { key: "school",  xMin: 72,  xMax: 144 },
  { key: "teen",    xMin: 144, xMax: 216 },
] as const;

function percentileColor(p: number): string {
  if (p < 3 || p > 97) return "#FF3B30";
  if (p < 10 || p > 90) return "#FF9500";
  return "#4CAF82";
}

/** 计算最近 N 个月内的增长量（通用，单位由调用方决定） */
function growthIn(
  items: { ageMonths: number; value: number }[],
  monthsBack: number,
): number | null {
  if (items.length < 2) return null;
  const latest = items[items.length - 1];
  const cutoffAge = latest.ageMonths - monthsBack;
  const candidates = items.filter(
    (m) => m.ageMonths <= cutoffAge + monthsBack * 0.4 && m !== latest,
  );
  if (candidates.length === 0) return null;
  const ref = candidates.reduce((best, m) =>
    Math.abs(m.ageMonths - cutoffAge) < Math.abs(best.ageMonths - cutoffAge)
      ? m
      : best,
  );
  return Math.round((latest.value - ref.value) * 10) / 10;
}

export default function WeightDetailScreen() {
  const { t } = useTranslation();
  const formatAge = useFormatAge();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const child = useChildStore((s) => s.children.find((c) => c.id === childId));
  const {
    byChild,
    loadingByChild,
    loadForChild,
    remove: removeMeasurement,
  } = useMeasurementStore();
  const allMeasurements = byChild[childId ?? ""] ?? [];
  const isMeasurementsLoading = loadingByChild[childId ?? ""] ?? false;

  // 只取有体重数据的记录
  const measurements: Measurement[] = allMeasurements.filter(
    (m) => m.weightKg != null,
  );

  const [tab, setTab] = useState<Tab>("chart");
  const pagerRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (childId) loadForChild(childId);
    }, [childId]),
  );

  const standard = child
    ? getWeightStandardFile(child.standardId as StandardId, child.sex)
    : null;

  /** 带百分位的体重计算记录 */
  const computed = useMemo(() => {
    if (!child || !standard) return [];
    return measurements.map((m) => {
      const ageMonths = getAgeInMonths(
        new Date(child.birthDate),
        new Date(m.measuredAt),
      );
      const kg = m.weightKg!;
      const percentile = getPercentile(ageMonths, kg, standard.rows);
      const median = getMedianHeight(ageMonths, standard.rows);
      const medianDeltaKg =
        median !== undefined
          ? Math.round((kg - median) * 10) / 10
          : undefined;
      return { ...m, ageMonths, percentile, medianDeltaKg };
    });
  }, [measurements, child, standard]);

  if (!child || !standard) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t("childDetail.notFound")}</Text>
      </View>
    );
  }

  const ageMonths = getAgeInMonths(new Date(child.birthDate));
  const chartWidth = width - 32;
  const latestComputed =
    computed.length > 0 ? computed[computed.length - 1] : null;
  const currentPercentile = latestComputed?.percentile ?? 50;

  const chartPoints: MeasurementPoint[] = computed.map((m) => ({
    ageMonths: m.ageMonths,
    heightCm: m.weightKg!,   // GrowthChart 的 Y 轴值（复用 heightCm 字段名）
    date: m.measuredAt,
    percentile: m.percentile,
  }));

  const maxAgeMonths = standard.meta.ageMaxMonths;
  const maxAgeYears = Math.floor(maxAgeMonths / 12);

  const growthItems = computed.map((m) => ({
    ageMonths: m.ageMonths,
    value: m.weightKg!,
  }));
  const growth6m  = growthIn(growthItems, 6);
  const growth12m = growthIn(growthItems, 12);

  const sexSuffix = t(
    `sex.${child.sex === "male" ? "maleSuffix" : "femaleSuffix"}`,
  );

  function onTabPress(newTab: Tab) {
    const idx = TABS.indexOf(newTab);
    setTab(newTab);
    pagerRef.current?.scrollTo({ x: idx * width, animated: true });
  }

  function onPagerScroll(x: number) {
    const idx = Math.round(x / width);
    if (TABS[idx] && TABS[idx] !== tab) setTab(TABS[idx]);
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: `${child.name} ${t("childDetail.analysis.weight")}`,
        }}
      />

      {/* 顶部摘要 */}
      <View style={styles.summary}>
        <Text style={styles.childMeta}>
          {t(`sex.${child.sex}`)} · {formatAge(ageMonths)}
          {latestComputed ? ` · ${latestComputed.weightKg} kg` : ""}
        </Text>
        {latestComputed?.percentile !== undefined && (
          <View
            style={[
              styles.percentileBadge,
              { backgroundColor: percentileColor(latestComputed.percentile) },
            ]}
          >
            <Text style={styles.percentileBadgeText}>
              P{Math.round(latestComputed.percentile)}
            </Text>
          </View>
        )}
      </View>

      {/* Tab 切换 */}
      <View style={styles.tabBar}>
        {TABS.map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            style={[styles.tabBtn, tab === tabKey && styles.tabBtnActive]}
            onPress={() => onTabPress(tabKey)}
          >
            <Text
              style={[styles.tabText, tab === tabKey && styles.tabTextActive]}
            >
              {t(`childDetail.tabs.${tabKey}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 整页 Pager */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        onMomentumScrollEnd={(e) =>
          onPagerScroll(e.nativeEvent.contentOffset.x)
        }
        scrollEventThrottle={16}
      >
        {/* Page 0: 曲线 */}
        <ScrollView
          style={{ width }}
          contentContainerStyle={styles.chartContent}
        >
          {isMeasurementsLoading ? (
            <ActivityIndicator style={{ marginTop: 60 }} color="#4CAF82" />
          ) : (
            <>
              {AGE_SEGMENTS.filter(
                (seg) =>
                  seg.xMin < maxAgeMonths &&
                  chartPoints.some(
                    (p) => p.ageMonths >= seg.xMin && p.ageMonths < seg.xMax,
                  ),
              ).map((seg) => (
                <View key={seg.key}>
                  <Text style={styles.sectionTitle}>
                    {t(`childDetail.ageSegments.${seg.key}`)}
                  </Text>
                  <GrowthChart
                    rows={standard.rows}
                    measurements={chartPoints}
                    xMin={seg.xMin}
                    xMax={Math.min(seg.xMax, maxAgeMonths)}
                    width={chartWidth}
                    height={240}
                  />
                </View>
              ))}

              {/* 全体曲线 */}
              <Text style={styles.sectionTitle}>
                {t("childDetail.allAges", { maxAge: maxAgeYears })}
              </Text>
              <GrowthChart
                rows={standard.rows}
                measurements={chartPoints}
                xMin={0}
                xMax={maxAgeMonths}
                width={chartWidth}
                height={240}
              />
            </>
          )}
        </ScrollView>

        {/* Page 1: 记录 */}
        <ScrollView
          style={{ width }}
          contentContainerStyle={styles.recordsContent}
        >
          {latestComputed && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardRow}>
                <View style={styles.summaryCardItem}>
                  <Text style={styles.summaryCardLabel}>
                    {t("childDetail.currentPercentile")}
                  </Text>
                  <Text
                    style={[
                      styles.summaryCardValue,
                      { color: percentileColor(latestComputed.percentile ?? 50) },
                    ]}
                  >
                    P{Math.round(latestComputed.percentile ?? 50)}
                  </Text>
                </View>
                <View style={styles.summaryCardDivider} />
                <View style={styles.summaryCardItem}>
                  <Text style={styles.summaryCardLabel}>
                    {t("childDetail.vsMedian")}
                  </Text>
                  <Text
                    style={[
                      styles.summaryCardValue,
                      {
                        color:
                          (latestComputed.medianDeltaKg ?? 0) >= 0
                            ? "#4CAF82"
                            : "#FF3B30",
                      },
                    ]}
                  >
                    {(latestComputed.medianDeltaKg ?? 0) >= 0 ? "+" : ""}
                    {latestComputed.medianDeltaKg ?? "-"} kg
                  </Text>
                </View>
              </View>
              <Text style={styles.summaryCardDesc}>
                {t("childDetail.higherThan", {
                  p: Math.round(latestComputed.percentile ?? 50),
                  sex: sexSuffix,
                })}
              </Text>
            </View>
          )}

          {computed.length === 0 ? (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyText}>
                {t("childDetail.noWeightRecords")}
              </Text>
              <Text style={styles.emptyDesc}>
                {t("childDetail.noWeightRecordsDesc")}
              </Text>
            </View>
          ) : (
            [...computed].reverse().map((m) => (
              <View key={m.id} style={styles.recordRow}>
                <View style={styles.recordMain}>
                  <Text style={styles.recordDate}>{m.measuredAt}</Text>
                  <View style={styles.recordSubRow}>
                    <Text style={styles.recordAge}>
                      {formatAge(m.ageMonths)}
                    </Text>
                    {m.percentile !== undefined && (
                      <Text
                        style={[
                          styles.recordPercentile,
                          { color: percentileColor(m.percentile) },
                        ]}
                      >
                        · P{Math.round(m.percentile)}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.recordWeight}>{m.weightKg} kg</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert(
                      t("childDetail.deleteWeightRecord.title"),
                      t("childDetail.deleteWeightRecord.msg", {
                        date: m.measuredAt,
                      }),
                      [
                        {
                          text: t("childDetail.deleteWeightRecord.cancel"),
                          style: "cancel",
                        },
                        {
                          text: t("childDetail.deleteWeightRecord.confirm"),
                          style: "destructive",
                          onPress: () => removeMeasurement(m.id, child.id),
                        },
                      ],
                    )
                  }
                >
                  <Text style={styles.deleteBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Page 2: 分析（无18岁预测） */}
        <ScrollView
          style={{ width }}
          contentContainerStyle={styles.analysisContent}
        >
          {!latestComputed ? (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyText}>
                {t("childDetail.noWeightRecords")}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>
                  {t("childDetail.analysis.currentStatus")}
                </Text>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>
                    {t("childDetail.analysis.weight")}
                  </Text>
                  <Text style={styles.analysisValue}>
                    {latestComputed.weightKg} kg
                  </Text>
                </View>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>
                    {t("childDetail.analysis.percentile")}
                  </Text>
                  <Text
                    style={[
                      styles.analysisValue,
                      { color: percentileColor(currentPercentile) },
                    ]}
                  >
                    P{Math.round(currentPercentile)}
                  </Text>
                </View>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>
                    {t("childDetail.analysis.vsMedian")}
                  </Text>
                  <Text
                    style={[
                      styles.analysisValue,
                      {
                        color:
                          (latestComputed.medianDeltaKg ?? 0) >= 0
                            ? "#4CAF82"
                            : "#FF3B30",
                      },
                    ]}
                  >
                    {(latestComputed.medianDeltaKg ?? 0) >= 0 ? "+" : ""}
                    {latestComputed.medianDeltaKg ?? "-"} kg
                  </Text>
                </View>
                <Text style={styles.analysisDesc}>
                  {t("childDetail.analysis.higherThan", {
                    p: Math.round(currentPercentile),
                    sex: sexSuffix,
                  })}
                </Text>
              </View>

              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>
                  {t("childDetail.analysis.growthRate")}
                </Text>
                {growth6m !== null && (
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>
                      {t("childDetail.analysis.last6m")}
                    </Text>
                    <Text style={styles.analysisValue}>
                      {growth6m >= 0 ? "+" : ""}{growth6m} kg
                    </Text>
                  </View>
                )}
                {growth12m !== null && (
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>
                      {t("childDetail.analysis.last12m")}
                    </Text>
                    <Text style={styles.analysisValue}>
                      {growth12m >= 0 ? "+" : ""}{growth12m} kg
                    </Text>
                  </View>
                )}
                {growth6m === null && growth12m === null && (
                  <Text style={styles.analysisEmpty}>
                    {t("childDetail.analysis.insufficientData")}
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push(`/children/${childId}/add-weight-measurement` as never)
        }
      >
        <Text style={styles.fabText}>{t("childDetail.addWeight")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { color: "#999", fontSize: 16 },

  summary: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  childMeta: { fontSize: 13, color: "#888", flex: 1 },
  percentileBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  percentileBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#4CAF82" },
  tabText: { fontSize: 14, color: "#999" },
  tabTextActive: { color: "#4CAF82", fontWeight: "600" },

  pager: { flex: 1 },

  chartContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 13, fontWeight: "600", color: "#4CAF82",
    marginTop: 16, marginBottom: 4,
  },

  recordsContent: { padding: 16, gap: 8, paddingBottom: 100 },
  emptyRecords: { paddingTop: 60, alignItems: "center", gap: 8 },
  emptyText: { color: "#999", fontSize: 15 },
  emptyDesc: { color: "#BBB", fontSize: 13, textAlign: "center" },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  summaryCardRow: { flexDirection: "row", alignItems: "center" },
  summaryCardItem: { flex: 1, alignItems: "center" },
  summaryCardDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#EFEFEF",
    marginHorizontal: 8,
  },
  summaryCardLabel: { fontSize: 11, color: "#999", marginBottom: 4 },
  summaryCardValue: { fontSize: 22, fontWeight: "bold" },
  summaryCardDesc: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },

  recordRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  recordMain: { flex: 1 },
  recordDate: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  recordSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  recordAge: { fontSize: 12, color: "#999" },
  recordPercentile: { fontSize: 12, fontWeight: "600" },
  recordWeight: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF82",
    marginRight: 12,
  },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 20, color: "#CCC" },

  analysisContent: { padding: 16, gap: 12, paddingBottom: 100 },
  analysisCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  analysisCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4CAF82",
    marginBottom: 12,
  },
  analysisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  analysisLabel: { fontSize: 14, color: "#666" },
  analysisValue: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  analysisDesc: {
    fontSize: 12,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
  },
  analysisEmpty: {
    fontSize: 13,
    color: "#CCC",
    textAlign: "center",
    paddingVertical: 8,
  },

  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    left: 20,
    backgroundColor: "#4CAF82",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#4CAF82",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
