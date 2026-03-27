/**
 * 儿童档案管理页
 * 显示所有儿童列表，点击进入对应的档案编辑页
 */

import { useTranslation } from 'react-i18next';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildStore } from '@/store/childStore';
import { Child } from '@/types/child';
import { getAgeInMonths } from '@/services/growth/age';
import { useFormatAge } from '@/hooks/useFormatAge';
import { EmptyState } from '@/components/common/EmptyState';

function ChildEditRow({ child, onPress }: { child: Child; onPress: () => void }) {
  const { t } = useTranslation();
  const formatAge = useFormatAge();
  const ageMonths = getAgeInMonths(new Date(child.birthDate));
  const ageText = formatAge(ageMonths);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* 头像 */}
      <View style={[styles.avatar, child.sex === 'male' ? styles.avatarBoy : styles.avatarGirl]}>
        <Text style={styles.avatarText}>{child.sex === 'male' ? '♂' : '♀'}</Text>
      </View>

      {/* 信息 */}
      <View style={styles.info}>
        <Text style={styles.name}>{child.name}</Text>
        <Text style={styles.meta}>
          {t(`sex.${child.sex}`)} · {ageText}
        </Text>
      </View>

      {/* 编辑标记 */}
      <View style={styles.editBadge}>
        <Text style={styles.editBadgeText}>{t('manageChildren.edit')}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ManageChildrenScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { children, load } = useChildStore();

  // 每次进入页面刷新列表（编辑返回后同步最新数据）
  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  return (
    <>
      <Stack.Screen options={{ title: t('manageChildren.title') }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {children.length === 0 ? (
          <EmptyState
            icon="🌱"
            title={t('home.empty.title')}
            description={t('home.empty.desc')}
          />
        ) : (
          <FlatList
            data={children}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ChildEditRow
                child={item}
                onPress={() => router.push(`/children/${item.id}/edit` as never)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  list: { padding: 16, gap: 10 },

  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBoy: { backgroundColor: '#DFF0FF' },
  avatarGirl: { backgroundColor: '#FFE4F0' },
  avatarText: { fontSize: 22 },

  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600', color: '#1A1A2E' },
  meta: { fontSize: 13, color: '#888', marginTop: 2 },

  editBadge: {
    backgroundColor: '#F0FBF5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#4CAF82',
  },
  editBadgeText: {
    fontSize: 13,
    color: '#4CAF82',
    fontWeight: '600',
  },
});
