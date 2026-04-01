/**
 * [仅 DEV] 调试工具页
 * 汇集各种测试数据生成功能，不在生产构建中显示
 */

import { Stack, Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildStore } from '@/store/childStore';
import { DebugAddTestData } from '@/components/debug/DebugAddTestData';
import { DebugAddWeightTestData } from '@/components/debug/DebugAddWeightTestData';

if (!__DEV__) {
  // 生产环境不应访问此页面
}

export default function DebugScreen() {
  if (!__DEV__) return <Redirect href="/" />;

  const children = useChildStore(s => s.children);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Debug' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>测试数据生成</Text>

        {children.length === 0 && (
          <Text style={styles.empty}>暂无孩子档案，请先创建档案</Text>
        )}

        {children.map(child => (
          <View key={child.id} style={styles.childCard}>
            <Text style={styles.childName}>{child.name}</Text>
            <View style={styles.btnRow}>
              <View style={styles.btnWrap}>
                <Text style={styles.btnLabel}>身高数据</Text>
                <DebugAddTestData childId={child.id} />
              </View>
              <View style={styles.btnWrap}>
                <Text style={styles.btnLabel}>体重数据</Text>
                <DebugAddWeightTestData childId={child.id} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F7F8FA' },
  content:      { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  empty:        { color: '#AAA', fontSize: 15, textAlign: 'center', marginTop: 40 },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  childName:  { fontSize: 17, fontWeight: '600', color: '#1A1A2E' },
  btnRow:     { flexDirection: 'row', gap: 12 },
  btnWrap:    { flex: 1, alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: 8, paddingVertical: 10 },
  btnLabel:   { fontSize: 12, color: '#888', marginBottom: 4 },
});
