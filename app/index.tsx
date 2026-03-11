import { View, Text, StyleSheet } from 'react-native';

// 首页 / 孩子列表（占位页面，后续开发）
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>小芽成长</Text>
      <Text style={styles.subtitle}>KidSprout</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF82',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
});
