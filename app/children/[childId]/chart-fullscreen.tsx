/**
 * 成长曲线全屏页
 * - 双指缩放：SVG viewBox 锚点方案（松手无偏移）
 * - 单指拖拽：放大后平移
 * - 横竖屏自适应
 * - 未放大：带边距 + 底部提示；放大后：铺满全屏
 */

import { GrowthChart, PredictionConfig } from "@/components/chart/GrowthChart";
import { MeasurementPoint } from "@/components/chart/MeasurementSeries";
import { getStandardFile, StandardId } from "@/constants/standards";
import { useComputedMeasurements } from "@/hooks/growth/useComputedMeasurements";
import { useChildStore } from "@/store/childStore";
import { useMeasurementStore } from "@/store/measurementStore";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  PanGestureHandler,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  type PanGestureHandlerGestureEvent,
  PinchGestureHandler,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  type PinchGestureHandlerGestureEvent,
  State,
} from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const TOP_BAR = 52;
const HINT_H = 28;
const PAD = 16;

export default function ChartFullscreenScreen() {
  const {
    childId,
    xMin: xMinStr,
    xMax: xMaxStr,
  } = useLocalSearchParams<{
    childId: string;
    xMin: string;
    xMax: string;
  }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const child = useChildStore((s) => s.children.find((c) => c.id === childId));
  const { byChild, loadForChild } = useMeasurementStore();
  const measurements = byChild[childId ?? ""] ?? [];

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

  // SafeAreaView 已处理 insets，故可用高度 = height - insets.top - insets.bottom
  const contentH = height - insets.top - insets.bottom;

  // ── 缩放/手势状态 ─────────────────────────────────────────
  const [viewBox, setViewBox] = useState<string | undefined>(undefined);
  // 手势进行中时也切换到全屏坐标空间，避免 BEGAN 时坐标系错位
  const [gestureActive, setGestureActive] = useState(false);

  const isZoomed = viewBox !== undefined;
  const isFullscreen = isZoomed || gestureActive;

  // 全屏时铺满，否则带边距 + 底部提示
  const chartW = isFullscreen ? width : width - PAD * 2;
  const chartH = isFullscreen
    ? contentH - TOP_BAR
    : contentH - TOP_BAR - HINT_H;

  // ── Refs ──────────────────────────────────────────────────
  const baseScaleRef = useRef(1);
  const liveScaleRef = useRef(1);
  const originRef = useRef({ ox: 0, oy: 0 });
  // 手势开始时快照：SVG 锚点 + 屏幕焦点（固定屏幕焦点，避免 focalX/Y 漂移导致偏移）
  const anchorRef = useRef({ svgX: 0, svgY: 0, screenX: 0, screenY: 0 } as
    { svgX: number; svgY: number; screenX: number; screenY: number });
  // Pinch 是否进行中（用于屏蔽松手时残余手指触发 Pan）
  const pinchActiveRef = useRef(false);
  // 拖拽开始时的 origin 快照
  const panStartOriginRef = useRef({ ox: 0, oy: 0 });
  // 手势期间固定坐标空间（避免 isFullscreen 状态更新延迟导致计算不一致）
  const gWRef = useRef(chartW);
  const gHRef = useRef(chartH);

  const pinchRef = useRef<PinchGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);

  // ── 捏合缩放 ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handlePinch(e: PinchGestureHandlerGestureEvent) {
    const raw = baseScaleRef.current * e.nativeEvent.scale;
    const s = Math.max(1, Math.min(5, raw));
    liveScaleRef.current = s;

    if (s <= 1) {
      originRef.current = { ox: 0, oy: 0 };
      setViewBox(undefined);
      return;
    }

    const W = gWRef.current;
    const H = gHRef.current;
    const vw = W / s;
    const vh = H / s;

    // 以固定屏幕焦点为锚点（不跟随实时 focal，避免漂移）
    const ox = Math.max(
      0,
      Math.min(W - vw, anchorRef.current.svgX - anchorRef.current.screenX / s),
    );
    const oy = Math.max(
      0,
      Math.min(H - vh, anchorRef.current.svgY - anchorRef.current.screenY / s),
    );
    originRef.current = { ox, oy };
    setViewBox(`${ox} ${oy} ${vw} ${vh}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handlePinchStateChange(e: PinchGestureHandlerGestureEvent) {
    if (e.nativeEvent.state === State.BEGAN) {
      // 手势开始：切换到全屏坐标空间
      gWRef.current = width;
      gHRef.current = contentH - TOP_BAR;
      setGestureActive(true);

      // 记录锚点：SVG 坐标 + 固定屏幕焦点（不跟随实时 focalX/Y，防止漂移）
      const s = baseScaleRef.current;
      anchorRef.current = {
        svgX: originRef.current.ox + e.nativeEvent.focalX / s,
        svgY: originRef.current.oy + e.nativeEvent.focalY / s,
        screenX: e.nativeEvent.focalX,
        screenY: e.nativeEvent.focalY,
      };
      pinchActiveRef.current = true;
    }
    if (
      e.nativeEvent.state === State.END ||
      e.nativeEvent.state === State.CANCELLED
    ) {
      baseScaleRef.current = liveScaleRef.current;
      pinchActiveRef.current = false;
      if (liveScaleRef.current <= 1) {
        // 缩回初始状态，恢复带边距的坐标空间
        gWRef.current = width - PAD * 2;
        gHRef.current = contentH - TOP_BAR - HINT_H;
        setGestureActive(false);
      }
    }
  }

  // ── 单指拖拽平移 ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handlePan(e: PanGestureHandlerGestureEvent) {
    // pinch 进行中（含松手瞬间）时忽略 pan，防止残余手指触发偏移
    if (pinchActiveRef.current) return;
    const s = liveScaleRef.current;
    if (s <= 1) return;

    if (e.nativeEvent.state === State.BEGAN) {
      panStartOriginRef.current = { ...originRef.current };
      return;
    }

    const W = gWRef.current;
    const H = gHRef.current;
    const vw = W / s;
    const vh = H / s;
    // 屏幕位移 → SVG 坐标偏移（1 屏幕像素 = 1/s SVG 单位）
    const ox = Math.max(
      0,
      Math.min(
        W - vw,
        panStartOriginRef.current.ox - e.nativeEvent.translationX / s,
      ),
    );
    const oy = Math.max(
      0,
      Math.min(
        H - vh,
        panStartOriginRef.current.oy - e.nativeEvent.translationY / s,
      ),
    );
    originRef.current = { ox, oy };
    setViewBox(`${ox} ${oy} ${vw} ${vh}`);
  }

  // ── 复原 ──────────────────────────────────────────────────
  function resetZoom() {
    baseScaleRef.current = 1;
    liveScaleRef.current = 1;
    originRef.current = { ox: 0, oy: 0 };
    gWRef.current = width - PAD * 2;
    gHRef.current = contentH - TOP_BAR - HINT_H;
    setGestureActive(false);
    setViewBox(undefined);
  }

  if (!child || !standard) return null;

  const xMin = parseInt(xMinStr ?? "0");
  const xMax = parseInt(xMaxStr ?? String(standard.meta.ageMaxMonths));

  const latestComputed =
    computed.length > 0 ? computed[computed.length - 1] : null;
  const currentPercentile = latestComputed?.percentile ?? 50;
  const maxAgeMonths = standard.meta.ageMaxMonths;

  const chartPoints: MeasurementPoint[] = computed.map((m) => ({
    ageMonths: m.ageMonths,
    heightCm: m.heightCm,
    date: m.measuredAt,
    percentile: m.percentile,
  }));

  const prediction: PredictionConfig | undefined =
    latestComputed && latestComputed.ageMonths < maxAgeMonths
      ? {
          startAgeMonths: latestComputed.ageMonths,
          startHeightCm: latestComputed.heightCm,
          percentile: currentPercentile,
          maxAgeMonths,
        }
      : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 顶栏 */}
      <View style={styles.topBar}>
        {isZoomed ? (
          <TouchableOpacity style={styles.resetBtn} onPress={resetZoom}>
            <Text style={styles.resetBtnText}>复原</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.topBarPlaceholder} />
        )}

        {isZoomed && (
          <Text style={styles.topHint}>单指拖拽移动 · 双指缩放</Text>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* 图表 + 手势 */}
      <PanGestureHandler
        ref={panRef}
        simultaneousHandlers={pinchRef}
        onGestureEvent={handlePan}
        onHandlerStateChange={handlePan}
        minPointers={1}
        maxPointers={1}
      >
        <PinchGestureHandler
          ref={pinchRef}
          simultaneousHandlers={panRef}
          onGestureEvent={handlePinch}
          onHandlerStateChange={handlePinchStateChange}
        >
          <View
            style={[styles.chartArea, !isFullscreen && styles.chartAreaPadded]}
          >
            <GrowthChart
              rows={standard.rows}
              measurements={chartPoints}
              prediction={prediction}
              xMin={xMin}
              xMax={xMax}
              width={chartW}
              height={chartH}
              viewBox={viewBox}
            />
          </View>
        </PinchGestureHandler>
      </PanGestureHandler>

      {/* 底部提示（未放大时） */}
      {!isFullscreen && <Text style={styles.hint}>双指捏合放大</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    height: TOP_BAR,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PAD,
  },

  topBarPlaceholder: { width: 32 },

  topHint: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: "#999",
  },

  closeBtn: {
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 13, color: "#444", fontWeight: "700" },

  resetBtn: {
    backgroundColor: "#4CAF82",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  resetBtnText: { fontSize: 12, color: "#fff", fontWeight: "600" },

  chartArea: { overflow: "hidden" },
  chartAreaPadded: { paddingHorizontal: PAD },

  hint: {
    height: HINT_H,
    fontSize: 11,
    color: "#BBB",
    textAlign: "center",
    lineHeight: HINT_H,
  },
});
