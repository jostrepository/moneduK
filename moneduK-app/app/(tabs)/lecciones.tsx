import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { leccionService } from '../../services/api';
import { Colors, FontSizes, Spacing, Radii, Shadows } from '../../constants/theme';

interface Leccion {
  id_leccion: number; titulo: string; descripcion: string;
  categoria: string; recompensa_koin: number; recompensa_xp: number;
  completada: number; puntaje_quiz: number | null;
}

export default function LeccionesScreen() {
  const [lecciones, setLecciones] = useState<Leccion[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    leccionService.getLecciones()
      .then(r => setLecciones(r.data.data))
      .catch(() => Alert.alert('Error', 'No se pudieron cargar las lecciones'))
      .finally(() => setLoading(false));
  }, []);

  const completadas = lecciones.filter(l => l.completada).length;

  const renderLeccion = ({ item }: { item: Leccion }) => (
    <TouchableOpacity style={[styles.card, item.completada ? styles.cardDone : null]}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconCircle, item.completada ? styles.iconDone : null]}>
          <Text style={styles.iconEmoji}>{item.completada ? '✅' : '📖'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.categoryRow}>
          <Text style={styles.category}>{item.categoria}</Text>
          {item.completada && item.puntaje_quiz !== null && (
            <Text style={styles.puntaje}>{item.puntaje_quiz}%</Text>
          )}
        </View>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.descripcion} numberOfLines={2}>{item.descripcion}</Text>
        <View style={styles.recompensas}>
          <Text style={styles.recompensa}>🪙 {item.recompensa_koin} KoinK</Text>
          <Text style={styles.recompensa}>⭐ {item.recompensa_xp} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.title}>Lecciones 📚</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completadas}/{lecciones.length} completadas</Text>
        </View>
      </View>

      {/* Barra de progreso global */}
      <View style={styles.globalProgressBar}>
        <View style={[
          styles.globalProgressFill,
          { width: lecciones.length > 0 ? `${(completadas / lecciones.length) * 100}%` as any : '0%' }
        ]} />
      </View>

      <FlatList
        data={lecciones}
        keyExtractor={item => String(item.id_leccion)}
        renderItem={renderLeccion}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No hay lecciones disponibles aún</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title:  { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  progressBadge: {
    backgroundColor: Colors.pinkLight, borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border,
  },
  progressText:  { fontSize: FontSizes.xs, color: Colors.pinkDark, fontWeight: '700' },

  globalProgressBar: {
    marginHorizontal: Spacing.lg, height: 6,
    backgroundColor: Colors.border, borderRadius: Radii.full,
    marginBottom: Spacing.md, overflow: 'hidden',
  },
  globalProgressFill: { height: '100%', backgroundColor: Colors.pinkMid, borderRadius: Radii.full },

  list: { padding: Spacing.lg, gap: Spacing.sm },

  card: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: Radii.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardDone: { borderColor: Colors.excellent + '60', backgroundColor: '#F0FDF4' },

  cardLeft:   { justifyContent: 'flex-start', paddingTop: 2 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center',
  },
  iconDone:  { backgroundColor: '#DCFCE7' },
  iconEmoji: { fontSize: 20 },

  cardBody:    { flex: 1 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  category:    { fontSize: FontSizes.xs, color: Colors.pinkMid, fontWeight: '700', textTransform: 'uppercase' },
  puntaje:     { fontSize: FontSizes.xs, color: Colors.excellent, fontWeight: '700' },
  titulo:      { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  descripcion: { fontSize: FontSizes.sm, color: Colors.textMuted, lineHeight: 18, marginBottom: Spacing.sm },
  recompensas: { flexDirection: 'row', gap: Spacing.sm },
  recompensa:  { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600' },

  empty:      { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.sm },
});
