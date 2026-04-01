import '@/i18n'; // 必须最先引入，初始化 i18n
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import * as Linking from 'expo-linking';
import { initDb } from '@/db/sqlite';
import { useChildStore } from '@/store/childStore';
import { initLanguage } from '@/store/settingsStore';
import { initPurchaseState } from '@/store/purchaseStore';
import { useBackup } from '@/hooks/useBackup';

export default function RootLayout() {
  const loadChildren = useChildStore(s => s.load);
  const { handleImportFromUri } = useBackup();

  useEffect(() => {
    initDb();             // 先建表
    initLanguage();       // 再读取已保存的语言
    initPurchaseState();  // 读取内购状态
    loadChildren();
  }, []);

  // 监听 .kidsprout 文件打开事件
  useEffect(() => {
    // 处理已运行时通过 URL 打开文件
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (isBackupFile(url)) handleImportFromUri(url);
    });
    // 处理冷启动时打开文件
    Linking.getInitialURL().then((url) => {
      if (url && isBackupFile(url)) handleImportFromUri(url);
    });
    return () => sub.remove();
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

function isBackupFile(url: string): boolean {
  return url.toLowerCase().includes('.kidsprout');
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
