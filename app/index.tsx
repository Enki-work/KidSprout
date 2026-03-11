import { formatAgeMonths, getAgeInMonths } from "@/services/growth/age";
import { useChildStore } from "@/store/childStore";
import { Child } from "@/types/child";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ChildCard({ child, onPress }: { child: Child; onPress: () => void }) {
  const ageMonths = getAgeInMonths(new Date(child.birthDate));
  const ageText = formatAgeMonths(ageMonths);
  const sexLabel = child.sex === "male" ? "男の子" : "女の子";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.avatar,
          child.sex === "male" ? styles.avatarBoy : styles.avatarGirl,
        ]}
      >
        <Text style={styles.avatarText}>
          {child.sex === "male" ? "♂" : "♀"}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childMeta}>
          {sexLabel} · {ageText}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { children, load } = useChildStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  return (
    <>
      {/* 配置 Stack 导航器 header */}
      <Stack.Screen
        options={{
          title: "小芽成长",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/children/new" as never)}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>新建</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {children.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>还没有孩子档案</Text>
            <Text style={styles.emptyDesc}>点击右上角「新建」开始记录成长</Text>
          </View>
        ) : (
          <FlatList
            data={children}
            keyExtractor={(c) => c.id}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },

  addBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  addBtnText: { color: "#4CAF82", fontSize: 18, fontWeight: "600" },

  list: { padding: 16, gap: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBoy: { backgroundColor: "#DFF0FF" },
  avatarGirl: { backgroundColor: "#FFE4F0" },
  avatarText: { fontSize: 20 },
  cardBody: { flex: 1 },
  childName: { fontSize: 17, fontWeight: "600", color: "#1A1A2E" },
  childMeta: { fontSize: 13, color: "#888", marginTop: 2 },
  chevron: { fontSize: 22, color: "#CCC" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  emptyDesc: { fontSize: 14, color: "#999" },
});
