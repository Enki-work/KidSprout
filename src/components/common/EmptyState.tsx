import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * 通用空状态组件
 * 用于列表/内容区域暂无数据时的占位展示
 */
export function EmptyState({ icon = '🌱', title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  icon: { fontSize: 52, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#333', textAlign: 'center' },
  desc: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 19 },
  btn: {
    marginTop: 16,
    backgroundColor: '#4CAF82',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
