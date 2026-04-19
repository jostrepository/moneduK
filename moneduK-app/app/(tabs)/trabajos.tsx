import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { trabajoService, walletService } from '../../services/api';
import { Colors, FontSizes, Spacing, Radii, Shadows } from '../../constants/theme';

interface Trabajo {
  id_trabajo: number;
  nombre: string;
  descripcion: string;
  recompensa_koin: number;
  recompensa_xp: number;
  duracion_seg: number | null;
}

export default function TrabajosScreen() {
  const [trabajos,  setTrabajos]  = useState<Trabajo[]>([]);
  const [saldo,     setSaldo]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [working,   setWorking]   = useState<number | null>(null);
  const [resultado, setResultado] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [tRes, wRes] = await Promise.all([
        trabajoService.getTrabajos(),
        walletService.getMiWallet(),
      ]);
      setTrabajos(tRes.data.data);
      setSaldo(Number(wRes.data.data.saldo));
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los trabajos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCompletar = async (trabajo: Trabajo) => {
    setWorking(trabajo.id_trabajo);
    try {
      const res = await trabajoService.completarTrabajo(trabajo.id_trabajo);
      const data = res.data.data;
      setSaldo(Number(data.saldo_nuevo));
      setResultado({ trabajo, data });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo completar el trabajo');
    } finally {
      setWorking(null);
    }
  };

  const renderTrabajo = ({ item }: { item: Trabajo }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>💼</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
        </View>
      </View>

      <View style={styles.recompensaRow}>
        <View style={styles.recompensaBadge}>
          <Text style={styles.recompensaText}>🪙 +{item.recompensa_koin} KoinK</Text>
        </View>
        <View style={[styles.recompensaBadge, styles.xpBadge]}>
          <Text style={[styles.recompensaText, styles.xpText]}>⭐ +{item.recompensa_xp} XP</Text>
        </View>
        {item.duracion_seg && (
          <View style={[styles.recompensaBadge, styles.timeBadge]}>
            <Text style={[styles.recompensaText, styles.timeText]}>
              ⏱ {item.duracion_seg}s
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.btn, working === item.id_trabajo && styles.btnDisabled]}
        onPress={() => handleCompletar(item)}
        disabled={working !== null}
      >
        {working === item.id_trabajo
          ? <ActivityIndicator color={Colors.white} size="small" />
          : <Text style={styles.btnText}>¡Hacer este trabajo!</Text>
        }
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={Colors.pinkMid} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trabajos 💼</Text>
        <View style={styles.saldoBadge}>
          <Text style={styles.saldoText}>🪙 {Number(saldo).toFixed(0)}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Completa trabajos y gana KoinK para tu cerdito</Text>

      <FlatList
        data={trabajos}
        keyExtractor={item => String(item.id_trabajo)}
        renderItem={renderTrabajo}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No hay trabajos disponibles</Text>
          </View>
        }
      />

      {/* Modal de resultado */}
      <Modal visible={!!resultado} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>¡Trabajo completado!</Text>
            <Text style={styles.modalSubtitle}>{resultado?.trabajo?.nombre}</Text>

            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatVal}>+{resultado?.data?.recompensa_koin}</Text>
                <Text style={styles.modalStatLabel}>KoinK ganados</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalStat}>
                <Text style={styles.modalStatVal}>+{resultado?.data?.recompensa_xp}</Text>
                <Text style={styles.modalStatLabel}>XP ganados</Text>
              </View>
            </View>

            <Text style={styles.modalSaldo}>
              Saldo actual: 🪙 {Number(resultado?.data?.saldo_nuevo).toFixed(0)} KoinK
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setResultado(null)}
            >
              <Text style={styles.modalBtnText}>¡Genial! 🐷</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.background },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  title:    { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  saldoBadge: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.yellow + '80' },
  saldoText:  { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.yellowDark },
  subtitle:   { fontSize: FontSizes.sm, color: Colors.textMuted, paddingHorizontal: Spacing.lg, marginTop: 4, marginBottom: Spacing.md },

  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

  card: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.yellowLight, alignItems: 'center', justifyContent: 'center' },
  iconEmoji:  { fontSize: 24 },
  cardInfo:   { flex: 1 },
  cardTitle:  { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  cardDesc:   { fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 18 },

  recompensaRow:   { flexDirection: 'row', gap: 6, marginBottom: Spacing.md, flexWrap: 'wrap' },
  recompensaBadge: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  recompensaText:  { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.yellowDark },
  xpBadge:         { backgroundColor: '#EEF2FF' },
  xpText:          { color: '#3730A3' },
  timeBadge:       { backgroundColor: Colors.pinkLight },
  timeText:        { color: Colors.pinkDark },

  btn:         { backgroundColor: Colors.yellowMid, borderRadius: Radii.full, height: 44, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.white },

  empty:      { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.sm },

  overlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modal:   { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.xl, width: '100%', alignItems: 'center', ...Shadows.lg },
  modalEmoji:     { fontSize: 56, marginBottom: Spacing.sm },
  modalTitle:     { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  modalSubtitle:  { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 4, marginBottom: Spacing.lg },
  modalStats:     { flexDirection: 'row', width: '100%', marginBottom: Spacing.md },
  modalStat:      { flex: 1, alignItems: 'center' },
  modalStatVal:   { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.pinkDark },
  modalStatLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 4 },
  modalDivider:   { width: 1, backgroundColor: Colors.border },
  modalSaldo:     { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.lg },
  modalBtn:       { backgroundColor: Colors.pinkMid, borderRadius: Radii.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, width: '100%', alignItems: 'center' },
  modalBtnText:   { fontSize: FontSizes.md, fontWeight: '700', color: Colors.white },
});
