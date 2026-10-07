import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { walletService, mascotaService } from '../../services/api';
import { Colors, FontSizes, Spacing, Radii, Shadows } from '../../constants/theme';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [mascota, setMascota] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([walletService.getMiWallet(), mascotaService.getMiMascota()])
      .then(([w, m]) => { setWallet(w.data.data); setMascota(m.data.data); })
      .catch(() => {});
  }, []);

 const handleLogout = async () => {
    try {
      // 1. Limpiamos el estado global si existe
      if (logout) logout();
      
      // 2. Borramos los datos físicos de la memoria
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('usuario');
      
      // 3. Forzamos la navegación al inicio (Asegúrate de que '/' sea la ruta de tu login)
      router.replace('/'); 
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  const rol = usuario?.id_rol === 1 ? 'Estudiante 🎒' : 'Tutor 👨‍👩‍👧';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🐷</Text>
          </View>
          <Text style={styles.nombre}>{usuario?.nombre} {usuario?.apellido}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolText}>{rol}</Text>
          </View>
          <Text style={styles.email}>{usuario?.email}</Text>
        </View>

        {/* Stats */}
        {wallet && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🪙</Text>
              <Text style={styles.statValue}>{Number(wallet.saldo).toFixed(0)}</Text>
              <Text style={styles.statLabel}>KoinK</Text>
            </View>

            {usuario?.id_rol === 1 && mascota && (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statIcon}>⭐</Text>
                  <Text style={styles.statValue}>{mascota.nivel}</Text>
                  <Text style={styles.statLabel}>Nivel</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statIcon}>💖</Text>
                  <Text style={styles.statValue}>{mascota.salud}%</Text>
                  <Text style={styles.statLabel}>Salud</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Opciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi cuenta</Text>
          {[
            ...(usuario?.id_rol === 1 ? [
            { icon: '🐷', label: 'Mi mascota', route: '/home' },
            { icon: '🔑', label: 'Códigos de verificación', route: '/(tabs)/codigos' }
            ] : []),
            { icon: '📊', label: 'Historial de transacciones' },
            { icon: '🏆', label: 'Mis logros' },
            { icon: '⚙️', label: 'Configuración' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => item.route && router.push(item.route as any)}>
              
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.pinkLight,
    borderWidth: 3, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md, 
  },

  avatarEmoji: { fontSize: 52 },
  nombre: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  rolBadge: {
    backgroundColor: Colors.pinkLight, borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 6, borderWidth: 1, borderColor: Colors.border, 
  },

  rolText: { fontSize: FontSizes.xs, color: Colors.pinkDark, fontWeight: '700' },
  email: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 6 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: Radii.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    ...Shadows.sm, 
  },

  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },

  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radii.md,
    padding: Spacing.md, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border, 
  },

  menuIcon: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: FontSizes.md, color: Colors.textPrimary, fontWeight: '500' },
  menuArrow: { fontSize: FontSizes.lg, color: Colors.textMuted },

  logoutBtn: {
    backgroundColor: Colors.pinkLight, borderRadius: Radii.full,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.pinkMid, 
  },
    
  logoutText: { fontSize: FontSizes.md, color: Colors.pinkDark, fontWeight: '700' },
});