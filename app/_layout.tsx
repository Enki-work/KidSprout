import '@/i18n'; // 必须最先引入，初始化 i18n
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { initDb } from '@/db/sqlite';
import { useChildStore } from '@/store/childStore';
import { initLanguage } from '@/store/settingsStore';
import { initPurchaseState } from '@/store/purchaseStore';

export default function RootLayout() {
  const loadChildren = useChildStore(s => s.load);

  useEffect(() => {
    initDb();             // 先建表
    initLanguage();       // 再读取已保存的语言
    initPurchaseState();  // 读取内购状态
    loadChildren();
  }, []);

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
        />
      </ActionSheetProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
