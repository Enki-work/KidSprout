import { GrowthChart, PredictionConfig } from "@/components/chart/GrowthChart";
import { MeasurementPoint } from "@/components/chart/MeasurementSeries";
import { getStandardFile, StandardId } from "@/constants/standards";
import { useComputedMeasurements } from "@/hooks/growth/useComputedMeasurements";
import { useFormatAge } from "@/hooks/useFormatAge";
import { getAgeInMonths } from "@/services/growth/age";
import { predictAdultHeight } from "@/services/growth/prediction";
import { useChildStore } from "@/store/childStore";
import { useMeasurementStore } from "@/store/measurementStore";
import { ComputedMeasurement } from "@/types/measurement";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "chart" | "records" | "analysis";
const TABS: Tab[] = ["chart", "records", "analysis"];

/** 年龄段曲线定义（月龄区间） */
const AGE_SEGMENTS = [
  { key: "infant", xMin: 0, xMax: 36 },
  { key: "toddler", xMin: 36, xMax: 72 },
  { key: "school", xMin: 72, xMax: 144 },
  { key: "teen", xMin: 144, xMax: 216 },
] as const;

/** 百分位显示颜色 */
function percentileColor(p: number): string {
  if (p < 3 || p > 97) return "#FF3B30";
  if (p < 10 || p > 90) return "#FF9500";
  return "#4CAF82";
}

/** 计算最近 N 个月内的身高增长量 */
function growthIn(
  computed: ComputedMeasurement[],
  monthsBack: number,
): number | null {
  if (computed.length < 2) return null;
  const latest = computed[computed.length - 1];
  const cutoffAge = latest.ageMonths - monthsBack;
  const candidates = computed.filter(
    (m) => m.ageMonths <= cutoffAge + monthsBack * 0.4 && m.id !== latest.id,
  );
  if (candidates.length === 0) return null;
  const ref = candidates.reduce((best, m) =>
    Math.abs(m.ageMonths - cutoffAge) < Math.abs(best.ageMonths - cutoffAge)
      ? m
      : best,
  );
  return Math.round((latest.heightCm - ref.heightCm) * 10) / 10;
}

