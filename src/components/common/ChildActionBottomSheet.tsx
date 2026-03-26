/**
 * 儿童操作选择底部弹出面板
 * 点击首页儿童卡片后弹出，让用户选择查看身高或体重曲线
 * 使用 React Native 内置 Modal + Animated，零原生依赖
 */

import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Child } from '@/types/child';
import { usePurchase } from '@/hooks/usePurchase';
import { usePurchaseStore } from '@/store/purchaseStore';

type Props = {
  visible: boolean;
  child: Child | null;
  onClose: () => void;
  onSelectHeight: (childId: string) => void;
  onSelectWeight: (childId: string) => void;
};

export function ChildActionBottomSheet({
  visible,
  child,
  onClose,
  onSelectHeight,
  onSelectWeight,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { hasPurchased, purchase } = usePurchase();

  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          stiffness: 240,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
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
      ]).start();
    }
  }, [visible]);

  function handleSelectHeight() {
    onClose();
    if (child) {
      setTimeout(() => onSelectHeight(child.id), 210);
    }
  }

  async function handleSelectWeight() {
    if (!child) return;
    if (hasPurchased) {
      onClose();
      setTimeout(() => onSelectWeight(child.id), 210);
    } else {
      // 弹出购买 Alert，购买成功后检查 store 状态并跳转
      await purchase();
      const purchased = usePurchaseStore.getState().hasPurchasedWeightFeature;
      if (purchased) {
        onClose();
        setTimeout(() => onSelectWeight(child.id), 210);
      }
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* 遮罩 */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* 面板 */}
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* 拖拽条 */}
        <View style={styles.handle} />

        {/* 儿童姓名 */}
        {child && (
          <Text style={styles.childName}>{child.name}</Text>
        )}

        <View style={styles.divider} />

        {/* 身高选项 */}
        <TouchableOpacity
          style={styles.option}
          onPress={handleSelectHeight}
          activeOpacity={0.6}
        >
          <Text style={styles.optionIcon}>📏</Text>
          <Text style={styles.optionLabel}>{t('home.selectMetric.height')}</Text>
        </TouchableOpacity>

        {/* 体重选项 */}
        <WeightOption
          hasPurchased={hasPurchased}
          label={t('home.selectMetric.weight')}
          onPress={handleSelectWeight}
        />
      </Animated.View>
    </Modal>
  );
}

/** 体重选项行 — 未购买时显示锁定样式 */
function WeightOption({
  hasPurchased,
  label,
  onPress,
}: {
  hasPurchased: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.option}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={styles.optionIcon}>⚖️</Text>
      <Text style={[styles.optionLabel, !hasPurchased && styles.optionLabelLocked]}>
        {label}
      </Text>
      {!hasPurchased && (
        <Text style={styles.lockIcon}>💎</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 12,
  },
  childName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFEFEF',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  optionIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  optionLabel: { flex: 1, fontSize: 17, color: '#4CAF82', fontWeight: '600' },
  optionLabelLocked: { color: '#CCC' },
  lockIcon: { fontSize: 18, color: '#F5C518' },
});
