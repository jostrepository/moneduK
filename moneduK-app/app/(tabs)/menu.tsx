import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, RefreshControl,
  Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { mascotaService, walletService } from '../../services/api';
import { MascotaDisplay } from '../../components/mascota/MascotaDisplay';
import { Logo } from '../../components/ui/Logo';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface Mascota {
  nombre: string; salud: number; nivel: number;
  estado: string; experiencia: number;
}
interface Wallet { saldo: number; total_ganado: number; total_gastado: number; }

const MODULOS = [
  { icon: '📚', title: 'Lecciones',   desc: 'Aprende y gana KoinK',   color: Colors.lecciones,   bg: '#EFF6FF', route: '/(tabs)/lecciones' },
  { icon: '💼', title: 'Trabajos',    desc: 'Gana con esfuerzo',       color: Colors.trabajos,    bg: '#FFFBEB', route: '/(tabs)/trabajos' },
  { icon: '📈', title: 'Inversiones', desc: 'Haz crecer tu dinero',    color: Colors.inversiones, bg: '#EEF2FF', route: '/(tabs)/inversiones' },
  { icon: '🏪', title: 'Tienda',      desc: 'Accesorios para tu cerdi',color: Colors.tienda,      bg: '#F0FDF4', route: '/(tabs)/tienda' },
  { icon: '🎯', title: 'Misiones',    desc: 'Completa retos',          color: Colors.misiones,    bg: '#FAF5FF', route: '/(tabs)/misiones' },
  { icon: '🎰', title: 'Apuestas',    desc: 'Aprende por qué es malo', color: Colors.apuestas,    bg: '#FFF1F2', route: '/(tabs)/apuestas' },
];

