//Perfil del usuario: datos personales, rol (estudiante o tutor), resumen de la billetera y de la mascota, y un botón de cerrar sesión.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { walletService, mascotaService } from '../../services/api';
import { Colors, FontSizes, Spacing, Radii, Shadows } from '../../constants/theme';

    export default function PerfilScreen() {
      const { usuario, logout } = useAuth();
      const [wallet,  setWallet] = useState<any>(null);
      const [mascota, setMascota] = useState<any>(null);

      useEffect(() => {
        Promise.all([walletService.getMiWallet(), mascotaService.getMiMascota()])
          .then(([w, m]) => { setWallet(w.data.data); setMascota(m.data.data); })
          .catch(() => {});
      }, []);

      const handleLogout = () => {
        Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: logout },
        ]);
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

            {wallet && mascota && (
              <View style={styles.statsRow}>
                {[
                  { label: 'KoinK', value: Number(wallet.saldo).toFixed(0), icon: '🪙' },
                  { label: 'Nivel', value: mascota.nivel, icon: '⭐' },
                  { label: 'Salud', value: `${mascota.salud}%`, icon: '💖' },
                ].map((s, i) => (
                  <View key={i} style={styles.statCard}>
                    <Text style={styles.statIcon}>{s.icon}</Text>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

        {/* Opciones */}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mi cuenta</Text>
              {[
                { icon: '🐷', label: 'Mi mascota' },
                { icon: '📊', label: 'Historial de transacciones' },
                { icon: '🏆', label: 'Mis logros' },
                { icon: '⚙️', label: 'Configuración' },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={styles.menuItem}>
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
    ...Shadows.md, },

avatarEmoji: { fontSize: 52 },
  nombre: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  rolBadge: {
    backgroundColor: Colors.pinkLight, borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 6, borderWidth: 1, borderColor: Colors.border, },

  rolText: { fontSize: FontSizes.xs, color: Colors.pinkDark, fontWeight: '700' },
  email: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 6 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: Radii.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    ...Shadows.sm, },

  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },

  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radii.md,
    padding: Spacing.md, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border, },

  menuIcon: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: FontSizes.md, color: Colors.textPrimary, fontWeight: '500' },
  menuArrow: { fontSize: FontSizes.lg, color: Colors.textMuted },

  logoutBtn: {
    backgroundColor: Colors.pinkLight, borderRadius: Radii.full,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.pinkMid, },
    
  logoutText: { fontSize: FontSizes.md, color: Colors.pinkDark, fontWeight: '700' },

});
