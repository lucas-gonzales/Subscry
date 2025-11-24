import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/db';
import participantsDao from './src/db/participantsDao';
import { migrateInlineParticipantsToParticipantsDao } from './src/db/subscriptionsDao';
import Dashboard from './src/screens/Dashboard';
import SubscriptionsList from './src/screens/SubscriptionsList';
import SubscriptionForm from './src/screens/SubscriptionForm';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await participantsDao.initParticipantsDB();
        // Try to migrate inline participants into participants DB (safe, idempotent)
        await migrateInlineParticipantsToParticipantsDao(participantsDao);
      } catch (error) {
        console.error('Erro ao inicializar database ou migrar participantes:', error);
      }
    })();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Dashboard"
            component={Dashboard}
            options={{ title: 'Subscry' }}
          />
          <Stack.Screen
            name="SubscriptionsList"
            component={SubscriptionsList}
            options={{ title: 'Minhas Assinaturas' }}
          />
          <Stack.Screen
            name="SubscriptionForm"
            component={SubscriptionForm}
            options={{ title: 'Assinatura' }}
          />
          <Stack.Screen
            name="Participants"
            // lazy require to avoid cycle during import
            component={require('./src/screens/Participants').default}
            options={{ title: 'Participantes' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
