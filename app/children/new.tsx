import { StandardId, STANDARDS } from "@/constants/standards";
import { useChildStore } from "@/store/childStore";
import { Child, Sex } from "@/types/child";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
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

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function NewChildScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const addChild = useChildStore((s) => s.add);

  const today = new Date();
  const minBirthDate = new Date(
    today.getFullYear() - 20,
    today.getMonth(),
    today.getDate(),
  );

  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [birthDate, setBirthDate] = useState<Date>(new Date(2022, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [standardId, setStandardId] = useState<StandardId>("japan");

  function onDateChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setBirthDate(selected);
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert(t("newChild.alertTitle"), t("newChild.alertNameRequired"));
      return;
    }
    const now = new Date().toISOString();
    const child: Child = {
      id: genId(),
      name: name.trim(),
      sex,
      birthDate: dateToStr(birthDate),
      standardId,
      createdAt: now,
      updatedAt: now,
    };
    addChild(child);
    router.back();
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("newChild.title") }} />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {/* 姓名 */}
        <Text style={styles.label}>{t("newChild.labelName")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("newChild.namePlaceholder")}
          value={name}
          onChangeText={setName}
          maxLength={20}
        />

        {/* 性别 */}
        <Text style={styles.label}>{t("newChild.labelSex")}</Text>
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
        <Text style={styles.label}>{t("newChild.labelBirthDate")}</Text>
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
        <Text style={styles.label}>{t("newChild.labelStandard")}</Text>
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
          <Text style={styles.saveBtnText}>{t("newChild.save")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
});
