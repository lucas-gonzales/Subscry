import React from 'react';
import { View, Text, Switch, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAllSubscriptions, createSubscription } from '../db/subscriptionsDao';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { CreateSubscriptionInput } from '../types/subscription';

export default function Settings() {
  const { theme, isDark, toggleTheme, colors } = useTheme();
  const fs = FileSystem as any;

  const handleExport = async () => {
    try {
      const subscriptions = getAllSubscriptions();
      const json = JSON.stringify(subscriptions, null, 2);
      const fileUri = (fs.cacheDirectory || '') + 'subscry_backup.json';
      await fs.writeAsStringAsync(fileUri, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar dados: ' + (error as any).message);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await fs.readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        throw new Error('Formato de arquivo inválido. Esperado um array de assinaturas.');
      }

      let count = 0;
      for (const item of data) {
        // Basic validation
        if (!item.title || !item.amount || !item.frequency) continue;

        const input: CreateSubscriptionInput = {
          title: item.title,
          amount: item.amount,
          frequency: item.frequency,
          custom_interval_days: item.custom_interval_days,
          start_date: item.start_date || new Date().toISOString(),
          end_date: item.end_date,
          auto_renew: item.auto_renew ?? true,
          tags: item.tags,
          notes: item.notes,
        };
        createSubscription(input);
        count++;
      }

      Alert.alert('Sucesso', `${count} assinaturas importadas com sucesso!`);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao importar dados: ' + (error as any).message);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Modo Escuro</Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleExport}>
          <Text style={styles.buttonText}>Exportar Backup (JSON)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, marginTop: 10, borderWidth: 1, borderColor: colors.border }]} onPress={handleImport}>
          <Text style={[styles.buttonText, { color: colors.text }]}>Importar Backup (JSON)</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Subscry v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
  }
});
