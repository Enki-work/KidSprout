import '@/i18n'; // 必须最先引入，初始化 i18n
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import * as Linking from 'expo-linking';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { initDb } from '@/db/sqlite';
import { useChildStore } from '@/store/childStore';
import { initLanguage } from '@/store/settingsStore';
import { initPurchaseState } from '@/store/purchaseStore';
import { useBackup } from '@/hooks/useBackup';
import { syncWeightEntitlement } from '@/services/purchase/weightEntitlement';

// 在模块加载时双重拦截：阻止 Expo Router 将备份文件 URL 当作路由处理
// 问题：Expo Router 也监听 getInitialURL 和 addEventListener，
// 收到 .kidsprout URL 后会尝试导航 → "Unmatched Route" 页面
// 解决：拦截这两个 API，让 Expo Router 看不到备份 URL；
//       我们用保存的原始 addEventListener 来自行处理导入
let _pendingBackupUri: string | null = null;
// 保存原始 addEventListener 供 _layout useEffect 使用（绕过过滤）
type UrlListener = (e: { url: string }) => void;
type UrlSubscription = { remove: () => void };
type UrlAddEventListener = (event: string, handler: UrlListener) => UrlSubscription;
let _origAddEventListener: UrlAddEventListener | null = null;

if (Platform.OS === 'ios') {
  const _origGetInitialURL = Linking.getInitialURL.bind(Linking);
  _origAddEventListener = Linking.addEventListener.bind(Linking) as unknown as UrlAddEventListener;

  // 1. 拦截 getInitialURL：冷启动时 Expo Router 通过此获取初始 URL
  (Linking as unknown as { getInitialURL: () => Promise<string | null> }).getInitialURL =
    async () => {
      const url = await _origGetInitialURL();
      if (url && isBackupFile(url)) {
        _pendingBackupUri = url;
        return null; // 返回 null，Expo Router 不尝试导航
      }
      return url;
    };

  // 2. 拦截 addEventListener：热启动时 Expo Router 通过此接收 URL 事件
  (Linking as unknown as { addEventListener: UrlAddEventListener }).addEventListener =
    (event: string, handler: UrlListener) => {
      if (event === 'url') {
        // 给 Expo Router 包一层过滤：备份文件 URL 不传给它
        const filtered: UrlListener = (e) => {
          if (!isBackupFile(e.url)) handler(e);
        };
        return _origAddEventListener!(event, filtered);
      }
      return _origAddEventListener!(event, handler);
    };
}

export default function RootLayout() {
  const loadChildren = useChildStore(s => s.load);
  const { handleImportFromUri } = useBackup();

  useEffect(() => {
    initDb();             // 先建表
    initLanguage();       // 再读取已保存的语言
    initPurchaseState();  // 读取内购状态
    loadChildren();

    syncWeightEntitlement().catch(() => {});
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncWeightEntitlement().catch(() => {});
      }
    });

    return () => sub.remove();
  }, []);

  // iOS：监听 .kidsprout 文件通过 UTType document opener 打开
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    // 冷启动：使用模块级拦截到的 URL（避免 Expo Router 重复处理触发 GO_BACK 报错）
    if (_pendingBackupUri) {
      const uri = _pendingBackupUri;
      _pendingBackupUri = null;
      handleImportFromUri(uri);
    }

    // 热启动（App 已运行时打开文件）
    // 使用原始 addEventListener（绕过 Expo Router 的过滤层），确保能收到备份 URL
    const addListener = (_origAddEventListener ?? (Linking.addEventListener.bind(Linking) as unknown as UrlAddEventListener)) as UrlAddEventListener;
    const sub = addListener('url', ({ url }) => {
      if (isBackupFile(url)) handleImportFromUri(url);
    });
    return () => sub.remove();
  }, [handleImportFromUri]);

  // Android：监听 SEND / VIEW intent（含热启动场景）
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    ReceiveSharingIntent.getReceivedFiles(
      (files: SharedFile[]) => {
        const f = files?.[0];
        const uri = f?.contentUri ?? f?.filePath;
        if (uri && isBackupFile(f?.fileName ?? uri)) {
          handleImportFromUri(uri);
        }
        ReceiveSharingIntent.clearReceivedFiles();
      },
      () => { /* 非备份文件，静默忽略 */ },
    );
  }, [handleImportFromUri]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="auto" />
      <ActionSheetProvider>
        <Stack
          screenOptions={{
            headerTintColor: '#4CAF82',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#F7F8FA' },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          {/* 体重功能购买页：modal 弹出，无 header */}
          <Stack.Screen
            name="purchase/weight-feature"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </Stack>
      </ActionSheetProvider>
    </GestureHandlerRootView>
  );
}

type SharedFile = {
  contentUri?: string;
  filePath?: string;
  fileName?: string;
};

function isBackupFile(url: string): boolean {
  return url.toLowerCase().includes('.kidsprout');
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
