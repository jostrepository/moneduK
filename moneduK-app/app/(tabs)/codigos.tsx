import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Colors, Fonts, Typography, Spacing, Radii, Shadows } from '../../constants/theme';

export default function CodigosVerificacionScreen() {
  // Inicializamos el estado vacío
  const [codigoActivo, setCodigoActivo] = useState<any>(null); 

  useEffect(() => {
    // Forzamos la asignación del código al cargar la pantalla
    const codigosDeEjemplo = ['3492', '0931', '4591', '9012', '7121'];
    const codigoAleatorio = codigosDeEjemplo[Math.floor(Math.random() * codigosDeEjemplo.length)];

    setCodigoActivo({
      tutorEmail: 'johan@gmail.com',
      codigo: codigoAleatorio
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Códigos de verificación</Text>

        {codigoActivo ? (
          <View style={styles.card}>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text style={styles.emailText}>{codigoActivo.tutorEmail}</Text>
            
            <Text style={styles.labelCode}>Código</Text>
            <Text style={styles.codeText}>{codigoActivo.codigo}</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay códigos disponibles</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pinkLight || '#FFD6E0' },
  container: { padding: Spacing.xl, alignItems: 'center', paddingTop: 60 },
  title: { fontFamily: Fonts.black, fontSize: Typography.xl, color: Colors.pinkDark, marginBottom: 40 },
  
  card: { backgroundColor: Colors.white, width: '100%', borderRadius: 30, padding: Spacing.xl, alignItems: 'center', ...Shadows.md },
  label: { fontFamily: Fonts.black, fontSize: Typography.lg, color: Colors.pinkDeep, marginBottom: Spacing.sm },
  emailText: { fontFamily: Fonts.semiBold, fontSize: Typography.md, color: Colors.pinkDeep, marginBottom: Spacing.xl },
  
  labelCode: { fontFamily: Fonts.black, fontSize: Typography.xl, color: Colors.pinkDeep, marginBottom: Spacing.sm },
  codeText: { fontFamily: Fonts.black, fontSize: 40, color: Colors.pinkDeep, letterSpacing: 5 },

  emptyState: { marginTop: 60, padding: 20, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: Radii.lg },
  emptyText: { fontFamily: Fonts.semiBold, fontSize: Typography.md, color: Colors.white, textAlign: 'center' },
});