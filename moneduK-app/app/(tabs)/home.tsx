//Pantalla "Mi cerdito": vista dedicada y detallada de la mascota, con historial de cambios de salud, opción de renombrarla, y el componente CerditoPersonalidad (ML).

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, RefreshControl, TouchableOpacity,
  Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { mascotaService, tiendaService } from '../../services/api';
import { MascotaDisplay } from '../../components/mascota/MascotaDisplay';
import { Logo } from '../../components/ui/Logo';
import { Colors, Fonts, FontWeights, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { CerditoPersonalidad } from '../../components/mascota/CerditoPersonalidad';



    interface Mascota {
      id_mascota: number; nombre: string; salud: number;
      nivel: number; estado: string; experiencia: number;
  }
    interface HistorialItem {
      salud_anterior: number; salud_nueva: number;
      motivo: string; fecha: string;
  }

    export default function HomeScreen() {
      const [mascota, setMascota] = useState<Mascota | null>(null);
      const [historial, setHistorial] = useState<HistorialItem[]>([]);
      const [misCompras, setMisCompras] = useState<any[]>([]);
      const [refreshing, setRefreshing] = useState(false);
      const [renombrando, setRenombrando] = useState(false);
      const [nuevoNombre, setNuevoNombre] = useState('');
      const [guardando, setGuardando] = useState(false);

      const fetchData = useCallback(async () => {
        try {
          const [mRes, hRes, cRes] = await Promise.all([
            mascotaService.getMiMascota(),
            mascotaService.getHistorial(),
            tiendaService.getMisCompras(), 
          ]);
          setMascota(mRes.data.data);
          setHistorial(hRes.data.data.slice(0, 10));
          
          // FILTRO CLAVE: Guardamos solo los objetos cuyo valor 'equipado' sea verdadero (1 o true)
          const itemsEquipados = cRes.data.data.filter((item: any) => item.equipado === 1 || item.equipado === true);
          setMisCompras(itemsEquipados);
          
        } catch (error) {
          console.log("Error al cargar datos:", error);
        } finally { 
          setRefreshing(false); 
        }
      }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

      const onRefresh = () => { setRefreshing(true); fetchData(); };

      const handleRenombrar = async () => {
        if (!nuevoNombre.trim()) {
          Alert.alert('Error', 'El nombre no puede estar vacío'); return;
        }
        setGuardando(true);
        try {
          await mascotaService.renombrar(nuevoNombre.trim());
          setRenombrando(false);
          await fetchData();
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'No se pudo cambiar el nombre');
        } finally {
          setGuardando(false);
        }
    };

      const xpParaSiguienteNivel = mascota ? mascota.nivel * 100 : 100;
      const xpActual = mascota ? mascota.experiencia % xpParaSiguienteNivel : 0;
      const xpPct = Math.min(100, (xpActual / xpParaSiguienteNivel) * 100);

      const formatFecha = (fecha: string) => {
        const d = new Date(fecha);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
   };

      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pinkMid} />
            }
          >

        {/* Header */}

            <View style={styles.header}>
              <Text style={styles.title}>Mi cerdito 🐷</Text>
              <Logo size="sm" />
            </View>

        {/* Mascota principal */}

            <View style={styles.mascotaCard}>
              <View style={styles.mascotaDeco1} />
              <View style={styles.mascotaDeco2} />

            {mascota ? (
              <>
              <MascotaDisplay
              nombre={mascota.nombre}
              salud={mascota.salud}
              nivel={mascota.nivel}
              estado={mascota.estado}
              size="lg"
              showBirrete
              showStats
              // Esta propiedad es la que dibujará los emojis sobre el cerdito
              articulosEquipados={misCompras}
            />
                <TouchableOpacity
                  style={styles.renombrarBtn}
                  onPress={() => { setNuevoNombre(mascota.nombre); setRenombrando(true); }}
                >
                  <Text style={styles.renombrarText}>✏️ Cambiar nombre</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.loadingWrap}>
                <Text style={styles.loadingEmoji}>🐷</Text>
                <Text style={styles.loadingText}>Cargando tu mascota...</Text>
              </View>
            )}
          </View>
            <CerditoPersonalidad />

        {/* Barra de XP */}

            {mascota && (
              <View style={styles.xpCard}>
                <View style={styles.xpHeader}>
                  <Text style={styles.xpLabel}>⭐ Experiencia — Nivel {mascota.nivel}</Text>
                  <Text style={styles.xpValue}>{xpActual}/{xpParaSiguienteNivel} XP</Text>
                </View>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: `${xpPct}%` as any }]} />
                </View>
                <Text style={styles.xpSub}>
                  {Math.round(xpParaSiguienteNivel - xpActual)} XP para el siguiente nivel
                </Text>
              </View>
            )}

        {/* Consejo según estado */}

            {mascota && (
              <View style={[
                styles.consejoCard,
                mascota.salud <= 20 ? styles.consejoCritico :
                mascota.salud <= 50 ? styles.consejoMalo : styles.consejoBueno,
              ]}>
                <Text style={styles.consejoEmoji}>
                  {mascota.salud <= 20 ? '🚨' : mascota.salud <= 50 ? '⚠️' : '💚'}
                </Text>
                <View style={styles.consejoContent}>
                  <Text style={styles.consejoTitle}>
                    {mascota.salud <= 20 ? '¡Tu cerdito necesita ayuda urgente!'
                      : mascota.salud <= 50 ? 'Tu cerdito no está bien'
                      : '¡Tu cerdito está feliz!'}
                  </Text>
                  <Text style={styles.consejoText}>
                    {mascota.salud <= 20
                      ? 'Completa lecciones y evita las apuestas para recuperar su salud.'
                      : mascota.salud <= 50
                      ? 'Haz trabajos y completa misiones para mejorar su estado.'
                      : 'Sigue tomando buenas decisiones financieras para mantenerlo así.'}
                  </Text>
                </View>
              </View>
        )}

        {/* Historial de salud */}

            {historial.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Historial reciente</Text>
                <View style={styles.historialCard}>
                  {historial.map((h, i) => {
                    const subio = h.salud_nueva > h.salud_anterior;
                    const delta = h.salud_nueva - h.salud_anterior;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.historialItem,
                          i < historial.length - 1 && styles.historialBorder,
                        ]}
                      >
                        <View style={[
                          styles.historialDot,
                          { backgroundColor: subio ? Colors.excellent : Colors.critical },
                        ]} />
                        <View style={styles.historialInfo}>
                          <Text style={styles.historialMotivo} numberOfLines={1}>
                            {h.motivo || 'Sin descripción'}
                          </Text>
                          <Text style={styles.historialFecha}>{formatFecha(h.fecha)}</Text>
                        </View>
                        <Text style={[
                          styles.historialDelta,
                          { color: subio ? Colors.excellent : Colors.critical },
                        ]}>
                          {subio ? '+' : ''}{delta}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

          </ScrollView>

      {/* Modal renombrar */}

          <Modal visible={renombrando} transparent animationType="slide">
            <View style={styles.overlay}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Renombrar mascota 🐷</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nuevoNombre}
                  onChangeText={setNuevoNombre}
                  placeholder="Nombre de tu cerdito"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={30}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setRenombrando(false)}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.guardarBtn, guardando && styles.guardarBtnDisabled]}
                    onPress={handleRenombrar}
                    disabled={guardando}
                  >
                    {guardando
                      ? <ActivityIndicator color={Colors.white} size="small" />
                      : <Text style={styles.guardarText}>Guardar</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      );
    }



    const styles = StyleSheet.create({
      
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontFamily: Fonts.black, fontSize: Typography.xl, color: Colors.textPrimary, letterSpacing: -0.3 },

  mascotaCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    overflow: 'hidden',
    alignItems: 'center',
    ...Shadows.lg,
  },
  mascotaDeco1: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: Colors.pink + '12' },
  mascotaDeco2: { position: 'absolute', bottom: -40, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.yellow + '18' },

  renombrarBtn: {
    backgroundColor: Colors.pinkLight,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    marginTop: Spacing.sm,
  },
  renombrarText: { fontFamily: Fonts.bold, fontSize: Typography.sm, color: Colors.pinkMid },

  loadingWrap: { alignItems: 'center', padding: Spacing.xl },
  loadingEmoji: { fontSize: 56 },
  loadingText: { fontFamily: Fonts.semiBold, fontSize: Typography.sm, color: Colors.textMuted, marginTop: Spacing.sm },

  xpCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontFamily: Fonts.bold,  fontSize: Typography.sm, color: Colors.textPrimary },
  xpValue: { fontFamily: Fonts.black, fontSize: Typography.sm, color: Colors.yellowDark },
  xpBarBg: { height: 12, backgroundColor: Colors.border, borderRadius: Radii.full, overflow: 'hidden', marginBottom: 6 },
  xpBarFill: { height: '100%', backgroundColor: Colors.yellow, borderRadius: Radii.full },
  xpSub: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textMuted },

  consejoCard: { flexDirection: 'row', gap: Spacing.sm, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1.5, alignItems: 'flex-start' },
  consejoBueno: { backgroundColor: '#F0FDF4', borderColor: Colors.excellent + '60' },
  consejoMalo: { backgroundColor: '#FFFBEB', borderColor: Colors.yellow + '80' },
  consejoCritico: { backgroundColor: '#FFF1F2', borderColor: Colors.critical + '60' },
  consejoEmoji: { fontSize: 24 },
  consejoContent: { flex: 1 },
  consejoTitle: { fontFamily: Fonts.black,    fontSize: Typography.sm, color: Colors.textPrimary, marginBottom: 4 },
  consejoText: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },

  sectionTitle: { fontFamily: Fonts.black, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: Spacing.sm },
  historialCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm },
  historialItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  historialBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historialDot: { width: 10, height: 10, borderRadius: 5 },
  historialInfo: { flex: 1 },
  historialMotivo: { fontFamily: Fonts.semiBold, fontSize: Typography.sm, color: Colors.textPrimary },
  historialFecha: { fontFamily: Fonts.regular,  fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  historialDelta: { fontFamily: Fonts.black,    fontSize: Typography.md },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle: { fontFamily: Fonts.black, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: Spacing.lg, textAlign: 'center' },
  modalInput: {
    backgroundColor: Colors.pinkLight,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    height: 52,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.bold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalButtons: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: { flex: 1, height: 52, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
  cancelText:{ fontFamily: Fonts.bold, fontSize: Typography.md, color: Colors.textMuted },
  guardarBtn: { flex: 1, height: 52, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.pinkMid },
  guardarBtnDisabled:{ opacity: 0.6 },
  guardarText: { fontFamily: Fonts.bold, fontSize: Typography.md, color: Colors.white },

});
