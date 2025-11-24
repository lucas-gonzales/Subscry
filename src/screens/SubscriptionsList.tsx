import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { getAllSubscriptions, deleteSubscription, searchSubscriptions, markAsPaid } from '../db/subscriptionsDao';
import { Subscription } from '../types/subscription';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { presets } from '../data/presets';
import iconMap from '../data/iconMap';
import formatCurrencyBR from '../utils/format';
import { daysUntil } from '../utils/dateUtils';

export default function SubscriptionsList({ navigation }: any) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const { colors } = useTheme();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSubscriptions();
    });

    return unsubscribe;
  }, [navigation, filterActive]);

  const loadSubscriptions = () => {
    if (filterActive !== undefined) {
      const filtered = searchSubscriptions({ active: filterActive });
      setSubscriptions(filtered);
    } else {
      const all = getAllSubscriptions();
      setSubscriptions(all);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja excluir "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteSubscription(id);
            loadSubscriptions();
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = (id: string, title: string) => {
    Alert.alert(
      'Marcar como Pago',
      `Marcar "${title}" como pago e avançar próximo vencimento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            markAsPaid(id);
            loadSubscriptions();
          },
        },
      ]
    );
  };

  const getIconForSubscription = (title: string) => {
    const preset = presets.find(p => p.name.toLowerCase() === title.toLowerCase());
    return preset ? { name: preset.icon, color: preset.color } : { name: 'credit-card-outline', color: colors.textSecondary };
  };

  const filteredBySearch = subscriptions.filter((sub) =>
    sub.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: Subscription }) => {
    const iconData = getIconForSubscription(item.title);
    // Try to find preset and image asset
    const presetMatch = presets.find(p => p.name.toLowerCase() === item.title.toLowerCase());
    const imageSource: any = presetMatch ? (iconMap[presetMatch.id] || null) : null;
    const days = daysUntil(item.next_due);
    const isUrgent = days <= 7;
    const isCritical = days <= 2;
    const participantNames = (item.participants || []).map((p: any) => p.name).join(', ');
    const perPerson = (item.participants && item.participants.length > 0) ? (item.amount / 100) / item.participants.length : null;
    
    return (
    <View style={[styles.card, { backgroundColor: colors.card, borderLeftWidth: isUrgent ? 4 : 0, borderLeftColor: isCritical ? '#e53935' : '#f57c00' }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: iconData.color + '20' }]}>
                {imageSource ? (
                  <Image source={imageSource} style={{ width: 28, height: 28 }} resizeMode="contain" />
                ) : (
                  <MaterialCommunityIcons name={iconData.name as any} size={24} color={iconData.color} />
                )}
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        </View>
        <Text style={[styles.amount, { color: colors.primary }]}>
          {formatCurrencyBR(item.amount / 100)}
        </Text>
      </View>

      <Text style={[styles.frequency, { color: colors.textSecondary }]}>
        Frequência: {item.frequency === 'custom' 
          ? `A cada ${item.custom_interval_days} dias` 
          : item.frequency}
      </Text>

      <Text style={[styles.nextDue, { color: isUrgent ? (isCritical ? '#e53935' : '#f57c00') : colors.textSecondary }]}> 
        Próximo vencimento: {format(parseISO(item.next_due), 'dd/MM/yyyy')}{isUrgent ? ` • Vence em ${days} dia${days === 1 ? '' : 's'}` : ''}
      </Text>

      {participantNames ? (
        <Text style={[styles.participants, { color: colors.textSecondary }]}>Assinado por: {participantNames}</Text>
      ) : null}

      {perPerson !== null && (
        <Text style={[styles.participants, { color: colors.textSecondary }]}>Por pessoa: {formatCurrencyBR(perPerson)}</Text>
      )}

      {item.tags && (
        <Text style={[styles.tags, { color: colors.textSecondary }]}>Tags: {item.tags}</Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('SubscriptionForm', { subscriptionId: item.id })}
        >
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={() => handleMarkAsPaid(item.id, item.title)}
        >
          <Text style={styles.actionText}>Pago</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.danger }]}
          onPress={() => handleDelete(item.id, item.title)}
        >
          <Text style={styles.actionText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Minhas Assinaturas</Text>

      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
        placeholder="Buscar assinaturas..."
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterButton, 
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            filterActive === undefined && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setFilterActive(undefined)}
        >
          <Text style={[styles.filterText, { color: filterActive === undefined ? '#fff' : colors.text }]}>Todas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton, 
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            filterActive === true && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setFilterActive(true)}
        >
          <Text style={[styles.filterText, { color: filterActive === true ? '#fff' : colors.text }]}>Ativas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton, 
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            filterActive === false && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setFilterActive(false)}
        >
          <Text style={[styles.filterText, { color: filterActive === false ? '#fff' : colors.text }]}>Inativas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBySearch}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma assinatura encontrada</Text>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('SubscriptionForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  frequency: {
    fontSize: 14,
    marginBottom: 4,
  },
  nextDue: {
    fontSize: 14,
    marginBottom: 4,
  },
  participants: {
    fontSize: 14,
    marginBottom: 4,
  },
  tags: {
    fontSize: 12,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'android' ? 88 : 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
});