export default function MenuScreen() {
  const router    = useRouter();
  const { usuario } = useAuth();
  const [mascota,    setMascota]    = useState<Mascota | null>(null);
  const [wallet,     setWallet]     = useState<Wallet | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animaciones de entrada
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [mRes, wRes] = await Promise.all([
        mascotaService.getMiMascota(),
        walletService.getMiWallet(),
      ]);
      setMascota(mRes.data.data);
      setWallet(wRes.data.data);
    } catch {}
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const hora = new Date().getHours();
  const saludo = hora < 12 ? '¡Buenos días' : hora < 18 ? '¡Buenas tardes' : '¡Buenas noches';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pinkMid} />
        }
      >
        {/* ── Header con logo ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.saludo}>{saludo}, {usuario?.nombre}! 👋</Text>
            <Text style={styles.saludoSub}>¿Qué haremos hoy?</Text>
          </View>
          <Logo size="sm" />
        </Animated.View>

        {/* ── Widget principal — Mascota ── */}
        <Animated.View style={[styles.mascotaWidget, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Decoración de fondo */}
          <View style={styles.mascotaWidgetDeco1} />
          <View style={styles.mascotaWidgetDeco2} />

          <View style={styles.mascotaWidgetHeader}>
            <Text style={styles.mascotaWidgetLabel}>Mi cerdito 🐷</Text>
            <TouchableOpacity
              style={styles.verMasBtn}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.verMasText}>Ver detalle →</Text>
            </TouchableOpacity>
          </View>

          {mascota ? (
            <MascotaDisplay
              nombre={mascota.nombre}
              salud={mascota.salud}
              nivel={mascota.nivel}
              estado={mascota.estado}
              size="md"
              showBirrete
              showStats
            />
          ) : (
            <View style={styles.mascotaLoading}>
              <Text style={{ fontSize: 48 }}>🐷</Text>
              <Text style={styles.loadingText}>Cargando tu cerdito...</Text>
            </View>
          )}
        </Animated.View>

        {/* ── Widget de wallet ── */}
        {wallet && (
          <Animated.View style={[styles.walletWidget, { opacity: fadeAnim }]}>
            <View style={styles.walletLeft}>
              <Text style={styles.walletLabel}>Mis KoinK</Text>
              <Text style={styles.walletAmount}>🪙 {Number(wallet.saldo).toFixed(0)}</Text>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletRight}>
              <View style={styles.walletStat}>
                <Text style={styles.walletStatVal}>+{Number(wallet.total_ganado).toFixed(0)}</Text>
                <Text style={styles.walletStatLabel}>Ganado</Text>
              </View>
              <View style={styles.walletStat}>
                <Text style={[styles.walletStatVal, { color: Colors.pinkMid }]}>
                  -{Number(wallet.total_gastado).toFixed(0)}
                </Text>
                <Text style={styles.walletStatLabel}>Gastado</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Widgets de módulos ── */}
        <Text style={styles.sectionTitle}>¿Qué quieres hacer? 🎮</Text>
        <View style={styles.modulosGrid}>
          {MODULOS.map((mod, i) => (
            <Animated.View
              key={i}
              style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, (i + 1) * 5],
                  }),
                }],
                width: '47%',
              }}
            >
              <TouchableOpacity
                style={[styles.moduloWidget, { backgroundColor: mod.bg, borderColor: mod.color + '40' }]}
                onPress={() => router.push(mod.route as any)}
                activeOpacity={0.75}
              >
                {/* Acento de color lateral */}
                <View style={[styles.moduloAccent, { backgroundColor: mod.color }]} />

                <Text style={styles.moduloIcon}>{mod.icon}</Text>
                <Text style={[styles.moduloTitle, { color: mod.color }]}>{mod.title}</Text>
                <Text style={styles.moduloDesc}>{mod.desc}</Text>

                <View style={[styles.moduloArrow, { backgroundColor: mod.color + '20' }]}>
                  <Text style={[styles.moduloArrowText, { color: mod.color }]}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* ── Tip del día ── */}
        <View style={styles.tipWidget}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipTitle}>Consejo del día</Text>
          </View>
          <Text style={styles.tipText}>
            Ahorrar el 20% de lo que ganas es un hábito que los expertos financieros recomiendan.
            ¡Pruébalo con tus KoinK!
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  saludo:    { fontSize: Typography.lg, fontWeight: Typography.black, color: Colors.textPrimary, letterSpacing: -0.3 },
  saludoSub: { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },

  // Widget mascota
  mascotaWidget: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  mascotaWidgetDeco1: {
    position: 'absolute', top: -40, right: -40,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: Colors.pink + '15',
  },
  mascotaWidgetDeco2: {
    position: 'absolute', bottom: -30, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.yellow + '20',
  },
  mascotaWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mascotaWidgetLabel: { fontSize: Typography.md, fontWeight: Typography.black, color: Colors.pinkDeep },
  verMasBtn: {
    backgroundColor: Colors.pinkLight,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.borderMid,
  },
  verMasText:    { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.pinkMid },
  mascotaLoading:{ alignItems: 'center', padding: Spacing.xl },
  loadingText:   { fontSize: Typography.sm, color: Colors.textMuted, marginTop: Spacing.sm },

  // Widget wallet
  walletWidget: {
    flexDirection: 'row',
    backgroundColor: Colors.pinkDeep,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  walletLeft:     { flex: 1 },
  walletLabel:    { fontSize: Typography.xs, color: Colors.pink + 'CC', fontWeight: Typography.bold, marginBottom: 4 },
  walletAmount:   { fontSize: Typography.xxl, fontWeight: Typography.black, color: Colors.white, letterSpacing: -1 },
  walletDivider:  { width: 1, height: 40, backgroundColor: Colors.pink + '40', marginHorizontal: Spacing.md },
  walletRight:    { flexDirection: 'row', gap: Spacing.lg },
  walletStat:     { alignItems: 'center' },
  walletStatVal:  { fontSize: Typography.md, fontWeight: Typography.black, color: Colors.yellowLight },
  walletStatLabel:{ fontSize: Typography.xs, color: Colors.pink + 'AA', marginTop: 2 },

  // Módulos
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.black, color: Colors.textPrimary, marginBottom: Spacing.sm, letterSpacing: -0.3 },
  modulosGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.lg },

  moduloWidget: {
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  moduloAccent:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: Radii.lg, borderBottomLeftRadius: Radii.lg },
  moduloIcon:      { fontSize: 28, marginBottom: 6, marginLeft: 4 },
  moduloTitle:     { fontSize: Typography.md, fontWeight: Typography.black, marginBottom: 3, marginLeft: 4 },
  moduloDesc:      { fontSize: Typography.xs, color: Colors.textMuted, lineHeight: 16, marginLeft: 4, marginBottom: Spacing.sm },
  moduloArrow:     { alignSelf: 'flex-end', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moduloArrowText: { fontSize: 14, fontWeight: Typography.black },

  // Tip
  tipWidget: {
    backgroundColor: Colors.yellowLight,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.yellow + '60',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipIcon:   { fontSize: 18 },
  tipTitle:  { fontSize: Typography.sm, fontWeight: Typography.black, color: Colors.yellowDark },
  tipText:   { fontSize: Typography.xs, color: Colors.yellowDark, lineHeight: 18 },
});