export default function ChildDetailScreen() {
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
  const measurements = byChild[childId ?? ""] ?? [];
  const isMeasurementsLoading = loadingByChild[childId ?? ""] ?? false;

  const [tab, setTab] = useState<Tab>("chart");
  const [showPercentileInfo, setShowPercentileInfo] = useState(false);
  const pagerRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (childId) loadForChild(childId);
    }, [childId]),
  );

  const standard = child
    ? getStandardFile(child.standardId as StandardId, child.sex)
    : null;
  const computed = useComputedMeasurements(
    measurements,
    child?.birthDate ?? "",
    standard?.rows ?? [],
  );

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
    heightCm: m.heightCm,
    date: m.measuredAt,
    percentile: m.percentile,
  }));

  const maxAgeMonths = standard.meta.ageMaxMonths;
  const maxAgeYears = Math.floor(maxAgeMonths / 12);

  const prediction: PredictionConfig | undefined =
    latestComputed && latestComputed.ageMonths < maxAgeMonths
      ? {
          startAgeMonths: latestComputed.ageMonths,
          startHeightCm: latestComputed.heightCm,
          percentile: currentPercentile,
          maxAgeMonths,
        }
      : undefined;

  const predictedHeight = latestComputed
    ? Math.round(
        predictAdultHeight(currentPercentile, standard.rows, maxAgeMonths) * 10,
      ) / 10
    : null;

  const growth6m = growthIn(computed, 6);
  const growth12m = growthIn(computed, 12);

  const sexSuffix = t(
    `sex.${child.sex === "male" ? "maleSuffix" : "femaleSuffix"}`,
  );

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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: child.name,
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() =>
                  router.push(`/children/${childId}/edit` as never)
                }
              >
                <Text style={styles.editBtnText}>{t("childDetail.edit")}</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* 顶部摘要 */}
      <View style={styles.summary}>
        <Text style={styles.childMeta}>
          {t(`sex.${child.sex}`)} · {formatAge(ageMonths)}
          {latestComputed ? ` · ${latestComputed.heightCm} cm` : ""}
        </Text>
        {latestComputed?.percentile !== undefined && (
          <TouchableOpacity
            style={[
              styles.percentileBadge,
              { backgroundColor: percentileColor(latestComputed.percentile) },
            ]}
            onPress={() => setShowPercentileInfo(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.percentileBadgeText}>
              P{Math.round(latestComputed.percentile)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab 切換 */}
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

      {/* ── 整页 Pager ── */}
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
                  seg.xMin < standard.meta.ageMaxMonths &&
                  chartPoints.some(
                    (p) => p.ageMonths >= seg.xMin && p.ageMonths < seg.xMax,
                  ),
              ).map((seg) => (
                <View key={seg.key}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>
                      {t(`childDetail.ageSegments.${seg.key}`)}
                    </Text>
                    <TouchableOpacity
                      style={styles.expandBtn}
                      onPress={() =>
                        router.push(
                          `/children/${childId}/chart-fullscreen?xMin=${seg.xMin}&xMax=${Math.min(seg.xMax, standard.meta.ageMaxMonths)}` as never,
                        )
                      }
                    >
                      <Text style={styles.expandBtnText}>
                        {t("childDetail.expand")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <GrowthChart
                    rows={standard.rows}
                    measurements={chartPoints}
                    prediction={prediction}
                    xMin={seg.xMin}
                    xMax={Math.min(seg.xMax, standard.meta.ageMaxMonths)}
                    width={chartWidth}
                    height={240}
                  />
                </View>
              ))}

              {/* 全体曲线 */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {t("childDetail.allAges", { maxAge: maxAgeYears })}
                </Text>
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() =>
                    router.push(
                      `/children/${childId}/chart-fullscreen?xMin=0&xMax=${standard.meta.ageMaxMonths}` as never,
                    )
                  }
                >
                  <Text style={styles.expandBtnText}>
                    {t("childDetail.expand")}
                  </Text>
                </TouchableOpacity>
              </View>
              <GrowthChart
                rows={standard.rows}
                measurements={chartPoints}
                prediction={prediction}
                xMin={0}
                xMax={standard.meta.ageMaxMonths}
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
                      {
                        color: percentileColor(latestComputed.percentile ?? 50),
                      },
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
                          (latestComputed.medianDeltaCm ?? 0) >= 0
                            ? "#4CAF82"
                            : "#FF3B30",
                      },
                    ]}
                  >
                    {(latestComputed.medianDeltaCm ?? 0) >= 0 ? "+" : ""}
                    {latestComputed.medianDeltaCm ?? "-"} cm
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
              <Text style={styles.emptyText}>{t("childDetail.noRecords")}</Text>
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
                <Text style={styles.recordHeight}>{m.heightCm} cm</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert(
                      t("childDetail.deleteRecord.title"),
                      t("childDetail.deleteRecord.msg", { date: m.measuredAt }),
                      [
                        {
                          text: t("childDetail.deleteRecord.cancel"),
                          style: "cancel",
                        },
                        {
                          text: t("childDetail.deleteRecord.confirm"),
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

        {/* Page 2: 分析 */}
        <ScrollView
          style={{ width }}
          contentContainerStyle={styles.analysisContent}
        >
          {!latestComputed ? (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyText}>{t("childDetail.noRecords")}</Text>
            </View>
          ) : (
            <>
              <View style={styles.analysisCard}>
                <Text style={styles.analysisCardTitle}>
                  {t("childDetail.analysis.currentStatus")}
                </Text>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>
                    {t("childDetail.analysis.height")}
                  </Text>
                  <Text style={styles.analysisValue}>
                    {latestComputed.heightCm} cm
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
                          (latestComputed.medianDeltaCm ?? 0) >= 0
                            ? "#4CAF82"
                            : "#FF3B30",
                      },
                    ]}
                  >
                    {(latestComputed.medianDeltaCm ?? 0) >= 0 ? "+" : ""}
                    {latestComputed.medianDeltaCm ?? "-"} cm
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
                    <Text style={styles.analysisValue}>+{growth6m} cm</Text>
                  </View>
                )}
                {growth12m !== null && (
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>
                      {t("childDetail.analysis.last12m")}
                    </Text>
                    <Text style={styles.analysisValue}>+{growth12m} cm</Text>
                  </View>
                )}
                {growth6m === null && growth12m === null && (
                  <Text style={styles.analysisEmpty}>
                    {t("childDetail.analysis.insufficientData")}
                  </Text>
                )}
              </View>

              {predictedHeight !== null &&
                latestComputed.ageMonths < maxAgeMonths && (
                  <View style={styles.analysisCard}>
                    <Text style={styles.analysisCardTitle}>
                      {t("childDetail.analysis.prediction", {
                        maxAge: maxAgeYears,
                      })}
                    </Text>
                    <Text style={styles.predictionHeight}>
                      {t("childDetail.analysis.predictedHeight", {
                        height: predictedHeight,
                      })}
                    </Text>
                    <Text style={styles.predictionDisclaimer}>
                      {t("childDetail.analysis.disclaimer")}
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
        onPress={() =>
          router.push(`/children/${childId}/add-measurement` as never)
        }
      >
        <Text style={styles.fabText}>{t("childDetail.addHeight")}</Text>
      </TouchableOpacity>

      {/* 百分位说明弹窗 */}
      <Modal
        visible={showPercentileInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPercentileInfo(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPercentileInfo(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {t("childDetail.percentileModal.title")}
            </Text>
            <Text style={styles.modalBody}>
              {t("childDetail.percentileModal.body1")}
            </Text>
            <Text style={styles.modalBody}>
              {t("childDetail.percentileModal.body2prefix")}{" "}
              <Text style={styles.modalBold}>
                {t("childDetail.percentileModal.body2eg")}
              </Text>{" "}
              {t("childDetail.percentileModal.body2")}
            </Text>
            <View style={styles.modalLegend}>
              <View style={styles.modalLegendRow}>
                <View
                  style={[styles.modalDot, { backgroundColor: "#4CAF82" }]}
                />
                <Text style={styles.modalLegendText}>
                  {t("childDetail.percentileModal.normal")}
                </Text>
              </View>
              <View style={styles.modalLegendRow}>
                <View
                  style={[styles.modalDot, { backgroundColor: "#FF9500" }]}
                />
                <Text style={styles.modalLegendText}>
                  {t("childDetail.percentileModal.attention")}
                </Text>
              </View>
              <View style={styles.modalLegendRow}>
                <View
                  style={[styles.modalDot, { backgroundColor: "#FF3B30" }]}
                />
                <Text style={styles.modalLegendText}>
                  {t("childDetail.percentileModal.warning")}
                </Text>
              </View>
            </View>
            <Text style={styles.modalDisclaimer}>
              {t("childDetail.percentileModal.disclaimer")}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowPercentileInfo(false)}
            >
              <Text style={styles.modalCloseBtnText}>
                {t("childDetail.percentileModal.close")}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#4CAF82" },
  expandBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4CAF82",
  },
  expandBtnText: { fontSize: 11, color: "#4CAF82", fontWeight: "600" },

  recordsContent: { padding: 16, gap: 8, paddingBottom: 100 },
  emptyRecords: { paddingTop: 60, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 15 },

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
  recordHeight: {
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

  predictionHeight: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4CAF82",
    textAlign: "center",
    marginVertical: 12,
  },
  predictionDisclaimer: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    lineHeight: 16,
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

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editBtn: { paddingHorizontal: 8, paddingVertical: 6, alignSelf: "center" },
  editBtnText: { color: "#4CAF82", fontSize: 18, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  modalBody: { fontSize: 14, color: "#444", lineHeight: 22, marginBottom: 10 },
  modalBold: { fontWeight: "700", color: "#1A1A2E" },
  modalLegend: {
    backgroundColor: "#F7F8FA",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    gap: 8,
  },
  modalLegendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalDot: { width: 10, height: 10, borderRadius: 5 },
  modalLegendText: { fontSize: 12, color: "#555", flex: 1, lineHeight: 18 },
  modalDisclaimer: {
    fontSize: 11,
    color: "#999",
    lineHeight: 16,
    marginTop: 8,
  },
  modalCloseBtn: {
    backgroundColor: "#4CAF82",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
