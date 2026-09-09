//Lista de retos o misiones con progreso, tipos (ahorro, trabajo, inversión, etc.) y recompensas en KoinK/XP/salud.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { misionService } from '../../services/api';
import { Colors, FontSizes, Spacing, Radii, Shadows } from '../../constants/theme';

    interface Mision {
          id_mision: number;
          titulo: string;
          descripcion: string;
          tipo: string;
          meta_cantidad: number | null;
          recompensa_koin: number;
          recompensa_xp: number;
          recompensa_salud: number;
          progreso: number;
          completada: number;
          fecha_asignacion: string | null;
    }

    const TIPO_ICON: Record<string, string> = {
          ahorro: '💰',
          trabajo: '💼',
          inversion: '📈',
          leccion: '📚',
          gasto: '🛍️',
          gasto_cero: '🚫',
          general: '🏆',
    };

        export default function MisionesScreen() {
      const [misiones, setMisiones] = useState<Mision[]>([]);
      const [loading, setLoading] = useState(true);
      const [iniciando, setIniciando] = useState<number | null>(null);

      const fetchMisiones = async () => {
        try {
          const res = await misionService.getMisiones();
          setMisiones(res.data.data);
        } catch {
          Alert.alert('Error', 'No se pudieron cargar las misiones');
        } finally {
          setLoading(false);
        }
    };

      useEffect(() => { fetchMisiones(); }, []);

      const handleIniciar = async (id: number) => {
        setIniciando(id);
        try {
          await misionService.iniciarMision(id);
          await fetchMisiones();
        } catch (err: any) {
          Alert.alert('Ups', err.response?.data?.message || 'Error al iniciar misión');
        } finally {
          setIniciando(null);
        }
    };

      const completadas = misiones.filter(m => m.completada).length;
      const enProgreso = misiones.filter(m => m.fecha_asignacion && !m.completada).length;
      const disponibles = misiones.filter(m => !m.fecha_asignacion && !m.completada).length;

      const renderMision = ({ item }: { item: Mision }) => {
        const porcentaje = item.meta_cantidad
          ? Math.min(100, Math.round((item.progreso / item.meta_cantidad) * 100))
          : item.fecha_asignacion ? 50 : 0;

        const iniciada = !!item.fecha_asignacion;

        return (
          <View style={[
            styles.card,
            item.completada ? styles.cardDone : iniciada ? styles.cardActive : null,
          ]}>

        {/* Ícono + título */}

            <View style={styles.cardHeader}>
              <View style={[
                styles.iconCircle,
                item.completada ? styles.iconDone : iniciada ? styles.iconActive : null,
              ]}>
                <Text style={styles.iconEmoji}>
                  {item.completada ? '✅' : TIPO_ICON[item.tipo] || '🎯'}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
              </View>
            </View>

        {/* Barra de progreso */}

            {iniciada && item.meta_cantidad && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { width: `${porcentaje}%` as any },
                    item.completada ? styles.progressDone : null,
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {Number(item.progreso).toFixed(0)}/{item.meta_cantidad} ({porcentaje}%)
                </Text>
              </View>
            )}

        {/* Recompensas */}

            <View style={styles.recompensaRow}>
              <Text style={styles.recompensa}>🪙 {item.recompensa_koin} KoinK</Text>
              <Text style={styles.recompensa}>⭐ {item.recompensa_xp} XP</Text>
              <Text style={styles.recompensa}>💖 +{item.recompensa_salud} salud</Text>
            </View>

        {/* Botón */}

            {!item.completada && !iniciada && (
              <TouchableOpacity
                style={[styles.btn, iniciando === item.id_mision && styles.btnDisabled]}
                onPress={() => handleIniciar(item.id_mision)}
                disabled={iniciando !== null}
              >
                {iniciando === item.id_mision
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.btnText}>Iniciar misión 🎯</Text>
                }
              </TouchableOpacity>
            )}

            {item.completada && (
              <View style={styles.completadaBadge}>
                <Text style={styles.completadaText}>¡Misión completada! 🏆</Text>
              </View>
            )}

            {iniciada && !item.completada && (
              <View style={styles.enProgresoBadge}>
                <Text style={styles.enProgresoText}>En progreso...</Text>
              </View>
            )}
          </View>
        );
  } ;

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
            <Text style={styles.title}>Misiones 🎯</Text>
          </View>

      {/* Stats rápidos */}

          <View style={styles.statsRow}>
            {[
              { label: 'Completadas', value: completadas,  color: Colors.excellent },
              { label: 'En progreso', value: enProgreso,   color: Colors.yellow },
              { label: 'Disponibles', value: disponibles,  color: Colors.pinkMid },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <FlatList
            data={misiones}
            keyExtractor={item => String(item.id_mision)}
            renderItem={renderMision}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>No hay misiones disponibles</Text>
              </View>
            }
          />
        </SafeAreaView>
      );
  }


   
const styles = StyleSheet.create({
  
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statVal: { fontSize: FontSizes.xl, fontWeight: '900' },
  statLabel:{ fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },

  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

  card: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardDone: { borderColor: Colors.excellent + '60', backgroundColor: '#F0FDF4' },
  cardActive: { borderColor: Colors.yellow + '80', backgroundColor: Colors.yellowLight },

  cardHeader: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  iconDone: { backgroundColor: '#DCFCE7' },
  iconActive: { backgroundColor: Colors.yellowLight },
  iconEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 18 },

  progressSection: { marginBottom: Spacing.sm },
  progressBar: { height: 8, backgroundColor: Colors.border, borderRadius: Radii.full, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: Colors.yellow, borderRadius: Radii.full },
  progressDone: { backgroundColor: Colors.excellent },
  progressText: { fontSize: FontSizes.xs, color: Colors.textMuted, fontWeight: '600' },

  recompensaRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  recompensa: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600' },

  btn: { backgroundColor: Colors.pinkMid, borderRadius: Radii.full, height: 44, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.white },

  completadaBadge: { backgroundColor: '#DCFCE7', borderRadius: Radii.full, padding: Spacing.sm, alignItems: 'center' },
  completadaText: { fontSize: FontSizes.sm, fontWeight: '700', color: '#065F46' },
  enProgresoBadge: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, padding: Spacing.sm, alignItems: 'center' },
  enProgresoText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.yellowDark },

  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.sm },

});
