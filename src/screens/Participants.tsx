import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import participantsDao from '../db/participantsDao';
import { getParticipantTotalsFromDao } from '../db/subscriptionsDao';
import { useTheme } from '../contexts/ThemeContext';
import formatCurrencyBR from '../utils/format';

export default function ParticipantsScreen({ navigation }: any) {
  const [participants, setParticipants] = useState<any[]>([]);
  const { colors } = useTheme();

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadData();
    });
    return unsub;
  }, [navigation]);

  const loadData = async () => {
    await participantsDao.initParticipantsDB();
    const totals = await getParticipantTotalsFromDao(participantsDao);
    setParticipants(totals || []);
  };

  // edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editingName, setEditingName] = useState('');

  const openEdit = async (p: any) => {
    setEditing(p);
    setEditingName(p.name || '');
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const oldName = editing.name;
    const name = editingName.trim();
    if (!name) return Alert.alert('Nome inválido', 'O nome não pode ficar vazio.');

    // find participant record by name via DAO (normalized)
    await participantsDao.initParticipantsDB();
    const all = participantsDao.getAllParticipants();
    const found = all.find((x: any) => (x.name || '').toString().trim().toLowerCase() === (oldName || '').toString().trim().toLowerCase());
    if (!found) {
      Alert.alert('Erro', 'Registro do participante não encontrado.');
      setEditVisible(false);
      return;
    }

    // check for name collisions
    const collision = all.find((x: any) => (x.name || '').toString().trim().toLowerCase() === name.toLowerCase() && x.id !== found.id);
    if (collision) {
      return Alert.alert('Nome existente', 'Já existe outro participante com este nome. Escolha outro.');
    }

    await participantsDao.updateParticipant(found.id, { name });
    setEditVisible(false);
    loadData();
  };

  const confirmDelete = (p: any) => {
    Alert.alert('Excluir participante', `Deseja excluir "${p.name}"? Isso removerá o participante e seus links.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { 
        await participantsDao.initParticipantsDB();
        const all = participantsDao.getAllParticipants();
        const found = all.find((x: any) => (x.name || '').toString().trim().toLowerCase() === (p.name || '').toString().trim().toLowerCase());
        if (found) await participantsDao.deleteParticipant(found.id);
        loadData();
      } }
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Participantes</Text>
      {participants.length === 0 && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.textSecondary }}>Nenhum participante encontrado.</Text>
        </View>
      )}

      {participants.map((p: any) => (
        <View key={p.name} style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{p.name}</Text>
              <Text style={{ color: colors.textSecondary }}>{p.subscriptions.length} assinatura{p.subscriptions.length === 1 ? '' : 's'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => openEdit(p)} style={{ marginRight: 12 }}>
                <Text style={{ color: colors.primary }}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(p)}>
                <Text style={{ color: '#d9534f' }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            {p.subscriptions && p.subscriptions.length > 0 ? (
              p.subscriptions.map((s: any) => (
                <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                  <Text style={{ color: colors.text }}>{s.title}</Text>
                  <Text style={{ color: colors.textSecondary }}>{formatCurrencyBR((s.shareCents || 0) / 100)}</Text>
                </View>
              ))
            ) : null}
          </View>
        </View>
      ))}

      {/* Edit participant modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}>
          <View style={{ margin: 20, backgroundColor: colors.card, borderRadius: 12, padding: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Editar participante</Text>
            <TextInput value={editingName} onChangeText={setEditingName} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={{ padding: 12, backgroundColor: colors.border, borderRadius: 8 }}>
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
                <Text style={{ color: '#fff' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, borderRadius: 12, marginBottom: 12 },
});
