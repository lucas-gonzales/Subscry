import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type Props = {
  visible: boolean;
  date?: string | null; // YYYY-MM-DD
  onCancel: () => void;
  onConfirm: (isoDate: string) => void;
};

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function SimpleDatePicker({ visible, date, onCancel, onConfirm }: Props) {
  const today = new Date();
  const initial = date ? new Date(date) : today;

  const [day, setDay] = useState(initial.getDate());
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [year, setYear] = useState(initial.getFullYear());

  useEffect(() => {
    const d = date ? new Date(date) : new Date();
    setDay(d.getDate());
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }, [date, visible]);

  const years: number[] = [];
  const start = today.getFullYear() - 5;
  for (let y = start; y <= start + 20; y++) years.push(y);

  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Escolha a data</Text>
          <View style={styles.pickersRow}>
            <View style={styles.pickerWrap}>
              <Text style={styles.label}>Dia</Text>
              <Picker selectedValue={day} onValueChange={(v) => setDay(Number(v))}>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerWrap}>
              <Text style={styles.label}>Mês</Text>
              <Picker selectedValue={month} onValueChange={(v) => setMonth(Number(v))}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerWrap}>
              <Text style={styles.label}>Ano</Text>
              <Picker selectedValue={year} onValueChange={(v) => setYear(Number(v))}>
                {years.map((y) => (
                  <Picker.Item key={y} label={`${y}`} value={y} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#ddd' }]} onPress={onCancel}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#4E2A8E' }]}
              onPress={() => onConfirm(`${year}-${pad(month)}-${pad(day)}`)}
            >
              <Text style={{ color: '#fff' }}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  container: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  pickersRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pickerWrap: { flex: 1, alignItems: 'center' },
  label: { marginBottom: 6 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  btn: { padding: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
});
