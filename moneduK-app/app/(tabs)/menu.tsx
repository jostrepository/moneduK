import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, RefreshControl, Animated, FlatList, Image
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { mascotaService, walletService } from '../../services/api';
import { MascotaDisplay } from '../../components/mascota/MascotaDisplay';
import { Logo } from '../../components/ui/Logo';
import { Colors, Fonts, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { estudiantesRegistrados } from '../../data/estudiantesStore';

interface Mascota {
  nombre: string; salud: number; nivel: number;
  estado: string; experiencia: number;
}
interface Wallet { saldo: number; total_ganado: number; total_gastado: number; }

const MODULOS = [
  { icon: '💡', title: 'Minijuegos', desc: 'Diviertéte mientras ganas KoinK', color: Colors.lecciones, bg: '#EFF6FF', route: '/(tabs)/lecciones' },
  { icon: '💼', title: 'Trabajos', desc: 'Gana con esfuerzo', color: Colors.trabajos, bg: '#FFFBEB', route: '/(tabs)/trabajos'  },
  { icon: '📈', title: 'Inversiones', desc: 'Haz crecer tu dinero', color: Colors.inversiones, bg: '#EEF2FF', route: '/(tabs)/inversiones' },
  { icon: '🏪', title: 'Tienda', desc: 'Accesorios para tu cerdi', color: Colors.tienda, bg: '#F0FDF4', route: '/(tabs)/tienda'   },
  { icon: '🎯', title: 'Misiones', desc: 'Completa retos', color: Colors.misiones, bg: '#FAF5FF', route: '/(tabs)/misiones' },
  { icon: '🎰', title: 'Apuestas', desc: 'Aprende por qué es malo', color: Colors.apuestas, bg: '#FFF1F2', route: '/(tabs)/apuestas' },
];

export default function MenuScreen() {
  const router      = useRouter();
  const { usuario } = useAuth();
  const [mascota,    setMascota]    = useState<Mascota | null>(null);
  const [wallet,     setWallet]     = useState<Wallet | null>(null);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const [tieneEstudiantes, setTieneEstudiantes] = useState(false);

 // Dentro de tu componente MenuScreen:
  useFocusEffect(
    useCallback(() => {
      // Carga instantánea de los estudiantes registrados en memoria
      setEstudiantes([...estudiantesRegistrados]);
    }, [])
  );

  // Lista de ejemplo para tu presentación
  const estudiantesEjemplo = [
    { id: 1, nombre: 'Valentina Rico', correo: 'valen@gmail.com', monedas: 1250 },
    { id: 2, nombre: 'Johan Steven', correo: 'johan@correo.com', monedas: 840 },
  ];
  const fetchData = useCallback(async () => {
    try {
      if (usuario?.id_rol === 1) {
        // ... (código actual del estudiante) ...
      } else if (Number(usuario?.id_rol) === 2 || (usuario as any)?.rol?.toLowerCase() === 'tutor') {
        // Si es Tutor, cargamos la wallet y LOS ESTUDIANTES REALES
        const wRes = await walletService.getMiWallet();
        setWallet(wRes.data.data);
        
        // 2. AQUÍ CONECTAS TU BACKEND REAL
        // Descomenta y ajusta esta línea con tu servicio real cuando lo tengas listo
        // const estRes = await tutorService.getMisEstudiantes();
        // setEstudiantes(estRes.data.data);
      }
    } catch (error) {
      console.log("Error al cargar datos:", error);
    } finally { 
      setRefreshing(false); 
    }
  }, [usuario]);

  useEffect(() => { 
    if (usuario) fetchData(); 
  }, [fetchData, usuario]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? '¡Buenos días' : hora < 18 ? '¡Buenas tardes' : '¡Buenas noches';

// ------------------------------------------------------------------
  // VISTA EXCLUSIVA DEL TUTOR
  // ------------------------------------------------------------------
  if (Number(usuario?.id_rol) === 2 || (usuario as any)?.rol?.toLowerCase() === 'tutor') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.pinkLight || '#FFD6E0' }]}>
        
        {/* Encabezado: Logo y Tipografía pequeña de la app */}
        <View style={styles.tutorHeader}>
          <Logo size="sm" /> 
        </View>

        {/* Logo grande central en pantalla */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logocerditomoneduk.png')} 
            style={styles.bigLogo}
            resizeMode="contain"
          />
        </View>

        {/* Subtítulo y Lista */}
        <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
          <Text style={styles.tutorSubtitle}>Estudiantes registrados</Text>
          
          <FlatList
            data={estudiantes} 
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Registra estudiantes para que aparezcan aquí</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.nombre}</Text>
                  <Text style={styles.studentStats}>
                    🐾 {item.mascota || 'Sin mascota'} (Nvl {item.nivel || 1}) | 💖 {item.salud || 100}%
                  </Text>
                </View>
                <View style={styles.studentCoins}>
                  <Text style={styles.coinIcon}>🪙</Text>
                  <Text style={styles.coinValue}>{item.koink || 0}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(tabs)/registrar')}>
            <Text style={styles.registerBtnText}>Registrar estudiantes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ------------------------------------------------------------------
  // VISTA DEL ESTUDIANTE
  // ------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pinkMid} />
        }
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerText}>
            <Text style={styles.saludo}>{saludo}, {usuario?.nombre}! 👋</Text>
            <Text style={styles.saludoSub}>¿Qué haremos hoy?</Text>
          </View>
          <Logo size="sm" />
        </Animated.View>

        <Animated.View style={[styles.mascotaWidget, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.mascotaWidgetDeco1} />
          <View style={styles.mascotaWidgetDeco2} />

          <View style={styles.mascotaWidgetHeader}>
            <Text style={styles.mascotaWidgetLabel}>Mi cerdito 🐷</Text>
            <TouchableOpacity style={styles.verMasBtn} onPress={() => router.push('/(tabs)/home')}>
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
              <Text style={styles.loadingEmoji}>🐷</Text>
              <Text style={styles.loadingText}>Cargando tu cerdito...</Text>
            </View>
          )}
        </Animated.View>

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
                <Text style={[styles.walletStatVal, { color: Colors.pink }]}>
                  -{Number(wallet.total_gastado).toFixed(0)}
                </Text>
                <Text style={styles.walletStatLabel}>Gastado</Text>
              </View>
            </View>
          </Animated.View>
        )}

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

  // --- Estilos originales del Estudiante ---
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerText: { flex: 1, marginRight: Spacing.sm },
  saludo: { fontFamily: Fonts.black, fontSize: Typography.md, color: Colors.textPrimary, letterSpacing: -0.2 },
  saludoSub: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  mascotaWidget: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.borderMid, overflow: 'hidden', ...Shadows.lg },
  mascotaWidgetDeco1: { position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: Colors.pink + '15' },
  mascotaWidgetDeco2: { position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.yellow + '20' },
  mascotaWidgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  mascotaWidgetLabel: { fontFamily: Fonts.black, fontSize: Typography.md, color: Colors.pinkDeep },
  verMasBtn: { backgroundColor: Colors.pinkLight, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.borderMid },
  verMasText: { fontFamily: Fonts.bold, fontSize: Typography.xs, color: Colors.pinkMid },
  mascotaLoading:{ alignItems: 'center', padding: Spacing.xl },
  loadingEmoji: { fontSize: 48 },
  loadingText: { fontFamily: Fonts.semiBold, fontSize: Typography.sm, color: Colors.textMuted, marginTop: Spacing.sm },
  walletWidget: { flexDirection: 'row', backgroundColor: Colors.pinkDeep, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.lg, alignItems: 'center', ...Shadows.md },
  walletLeft: { flex: 1 },
  walletLabel: { fontFamily: Fonts.bold,  fontSize: Typography.xs, color: Colors.pink + 'CC', marginBottom: 4 },
  walletAmount: { fontFamily: Fonts.black, fontSize: Typography.xxl, color: Colors.white, letterSpacing: -1 },
  walletDivider: { width: 1, height: 40, backgroundColor: Colors.pink + '40', marginHorizontal: Spacing.md },
  walletRight: { flexDirection: 'row', gap: Spacing.lg },
  walletStat: { alignItems: 'center' },
  walletStatVal: { fontFamily: Fonts.black,    fontSize: Typography.md, color: Colors.yellowLight },
  walletStatLabel: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.pink + 'AA', marginTop: 2 },
  sectionTitle: { fontFamily: Fonts.black, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: Spacing.sm, letterSpacing: -0.3 },
  modulosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.lg },
  moduloWidget: { borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1.5, overflow: 'hidden', ...Shadows.sm },
  moduloAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: Radii.lg, borderBottomLeftRadius: Radii.lg },
  moduloIcon: { fontSize: 28, marginBottom: 6, marginLeft: 4 },
  moduloTitle: { fontFamily: Fonts.black,    fontSize: Typography.md, marginBottom: 3, marginLeft: 4 },
  moduloDesc: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textMuted, lineHeight: 16, marginLeft: 4, marginBottom: Spacing.sm },
  moduloArrow: { alignSelf: 'flex-end', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moduloArrowText: { fontFamily: Fonts.black, fontSize: 14 },
  tipWidget: { backgroundColor: Colors.yellowLight, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.yellow + '60' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipIcon: { fontSize: 18 },
  tipTitle: { fontFamily: Fonts.black,    fontSize: Typography.sm, color: Colors.yellowDark },
  tipText: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.yellowDark, lineHeight: 18 },
  bigLogo: { width: 160, height: 160, borderRadius: 80 }, 
  tutorSubtitle: { fontFamily: Fonts.black, fontSize: Typography.lg, color: Colors.pinkDeep, marginBottom: Spacing.md, textAlign: 'center' },

  // --- Estilos exclusivos del Tutor ---
  tutorHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, alignItems: 'flex-start' },
  logotipoBadge: { backgroundColor: Colors.yellow || '#FFD166', paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radii.sm },
  logotipoText: { fontWeight: '900', color: Colors.textPrimary || '#000', fontSize: Typography.md },
  logoContainer: { alignItems: 'center', marginVertical: Spacing.xl },
  circleLogo: { width: 140, height: 140, borderRadius: 70, backgroundColor: Colors.white, borderWidth: 4, borderColor: Colors.pinkDark || '#E63946', alignItems: 'center', justifyContent: 'center', ...Shadows.md },
  logoEmoji: { fontSize: 70 },
  listContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  studentCard: { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, marginBottom: Spacing.md, borderRadius: Radii.full, ...Shadows.sm },
  studentInfo: { flex: 1 },
  studentName: { fontSize: Typography.md, fontWeight: '800', color: Colors.textPrimary || '#000' },
  studentEmail: { fontFamily: Fonts.regular, fontSize: Typography.sm, color: Colors.textMuted },
  studentStats: { fontSize: Typography.sm, color: Colors.textMuted || '#666', marginTop: 2 },
  studentCoins: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  coinIcon: { fontSize: 20 },
  coinValue: { fontSize: Typography.md, fontWeight: '900', color: Colors.textPrimary || '#000' },
  emptyText: { textAlign: 'center', color: Colors.textMuted || '#666', marginTop: Spacing.xl },
  footer: { padding: Spacing.lg, alignItems: 'center', paddingBottom: Spacing.xl },
  registerBtn: { backgroundColor: Colors.success || '#06D6A0', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: Radii.full, ...Shadows.md },
  registerBtnText: { fontFamily: Fonts.black, color: Colors.white, fontSize: Typography.md },
});