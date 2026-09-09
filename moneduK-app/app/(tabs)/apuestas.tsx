//Simula apuestas (módulo educativo para enseñar el por qué es riesgoso apostar), con modal de confirmación antes de apostar.

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { apuestaService, walletService } from '../../services/api';
import { Colors, FontSizes, Spacing, Radii, Shadows } from '../../constants/theme';

    export default function ApuestasScreen() {
      const [saldo,        setSaldo]        = useState<number | null>(null);
      const [monto,        setMonto]        = useState('');
      const [apostando,    setApostando]    = useState(false);
      const [resultado,    setResultado]    = useState<any>(null);
      const [confirmarVisible, setConfirmarVisible] = useState(false);

      const cargarSaldo = async () => {
        try {
          const res = await walletService.getMiWallet();
          setSaldo(Number(res.data.data.saldo));
        } catch {}
    };

      React.useEffect(() => { cargarSaldo(); }, []);

      const handleApostar = () => {
        const montoNum = parseFloat(monto);
        if (!montoNum || montoNum <= 0) {
          Alert.alert('Error', 'Ingresa un monto válido');
          return;
        }
        if (saldo !== null && montoNum > saldo) {
          Alert.alert('KoinK insuficientes', `Solo tienes ${saldo.toFixed(0)} KoinK`);
          return;
        }
        setConfirmarVisible(true);
    };

      const confirmarApuesta = async () => {
        setConfirmarVisible(false);
        setApostando(true);
        try {
          const res = await apuestaService.realizarApuesta(parseFloat(monto));
          const data = res.data.data;
          setSaldo(Number(data.saldo_nuevo));
          setResultado(data);
          setMonto('');
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'No se pudo realizar la apuesta');
        } finally {
          setApostando(false);
        }
    };

      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>

        {/* Advertencia educativa */}

            <View style={styles.warningBanner}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>¡Zona de aprendizaje!</Text>
                <Text style={styles.warningText}>
                  Esta sección existe para enseñarte por qué las apuestas son dañinas para tus finanzas. Tu cerdito SIEMPRE sufrirá cuando apuestes,
                   ¡sin importar si ganas o pierdes!
                </Text>
              </View>
            </View>

        {/* ¿Por qué apostar es malo? */}

            <Text style={styles.sectionTitle}>¿Por qué apostar es malo?</Text>
            {[
              { icon: '📉', title: 'Las probabilidades siempre te pierdes', desc: 'Los juegos de azar están diseñados para que la casa gane más de lo que paga.' },
              { icon: '🧠', title: 'Crea adicción', desc: 'Apostar puede volverse un hábito difícil de controlar, afectando tu vida y finanzas.' },
              { icon: '💸', title: 'Pierdes más de lo que ganas', desc: 'A largo plazo, las personas que apuestan pierden dinero casi siempre.' },
              { icon: '😢', title: 'Daña a tu mascota', desc: 'En MoneduK, apostar SIEMPRE baja la salud de tu cerdito, ¡aunque ganes!' },
            ].map((item, i) => (
              <View key={i} style={styles.factCard}>
                <Text style={styles.factIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factTitle}>{item.title}</Text>
                  <Text style={styles.factDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}

        {/* Sección de apuesta (con diseño de advertencia) */}

            <View style={styles.apuestaSection}>
              <Text style={styles.apuestaSectionTitle}>Prueba y aprende</Text>
              <Text style={styles.apuestaSectionDesc}>
                Prueba apostar para ver en tiempo real cómo afecta a tu cerdito. Recuerda: esto es solo para aprender.
              </Text>

              <View style={styles.saldoRow}>
                <Text style={styles.saldoLabel}>Tu saldo actual:</Text>
                <Text style={styles.saldoVal}>🪙 {saldo !== null ? Number(saldo).toFixed(0) : '...'}</Text>
              </View>

              <Text style={styles.montoLabel}>¿Cuánto quieres arriesgar?</Text>
              <TextInput
                style={styles.montoInput}
                placeholder="Ej: 10"
                keyboardType="numeric"
                value={monto}
                onChangeText={setMonto}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.probabilidad}>
                Probabilidad de ganar: 25% · Probabilidad de perder: 75%
              </Text>

              <TouchableOpacity
                style={[styles.apuestaBtn, apostando && styles.apuestaBtnDisabled]}
                onPress={handleApostar}
                disabled={apostando}
              >
                {apostando
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.apuestaBtnText}>Apostar (y aprender) 🎰</Text>
                }
              </TouchableOpacity>
            </View>

          </ScrollView>

      {/* Modal de confirmación */}
          
          <Modal visible={confirmarVisible} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.modal}>
                <Text style={styles.modalEmoji}>🤔</Text>
                <Text style={styles.modalTitle}>¿Seguro quieres apostar?</Text>
                <Text style={styles.modalDesc}>
                  Vas a arriesgar <Text style={{ fontWeight: '900' }}>🪙 {monto} KoinK</Text>.{'\n\n'}
                  Recuerda que tu cerdito sufrirá -{10} de salud sin importar el resultado.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmarVisible(false)}>
                    <Text style={styles.cancelText}>Mejor no 😌</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmarBtn} onPress={confirmarApuesta}>
                    <Text style={styles.confirmarText}>Apostar igual</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

      {/* Modal de resultado */}

          <Modal visible={!!resultado} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.modal}>
                <Text style={styles.modalEmoji}>
                  {resultado?.resultado === 'ganó' ? '😅' : '😢'}
                </Text>
                <Text style={styles.modalTitle}>
                  {resultado?.resultado === 'ganó' ? '¡Ganaste esta vez...' : 'Perdiste la apuesta'}
                </Text>

                <View style={[styles.resultBanner, resultado?.resultado === 'ganó' ? styles.resultGano : styles.resultPerdio]}>
                  <Text style={styles.resultBannerText}>
                    {resultado?.resultado === 'ganó'
                      ? `+${resultado?.monto_resultado} KoinK ganados`
                      : `-${resultado?.monto_apostado} KoinK perdidos`
                    }
                  </Text>
                </View>

                {/* Daño a la mascota (siempre) */}
                <View style={styles.mascotaDano}>
                  <Text style={styles.mascotaDanoTitle}>🐷 Tu cerdito perdió 10 de salud</Text>
                  <Text style={styles.mascotaDanoDesc}>
                    Aunque {resultado?.resultado === 'ganó' ? 'ganaste' : 'perdiste'}, apostar siempre daña a tu mascota.
                  </Text>
                </View>

                {/* Lección moral */}
                <View style={styles.leccionBox}>
                  <Text style={styles.leccionTitle}>💡 Lección:</Text>
                  <Text style={styles.leccionText}>{resultado?.leccion_moral}</Text>
                </View>

                <Text style={styles.saldoNuevo}>
                  Saldo actual: 🪙 {Number(resultado?.saldo_nuevo).toFixed(0)} KoinK
                </Text>

                <TouchableOpacity style={styles.entendidoBtn} onPress={() => setResultado(null)}>
                  <Text style={styles.entendidoBtnText}>Entendí la lección 📚</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      );
  }



