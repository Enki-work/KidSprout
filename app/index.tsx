import { useTranslation } from 'react-i18next';
import { getAgeInMonths } from "@/services/growth/age";
import { useChildStore } from "@/store/childStore";
import { Child } from "@/types/child";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFormatAge } from "@/hooks/useFormatAge";
import { EmptyState } from "@/components/common/EmptyState";
import { AppDrawer } from "@/components/common/AppDrawer";
import { ChildActionBottomSheet, ChildActionBottomSheetRef } from "@/components/common/ChildActionBottomSheet";
import { useAppRating } from "@/hooks/useAppRating";

function ChildCard({ child, onPress }: { child: Child; onPress: () => void }) {
  const { t } = useTranslation();
  const formatAge = useFormatAge();
  const ageMonths = getAgeInMonths(new Date(child.birthDate));
  const ageText = formatAge(ageMonths);
  const sexLabel = t(`sex.${child.sex}`);

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
  const { t } = useTranslation();
  const router = useRouter();
  const { children, isLoading, load } = useChildStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sheetRef = useRef<ChildActionBottomSheetRef>(null);
  useAppRating();

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  function handleCardPress(child: Child) {
    sheetRef.current?.show(child);
  }

  function handleSelectHeight(childId: string) {
    router.push(`/children/${childId}` as never);
  }

  function handleSelectWeight(childId: string) {
    router.push(`/children/${childId}/weight` as never);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('app.title'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => setDrawerOpen(true)}
              style={styles.hamburgerBtn}
            >
              <Text style={styles.hamburger}>☰</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/children/new" as never)}
              style={styles.headerBtn}
            >
              <Text style={styles.addBtnText}>{t('home.new')}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color="#4CAF82" />
        ) : children.length === 0 ? (
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
              <ChildCard
                child={item}
                onPress={() => handleCardPress(item)}
              />
            )}
          />
        )}
      </SafeAreaView>

      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ChildActionBottomSheet
        ref={sheetRef}
        onSelectHeight={handleSelectHeight}
        onSelectWeight={handleSelectWeight}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  headerBtn: { paddingHorizontal: 6, paddingVertical: 6, alignSelf: 'center' },
  hamburgerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburger: { fontSize: 24, color: "#4CAF82", lineHeight: 28 },
  addBtnText: { color: "#4CAF82", fontSize: 18, fontWeight: "600" },

  loader: { flex: 1 },
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
});
