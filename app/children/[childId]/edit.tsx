import { StandardId, STANDARDS } from "@/constants/standards";
import { useChildStore } from "@/store/childStore";
import { Sex } from "@/types/child";
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

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function EditChildScreen() {
  const { t } = useTranslation();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { children, update, remove } = useChildStore();
  const child = children.find((c) => c.id === childId);

  const today = new Date();
  const minBirthDate = new Date(
    today.getFullYear() - 20,
    today.getMonth(),
    today.getDate(),
  );

  const [name, setName] = useState(child?.name ?? "");
  const [sex, setSex] = useState<Sex>(child?.sex ?? "male");
  const [birthDate, setBirthDate] = useState<Date>(
    child ? new Date(child.birthDate) : new Date(2022, 0, 1),
  );
  const [showPicker, setShowPicker] = useState(false);
  const [standardId, setStandardId] = useState<StandardId>(
    (child?.standardId as StandardId) ?? "japan",
  );

  if (!child) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t("childDetail.notFound")}</Text>
      </View>
    );
  }

  function onDateChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setBirthDate(selected);
  }

  function handleDelete() {
    const c = child!;
    Alert.alert(
      t("editChild.deleteAlertTitle"),
      t("editChild.deleteAlertMsg", { name: c.name }),
      [
        { text: t("editChild.cancel"), style: "cancel" },
        {
          text: t("editChild.confirmDelete"),
          style: "destructive",
          onPress: () => {
            remove(c.id);
            router.dismissAll();
          },
        },
      ],
    );
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert(t("editChild.alertTitle"), t("editChild.alertNameRequired"));
      return;
    }
    const now = new Date().toISOString();
    update({
      ...child!,
      name: name.trim(),
      sex,
      birthDate: dateToStr(birthDate),
      standardId,
      updatedAt: now,
    });
    router.back();
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("editChild.title") }} />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {/* 姓名 */}
        <Text style={styles.label}>{t("editChild.labelName")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("editChild.namePlaceholder")}
          value={name}
          onChangeText={setName}
          maxLength={20}
        />

        {/* 性别 */}
        <Text style={styles.label}>{t("editChild.labelSex")}</Text>
        <View style={styles.row}>
          {(["male", "female"] as Sex[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, sex === s && styles.chipActive]}
              onPress={() => setSex(s)}
            >
              <Text
                style={[styles.chipText, sex === s && styles.chipTextActive]}
              >
                {t(`sex.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 出生日期 */}
        <Text style={styles.label}>{t("editChild.labelBirthDate")}</Text>
        {Platform.OS === "ios" ? (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            minimumDate={minBirthDate}
            maximumDate={today}
            style={styles.iosPicker}
          />
        ) : (
          <>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.dateBtnText}>{dateToStr(birthDate)}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={minBirthDate}
                maximumDate={today}
              />
            )}
          </>
        )}

        {/* 成长标准 */}
        <Text style={styles.label}>{t("editChild.labelStandard")}</Text>
        <View style={styles.row}>
          {STANDARDS.map((std) => (
            <TouchableOpacity
              key={std.id}
              style={[styles.chip, standardId === std.id && styles.chipActive]}
              onPress={() => setStandardId(std.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  standardId === std.id && styles.chipTextActive,
                ]}
              >
                {t(`standards.${std.id}.label`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.standardDesc}>
          {t(`standards.${standardId}.description`)}
        </Text>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t("editChild.save")}</Text>
        </TouchableOpacity>

        {/* 删除按钮 */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>{t("editChild.delete")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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

  iosPicker: { marginTop: 4, marginLeft: -8 },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  dateBtnText: { fontSize: 16, color: "#1A1A2E" },

  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF82",
  },
  chipActive: { backgroundColor: "#4CAF82" },
  chipText: { fontSize: 14, color: "#4CAF82", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  standardDesc: { fontSize: 11, color: "#999", marginTop: 6, lineHeight: 16 },

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
