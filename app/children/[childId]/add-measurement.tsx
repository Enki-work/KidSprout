import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMeasurementStore } from '@/store/measurementStore';
import { Measurement } from '@/types/measurement';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddMeasurementScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const addMeasurement = useMeasurementStore(s => s.add);

  const [date, setDate]       = useState(todayStr());
  const [height, setHeight]   = useState('');
  const [note, setNote]       = useState('');

  function handleSave() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('提示', '请输入正确的日期（格式：YYYY-MM-DD）');
      return;
    }
    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum < 30 || heightNum > 250) {
      Alert.alert('提示', '请输入合理的身高（30〜250 cm）');
      return;
    }
    const now = new Date().toISOString();
    const m: Measurement = {
      id:         genId(),
      childId:    childId!,
      measuredAt: date,
      heightCm:   heightNum,
      note:       note.trim() || undefined,
      createdAt:  now,
      updatedAt:  now,
    };
    addMeasurement(m);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>测量日期 *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        <Text style={styles.label}>身高（cm）*</Text>
        <TextInput
          style={[styles.input, styles.heightInput]}
          value={height}
          onChangeText={setHeight}
          placeholder="例：98.5"
          keyboardType="decimal-pad"
          maxLength={6}
        />

        <Text style={styles.label}>备注（可选）</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="例：医院体检"
          multiline
          maxLength={100}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>保存记录</Text>
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
  heightInput: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#4CAF82' },
  noteInput:   { height: 80, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: '#4CAF82', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
