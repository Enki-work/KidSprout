import { useChildStore } from "@/store/childStore";
import { useMeasurementStore } from "@/store/measurementStore";
import { Measurement } from "@/types/measurement";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dateToStr(d: Date): string {
  // 使用本地日期分量，避免 toISOString() 转 UTC 导致跨日（JST 等东亚时区凌晨-1天）
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AddMeasurementScreen() {
  const { t } = useTranslation();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const addMeasurement = useMeasurementStore((s) => s.add);
  const child = useChildStore((s) => s.children.find((c) => c.id === childId));

  const today = new Date();
  const minMeasureDate = child
    ? new Date(child.birthDate)
    : new Date(2000, 0, 1);

  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [height, setHeight] = useState("");
  const [note, setNote] = useState("");

  function onDateChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setDate(selected);
  }

  function handleSave() {
    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum < 30 || heightNum > 250) {
      Alert.alert(
        t("addMeasurement.alertTitle"),
        t("addMeasurement.alertHeightInvalid"),
      );
      return;
    }
    const now = new Date().toISOString();
    const m: Measurement = {
      id: genId(),
      childId: childId!,
      measuredAt: dateToStr(date),
      heightCm: heightNum,
      note: note.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    addMeasurement(m);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("addMeasurement.title") }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 测量日期 */}
        <Text style={styles.label}>{t("addMeasurement.labelDate")}</Text>

        {Platform.OS === "ios" ? (
          <View style={styles.iosPickerWrapper}>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              minimumDate={minMeasureDate}
              maximumDate={today}
              style={styles.iosPicker}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.dateBtnText}>{dateToStr(date)}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={minMeasureDate}
                maximumDate={today}
              />
            )}
          </>
        )}

        {/* 身高 */}
        <Text style={styles.label}>{t("addMeasurement.labelHeight")}</Text>
        <TextInput
          style={[styles.input, styles.heightInput]}
          value={height}
          onChangeText={setHeight}
          placeholder={t("addMeasurement.heightPlaceholder")}
          keyboardType="decimal-pad"
          maxLength={6}
        />

        {/* 备注 */}
        <Text style={styles.label}>{t("addMeasurement.labelNote")}</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder={t("addMeasurement.notePlaceholder")}
          multiline
          maxLength={100}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t("addMeasurement.save")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, gap: 8 },

  label: { fontSize: 14, fontWeight: "600", color: "#555", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A2E",
    marginTop: 4,
  },

  iosPickerWrapper: { height: 160, overflow: "hidden", marginTop: 4 },
  iosPicker: { marginLeft: -8 },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  dateBtnText: { fontSize: 16, color: "#1A1A2E" },

  heightInput: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#4CAF82",
  },
  noteInput: { height: 80, textAlignVertical: "top" },

  saveBtn: {
    backgroundColor: "#4CAF82",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 32,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
