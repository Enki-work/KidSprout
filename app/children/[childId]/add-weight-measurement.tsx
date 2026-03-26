import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMeasurementStore } from '@/store/measurementStore';
import { useChildStore } from '@/store/childStore';
import { Measurement } from '@/types/measurement';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AddWeightMeasurementScreen() {
  const { t } = useTranslation();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { byChild, add: addMeasurement, update: updateMeasurement } = useMeasurementStore();
  const child = useChildStore(s => s.children.find(c => c.id === childId));

  const today = new Date();
  const minMeasureDate = child ? new Date(child.birthDate) : new Date(2000, 0, 1);

  const [date, setDate]             = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [weight, setWeight]         = useState('');
  const [note, setNote]             = useState('');

  function onDateChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setDate(selected);
  }

  function handleSave() {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 200) {
      Alert.alert(
        t('addWeightMeasurement.alertTitle'),
        t('addWeightMeasurement.alertWeightInvalid'),
      );
      return;
    }

    const dateStr = dateToStr(date);
    const now = new Date().toISOString();

    // 如果该日期已有身高记录，直接更新 weightKg 字段（合并到同一条记录）
    const existing = (byChild[childId!] ?? []).find(m => m.measuredAt === dateStr);
    if (existing) {
      updateMeasurement({ ...existing, weightKg: weightNum, updatedAt: now });
    } else {
      // 新建记录（heightCm 暂填 0，仅记录体重）
      const m: Measurement = {
        id:         genId(),
        childId:    childId!,
        measuredAt: dateStr,
        heightCm:   0,
        weightKg:   weightNum,
        note:       note.trim() || undefined,
        createdAt:  now,
        updatedAt:  now,
      };
      addMeasurement(m);
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: t('addWeightMeasurement.title') }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* 测量日期 */}
        <Text style={styles.label}>{t('addWeightMeasurement.labelDate')}</Text>

        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            minimumDate={minMeasureDate}
            maximumDate={today}
            style={styles.iosPicker}
          />
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
        <Text style={styles.label}>{t('addWeightMeasurement.labelWeight')}</Text>
        <TextInput
          style={[styles.input, styles.weightInput]}
          value={weight}
          onChangeText={setWeight}
          placeholder={t('addWeightMeasurement.weightPlaceholder')}
          keyboardType="decimal-pad"
          maxLength={6}
        />

        {/* 备注 */}
        <Text style={styles.label}>{t('addWeightMeasurement.labelNote')}</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder={t('addWeightMeasurement.notePlaceholder')}
          multiline
          maxLength={100}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t('addWeightMeasurement.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content:   { padding: 24, gap: 8 },

  label: { fontSize: 14, fontWeight: '600', color: '#555', marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: '#1A1A2E', marginTop: 4,
  },

  iosPicker:   { marginTop: 4, marginLeft: -8 },
  dateBtn: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginTop: 4,
  },
  dateBtnText: { fontSize: 16, color: '#1A1A2E' },

  weightInput: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#4CAF82' },
  noteInput:   { height: 80, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: '#4CAF82', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
