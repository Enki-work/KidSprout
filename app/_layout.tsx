import '@/i18n'; // 必须最先引入，初始化 i18n
import { useEffect } from 'react';
import { Platform } from 'react-native';
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

// 在模块加载时拦截初始 URL：阻止 Expo Router 将备份文件 URL 当作路由处理
// （会导致找不到路由 → 触发 GO_BACK → 报错）
// 我们将 URL 保存在此变量，由 _layout 的 useEffect 自行处理
let _pendingBackupUri: string | null = null;
if (Platform.OS === 'ios') {
  const _origGetInitialURL = Linking.getInitialURL.bind(Linking);
  (Linking as unknown as { getInitialURL: () => Promise<string | null> }).getInitialURL =
    async () => {
      const url = await _origGetInitialURL();
      if (url && isBackupFile(url)) {
        _pendingBackupUri = url;
        return null; // Expo Router 收到 null，不再尝试导航
      }
      return url;
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
    const sub = Linking.addEventListener('url', ({ url }) => {
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
