// Este es el componente que se conecta con el modelo de Machine Learning. Llama a /ml/perfil para obtener el perfil de personalidad 
// financiera del usuario (ahorrador, inversor, gastador, etc.) junto con un consejo personalizado. Incluye:

// Un efecto de escritura letra por letra en el consejo
// Burbuja de diálogo con animación
// Botón de nuevo consejo que vuelve a pedir un consejo al backend/ML
// Mapa de colores según el estado emocional devuelto por el modelo (feliz, orgulloso, preocupado, etc.)

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated,
} from 'react-native';
import api from '../../services/api';
import { Colors, Fonts, Typography, Spacing, Radii, Shadows } from '../../constants/theme';

    interface PerfilML {
        perfil: string;
        confianza: number;
        estado: string;
        emoji: string;
        titulo: string;
        consejo: string;
        ml_activo: boolean;
  }

    // Clasificamos en memoria las variables cromáticas para cada estado anímico
    // inyectando consistencia en la colorimetría de la burbuja sin cargar el backend.

    const ESTADO_COLORES: Record<string, { bg: string; border: string; text: string; bubble: string }> = {
        feliz: { bg: '#F0FDF4', border: '#22C55E60', text: '#166534', bubble: '#DCFCE7' },
        emocionado: { bg: '#EEF2FF', border: '#6366F160', text: '#3730A3', bubble: '#E0E7FF' },
        orgulloso: { bg: '#FFFBEB', border: '#F59E0B60', text: '#92400E', bubble: '#FEF9C3' },
        preocupado: { bg: '#FFF7ED', border: '#F9731660', text: '#9A3412', bubble: '#FFEDD5' },
        triste: { bg: '#FFF1F2', border: '#F43F5E60', text: '#BE123C', bubble: '#FFE4E6' },
        animado: { bg: Colors.pinkLight, border: Colors.borderMid, text: Colors.pinkDark, bubble: '#FCE7F3' },
  };

