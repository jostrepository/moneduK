// Define la barra de navegación inferior (tabs). Solo muestra 4 pestañas visibles (Inicio, Mi cerdito, Lecciones, Perfil) y oculta las demás pantallas 
// (trabajos, inversiones, apuestas, tienda, misiones) con href: null (estas se navegan por botones desde el menú y no aparecen en la tab bar.

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

    export default function TabsLayout() {
      return (
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor:   Colors.pinkMid,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarStyle: {
              backgroundColor: Colors.white,
              borderTopColor:  Colors.border,
              borderTopWidth: 1,
              height: 64,
              paddingBottom: 10,
              paddingTop: 6,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >

      {/* Inicio (widgets + mascota) */}

          <Tabs.Screen
            name="menu"
            options={{
              title: 'Inicio',
              tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
            }}
          />

      {/* Mi cerdito (pantalla dedicada) */}

          <Tabs.Screen

            name="home"
            options={{
              title: 'Mi cerdito',
              tabBarIcon: ({ color, size }) => <Ionicons name="happy" size={size} color={color} />,
            }}
          />

      {/* Lecciones */}

          <Tabs.Screen
            name="lecciones"
            options={{
              title: 'Lecciones',
              tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
            }}
          />

      {/* Perfil */}

          <Tabs.Screen
            name="perfil"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
            }}
          />

      {/* Pantallas ocultas (sin tab) */}
      
          <Tabs.Screen name="trabajos" options={{ href: null }} />
          <Tabs.Screen name="inversiones" options={{ href: null }} />
          <Tabs.Screen name="apuestas" options={{ href: null }} />
          <Tabs.Screen name="tienda" options={{ href: null }} />
          <Tabs.Screen name="misiones" options={{ href: null }} />
        </Tabs>
      );
  }
