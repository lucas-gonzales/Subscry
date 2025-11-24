import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getAllSubscriptions, getParticipantTotalsFromDao } from '../db/subscriptionsDao';
import participantsDao from '../db/participantsDao';
import { Subscription } from '../types/subscription';
import { parseISO, format, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { presets } from '../data/presets';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import iconMap from '../data/iconMap';
import { Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import formatCurrencyBR from '../utils/format';
import { daysUntil } from '../utils/dateUtils';
import { Platform } from 'react-native';

export default function Dashboard({ navigation }: any) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [nextPayment, setNextPayment] = useState<Subscription | null>(null);
  const [activeIcons, setActiveIcons] = useState<Array<{ id: string; icon: string; color: string; title: string; image?: any }>>([]);
  const [participantTotals, setParticipantTotals] = useState<Array<{ name: string; amount: number }>>([]);
  const { colors } = useTheme();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = () => {
    const subs = getAllSubscriptions();
    setSubscriptions(subs);

    // Calcular total mensal
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    let yearly = 0;

    // Build list of active subscriptions for icons and compute totals
    const activeList: typeof activeIcons = [];
    const perPersonMap: Record<string, number> = {};
    const meNames = new Set<string>();

    subs.forEach((sub) => {
      // Only count active subscriptions (skip expired)
      if (!sub.auto_renew && sub.end_date && new Date(sub.end_date) < now) {
          return;
      }

      // Collect active subscription icon info
      const preset = presets.find(p => p.name.toLowerCase() === sub.title.toLowerCase());
      const imageSource = preset ? (iconMap[preset.id] || null) : null;
      activeList.push({ id: sub.id, icon: (preset && preset.icon) ? preset.icon : 'credit-card-outline', color: (preset && preset.color) ? preset.color : colors.textSecondary, title: sub.title, image: imageSource });

      // Total anual (estimativa baseada na frequência) and monthly equivalent
      let monthlyEquivalent = 0;
      switch (sub.frequency) {
        case 'monthly':
          yearly += (sub.amount / 100) * 12;
          monthlyEquivalent = sub.amount / 100;
          break;
        case 'yearly':
          yearly += sub.amount / 100;
          monthlyEquivalent = (sub.amount / 100) / 12;
          break;
        case 'weekly':
          yearly += (sub.amount / 100) * 52;
          monthlyEquivalent = (sub.amount / 100) * 52 / 12;
          break;
        case 'daily':
          yearly += (sub.amount / 100) * 365;
          monthlyEquivalent = (sub.amount / 100) * 365 / 12;
          break;
        case 'custom':
          if (sub.custom_interval_days) {
            yearly += (sub.amount / 100) * (365 / sub.custom_interval_days);
            monthlyEquivalent = (sub.amount / 100) * (365 / sub.custom_interval_days) / 12;
          }
          break;
      }

      // Distribute monthlyEquivalent among participants (if any)
      if (sub.participants && Array.isArray(sub.participants) && sub.participants.length > 0) {
        const per = monthlyEquivalent / sub.participants.length;
        sub.participants.forEach((p: any) => {
          const name = p.name || '—';
          perPersonMap[name] = (perPersonMap[name] || 0) + per;
          if (p.isMe) {
            meNames.add(name);
          }
        });
      }
    });

    setYearlyTotal(yearly);
    // Normalize yearly estimate to monthly expected cost
    setMonthlyTotal(yearly / 12);
    setActiveIcons(activeList);

    // Prefer aggregated totals from persistent participants DB when available
    (async () => {
      try {
        await participantsDao.initParticipantsDB();
        const totalsFromDao = await getParticipantTotalsFromDao(participantsDao);
        if (totalsFromDao && totalsFromDao.length > 0) {
          const mapped = totalsFromDao.map((t: any) => ({ name: t.name, amount: parseFloat(t.total), isMe: t.name === 'Você' }));
          mapped.sort((a: any, b: any) => b.amount - a.amount);
          setParticipantTotals(mapped);
          return;
        }
      } catch (e) {
        // fallback to inline calculation below
      }

      // Fallback: Convert perPersonMap to sorted array
      const participantsArray = Object.keys(perPersonMap).map(name => ({ name, amount: perPersonMap[name], isMe: meNames.has(name) } as any));
      participantsArray.sort((a, b) => b.amount - a.amount);
      setParticipantTotals(participantsArray);
    })();
    
    // Próximo pagamento (filter out inactive/expired)
    const activeSubs = subs.filter(s => {
      if (s.end_date) {
        return new Date(s.end_date) >= now;
      }
      return Boolean(s.auto_renew);
    });
    if (activeSubs.length > 0) {
      // Sort by next_due just in case
      activeSubs.sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime());
      setNextPayment(activeSubs[0]);
    } else {
      setNextPayment(null);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingBottom: Platform.OS === 'android' ? 120 : 28 }]}>
      <Text style={[styles.title, { color: colors.text }]}>Subscry Dashboard</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Total Mensal</Text>
        <Text style={[styles.amount, { color: colors.primary }]}>{formatCurrencyBR(monthlyTotal)}</Text>
      </View>
      {/* Per-person totals this month (summary) */}
      {participantTotals.length > 0 && (
        <View style={{ marginTop: 10, marginBottom: 12 }}>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Por pessoa (este mês):</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {participantTotals.map((p: any) => (
              <View key={p.name} style={{ backgroundColor: p.isMe ? colors.primary + '10' : colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8, borderWidth: p.isMe ? 1 : 0, borderColor: p.isMe ? colors.primary : 'transparent' }}>
                <Text style={{ color: p.isMe ? colors.primary : colors.text, fontWeight: '600' }}>{p.name}{p.isMe ? ' • Você' : ''}</Text>
                <Text style={{ color: colors.textSecondary }}>{formatCurrencyBR(p.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Row of active subscription icons */}
      {activeIcons.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: colors.textSecondary, marginRight: 12 }}>Ativas:</Text>
          <View style={{ flexDirection: 'row' }}>
            {activeIcons.map(a => (
              <View key={a.id} style={{ alignItems: 'center', marginRight: 8 }}>
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: a.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                  {a.image ? (
                    <Image source={a.image} style={{ width: 28, height: 28 }} resizeMode="contain" />
                  ) : (
                    <MaterialCommunityIcons name={a.icon as any} size={22} color={a.color} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Total Anual (Estimado)</Text>
        <Text style={[styles.amount, { color: colors.primary }]}>{formatCurrencyBR(yearlyTotal)}</Text>
      </View>

      {nextPayment && (() => {
        const days = daysUntil(nextPayment.next_due);
        const isUrgent = days <= 7;
        const isCritical = days <= 2;
        const participantNames = (nextPayment.participants || []).map((p: any) => p.name).join(', ');
        const perPerson = (nextPayment.participants && nextPayment.participants.length > 0) ? (nextPayment.amount / 100) / nextPayment.participants.length : null;

        return (
          <View style={[styles.card, { backgroundColor: colors.card, borderLeftWidth: isUrgent ? 6 : 0, borderLeftColor: isCritical ? '#e53935' : '#f57c00' }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Próximo Pagamento</Text>
            <Text style={[styles.nextTitle, { color: colors.text }]}>{nextPayment.title}</Text>
            <Text style={[styles.nextAmount, { color: colors.primary }]}>{formatCurrencyBR(nextPayment.amount / 100)}</Text>
            <Text style={[styles.nextDate, { color: isUrgent ? (isCritical ? '#e53935' : '#f57c00') : colors.textSecondary }]}>Vencimento: {format(parseISO(nextPayment.next_due), 'dd/MM/yyyy')}{isUrgent ? ` • Vence em ${days} dia${days === 1 ? '' : 's'}` : ''}</Text>
            {participantNames ? (<Text style={{ color: colors.textSecondary, marginTop: 8 }}>Assinado por: {participantNames}</Text>) : null}
            {perPerson !== null ? (<Text style={{ color: colors.textSecondary }}>Por pessoa: {formatCurrencyBR(perPerson)}</Text>) : null}
          </View>
        );
      })()}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, marginBottom: Platform.OS === 'android' ? 12 : 10 }]}
        onPress={() => navigation.navigate('SubscriptionsList')}
      >
        <Text style={styles.buttonText}>Ver Todas as Assinaturas</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent || '#6c757d', marginBottom: Platform.OS === 'android' ? 12 : 10 }]}
        onPress={() => navigation.navigate('Participants')}
      >
        <Text style={styles.buttonText}>Participantes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.accent, marginBottom: Platform.OS === 'android' ? 20 : 12 }]}
        onPress={() => navigation.navigate('SubscriptionForm')}
      >
        <Text style={styles.buttonText}>Adicionar Nova Assinatura</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  nextTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nextDate: {
    fontSize: 14,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSecondary: {
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
