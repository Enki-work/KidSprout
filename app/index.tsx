import { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildStore } from '@/store/childStore';
import { Child } from '@/types/child';
import { getAgeInMonths, formatAgeMonths } from '@/services/growth/age';

function ChildCard({ child, onPress }: { child: Child; onPress: () => void }) {
  const ageMonths = getAgeInMonths(new Date(child.birthDate));
  const ageText = formatAgeMonths(ageMonths);
  const sexLabel = child.sex === 'male' ? '男の子' : '女の子';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, child.sex === 'male' ? styles.avatarBoy : styles.avatarGirl]}>
          <Text style={styles.avatarText}>{child.sex === 'male' ? '♂' : '♀'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childMeta}>{sexLabel} · {ageText}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { children, load } = useChildStore();

  // 每次回到首页刷新列表
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <SafeAreaView style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <Text style={styles.title}>小芽成长</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/children/new' as never)}
        >
          <Text style={styles.addBtnText}>＋ 新建</Text>
        </TouchableOpacity>
      </View>

      {children.length === 0 ? (
        /* 空状态 */
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyTitle}>还没有孩子档案</Text>
          <Text style={styles.emptyDesc}>点击右上角「新建」开始记录成长</Text>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ChildCard
              child={item}
              onPress={() => router.push(`/children/${item.id}` as never)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A1A2E' },
  addBtn: {
    backgroundColor: '#4CAF82',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  list: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: { marginRight: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBoy:  { backgroundColor: '#DFF0FF' },
  avatarGirl: { backgroundColor: '#FFE4F0' },
  avatarText: { fontSize: 20 },
  cardBody: { flex: 1 },
  childName: { fontSize: 17, fontWeight: '600', color: '#1A1A2E' },
  childMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  chevron:   { fontSize: 22, color: '#CCC' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyDesc:  { fontSize: 14, color: '#999' },
});
