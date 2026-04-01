/**
 * 左侧抽屉菜单
 * 使用 React Native 内置 Animated API，零原生依赖，兼容 Expo Go
 */

import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBackup } from '@/hooks/useBackup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

const DRAWER_WIDTH = 280;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AppDrawer({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { handleExport, isExporting } = useBackup();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
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
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
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

  function navigate(path: string) {
    onClose();
    setTimeout(() => router.push(path as never), 210);
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

      {/* 抽屉面板 */}
      <Animated.View
        style={[
          styles.drawer,
          {
            paddingTop: insets.top + 12,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>🌱</Text>
          </View>
          <View>
            <Text style={styles.appName}>{t('app.title')}</Text>
            <Text style={styles.appSub}>KidSprout</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 菜单项 */}
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigate('/manage')}
            activeOpacity={0.6}
          >
            <Ionicons name="people-outline" size={22} color="#4CAF82" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>{t('drawer.manage')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigate('/settings')}
            activeOpacity={0.6}
          >
            <Ionicons name="language-outline" size={22} color="#4CAF82" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>{t('drawer.language')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { onClose(); setTimeout(handleExport, 210); }}
            activeOpacity={0.6}
            disabled={isExporting}
          >
            <Ionicons name="archive-outline" size={22} color="#4CAF82" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>{t('drawer.backup')}</Text>
            {isExporting
              ? <ActivityIndicator size="small" color="#CCC" />
              : <Ionicons name="chevron-forward" size={18} color="#CCC" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigate('/about')}
            activeOpacity={0.6}
          >
            <Ionicons name="information-circle-outline" size={22} color="#4CAF82" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>{t('drawer.about')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigate('/debug')}
              activeOpacity={0.6}
            >
              <Ionicons name="bug-outline" size={22} color="#FF9500" style={styles.menuIcon} />
              <Text style={[styles.menuLabel, styles.debugLabel]}>Debug</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 6, height: 0 },
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E8F8EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 28 },
  appName: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  appSub: { fontSize: 13, color: '#888', marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFEFEF',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  menu: { paddingHorizontal: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  menuIcon: { width: 28, textAlign: 'center' },
  menuLabel:  { flex: 1, fontSize: 16, color: '#1A1A2E' },
  debugLabel: { color: '#FF9500' },
});
