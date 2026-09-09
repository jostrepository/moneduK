//  Layout raíz de toda la aplicación. Carga las fuentes Nunito (5 pesos), mantiene el splash screen visible hasta que las fuentes cargan,
//  envuelve toda la app en contexto de sesión y define el stack de navegación con 3 rutas principales: index, (auth) y (tabs).

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../hooks/useAuth';
import { Colors } from '../constants/theme';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

    SplashScreen.preventAutoHideAsync();

    export default function RootLayout() {
      const [fontsLoaded] = useFonts({
            Nunito_400Regular,
            Nunito_600SemiBold,
            Nunito_700Bold,
            Nunito_800ExtraBold,
            Nunito_900Black,
        });

      useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
      }, [fontsLoaded]);

      if (!fontsLoaded) return null;

      return (
        <AuthProvider>
          <StatusBar style="dark" backgroundColor={Colors.background} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthProvider>
      );
  }
