//Permite invertir saldo en distintos tipos con rendimiento %, ver inversiones activas con cuenta regresiva y cobrarlas al vencer.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { inversionService, walletService } from '../../services/api';
import { Colors, FontSizes, Spacing, Radii, Shadows } from '../../constants/theme';

    interface TipoInversion {
        id_tipo_inv: number;
        nombre: string;
        descripcion: string;
        rendimiento_pct: number;
  }

    interface Inversion {
        id_inversion: number;
        monto_invertido: number;
        rendimiento_esperado: number;
        fecha_inicio: string;
        fecha_vencimiento: string;
        estado: string;
        tipo: string;
        rendimiento_pct: number;
        horas_restantes: number;
  }

    export default function InversionesScreen() {
        const [tipos, setTipos] = useState<TipoInversion[]>([]);
        const [inversiones, setInversiones] = useState<Inversion[]>([]);
        const [saldo, setSaldo] = useState(0);
        const [loading, setLoading] = useState(true);
        const [modalVisible, setModalVisible] = useState(false);
        const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoInversion | null>(null);
        const [monto, setMonto] = useState('');
        const [creando, setCreando] = useState(false);
        const [cobrando, setCobrando] = useState<number | null>(null);

      const fetchData = async () => {
        try {
          const [tRes, iRes, wRes] = await Promise.all([
            inversionService.getTipos(),
            inversionService.getMisInversiones(),
            walletService.getMiWallet(),
          ]);
          setTipos(tRes.data.data);
          setInversiones(iRes.data.data);
          setSaldo(Number(wRes.data.data.saldo));
        } catch {
          Alert.alert('Error', 'No se pudieron cargar las inversiones');
        } finally {
          setLoading(false);
        }
    };

      useEffect(() => { fetchData(); }, []);

      const abrirModal = (tipo: TipoInversion) => {
        setTipoSeleccionado(tipo);
        setMonto('');
        setModalVisible(true);
    };

      const handleCrear = async () => {
        const montoNum = parseFloat(monto);
        if (!montoNum || montoNum <= 0) {
          Alert.alert('Error', 'Ingresa un monto válido'); return;
        }
        if (montoNum > saldo) {
          Alert.alert('KoinK insuficientes', `Tienes ${saldo.toFixed(0)} KoinK disponibles`); return;
        }
        setCreando(true);
        try {
          await inversionService.crearInversion(tipoSeleccionado!.id_tipo_inv, montoNum);
          setModalVisible(false);
          await fetchData();
          Alert.alert('¡Inversión creada! 📈', `Invertiste ${montoNum} KoinK en "${tipoSeleccionado!.nombre}". ¡Tu dinero está creciendo!`);
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'No se pudo crear la inversión');
        } finally {
          setCreando(false);
        }
    };

      const handleCobrar = async (inv: Inversion) => {
        if (inv.horas_restantes > 0) {
          Alert.alert('Aún no vence', `Faltan ${inv.horas_restantes} horas para poder cobrar esta inversión.`);
          return;
        }
        setCobrando(inv.id_inversion);
        try {
          const res = await inversionService.cobrarInversion(inv.id_inversion);
          const data = res.data.data;
          await fetchData();
          Alert.alert(
            '¡Cobro exitoso! 🎉',
            `Recibiste ${data.total_cobrado.toFixed(2)} KoinK\n(${data.monto_invertido} invertido + ${data.rendimiento.toFixed(2)} de ganancia)`
          );
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'No se pudo cobrar');
        } finally {
          setCobrando(null);
        }
    };

      const rendimientoPreview = tipoSeleccionado && monto
        ? (parseFloat(monto) * tipoSeleccionado.rendimiento_pct / 100).toFixed(2)
        : '0.00';

      if (loading) {
        return (
          <SafeAreaView style={styles.safe}>
            <ActivityIndicator size="large" color={Colors.pinkMid} style={{ marginTop: 80 }} />
          </SafeAreaView>
        );
    }

      const activas = inversiones.filter(i => i.estado === 'activa');
      const historial = inversiones.filter(i => i.estado !== 'activa');

      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}

            <View style={styles.header}>
              <Text style={styles.title}>Inversiones 📈</Text>
              <View style={styles.saldoBadge}>
                <Text style={styles.saldoText}>🪙 {Number(saldo).toFixed(0)}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Haz crecer tu dinero con el tiempo</Text>

        {/* Tip educativo */}

            <View style={styles.tip}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Invertir significa poner tu dinero a trabajar para ti. A diferencia de apostar, las inversiones tienen un rendimiento seguro y predecible.
              </Text>
            </View>

        {/* Tipos de inversión */}

            <Text style={styles.sectionTitle}>Elige dónde invertir</Text>
            {tipos.map(tipo => (
              <TouchableOpacity
                key={tipo.id_tipo_inv}
                style={styles.tipoCard}
                onPress={() => abrirModal(tipo)}
              >
                <View style={styles.tipoIconWrap}>
                  <Text style={styles.tipoIcon}>
                    {tipo.rendimiento_pct <= 5 ? '🏦' : tipo.rendimiento_pct <= 12 ? '📊' : '🚀'}
                  </Text>
                </View>
                <View style={styles.tipoInfo}>
                  <Text style={styles.tipoNombre}>{tipo.nombre}</Text>
                  <Text style={styles.tipoDesc} numberOfLines={2}>{tipo.descripcion}</Text>
                </View>
                <View style={styles.rendimientoBadge}>
                  <Text style={styles.rendimientoText}>+{tipo.rendimiento_pct}%</Text>
                </View>
              </TouchableOpacity>
            ))}

        {/* Inversiones activas */}

            {activas.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Mis inversiones activas</Text>
                {activas.map(inv => (
                  <View key={inv.id_inversion} style={styles.invCard}>
                    <View style={styles.invHeader}>
                      <Text style={styles.invTipo}>{inv.tipo}</Text>
                      <View style={[styles.estadoBadge, inv.horas_restantes <= 0 ? styles.estadoListo : null]}>
                        <Text style={[styles.estadoText, inv.horas_restantes <= 0 ? styles.estadoListoText : null]}>
                          {inv.horas_restantes <= 0 ? '¡Listo para cobrar!' : `${inv.horas_restantes}h restantes`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.invStats}>
                      <View style={styles.invStat}>
                        <Text style={styles.invStatVal}>🪙 {Number(inv.monto_invertido).toFixed(0)}</Text>
                        <Text style={styles.invStatLabel}>Invertido</Text>
                      </View>
                      <Text style={styles.invPlus}>+</Text>
                      <View style={styles.invStat}>
                        <Text style={[styles.invStatVal, { color: Colors.excellent }]}>
                          🪙 {Number(inv.rendimiento_esperado).toFixed(2)}
                        </Text>
                        <Text style={styles.invStatLabel}>Ganancia</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.cobrarBtn, inv.horas_restantes > 0 && styles.cobrarBtnDisabled]}
                      onPress={() => handleCobrar(inv)}
                      disabled={cobrando !== null}
                    >
                      {cobrando === inv.id_inversion
                        ? <ActivityIndicator color={Colors.white} size="small" />
                        : <Text style={styles.cobrarBtnText}>
                            {inv.horas_restantes <= 0 ? 'Cobrar ahora 💰' : 'Aún no vence'}
                          </Text>
                      }
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

        {/* Historial */}
            
            {historial.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Historial</Text>
                {historial.map(inv => (
                  <View key={inv.id_inversion} style={[styles.invCard, styles.invCardDone]}>
                    <Text style={styles.invTipo}>{inv.tipo}</Text>
                    <Text style={styles.invHistorial}>
                      Cobrado: 🪙 {(Number(inv.monto_invertido) + Number(inv.rendimiento_esperado)).toFixed(2)} KoinK
                    </Text>
                  </View>
                ))}
              </>
            )}

          </ScrollView>

      {/* Modal crear inversión */}

          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.overlay}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Invertir en</Text>
                <Text style={styles.modalTipoNombre}>{tipoSeleccionado?.nombre}</Text>
                <Text style={styles.modalTipoDesc}>{tipoSeleccionado?.descripcion}</Text>

                <View style={styles.montoWrap}>
                  <Text style={styles.montoLabel}>¿Cuántos KoinK quieres invertir?</Text>
                  <TextInput
                    style={styles.montoInput}
                    placeholder="Ej: 100"
                    keyboardType="numeric"
                    value={monto}
                    onChangeText={setMonto}
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.disponible}>Disponibles: 🪙 {Number(saldo).toFixed(0)}</Text>
                </View>

                {monto !== '' && parseFloat(monto) > 0 && (
                  <View style={styles.preview}>
                    <Text style={styles.previewText}>
                      Ganarás 🪙 {rendimientoPreview} KoinK en 24h
                    </Text>
                    <Text style={styles.previewTotal}>
                      Total a cobrar: 🪙 {(parseFloat(monto) + parseFloat(rendimientoPreview)).toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmarBtn, creando && styles.btnDisabled]}
                    onPress={handleCrear}
                    disabled={creando}
                  >
                    {creando
                      ? <ActivityIndicator color={Colors.white} size="small" />
                      : <Text style={styles.confirmarBtnText}>Invertir 📈</Text>
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  saldoBadge: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.yellow + '80' },
  saldoText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.yellowDark },
  subtitle: { fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.md },

  tip: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: '#EEF2FF', borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.lg, alignItems: 'flex-start' },
  tipIcon: { fontSize: 20 },
  tipText: { flex: 1, fontSize: FontSizes.xs, color: '#3730A3', lineHeight: 18 },

  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md },

  tipoCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: Spacing.sm, ...Shadows.sm },
  tipoIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  tipoIcon: { fontSize: 24 },
  tipoInfo: { flex: 1 },
  tipoNombre: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textPrimary },
  tipoDesc: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  rendimientoBadge: { backgroundColor: '#DCFCE7', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 6 },
  rendimientoText: { fontSize: FontSizes.sm, fontWeight: '900', color: '#065F46' },

  invCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  invCardDone: { backgroundColor: '#F0FDF4', borderColor: Colors.excellent + '40' },
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  invTipo: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textPrimary },
  estadoBadge: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  estadoListo: { backgroundColor: '#DCFCE7' },
  estadoText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.yellowDark },
  estadoListoText: { color: '#065F46' },
  invStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, marginBottom: Spacing.md },
  invStat: { alignItems: 'center' },
  invStatVal: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textPrimary },
  invStatLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
  invPlus: { fontSize: FontSizes.xl, color: Colors.textMuted, fontWeight: '300' },
  invHistorial: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },

  cobrarBtn: { backgroundColor: Colors.excellent, borderRadius: Radii.full, height: 44, alignItems: 'center', justifyContent: 'center' },
  cobrarBtnDisabled: { backgroundColor: Colors.textMuted },
  cobrarBtnText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.white },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.white, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: Spacing.xl, ...Shadows.lg },
  modalTitle: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center' },
  modalTipoNombre:{ fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  modalTipoDesc: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.lg },

  montoWrap: { marginBottom: Spacing.md },
  montoLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  montoInput: { backgroundColor: Colors.pinkLight, borderRadius: Radii.md, borderWidth: 1.5, borderColor: Colors.border, height: 52, paddingHorizontal: Spacing.md, fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary },
  disponible: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 6 },

  preview: { backgroundColor: '#EEF2FF', borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md, alignItems: 'center' },
  previewText: { fontSize: FontSizes.sm, color: '#3730A3', fontWeight: '600' },
  previewTotal: { fontSize: FontSizes.md, color: '#3730A3', fontWeight: '900', marginTop: 4 },

  modalButtons: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: { flex: 1, height: 52, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
  cancelBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMuted },
  confirmarBtn: { flex: 1, height: 52, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3730A3' },
  confirmarBtnText:{ fontSize: FontSizes.md, fontWeight: '700', color: Colors.white },
  btnDisabled: { opacity: 0.6 },

});