// Hook: efecto de escritura letra por letra

    const useTypewriter = (texto: string, velocidad = 28) => {
      
      // Controlamos la interpolación textual simulando tipeo humano para atrapar la atención
      // y disolvemos el intervalo de memoria inmediatamente cuando el ciclo culmina.

      const [displayText, setDisplayText] = useState('');
      const [escribiendo, setEscribiendo] = useState(false);

      useEffect(() => {
        if (!texto) return;
        setDisplayText('');
        setEscribiendo(true);
        let i = 0;
        const intervalo = setInterval(() => {
          if (i < texto.length) {
            setDisplayText(texto.slice(0, i + 1));
            i++;
          } else {
            clearInterval(intervalo);
            setEscribiendo(false);
          }
        }, velocidad);
        return () => clearInterval(intervalo);
      }, [texto]);

      return { displayText, escribiendo };
  };

    export const CerditoPersonalidad = () => {
      const [perfil, setPerfil] = useState<PerfilML | null>(null);
      const [loading, setLoading] = useState(true);
      const [consejo, setConsejo] = useState('');
      const [cargandoConsejo, setCargandoConsejo] = useState(false);

  // Animaciones

      const fadeAnim    = useRef(new Animated.Value(0)).current;
      const slideAnim   = useRef(new Animated.Value(20)).current;
      const bubbleAnim  = useRef(new Animated.Value(0)).current;
      const cerditoAnim = useRef(new Animated.Value(1)).current;

  // Efecto typewriter en el consejo

      const { displayText, escribiendo } = useTypewriter(consejo, 25);

      useEffect(() => {
        cargarPerfil();
      }, []);

  // Animación de rebote del cerdito cuando escribe

      useEffect(() => {

        // Engranamos el latido de la UI con la cadencia de la máquina de escribir
        // parando el latido en seco cuando el texto logra renderizarse por completo.

        if (escribiendo) {
          Animated.loop(
            Animated.sequence([
              Animated.timing(cerditoAnim, { toValue: 1.08, duration: 200, useNativeDriver: true }),
              Animated.timing(cerditoAnim, { toValue: 1,    duration: 200, useNativeDriver: true }),
            ])
          ).start();
        } else {
          cerditoAnim.stopAnimation();
          cerditoAnim.setValue(1);
        }
      }, [escribiendo]);

      const cargarPerfil = async () => {
        
        // Hacemos ping al motor en Python para recuperar la lectura predictiva actual
        // y atamos la respuesta a una cascada de animaciones fluidas para la revelación del panel.

        setLoading(true);
        try {
          const res = await api.get('/ml/perfil');
          const data = res.data.data;
          setPerfil(data);
          setConsejo(data.consejo);

      // Animación de entrada del card

          Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]).start(() => {

        // Burbuja aparece después del card

            Animated.spring(bubbleAnim, {
              toValue: 1, tension: 60, friction: 8, useNativeDriver: true,
            }).start();
          });
        } catch {
          setPerfil(null);
        } finally {
          setLoading(false);
        }
    };

      const nuevoConsejo = async () => {

        // Vaciamos el viewport retrayendo la burbuja a escala cero para enmascarar la latencia
        // y repintamos el cuadro rebotando la interfaz apenas llegue la nueva frase del servidor.

        if (cargandoConsejo) return;
        setCargandoConsejo(true);

    // Reset burbuja

        bubbleAnim.setValue(0);

        try {
          const res = await api.get('/ml/perfil');
          const data = res.data.data;
          setConsejo(data.consejo);

      // Burbuja reaparece con animación

          Animated.spring(bubbleAnim, {
            toValue: 1, tension: 60, friction: 8, useNativeDriver: true,
          }).start();
        } catch {}
        finally { setCargandoConsejo(false); }
      };

      if (loading) {
        return (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.pinkMid} size="small" />
            <Text style={styles.loadingText}>Tu cerdito te está analizando...</Text>
          </View>
        );
      }

      if (!perfil) return null;

      const colores = ESTADO_COLORES[perfil.estado] || ESTADO_COLORES.animado;

      return (
        <Animated.View style={[
          styles.card,
          { backgroundColor: colores.bg, borderColor: colores.border },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>

      {/* Header: cerdito + título + perfil */}

          <View style={styles.header}>
        
        {/* Cerdito animado */}

            <Animated.Text style={[
              styles.cerditoEmoji,
              { transform: [{ scale: cerditoAnim }] },
            ]}>
              {perfil.emoji}
            </Animated.Text>

            <View style={styles.headerInfo}>
              <Text style={[styles.titulo, { color: colores.text }]}>
                {perfil.titulo}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.perfilBadge, { backgroundColor: colores.bubble }]}>
                  <Text style={[styles.perfilBadgeText, { color: colores.text }]}>
                    🧠 {perfil.perfil}
                  </Text>
                </View>
                <Text style={styles.confianza}>{perfil.confianza}%</Text>
              </View>
            </View>
          </View>

      {/* Burbuja de diálogo animada */}

          <Animated.View style={[
            styles.bubbleWrap,
            {
              opacity:   bubbleAnim,
              transform: [
                { scale: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                { translateY: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
              ],
            },
          ]}>
        {/* Cola de la burbuja */}

            <View style={[styles.bubbleTail, { borderBottomColor: colores.bubble }]} />

            <View style={[styles.bubble, { backgroundColor: colores.bubble, borderColor: colores.border }]}>

          {/* Indicador de escritura */}

              <View style={styles.bubbleHeader}>
                <Text style={[styles.bubbleLabel, { color: colores.text }]}>
                  💬 Tu cerdito dice:
                </Text>
                {escribiendo && (
                  <View style={styles.typingDots}>
                    <Text style={[styles.dot, { color: colores.text }]}>●</Text>
                    <Text style={[styles.dot, { color: colores.text }]}>●</Text>
                    <Text style={[styles.dot, { color: colores.text }]}>●</Text>
                  </View>
                )}
              </View>

          {/* Texto con efecto typewriter */}

              <Text style={[styles.consejoText, { color: colores.text }]}>
                "{displayText}"
                {escribiendo && <Text style={{ color: colores.text }}>|</Text>}
              </Text>
            </View>
          </Animated.View>

      {/* Botón nuevo consejo */}

          <TouchableOpacity
            style={[styles.nuevoBtn, { borderColor: colores.border }]}
            onPress={nuevoConsejo}
            disabled={cargandoConsejo || escribiendo}
            activeOpacity={0.7}
          >
            {cargandoConsejo
              ? <ActivityIndicator size="small" color={colores.text} />
              : <Text style={[styles.nuevoBtnText, { color: colores.text }]}>
                  🔄 Nuevo consejo
                </Text>
            }
          </TouchableOpacity>

        </Animated.View>
      );
  };



const styles = StyleSheet.create({

  loadingCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radii.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, },
    
  loadingText: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textMuted },

  card: {
    borderRadius: Radii.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1.5,
    ...Shadows.md,},

  // Header

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  cerditoEmoji: { fontSize: 44 },
  headerInfo: { flex: 1, justifyContent: 'center' },
  titulo: { fontFamily: Fonts.black, fontSize: Typography.sm, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perfilBadge: { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3 },
  perfilBadgeText: { fontFamily: Fonts.bold, fontSize: Typography.xs },
  confianza: { fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textMuted },

  // Burbuja de diálogo

  bubbleWrap: { marginBottom: Spacing.sm },
  bubbleTail: {
    marginLeft: 20,
    width: 0, height: 0,
    borderLeftWidth: 8, borderLeftColor: 'transparent',
    borderRightWidth: 8, borderRightColor: 'transparent',
    borderBottomWidth: 10, },

  bubble: {
    borderRadius: Radii.md, padding: Spacing.md,
    borderWidth: 1, },

  bubbleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  bubbleLabel: { fontFamily: Fonts.bold, fontSize: Typography.xs },
  typingDots: { flexDirection: 'row', gap: 3 },
  dot: { fontSize: 8 },
  consejoText:  { fontFamily: Fonts.semiBold, fontSize: Typography.sm, lineHeight: 20, fontStyle: 'italic' },

  // Botón

  nuevoBtn: { alignSelf: 'flex-end', borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.6)' },
  nuevoBtnText: { fontFamily: Fonts.bold, fontSize: Typography.xs },

});