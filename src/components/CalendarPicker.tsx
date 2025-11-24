import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

type Props = {
  visible: boolean;
  date?: string | null; // YYYY-MM-DD
  onCancel: () => void;
  onConfirm: (isoDate: string) => void;
};

export default function CalendarPicker({ visible, date, onCancel, onConfirm }: Props) {
  const [selected, setSelected] = useState<string | undefined>(date || undefined);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Escolha a data</Text>
          <Calendar
            onDayPress={(day) => setSelected(day.dateString)}
            markedDates={selected ? { [selected]: { selected: true, selectedColor: '#4E2A8E' } } : {}}
            current={date || undefined}
            style={{ borderRadius: 8 }}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#ddd' }]} onPress={onCancel}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#4E2A8E' }]}
              onPress={() => selected && onConfirm(selected)}
              disabled={!selected}
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
  container: { width: '95%', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  btn: { padding: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
});
