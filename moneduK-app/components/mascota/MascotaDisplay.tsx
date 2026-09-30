// Modificamos el componente base añadiendo el soporte para artículos equipados dinámicamente,
// reemplazando el birrete estático por la lectura en tiempo real del inventario del usuario.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Fonts, Typography, Spacing, Radii } from '../../constants/theme';

interface MascotaProps {
  nombre: string;
  salud: number;
  nivel: number;
  estado: string;
  size?: 'sm' | 'md' | 'lg';
  showBirrete?: boolean;
  showStats?: boolean;
  articulosEquipados?: any[];
}


// Mantenemos las paletas y tamaños intactos para preservar la consistencia de la interfaz,
// delegando únicamente la personalización de los accesorios sobre el renderizado base.

const CERDO_EMOJI: Record<string, string> = {
  'Excelente': '🐷',
  'Bien': '🐷',
  'Regular': '🐽',
  'Malo': '🤒',
  'Crítico': '😰',
};

const HEALTH_COLOR = (salud: number) => {
  if (salud > 80) return Colors.excellent;
  if (salud > 60) return Colors.good;
  if (salud > 40) return Colors.regular;
  if (salud > 20) return Colors.bad;
  return Colors.critical;
};

const SIZES = { sm: 72, md: 110, lg: 150 };

export const MascotaDisplay = ({
  nombre, salud, nivel, estado,
  size = 'md', showBirrete = true, showStats = true,
  articulosEquipados = [],
}: MascotaProps) => {


  // Conservamos los nodos animados en el hilo nativo para proteger los fotogramas por segundo,
  // asegurando que las colisiones de renderizado de React no afecten la fluidez del personaje.

  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cabezaAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 900, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.spring(cabezaAnim, {
      toValue: 1, tension: 60, friction: 7, useNativeDriver: true,
    }).start();
  }, [articulosEquipados, showBirrete]);

  useEffect(() => {
    if (salud <= 20) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1,  duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [salud]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);


  // Procesamos el catálogo activo buscando coincidencias exactas por categoría visual,
  // definiendo el birrete tradicional como valor de repliegue si la opción está habilitada.

  const cerditoSize  = SIZES[size];
  const emoji        = CERDO_EMOJI[estado] || '🐷';
  const healthColor  = HEALTH_COLOR(salud);
  const accesorioSize = cerditoSize * 0.55;

  const accesorioCabeza = articulosEquipados.find(a => a.categoria === 'Cabeza')?.imagen_url || (showBirrete ? '🎓' : null);

  // Ampliamos la búsqueda para incluir posibles nombres de categoría de la base de datos

  const accesorioMano = articulosEquipados.find(a => 
    a.categoria === 'Mano' || a.categoria === 'Bebida' || a.categoria === 'Consumible' || a.categoria === 'Accesorio'
  )?.imagen_url;

  console.log('\n--- DATOS QUE LLEGAN AL CERDITO ---');
  console.log('Total artículos equipados recibidos:', articulosEquipados.length);
  if (articulosEquipados.length > 0) {
    console.log('Estructura del primer artículo:', articulosEquipados[0]);
  }
  
  const cabezaStyle = {
    opacity: cabezaAnim,
    transform: [
      { scale: cabezaAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
      { translateY: cabezaAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
    ],
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelStar}>⭐</Text>
        <Text style={styles.levelText}>Nivel {nivel}</Text>
      </View>

      <Animated.View style={[
        styles.mascotaOuter,
        { transform: [{ translateY: bounceAnim }, { scale: pulseAnim }] }
      ]}>

        {/* Accesorio de Cabeza dinámico */}

        {accesorioCabeza && (
          <Animated.View style={[styles.cabezaWrap, cabezaStyle]}>
            <Text style={[styles.accesorioEmoji, { fontSize: accesorioSize }]}>{accesorioCabeza}</Text>
          </Animated.View>
        )}

        <Animated.View style={[
          styles.glowRing,
          {
            width: cerditoSize + 24,
            height: cerditoSize + 24,
            borderRadius: (cerditoSize + 24) / 2,
            borderColor: healthColor,
            opacity: glowAnim,
          }
        ]} />

        <View style={[
          styles.cerditoCircle,
          {
            width: cerditoSize,
            height: cerditoSize,
            borderRadius: cerditoSize / 2,
            borderColor: healthColor,
          }
        ]}>
          <Text style={{ fontSize: cerditoSize * 0.52 }}>{emoji}</Text>

          {/* Accesorio de Mano dinámico */}

          {accesorioMano && (
            <Text style={[styles.manoEmoji, { fontSize: cerditoSize * 0.35 }]}>
              {accesorioMano}
            </Text>
          )}
        </View>
      </Animated.View>

      <Text style={[styles.nombre, size === 'sm' && styles.nombreSm]}>
        {nombre}
      </Text>

      <View style={[styles.estadoBadge, { backgroundColor: healthColor + '20' }]}>
        <View style={[styles.estadoDot, { backgroundColor: healthColor }]} />
        <Text style={[styles.estadoText, { color: healthColor }]}>{estado}</Text>
      </View>

      {showStats && (
        <View style={styles.healthSection}>
          <View style={styles.healthLabelRow}>
            <Text style={styles.healthLabel}>Salud</Text>
            <Text style={[styles.healthValue, { color: healthColor }]}>{salud}/100</Text>
          </View>
          <View style={styles.healthBarBg}>
            <Animated.View style={[
              styles.healthBarFill,
              { width: `${salud}%` as any, backgroundColor: healthColor }
            ]} />
          </View>
        </View>
      )}
    </View>
  );
};


// Calculamos y anclamos el accesorio de la extremidad a la sección inferior derecha del contenedor,
// forzando la indexación z-index para sobreponer las manos y gorros frente al renderizado del emoji base.

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: Spacing.md },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.yellow + '25', borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 5, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.yellow + '60' },
  levelStar: { fontSize: 12 },
  levelText: { fontSize: 12, fontFamily: Fonts.bold, color: Colors.yellowDark },
  mascotaOuter: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },

  cabezaWrap: { position: 'absolute', top: -28, zIndex: 10, alignItems: 'center' },
  accesorioEmoji: { textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  manoEmoji: { position: 'absolute', bottom: -5, right: -5, zIndex: 10, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: -1, height: 2 }, textShadowRadius: 3 },

  glowRing: { position: 'absolute', borderWidth: 2, borderStyle: 'dashed' },
  cerditoCircle: { backgroundColor: Colors.pinkLight, borderWidth: 3, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  
  nombre: { fontSize: 22, fontFamily: Fonts.black, color: Colors.textPrimary, marginTop: Spacing.sm, letterSpacing: -0.3 },
  nombreSm: { fontSize: 16 },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 5, marginTop: 6 },
  estadoDot: { width: 8, height: 8, borderRadius: 4 },
  estadoText: { fontSize: 13, fontFamily: Fonts.bold },

  healthSection: { width: '85%', marginTop: Spacing.md },
  healthLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  healthLabel: { fontSize: 12, color: Colors.textMuted, fontFamily: Fonts.regular },
  healthValue: { fontSize: 12, fontFamily: Fonts.black },
  healthBarBg: { height: 10, backgroundColor: Colors.border, borderRadius: Radii.full, overflow: 'hidden' },
  healthBarFill: { height: '100%', borderRadius: Radii.full },
});