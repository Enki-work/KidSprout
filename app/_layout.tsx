import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { initDb } from '@/db/sqlite';
import { useChildStore } from '@/store/childStore';

export default function RootLayout() {
  const loadChildren = useChildStore(s => s.load);

  useEffect(() => {
    // 应用启动时初始化 DB，然后加载孩子列表
    initDb();
    loadChildren();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerTintColor: '#4CAF82',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
