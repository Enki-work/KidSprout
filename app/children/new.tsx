import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildStore } from '@/store/childStore';
import { Child, Sex } from '@/types/child';
import { StandardId, STANDARDS } from '@/constants/standards';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function NewChildScreen() {
  const router = useRouter();
  const addChild = useChildStore(s => s.add);

  const [name, setName]               = useState('');
  const [sex, setSex]                 = useState<Sex>('male');
  const [birthDate, setBirthDate]     = useState<Date>(new Date(2022, 0, 1));
  const [showPicker, setShowPicker]   = useState(false);
  const [standardId, setStandardId]   = useState<StandardId>('japan');

  function onDateChange(_: DateTimePickerEvent, selected?: Date) {
    // Android 在选完后自动关闭；iOS 需手动关闭
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setBirthDate(selected);
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('提示', '请输入孩子姓名');
      return;
    }
    const now = new Date().toISOString();
    const child: Child = {
      id:         genId(),
      name:       name.trim(),
      sex,
      birthDate:  dateToStr(birthDate),
      standardId,
      createdAt:  now,
      updatedAt:  now,
    };
    addChild(child);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* 姓名 */}
        <Text style={styles.label}>姓名 *</Text>
        <TextInput
          style={styles.input}
          placeholder="孩子的名字"
          value={name}
          onChangeText={setName}
          maxLength={20}
        />

        {/* 性别 */}
        <Text style={styles.label}>性别 *</Text>
        <View style={styles.row}>
          {(['male', 'female'] as Sex[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, sex === s && styles.chipActive]}
              onPress={() => setSex(s)}
            >
              <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
                {s === 'male' ? '男の子' : '女の子'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 出生日期 */}
        <Text style={styles.label}>出生日期 *</Text>

        {/* iOS：始终内嵌显示 spinner */}
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            maximumDate={new Date()}
            locale="zh-CN"
            style={styles.iosPicker}
          />
        ) : (
          /* Android：点击按钮弹出系统对话框 */
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
                maximumDate={new Date()}
              />
            )}
          </>
        )}

        {/* 成长标准 */}
        <Text style={styles.label}>成长标准</Text>
        <View style={styles.row}>
          {STANDARDS.map(std => (
            <TouchableOpacity
              key={std.id}
              style={[styles.chip, standardId === std.id && styles.chipActive]}
              onPress={() => setStandardId(std.id)}
            >
              <Text style={[styles.chipText, standardId === std.id && styles.chipTextActive]}>
                {std.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>保存</Text>
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

  iosPicker: { marginTop: 4, marginLeft: -8 },

  dateBtn: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginTop: 4,
  },
  dateBtnText: { fontSize: 16, color: '#1A1A2E' },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#4CAF82',
  },
  chipActive:     { backgroundColor: '#4CAF82' },
  chipText:       { fontSize: 14, color: '#4CAF82', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  saveBtn: {
    backgroundColor: '#4CAF82', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