const styles = StyleSheet.create({
  
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  warningBanner: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: '#FFF7ED', borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: '#FED7AA', alignItems: 'flex-start' },
  warningIcon: { fontSize: 24 },
  warningTitle: { fontSize: FontSizes.sm, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  warningText: { fontSize: FontSizes.xs, color: '#92400E', lineHeight: 18 },

  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },

  factCard: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: Radii.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'flex-start' },
  factIcon: { fontSize: 22 },
  factTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  factDesc: { fontSize: FontSizes.xs, color: Colors.textMuted, lineHeight: 16 },

  apuestaSection: { backgroundColor: '#FFF1F2', borderRadius: Radii.lg, padding: Spacing.lg, marginTop: Spacing.lg, borderWidth: 1.5, borderColor: '#FECDD3' },
  apuestaSectionTitle:{ fontSize: FontSizes.lg, fontWeight: '900', color: '#BE123C', marginBottom: 4 },
  apuestaSectionDesc: { fontSize: FontSizes.sm, color: '#9F1239', marginBottom: Spacing.md, lineHeight: 20 },

  saldoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  saldoLabel: { fontSize: FontSizes.sm, color: '#9F1239', fontWeight: '600' },
  saldoVal: { fontSize: FontSizes.md, fontWeight: '900', color: '#BE123C' },

  montoLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: '#9F1239', marginBottom: 8 },
  montoInput: { backgroundColor: Colors.white, borderRadius: Radii.md, borderWidth: 1.5, borderColor: '#FECDD3', height: 52, paddingHorizontal: Spacing.md, fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  probabilidad: { fontSize: FontSizes.xs, color: '#9F1239', marginBottom: Spacing.md, textAlign: 'center', fontWeight: '600' },

  apuestaBtn: { backgroundColor: '#BE123C', borderRadius: Radii.full, height: 52, alignItems: 'center', justifyContent: 'center' },
  apuestaBtnDisabled: { opacity: 0.6 },
  apuestaBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.white },

  overlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modal: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.xl, width: '100%', alignItems: 'center', ...Shadows.lg },
  modalEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  modalDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },

  resultBanner: { borderRadius: Radii.md, padding: Spacing.md, width: '100%', alignItems: 'center', marginBottom: Spacing.md },
  resultGano: { backgroundColor: '#DCFCE7' },
  resultPerdio: { backgroundColor: '#FEE2E2' },
  resultBannerText: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textPrimary },

  mascotaDano: { backgroundColor: '#FFF1F2', borderRadius: Radii.md, padding: Spacing.md, width: '100%', marginBottom: Spacing.md },
  mascotaDanoTitle: { fontSize: FontSizes.sm, fontWeight: '800', color: '#BE123C', marginBottom: 4 },
  mascotaDanoDesc: { fontSize: FontSizes.xs, color: '#9F1239', lineHeight: 16 },

  leccionBox: { backgroundColor: Colors.yellowLight, borderRadius: Radii.md, padding: Spacing.md, width: '100%', marginBottom: Spacing.md },
  leccionTitle:{ fontSize: FontSizes.sm, fontWeight: '800', color: Colors.yellowDark, marginBottom: 4 },
  leccionText: { fontSize: FontSizes.xs, color: Colors.yellowDark, lineHeight: 18 },

  saldoNuevo: { fontSize: FontSizes.sm, color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.lg },
  entendidoBtn: { backgroundColor: Colors.pinkMid, borderRadius: Radii.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, width: '100%', alignItems: 'center' },
  entendidoBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.white },

  modalButtons: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  cancelBtn: { flex: 1, height: 52, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCFCE7' },
  cancelText: { fontSize: FontSizes.sm, fontWeight: '700', color: '#065F46' },
  confirmarBtn: { flex: 1, height: 52, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BE123C' },
  confirmarText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.white },

});
