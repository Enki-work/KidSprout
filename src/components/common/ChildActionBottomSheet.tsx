/**
 * 儿童操作选择面板 — 自定义底部弹出 Sheet
 * 使用 Modal + Animated，不依赖系统 ActionSheet，兼容 iOS 26 Liquid Glass 及所有平台
 * 通过 ref.show(child) 命令式调用
 */

import { usePurchaseStore } from "@/store/purchaseStore";
import { Child } from "@/types/child";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ChildActionBottomSheetRef = {
  show: (child: Child) => void;
};

type Props = {
  onSelectHeight: (childId: string) => void;
  onSelectWeight: (childId: string) => void;
};

export const ChildActionBottomSheet = forwardRef<
  ChildActionBottomSheetRef,
  Props
>(function ChildActionBottomSheet({ onSelectHeight, onSelectWeight }, ref) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hasPurchased = usePurchaseStore(s => s.hasPurchasedWeightFeature);

  const [visible, setVisible] = useState(false);
  const [child, setChild] = useState<Child | null>(null);

  // 动画：从底部滑入
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  function animateIn() {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 24,
        stiffness: 260,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function animateOut(callback?: () => void) {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setChild(null);
      callback?.();
    });
  }

  useImperativeHandle(ref, () => ({
    show(c: Child) {
      setChild(c);
      translateY.setValue(300);
      opacity.setValue(0);
      setVisible(true);
      // 等 Modal 渲染完再触发动画
      requestAnimationFrame(() => animateIn());
    },
  }));

  function handleWeightPress() {
    if (!child) return;
    if (hasPurchased) {
      // 已购买：直接跳转体重详情页
      animateOut(() => setTimeout(() => onSelectWeight(child.id), 10));
    } else {
      // 未购买：关闭 Sheet 后跳转购买页（modal）
      animateOut(() => {
        setTimeout(() => router.push('/purchase/weight-feature' as never), 50);
      });
    }
  }

  function handleHeightPress() {
    if (!child) return;
    animateOut(() => setTimeout(() => onSelectHeight(child.id), 10));
  }

  function handleClose() {
    animateOut();
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* 遮罩 */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet 面板 */}
      <Animated.View
        style={[
          styles.sheetWrapper,
          { paddingBottom: insets.bottom + 8, transform: [{ translateY }] },
        ]}
      >
        {/* 主卡片：标题 + 选项 */}
        <View style={styles.card}>
          {/* 标题 */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{child?.name}</Text>
          </View>

          <View style={styles.divider} />

          {/* 身高选项 */}
          <TouchableOpacity
            style={styles.option}
            onPress={handleHeightPress}
            activeOpacity={0.6}
          >
            <Text style={styles.optionText}>
              {"  "}
              {t("home.selectMetric.height")}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 体重选项 */}
          <TouchableOpacity
            style={styles.option}
            onPress={handleWeightPress}
            activeOpacity={hasPurchased ? 0.6 : 0.9}
          >
            <Text
              style={[styles.optionText, !hasPurchased && styles.optionLocked]}
            >
              {"  "}
              {t("home.selectMetric.weight")}
              {!hasPurchased && (
                <Text style={styles.lockedBadge}>
                  {"  "}{t("purchase.weightFeature.locked")}
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 取消按钮（单独卡片） */}
        <TouchableOpacity
          style={[styles.card, styles.cancelCard]}
          onPress={handleClose}
          activeOpacity={0.6}
        >
          <Text style={styles.cancelText}>
            {t("purchase.weightFeature.cancel")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetWrapper: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 0,
    gap: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
  },
  titleRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E0E0E0",
  },
  option: {
    paddingVertical: 17,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  optionText: {
    fontSize: 18,
    color: "#4CAF82",
    fontWeight: "500",
  },
  optionLocked: {
    color: "#AAAAAA",
  },
  lockedBadge: {
    fontSize: 13,
    color: "#AAAAAA",
  },
  cancelCard: {
    marginTop: 0,
  },
  cancelText: {
    fontSize: 18,
    color: "#FF3B30",
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 17,
  },
});
