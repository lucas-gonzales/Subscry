import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { Image, Text, View } from 'react-native';
import { initDatabase } from "./src/db";
import participantsDao from './src/db/participantsDao';
import { migrateInlineParticipantsToParticipantsDao } from './src/db/subscriptionsDao';
import Dashboard from "./src/screens/Dashboard";
import SubscriptionsList from "./src/screens/SubscriptionsList";
import SubscriptionForm from "./src/screens/SubscriptionForm";
import Settings from "./src/screens/Settings";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";

const Stack = createStackNavigator();

function AppInner() {
  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await participantsDao.initParticipantsDB();
        await migrateInlineParticipantsToParticipantsDao(participantsDao);
      } catch (error) {
        console.error('Erro ao inicializar database ou migrar participantes:', error);
      }
    })();
  }, []);

  const { theme, colors } = useTheme();

  // Try to load custom header icon if present; fall back to text title when missing
  let subscryIcon: any = null;
  try {
    // Try the custom image first
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    subscryIcon = require('./assets/images/subscry.png');
  } catch (e1) {
    try {
      // Fallback to the project's main icon if present
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      subscryIcon = require('./assets/icon.png');
    } catch (e2) {
      subscryIcon = null;
    }
  }

  // Inline SVG placeholder (small rounded square with S) used when there's no asset file.
  // You can replace it by placing your logo at `assets/images/subscry.png` (recommended).
  const inlineLogoSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect rx="12" width="64" height="64" fill="#E50914" />
      <text x="50%" y="55%" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#fff" text-anchor="middle" font-weight="700">S</text>
    </svg>`
  )}`;

  return (
    <NavigationContainer>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
          headerTitle: () => (subscryIcon ? (
            // Show icon inside a rounded container to mask imperfect crop
            <>
              <View style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <Image
                  source={subscryIcon}
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
              </View>
            </>
          ) : (
            <View style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={{ uri: inlineLogoSvg }}
                style={{ width: 44, height: 44 }}
                resizeMode="contain"
              />
            </View>
          )),
          headerTitleStyle: { fontWeight: 'bold' },
          cardStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: "Subscry" }} />
        <Stack.Screen name="SubscriptionsList" component={SubscriptionsList} options={{ title: "Minhas Assinaturas" }} />
        <Stack.Screen name="SubscriptionForm" component={SubscriptionForm} options={{ title: "Assinatura" }} />
        <Stack.Screen name="Participants" component={require('./src/screens/Participants').default} options={{ title: 'Participantes' }} />
        <Stack.Screen name="Settings" component={Settings} options={{ title: "Configurações" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
