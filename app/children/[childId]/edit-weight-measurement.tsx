import { useChildStore } from "@/store/childStore";
import { useMeasurementStore } from "@/store/measurementStore";
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

function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EditWeightMeasurementScreen() {
  const { t } = useTranslation();
  const { childId, id } = useLocalSearchParams<{ childId: string; id: string }>();
  const router = useRouter();
  const { update: updateMeasurement, remove: removeMeasurement, byChild } = useMeasurementStore();
  const child = useChildStore((s) => s.children.find((c) => c.id === childId));

  const measurement = (byChild[childId ?? ""] ?? []).find((m) => m.id === id);

  const today = new Date();
  const minMeasureDate = child ? new Date(child.birthDate) : new Date(2000, 0, 1);

  const [date, setDate] = useState<Date>(
    measurement ? new Date(measurement.measuredAt) : new Date(),
  );
  const [showPicker, setShowPicker] = useState(false);
  const [weight, setWeight] = useState(
    measurement?.weightKg != null ? String(measurement.weightKg) : "",
  );
  const [note, setNote] = useState(measurement?.note ?? "");

  if (!measurement) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t("childDetail.notFound")}</Text>
      </View>
    );
  }

  function onDateChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setDate(selected);
  }

  function handleSave() {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 200) {
      Alert.alert(
        t("addWeightMeasurement.alertTitle"),
        t("addWeightMeasurement.alertWeightInvalid"),
      );
      return;
    }
    updateMeasurement({
      ...measurement!,
      measuredAt: dateToStr(date),
      weightKg: weightNum,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  }

  function handleDelete() {
    Alert.alert(
      t("childDetail.deleteWeightRecord.title"),
      t("childDetail.deleteWeightRecord.msg", { date: measurement!.measuredAt }),
      [
        { text: t("childDetail.deleteWeightRecord.cancel"), style: "cancel" },
        {
          text: t("childDetail.deleteWeightRecord.confirm"),
          style: "destructive",
          onPress: () => {
            removeMeasurement(measurement!.id, childId!);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("editWeightMeasurement.title") }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 测量日期 */}
        <Text style={styles.label}>{t("addWeightMeasurement.labelDate")}</Text>
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

        {/* 体重 */}
        <Text style={styles.label}>{t("addWeightMeasurement.labelWeight")}</Text>
        <TextInput
          style={[styles.input, styles.weightInput]}
          value={weight}
          onChangeText={setWeight}
          placeholder={t("addWeightMeasurement.weightPlaceholder")}
          keyboardType="decimal-pad"
          maxLength={6}
        />

        {/* 备注 */}
        <Text style={styles.label}>{t("addWeightMeasurement.labelNote")}</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder={t("addWeightMeasurement.notePlaceholder")}
          multiline
          maxLength={100}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t("editWeightMeasurement.save")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>{t("editWeightMeasurement.delete")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { color: "#999", fontSize: 16 },

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

  weightInput: {
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

  deleteBtn: {
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  deleteBtnText: { color: "#FF3B30", fontSize: 16, fontWeight: "600" },
});
