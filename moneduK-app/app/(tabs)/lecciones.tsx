//El minijuego de quiz (tab "Minijuegos" en el menú). Máquina de estados (lobby, countdown, jugando, resultado), banco de preguntas con 
// indicesOriginales para la verificación en el backend, contador de 15s por pregunta, y cooldown de 2 horas entre sesiones controlado por el backend.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { Colors, Fonts, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import api from '../../services/api';

    interface Pregunta {
      id: number;
      pregunta: string;
      opciones: string[];
    }

    type FaseJuego = 'lobby' | 'countdown' | 'jugando' | 'resultado';

    export default function MinijuegosScreen() {
      const [puedeJugar, setPuedeJugar] = useState(true);
      const [minutosRestantes, setMinutosRestantes]   = useState(0);
      const [cargando, setCargando] = useState(true);
      const [fase, setFase] = useState<FaseJuego>('lobby');

  // Cuenta atrás inicial

      const [countdownVal, setCountdownVal] = useState<number | string>(3);

  // Quiz

      const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
      const [indicesOriginales, setIndicesOriginales] = useState<number[]>([]);
      const [preguntaActual, setPreguntaActual] = useState(0);
      const [respuestas, setRespuestas] = useState<number[]>([]);
      const [seleccionada, setSeleccionada] = useState<number | null>(null);
      const [confirmada, setConfirmada] = useState(false);
      const [resultado, setResultado] = useState<any>(null);

  // Contador de 15 segundos

      const [timerSeg, setTimerSeg] = useState(15);
      const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animaciones

      const overlayAnim = useRef(new Animated.Value(0)).current;
      const cardAnim = useRef(new Animated.Value(300)).current;
      const opcionesAnim = useRef([0,1,2,3].map(() => new Animated.Value(-400))).current;
      const countAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => { cargarEstado(); }, []);

  // Contador de 15 segundos 

      useEffect(() => {
        if (fase !== 'jugando' || confirmada) return;

        setTimerSeg(15);
        timerRef.current = setInterval(() => {
          setTimerSeg(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              // Tiempo agotado → confirmar con lo que haya (o sin respuesta)
              confirmarRespuestaAuto();
              return 0;
            }
            return prev - 1;
          });
      }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
      }, [preguntaActual, fase]);

      const detenerTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

      const confirmarRespuestaAuto = () => {

    // Si no hay seleccionada, se cuenta como incorrecta (índice -1)

        setConfirmada(true);
        detenerTimer();
        const resp = seleccionada !== null ? seleccionada : -1;
        procesarRespuesta(resp);
    };

      const cargarEstado = async () => {
        try {
          const res = await api.get('/minijuegos/quiz/estado');
          setPuedeJugar(res.data.data.puede_jugar);
          setMinutosRestantes(res.data.data.minutos_restantes || 0);
        } catch {}
        finally { setCargando(false); }
    };

  // Iniciar juego

      const iniciarJuego = async () => {
        try {
          const res  = await api.get('/minijuegos/quiz/preguntas');
          const data = res.data.data;
          setPreguntas(data.preguntas);
          setIndicesOriginales(data.indices_originales);
          setRespuestas([]);
          setPreguntaActual(0);
          setSeleccionada(null);
          setConfirmada(false);
          iniciarCountdown();
        } catch (err: any) {
          Alert.alert('Ups', err.response?.data?.message || 'No se pudo cargar el quiz');
        }
     };

  // Countdown 3-2-1... "¡A jugar!" 

      const iniciarCountdown = () => {
        setFase('countdown');
        setCountdownVal(3);
        Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

        const secuencia = [3, 2, 1, '¡A jugar!'];
        let i = 0;

        const intervalo = setInterval(() => {
          i++;
          if (i < secuencia.length) {
            setCountdownVal(secuencia[i]);
            countAnim.setValue(1.5);
            Animated.spring(countAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
          }
          if (i >= secuencia.length) {
            clearInterval(intervalo);
            setTimeout(() => iniciarPregunta(), 600);
          }
        }, 900);
    };

  // Mostrar pregunta con animaciones 

      const iniciarPregunta = () => {
        setFase('jugando');
        setSeleccionada(null);
        setConfirmada(false);
        cardAnim.setValue(300);
        opcionesAnim.forEach(a => a.setValue(-400));

        Animated.spring(cardAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
        opcionesAnim.forEach((anim, i) => {
          Animated.spring(anim, {
            toValue: 0, tension: 60, friction: 10,
            delay: 150 + i * 100, useNativeDriver: true,
          }).start();
        });
    };

  // Confirmar respuesta (botón Enviar)
      const handleEnviar = () => {
        if (seleccionada === null) {
          Alert.alert('Selecciona una opción', 'Elige una respuesta antes de enviar.');
          return;
        }
        detenerTimer();
        setConfirmada(true);
        procesarRespuesta(seleccionada);
    };

  // Procesar respuesta y avanzar
      const procesarRespuesta = (respuesta: number) => {
        const nuevasRespuestas = [...respuestas, respuesta];
        setRespuestas(nuevasRespuestas);
        setSeleccionada(respuesta);
        setConfirmada(true);

        setTimeout(() => {
          if (preguntaActual < preguntas.length - 1) {
            setPreguntaActual(prev => prev + 1);
            iniciarPregunta();
          } else {
            enviarResultados(nuevasRespuestas);
          }
        }, 1400);
    };

  // Enviar al backend

      const enviarResultados = async (todasRespuestas: number[]) => {
        try {
          const res = await api.post('/minijuegos/quiz/completar', {
            respuestas:         todasRespuestas,
            indices_preguntas:  indicesOriginales,
          });
          setResultado(res.data.data);
          setFase('resultado');
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'Error al enviar resultados');
          cerrarJuego();
        }
    };

  // Cerrar juego

      const cerrarJuego = () => {
        detenerTimer();
        Animated.timing(overlayAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          setFase('lobby');
          setResultado(null);
          cargarEstado();
        });
      };

  // Color de opción

  // Solo se muestra verde/rojo después de confirmar

      const getColorOpcion = (indice: number) => {
        if (!confirmada) {

      // Antes de confirmar: amarillo si está seleccionada

          return seleccionada === indice ? Colors.yellow : Colors.white;
        }

    // Después de confirmar: verde si correcta, rojo si es la elegida incorrecta

        const idxOriginal   = indicesOriginales[preguntaActual];

    // Se pide al backend la opción correcta, como no la tenemos en frontend,
    // la verificación real es del backend. Aquí solo resaltamos la elegida.
    // Verde/rojo se muestra en el resumen final.

        return seleccionada === indice ? '#FEF08A' : Colors.white; // amarillo confirmado
    };

      const horasRestantes = Math.floor(minutosRestantes / 60);
      const minsRestantes  = minutosRestantes % 60;

      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>Minijuegos 🎮</Text>
            <Text style={styles.subtitle}>Pon a prueba tus conocimientos financieros</Text>

            {/* Card del juego */}
            <View style={styles.gameCard}>
              <View style={styles.gameCardLeft}>
                <View style={styles.gameIconWrap}>
                  <Text style={styles.gameIcon}>🧠</Text>
                </View>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameTitle}>Quiz Financiero</Text>
                  <Text style={styles.gameDesc}>5 preguntas · 50 KoinK · 50 XP</Text>
                  <View style={styles.gameTags}>
                    <View style={styles.tag}><Text style={styles.tagText}>💰 +50 KoinK</Text></View>
                    <View style={[styles.tag, styles.tagXP]}><Text style={[styles.tagText, styles.tagXPText]}>⭐ +50 XP</Text></View>
                  </View>
                </View>
              </View>

              {cargando ? (
                <ActivityIndicator color={Colors.pinkMid} />
              ) : puedeJugar ? (
                <TouchableOpacity style={styles.playBtn} onPress={iniciarJuego} activeOpacity={0.8}>
                  <Text style={styles.playBtnText}>Jugar</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.cooldownWrap}>
                  <Text style={styles.cooldownIcon}>⏳</Text>
                  <Text style={styles.cooldownTime}>
                    {horasRestantes > 0 ? `${horasRestantes}h ` : ''}{minsRestantes}min
                  </Text>
                </View>
              )}
            </View>

        {/* Reglas */}

            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>📋 Cómo funciona</Text>
              {[
                '5 preguntas aleatorias de educación financiera',
                'Cada respuesta correcta: +10 HP a tu cerdito',
                'Cada respuesta incorrecta: -10 HP a tu cerdito',
                'Siempre ganas 50 KoinK y 50 XP al completar',
                'Tienes 15 segundos por pregunta',
                'Puedes cambiar tu respuesta antes de enviar',
                'Puedes jugar cada 2 horas',
              ].map((r, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={styles.ruleDot} />
                  <Text style={styles.ruleText}>{r}</Text>
                </View>
              ))}
            </View>

          </ScrollView>

      {/* Overlay del juego */}
          
          {fase !== 'lobby' && (
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents="auto">

          {/* Countdown */}

              {fase === 'countdown' && (
                <View style={styles.countdownWrap}>
                  <Animated.Text style={[
                    styles.countdownNum,
                    typeof countdownVal === 'string' && styles.countdownText,
                    { transform: [{ scale: countAnim }] },
                  ]}>
                    {countdownVal}
                  </Animated.Text>
                </View>
              )}

          {/* Quiz */}

              {fase === 'jugando' && preguntas.length > 0 && (
                <View style={styles.quizContainer}>

              {/* Fila superior: progreso + contador */}
              
                  <View style={styles.topRow}>

              {/* Puntos de progreso */}
                    <View style={styles.progressRow}>
                      {preguntas.map((_, i) => (
                        <View key={i} style={[
                          styles.progressDot,
                          i < preguntaActual  && styles.progressDotDone,
                          i === preguntaActual && styles.progressDotActive,
                        ]} />
                      ))}
                    </View>

                {/* Timer circular */}

                    <View style={[
                      styles.timerCircle,
                      timerSeg <= 5 && styles.timerCircleRed,
                    ]}>
                      <Text style={[
                        styles.timerNum,
                        timerSeg <= 5 && styles.timerNumRed,
                      ]}>
                        {timerSeg}
                      </Text>
                    </View>
                  </View>

              {/* Card pregunta */}

                  <Animated.View style={[styles.preguntaCard, { transform: [{ translateY: cardAnim }] }]}>
                    <Text style={styles.preguntaNum}>Pregunta {preguntaActual + 1} de 5</Text>
                    <Text style={styles.preguntaText}>{preguntas[preguntaActual].pregunta}</Text>
                  </Animated.View>

              {/* Opciones */}

                  <View style={styles.opcionesWrap}>
                    {preguntas[preguntaActual].opciones.map((opcion, i) => (
                      <Animated.View key={i} style={{ transform: [{ translateX: opcionesAnim[i] }] }}>
                        <TouchableOpacity
                          style={[
                            styles.opcionCard,
                            { backgroundColor: getColorOpcion(i) },
                            seleccionada === i && styles.opcionSeleccionada,
                          ]}
                          onPress={() => { if (!confirmada) setSeleccionada(i); }}
                          activeOpacity={0.85}
                          disabled={confirmada}
                        >
                          <View style={styles.opcionLetraWrap}>
                            <Text style={styles.opcionLetra}>{['A','B','C','D'][i]}</Text>
                          </View>
                          <Text style={styles.opcionText}>{opcion}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>

              {/* Botón Enviar */}

                  {!confirmada && (
                    <TouchableOpacity
                      style={[styles.enviarBtn, seleccionada === null && styles.enviarBtnDisabled]}
                      onPress={handleEnviar}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.enviarBtnText}>Enviar respuesta →</Text>
                    </TouchableOpacity>
                  )}

                </View>
              )}

          {/* Resultado */}

              {fase === 'resultado' && resultado && (
                <View style={styles.resultadoContainer}>
                  <View style={styles.resultadoCard}>
                    <Text style={styles.resultadoEmoji}>
                      {resultado.aciertos >= 4 ? '🏆' : resultado.aciertos >= 2 ? '👍' : '📚'}
                    </Text>
                    <Text style={styles.resultadoTitulo}>
                      {resultado.aciertos >= 4 ? '¡Excelente!' : resultado.aciertos >= 2 ? '¡Bien hecho!' : '¡Sigue practicando!'}
                    </Text>
                    <Text style={styles.resultadoPuntaje}>{resultado.puntaje}</Text>
                    <Text style={styles.resultadoPuntajeLabel}>respuestas correctas</Text>

                    <View style={styles.recompensasRow}>
                      <View style={styles.recompensaItem}>
                        <Text style={styles.recompensaVal}>+{resultado.koin_ganado}</Text>
                        <Text style={styles.recompensaLabel}>KoinK</Text>
                      </View>
                      <View style={styles.recompensaItem}>
                        <Text style={styles.recompensaVal}>+{resultado.xp_ganado}</Text>
                        <Text style={styles.recompensaLabel}>XP</Text>
                      </View>
                      <View style={styles.recompensaItem}>
                        <Text style={[
                          styles.recompensaVal,
                          { color: resultado.salud_delta >= 0 ? Colors.excellent : Colors.critical },
                        ]}>
                          {resultado.salud_delta >= 0 ? '+' : ''}{resultado.salud_delta}
                        </Text>
                        <Text style={styles.recompensaLabel}>Salud</Text>
                      </View>
                    </View>

                {/* Resumen con verde/rojo correcto desde el backend */}

                    <View style={styles.resumenWrap}>
                      {resultado.resultados.map((r: any, i: number) => (
                        <View key={i} style={[styles.resumenItem, r.correcta ? styles.resumenOk : styles.resumenFail]}>
                          <Text style={styles.resumenIcon}>{r.correcta ? '✅' : '❌'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resumenPregunta} numberOfLines={1}>{r.pregunta}</Text>
                            {!r.correcta && (
                              <Text style={styles.resumenCorrecta}>✔ {r.opcion_correcta}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.continuarBtn} onPress={cerrarJuego}>
                      <Text style={styles.continuarBtnText}>Continuar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </Animated.View>
          )}
        </SafeAreaView>
      );
    }

    

const styles = StyleSheet.create({
  
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontFamily: Fonts.black, fontSize: Typography.xl, color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontFamily: Fonts.semiBold, fontSize: Typography.sm, color: Colors.textMuted, marginTop: 4, marginBottom: Spacing.lg },

  gameCard: {
    backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', ...Shadows.md,
  },
  gameCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  gameIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  gameIcon: { fontSize: 28 },
  gameInfo: { flex: 1 },
  gameTitle: { fontFamily: Fonts.black, fontSize: Typography.md, color: Colors.textPrimary },
  gameDesc: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, marginBottom: 6 },
  gameTags: { flexDirection: 'row', gap: 4 },
  tag: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.yellowDark },
  tagXP: { backgroundColor: '#EEF2FF' },
  tagXPText: { color: '#3730A3' },

  playBtn: { backgroundColor: Colors.pinkMid, borderRadius: Radii.full, paddingHorizontal: 20, paddingVertical: 10, ...Shadows.sm },
  playBtnText: { fontFamily: Fonts.black, fontSize: Typography.sm, color: Colors.white },

  cooldownWrap: { alignItems: 'center' },
  cooldownIcon: { fontSize: 20 },
  cooldownTime: { fontFamily: Fonts.black, fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },

  rulesCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  rulesTitle: { fontFamily: Fonts.black, fontSize: Typography.sm, color: Colors.textPrimary, marginBottom: Spacing.sm },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  ruleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.pinkMid, marginTop: 6 },
  ruleText: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,10,16,0.88)',
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.lg,
  },

  countdownWrap: { alignItems: 'center' },
  countdownNum: { fontFamily: Fonts.black, fontSize: 96, color: Colors.white },
  countdownText: { fontSize: 42 },

  // Quiz

  quizContainer: { width: '100%' },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },

  progressRow: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressDotDone: { backgroundColor: Colors.excellent },
  progressDotActive: { backgroundColor: Colors.yellow, width: 24 },

  // Contador circular con borde amarillo

  timerCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 3, borderColor: Colors.yellow,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  timerCircleRed: { borderColor: Colors.critical },
  timerNum: { fontFamily: Fonts.black, fontSize: Typography.lg, color: Colors.white },
  timerNumRed: { color: Colors.critical },

  preguntaCard: {
    backgroundColor: Colors.white, borderRadius: Radii.xl,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.lg,
  },
  preguntaNum: { fontFamily: Fonts.bold, fontSize: Typography.xs, color: Colors.pinkMid, marginBottom: 8 },
  preguntaText: { fontFamily: Fonts.black, fontSize: Typography.lg, color: Colors.textPrimary, lineHeight: 26 },

  opcionesWrap: { gap: Spacing.sm },
  opcionCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radii.lg, padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadows.sm,
  },
  opcionSeleccionada: { borderColor: Colors.yellowMid, borderWidth: 2 },
  opcionLetraWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  opcionLetra: { fontFamily: Fonts.black, fontSize: Typography.sm, color: Colors.pinkDark },
  opcionText: { fontFamily: Fonts.bold, fontSize: Typography.sm, color: Colors.textPrimary, flex: 1 },

  // Botón enviar

  enviarBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.pinkMid,
    borderRadius: Radii.full, paddingVertical: 14,
    alignItems: 'center', ...Shadows.md,
  },
  enviarBtnDisabled: { backgroundColor: Colors.textMuted },
  enviarBtnText: { fontFamily: Fonts.black, fontSize: Typography.md, color: Colors.white },

  // Resultado
  resultadoContainer: { width: '100%' },
  resultadoCard: {
    backgroundColor: Colors.white, borderRadius: Radii.xl,
    padding: Spacing.xl, alignItems: 'center', ...Shadows.lg,
  },
  resultadoEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  resultadoTitulo:  { fontFamily: Fonts.black, fontSize: Typography.xl, color: Colors.textPrimary, marginBottom: 4 },
  resultadoPuntaje: { fontFamily: Fonts.black, fontSize: 56, color: Colors.pinkDark, lineHeight: 64 },
  resultadoPuntajeLabel:{ fontFamily: Fonts.semiBold, fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },

  recompensasRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.lg },
  recompensaItem: { alignItems: 'center' },
  recompensaVal: { fontFamily: Fonts.black,    fontSize: Typography.xl, color: Colors.pinkDark },
  recompensaLabel: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textMuted },

  resumenWrap: { width: '100%', gap: 6, marginBottom: Spacing.lg },
  resumenItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: Radii.sm, padding: 8 },
  resumenOk: { backgroundColor: '#F0FDF4' },
  resumenFail: { backgroundColor: '#FFF1F2' },
  resumenIcon: { fontSize: 14, marginTop: 2 },
  resumenPregunta: { fontFamily: Fonts.semiBold, fontSize: Typography.xs, color: Colors.textPrimary },
  resumenCorrecta: { fontFamily: Fonts.bold,     fontSize: Typography.xs, color: Colors.excellent, marginTop: 2 },

  continuarBtn: { backgroundColor: Colors.pinkMid, borderRadius: Radii.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, width: '100%', alignItems: 'center' },
  continuarBtnText: { fontFamily: Fonts.black, fontSize: Typography.md, color: Colors.white },

});
