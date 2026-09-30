import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, Modal,
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
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<number | null>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [segundosLiberar, setSegundosLiberar] = useState(0);
  const [trabajosEnHora, setTrabajosEnHora] = useState(0);

  const fetchData = async () => {
    try {
      const [tRes, wRes] = await Promise.all([
        trabajoService.getTrabajos(),
        walletService.getMiWallet(),
      ]);
      setTrabajos(tRes.data.data.trabajos);
      setSaldo(Number(wRes.data.data.saldo));
      setBloqueado(tRes.data.data.bloqueado);
      setSegundosLiberar(tRes.data.data.segundos_para_liberar);
      setTrabajosEnHora(tRes.data.data.trabajos_en_ultima_hora);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los trabajos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

// Temporizador para la cuenta regresiva del bloqueo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>; 
    
    if (bloqueado) {
      interval = setInterval(() => {
        setSegundosLiberar((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            fetchData(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [bloqueado]);

  const formatearTiempo = (segundos: number) => {
    const segsPositivos = Math.max(0, segundos); 
    const m = Math.floor(segsPositivos / 60);
    const s = segsPositivos % 60;
    return `${m}m ${s}s`;
  };
  
  const handleCompletar = async (trabajo: Trabajo) => {
    setWorking(trabajo.id_trabajo);
    try {
      const res = await trabajoService.completarTrabajo(trabajo.id_trabajo);
      const data = res.data.data;
      setSaldo(Number(data.saldo_nuevo));
      setResultado({ trabajo, data });
      
      // Actualizamos estado bloqueado y conteo inmediatamente desde la respuesta
      if (data.trabajos_restantes_en_hora <= 0) {
        fetchData(); // Volvemos a consultar para traer el tiempo exacto del backend
      }
    } catch (err: any) {
      // Alert fallback if backend denies it
      Alert.alert('Error', err.response?.data?.message || 'No se pudo completar el trabajo');
      if (err.response?.status === 400) fetchData(); // Sync frontend si el backend nos bloqueó
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

  // Pantalla de bloqueo si alcanzó el límite
  if (bloqueado) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Trabajos 💼</Text>
          <View style={styles.saldoBadge}>
            <Text style={styles.saldoText}>🪙 {Number(saldo).toFixed(0)}</Text>
          </View>
        </View>
        <View style={styles.bloqueoContainer}>
          <Text style={styles.bloqueoEmoji}>⏳</Text>
          <Text style={styles.bloqueoTitle}>¡Has trabajado mucho!</Text>
          <Text style={styles.bloqueoDesc}>
            Tu cerdito necesita descansar. Alcanzaste el límite de 2 trabajos por hora.
          </Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>
              Podrás trabajar de nuevo en: {formatearTiempo(segundosLiberar)}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  title: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  saldoBadge: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.yellow + '80' },
  saldoText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.yellowDark },
  subtitle: { fontSize: FontSizes.sm, color: Colors.textMuted, paddingHorizontal: Spacing.lg, marginTop: 4, marginBottom: Spacing.md },

  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

  card: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.yellowLight, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 18 },

  recompensaRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.md, flexWrap: 'wrap' },
  recompensaBadge: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  recompensaText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.yellowDark },
  xpBadge: { backgroundColor: '#EEF2FF' },
  xpText: { color: '#3730A3' },
  timeBadge: { backgroundColor: Colors.pinkLight },
  timeText: { color: Colors.pinkDark },

  btn: { backgroundColor: Colors.yellowMid, borderRadius: Radii.full, height: 44, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.white },

  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.sm },

  overlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modal: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.xl, width: '100%', alignItems: 'center', ...Shadows.lg },
  modalEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  modalSubtitle: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 4, marginBottom: Spacing.lg },
  modalStats: { flexDirection: 'row', width: '100%', marginBottom: Spacing.md },
  modalStat: { flex: 1, alignItems: 'center' },
  modalStatVal: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.pinkDark },
  modalStatLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 4 },
  modalDivider: { width: 1, backgroundColor: Colors.border },
  modalSaldo: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.lg },
  modalBtn: { backgroundColor: Colors.pinkMid, borderRadius: Radii.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, width: '100%', alignItems: 'center' },
  modalBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.white },

  bloqueoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  bloqueoEmoji: { fontSize: 64, marginBottom: Spacing.md },
  bloqueoTitle: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  bloqueoDesc: { fontSize: FontSizes.md, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  timerBadge: { backgroundColor: Colors.error + '15', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.error + '40' },
  timerText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.error },
});