import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import iconCollection from '../data/icons';
import iconMap from '../data/iconMap';
import CalendarPicker from '../components/CalendarPicker';
import {
  createSubscription,
  updateSubscription,
  getSubscriptionById,
} from '../db/subscriptionsDao';
import participantsDao from '../db/participantsDao';
import { useTheme } from '../contexts/ThemeContext';
import { presets, Preset, Plan } from '../data/presets';
import formatCurrencyBR from '../utils/format';
import { toISOString } from '../utils/dateUtils';
import { FrequencyType } from '../types/subscription';

export default function SubscriptionForm({ route, navigation }: any) {
  const subscriptionId = route.params?.subscriptionId;
  const isEditing = !!subscriptionId;
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [participants, setParticipants] = useState<{ name: string; isMe?: boolean }[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [knownParticipants, setKnownParticipants] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [customDays, setCustomDays] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(undefined);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  

  useEffect(() => {
    if (isEditing) {
      loadSubscription();
    } else {
      setStartDate(new Date().toISOString().split('T')[0]);
    }
    // load persisted participants for autocomplete
    (async () => {
      try {
        await participantsDao.initParticipantsDB();
        const parts = participantsDao.getAllParticipants() || [];
        setKnownParticipants(parts.map((p: any) => p.name));
      } catch (e) {
        // ignore - suggestions optional
      }
    })();
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, [subscriptionId]);

  // Helper: show YYYY-MM-DD (internal) as DD/MM/YYYY for display
  const formatDisplayDate = (isoDate: string | null | undefined) => {
    if (!isoDate) return '';
    // isoDate expected as 'YYYY-MM-DD' or full ISO
    const d = isoDate.split('T')[0];
    const parts = d.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const loadSubscription = () => {
    const sub = getSubscriptionById(subscriptionId);
    if (sub) {
      setTitle(sub.title);
      setAmount((sub.amount / 100).toFixed(2));
      setParticipants((sub.participants as any) || []);
      setFrequency(sub.frequency);
      setCustomDays(sub.custom_interval_days?.toString() || '');
      setStartDate(sub.start_date.split('T')[0]);
      
      // Logic for Active status: if auto_renew is true and not expired
      const isExpired = sub.end_date && new Date(sub.end_date) < new Date();
      setIsActive(sub.auto_renew && !isExpired);

      setTags(sub.tags || '');
      // Remove linhas automáticas do tipo "Icon: <name>" que podem existir em assinaturas antigas
      const cleanedNotes = (sub.notes || '').replace(/^Icon:\s*[^\r\n]*(\r?\n)?/i, '').trim();
      setNotes(cleanedNotes);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setTitle(preset.name);
    setTags(preset.category ?? '');
    setSelectedIcon(preset.icon);
    
    if (preset.plans.length === 1) {
      applyPlan(preset.plans[0]);
    } else {
      setShowPlanModal(true);
    }
  };

  const applyPlan = (plan: Plan) => {
    setAmount((plan.price_cents / 100).toFixed(2));
    setFrequency(plan.frequency);
    setShowPlanModal(false);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Título é obrigatório');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Erro', 'Valor deve ser maior que zero');
      return false;
    }

    if (!startDate) {
      Alert.alert('Erro', 'Data de início é obrigatória');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    // We no longer expose an end date in the form. Keep end_date null and
    // rely on auto_renew flag for active/inactive state.
    let finalAutoRenew = isActive;

    const data = {
      title: title.trim(),
      amount: amountInCents,
      participants,
      frequency,
      custom_interval_days: frequency === 'custom' ? parseInt(customDays) : null,
      start_date: toISOString(new Date(startDate + 'T00:00:00')),
      end_date: null,
      auto_renew: finalAutoRenew,
      tags: tags.trim(),
      notes: notes.trim() || null,
    };

    try {
      let savedSub;
      if (isEditing) {
        savedSub = updateSubscription(subscriptionId, data);
        Alert.alert('Sucesso', 'Assinatura atualizada!');
      } else {
        savedSub = createSubscription(data);
        Alert.alert('Sucesso', 'Assinatura criada!');
      }

      // Link participants to persistent participants DB (create if missing)
      if (savedSub && Array.isArray(participants) && participants.length > 0) {
        for (const p of participants) {
          if (!p || !p.name) continue;
          const found = await participantsDao.findOrCreateByName(p.name);
          // if this participant was marked as 'isMe' in the form, persist that and unset others
          if (p.isMe) {
            await participantsDao.setParticipantAsMe(found.id);
          }
          // ensure subscriptionId is linked
          await participantsDao.addSubscriptionToParticipant(found.id, savedSub.id);
        }
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const inputStyle = [
    styles.input, 
    { 
      color: colors.text, 
      borderColor: colors.border,
      backgroundColor: colors.card 
    }
  ];

  // If the user hasn't marked any participant as "isMe", include the app user
  // in the per-person division (so adding 2 participants + you => divide by 3).
  const perPersonCount = participants.length === 0
    ? 1
    : participants.some(p => p.isMe)
      ? participants.length
      : participants.length + 1;
  const perPersonAmount = formatCurrencyBR((parseFloat(amount || '0') || 0) / perPersonCount);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {!isEditing && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Escolha um Serviço</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
            {presets.map((preset: Preset) => {
              // try to load a brand image from our static iconMap
              const imageSource: any = iconMap[preset.id] || null;
              // If we know some assets are placeholders or incorrect, prefer vector icon
              const preferVectorFor = ['telecine', 'looke'];

              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetCard,
                    { backgroundColor: colors.card, borderColor: selectedPreset?.id === preset.id ? colors.primary : colors.border },
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: preset.color + '20' }]}>
                    {imageSource && !preferVectorFor.includes(preset.id) ? (
                      // show brand image when available and not a known-bad placeholder
                      // eslint-disable-next-line react-native/no-inline-styles
                      <Image source={imageSource} style={{ width: 32, height: 32 }} resizeMode="contain" />
                    ) : (
                      <MaterialCommunityIcons name={preset.icon as any} size={32} color={preset.color} />
                    )}
                  </View>
                  <Text style={[styles.presetName, { color: colors.text }]}>{preset.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.formContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Nome do Serviço</Text>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Netflix"
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.label, { color: colors.text }]}>Valor</Text>
            <TextInput
              style={inputStyle}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 0.45, minWidth: 150 }}>
            <Text style={[styles.label, { color: colors.text }]}>Participantes</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[inputStyle, { flex: 1 }]}
                value={newParticipantName}
                onChangeText={(text) => {
                  setNewParticipantName(text);
                  const q = text.trim().toLowerCase();
                  if (!q) {
                    setSuggestions([]);
                    return;
                  }
                  const s = knownParticipants.filter(k => k.toLowerCase().includes(q) && !participants.some(p => p.name.trim().toLowerCase() === k.toLowerCase()));
                  setSuggestions(s.slice(0, 6));
                }}
                placeholder="Nome"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => {
                  const name = newParticipantName.trim();
                  if (!name) return;
                  // avoid duplicates in the current subscription
                  const alreadyAdded = participants.some(p => p.name.trim().toLowerCase() === name.toLowerCase());
                  if (alreadyAdded) {
                    Alert.alert('Participante já adicionado', `O participante "${name}" já foi adicionado a esta assinatura.`);
                    setNewParticipantName('');
                    setSuggestions([]);
                    return;
                  }

                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setParticipants(prev => [...prev, { name, isMe: false }]);
                  setNewParticipantName('');
                  setSuggestions([]);
                }}
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: colors.primary + '10',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityLabel="Adicionar participante"
                accessibilityRole="button"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 6 }}>Adicionar</Text>
                </View>
              </TouchableOpacity>
            </View>
            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 8, marginTop: 6, padding: 6, borderWidth: 1, borderColor: colors.border }}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity key={i} onPress={() => {
                    const name = s.trim();
                    if (!name) return;
                    if (participants.some(p => p.name.trim().toLowerCase() === name.toLowerCase())) return;
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setParticipants(prev => [...prev, { name, isMe: false }]);
                    setNewParticipantName('');
                    setSuggestions([]);
                  }} style={{ paddingVertical: 8, paddingHorizontal: 6 }}>
                    <Text style={{ color: colors.text }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {participants.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  // Tap toggles 'isMe' for this participant (only one may be isMe)
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setParticipants(prev => prev.map((pp, i) => {
                      if (i === idx) return { ...pp, isMe: !pp.isMe };
                      return { ...pp, isMe: false };
                    }));
                  }}
                  onLongPress={() => {
                    const nameToRemove = p.name;
                    Alert.alert(
                      'Remover participante',
                      `Deseja remover "${nameToRemove}" desta assinatura?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Remover', style: 'destructive', onPress: () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setParticipants(prev => prev.filter((_, i) => i !== idx)); } }
                      ]
                    );
                  }}
                  style={{
                    backgroundColor: p.isMe ? colors.primary + '20' : colors.card,
                    borderWidth: p.isMe ? 1 : 0,
                    borderColor: p.isMe ? colors.primary : 'transparent',
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 12,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {p.isMe && <MaterialCommunityIcons name="account-circle" size={16} color={colors.primary} style={{ marginRight: 6 }} />}
                    <Text style={{ color: p.isMe ? colors.primary : colors.text }}>{p.name}{p.isMe ? ' • Você' : ''}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {participants.length > 0 && (
              <Text style={{ marginTop: 8, color: colors.textSecondary }}>
                Por pessoa{!participants.some(p => p.isMe) ? ' (incluindo você)' : ''}: {perPersonAmount}
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Frequência</Text>
        <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Picker
            selectedValue={frequency}
            onValueChange={(value: FrequencyType) => setFrequency(value)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="Mensal" value="monthly" />
            <Picker.Item label="Anual" value="yearly" />
          </Picker>
        </View>

        {frequency === 'custom' && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>A cada quantos dias?</Text>
            <TextInput
              style={inputStyle}
              value={customDays}
              onChangeText={setCustomDays}
              placeholder="Ex: 30"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
          </>
        )}

        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>Data da assinatura do serviço</Text>
                <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
                  <TextInput
                    style={inputStyle}
                    value={formatDisplayDate(startDate)}
                    editable={false}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={colors.textSecondary}
                  />
                </TouchableOpacity>
            </View>
        </View>

        <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Assinatura Ativa</Text>
                <Text style={[styles.switchSubLabel, { color: colors.textSecondary }]}>
                    {isActive ? 'Renovação automática ativada' : 'Assinatura cancelada ou finalizada'}
                </Text>
            </View>
            <Switch 
                value={isActive} 
                onValueChange={setIsActive} 
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#fff'}
            />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
        <TextInput
          style={inputStyle}
          value={tags}
          onChangeText={setTags}
          placeholder="Ex: streaming, trabalho"
          placeholderTextColor={colors.textSecondary}
        />

        <View style={{ marginTop: 12 }}>
          <Text style={[styles.label, { color: colors.text }]}>Ícone (opcional)</Text>
          <TouchableOpacity style={[styles.iconPickerButton, { borderColor: colors.border }]} onPress={() => setShowIconModal(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name={(selectedIcon || 'dots-horizontal') as any} size={24} color={colors.text} />
              <Text style={{ marginLeft: 10, color: colors.textSecondary }}>{selectedIcon || 'Escolher ícone'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Notas</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observações..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Salvar Assinatura</Text>
        </TouchableOpacity>
      </View>

      {/* Icon picker modal */}
      <Modal visible={showIconModal} transparent animationType="slide" onRequestClose={() => setShowIconModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}>
          <View style={{ margin: 20, backgroundColor: colors.card, borderRadius: 12, padding: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Escolha um ícone</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {iconCollection.map((ic) => (
                <TouchableOpacity key={ic.id} onPress={() => { setSelectedIcon(ic.name); setShowIconModal(false); }} style={{ width: 80, alignItems: 'center', margin: 8 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: ic.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={ic.name as any} size={28} color={ic.color} />
                  </View>
                  <Text style={{ color: colors.textSecondary, marginTop: 6 }}>{ic.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowIconModal(false)} style={{ marginTop: 12, padding: 12, backgroundColor: colors.border, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: colors.text }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date pickers using visual calendar */}
      <CalendarPicker visible={showStartDatePicker} date={startDate || undefined} onCancel={() => setShowStartDatePicker(false)} onConfirm={(d) => { setStartDate(d); setShowStartDatePicker(false); }} />

      {/* Plan Selection Modal */}
      <Modal
        visible={showPlanModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Escolha o Plano - {selectedPreset?.name}</Text>
                <ScrollView>
                    {selectedPreset?.plans.map((plan: Plan, index: number) => (
                        <TouchableOpacity 
                            key={index} 
                            style={[styles.planOption, { borderBottomColor: colors.border }]}
                            onPress={() => applyPlan(plan)}
                        >
                            <View>
                                <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                                <Text style={[styles.planFreq, { color: colors.textSecondary }]}>
                                    {plan.frequency === 'monthly' ? 'Mensal' : 'Anual'}
                                </Text>
                            </View>
                            <Text style={[styles.planPrice, { color: colors.primary }]}>
                              {formatCurrencyBR(plan.price_cents / 100)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity 
                    style={[styles.closeButton, { backgroundColor: colors.border }]} 
                    onPress={() => setShowPlanModal(false)}
                >
                    <Text style={{ color: colors.text }}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
      
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  presetsScroll: {
    marginBottom: 10,
  },
  presetCard: {
    width: 100,
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchSubLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  planOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
  },
  planFreq: {
    fontSize: 12,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  iconPickerButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },
});
