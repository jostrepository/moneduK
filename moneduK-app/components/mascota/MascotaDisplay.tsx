import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

interface MascotaProps {
  nombre:      string;
  salud:       number;
  nivel:       number;
  estado:      string;
  size?:       'sm' | 'md' | 'lg';
  showBirrete?: boolean;
  showStats?:  boolean;
}

const CERDO_EMOJI: Record<string, string> = {
  'Excelente': '🐷',
  'Bien':      '🐷',
  'Regular':   '🐽',
  'Malo':      '🤒',
  'Crítico':   '😰',
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
}: MascotaProps) => {
  const bounceAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const birreteAnim = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0.6)).current;

  // Rebote continuo suave
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 900, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Entrada del birrete con rebote
  useEffect(() => {
    if (showBirrete) {
      Animated.spring(birreteAnim, {
        toValue: 1, tension: 60, friction: 7, useNativeDriver: true,
      }).start();
    }
  }, [showBirrete]);

  // Pulso de alerta cuando la salud es crítica
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

  // Brillo pulsante del círculo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cerditoSize  = SIZES[size];
  const emoji        = CERDO_EMOJI[estado] || '🐷';
  const healthColor  = HEALTH_COLOR(salud);
  const birreteSize  = cerditoSize * 0.55;

  const birreteStyle = {
    opacity:   birreteAnim,
    transform: [
      { scale: birreteAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
      { translateY: birreteAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
    ],
  };

  return (
    <View style={styles.wrapper}>
      {/* Badge de nivel */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelStar}>⭐</Text>
        <Text style={styles.levelText}>Nivel {nivel}</Text>
      </View>

      {/* Contenedor mascota + birrete */}
      <Animated.View style={[
        styles.mascotaOuter,
        { transform: [{ translateY: bounceAnim }, { scale: pulseAnim }] },
      ]}>
        {/* Birrete encima del cerdito */}
        {showBirrete && (
          <Animated.View style={[styles.birreteWrap, birreteStyle]}>
            <Text style={[styles.birreteEmoji, { fontSize: birreteSize }]}>🎓</Text>
          </Animated.View>
        )}

        {/* Círculo con glow */}
        <Animated.View style={[
          styles.glowRing,
          {
            width:  cerditoSize + 24,
            height: cerditoSize + 24,
            borderRadius: (cerditoSize + 24) / 2,
            borderColor: healthColor,
            opacity: glowAnim,
          },
        ]} />

        {/* Círculo principal */}
        <View style={[
          styles.cerditoCircle,
          {
            width:  cerditoSize,
            height: cerditoSize,
            borderRadius: cerditoSize / 2,
            borderColor: healthColor,
          },
        ]}>
          <Text style={{ fontSize: cerditoSize * 0.52 }}>{emoji}</Text>
        </View>
      </Animated.View>

      {/* Nombre */}
      <Text style={[styles.nombre, size === 'sm' && styles.nombreSm]}>
        {nombre}
      </Text>

      {/* Badge de estado */}
      <View style={[styles.estadoBadge, { backgroundColor: healthColor + '20' }]}>
        <View style={[styles.estadoDot, { backgroundColor: healthColor }]} />
        <Text style={[styles.estadoText, { color: healthColor }]}>{estado}</Text>
      </View>

      {/* Barra de salud */}
      {showStats && (
        <View style={styles.healthSection}>
          <View style={styles.healthLabelRow}>
            <Text style={styles.healthLabel}>Salud</Text>
            <Text style={[styles.healthValue, { color: healthColor }]}>{salud}/100</Text>
          </View>
          <View style={styles.healthBarBg}>
            <Animated.View style={[
              styles.healthBarFill,
              { width: `${salud}%` as any, backgroundColor: healthColor },
            ]} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.yellow + '25',
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.yellow + '60',
  },
  levelStar: { fontSize: 12 },
  levelText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.yellowDark },

  mascotaOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  birreteWrap: {
    position: 'absolute',
    top: -28,
    zIndex: 10,
    alignItems: 'center',
  },
  birreteEmoji: {
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  cerditoCircle: {
    backgroundColor: Colors.pinkLight,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nombre:   { fontSize: 22, fontWeight: Typography.black, color: Colors.textPrimary, marginTop: Spacing.sm, letterSpacing: -0.3 },
  nombreSm: { fontSize: 16 },

  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 6,
  },
  estadoDot:  { width: 8, height: 8, borderRadius: 4 },
  estadoText: { fontSize: 13, fontWeight: Typography.bold },

  healthSection: { width: '85%', marginTop: Spacing.md },
  healthLabelRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  healthLabel:   { fontSize: 12, color: Colors.textMuted, fontWeight: Typography.medium },
  healthValue:   { fontSize: 12, fontWeight: Typography.black },
  healthBarBg:   { height: 10, backgroundColor: Colors.border, borderRadius: Radii.full, overflow: 'hidden' },
  healthBarFill: { height: '100%', borderRadius: Radii.full },
});
