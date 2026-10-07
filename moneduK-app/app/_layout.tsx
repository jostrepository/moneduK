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

      // Montamos los assets tipográficos en paralelo al arranque de la aplicación móvil
      // evitando destellos de fuentes nativas (FOUC) durante el primer renderizado de la UI.

      const [fontsLoaded] = useFonts({
            Nunito_400Regular,
            Nunito_600SemiBold,
            Nunito_700Bold,
            Nunito_800ExtraBold,
            Nunito_900Black,
        });

      useEffect(() => {

        // Retenemos el splash screen nativo enganchándolo a nuestra promesa de fuentes
        // revelando la aplicación únicamente cuando la interfaz esté en capacidad de pintarse íntegra.

        if (fontsLoaded) SplashScreen.hideAsync();
      }, [fontsLoaded]);

      if (!fontsLoaded) return null;

      // Proveemos el estado global de autenticación como capa superior envolvente
      // para habilitar el redireccionamiento privado en todos los nodos de la jerarquía (tabs).

      return (
        <AuthProvider>
          <StatusBar style="dark" />
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