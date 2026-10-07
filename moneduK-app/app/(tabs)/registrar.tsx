import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Typography, Spacing, Radii } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { agregarEstudiante } from '../../data/estudiantesStore';

export default function RegistrarEstudianteScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailValido, setEmailValido] = useState(false);
  
  const [codigo, setCodigo] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(120); // 2 minutos en segundos
  const [codigoExpirado, setCodigoExpirado] = useState(false);

// Temporizador de 2 minutos
  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>; 
    
    if (emailValido && tiempoRestante > 0) {
      intervalo = setInterval(() => setTiempoRestante((prev) => prev - 1), 1000);
    } else if (tiempoRestante === 0) {
      setCodigoExpirado(true);
    }
    
    // 2. Agrega una pequeña validación al limpiar
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [emailValido, tiempoRestante]);

  // Simulación de validación de correo en la base de datos
  const verificarCorreo = async () => {
    if (!email.includes('@')) return Alert.alert('Error', 'Ingresa un correo válido');
    
    // AQUÍ VA LA LLAMADA AL BACKEND: const res = await api.verificarEmail(email);
    // Si existe:
    setEmailValido(true);
    setTiempoRestante(120);
    setCodigoExpirado(false);
    setCodigo('');
  };

  const generarNuevoCodigo = () => {
    // AQUÍ VA LA LLAMADA AL BACKEND PARA REENVIAR EL CÓDIGO
    setTiempoRestante(120);
    setCodigoExpirado(false);
    setCodigo('');
  };

  const handleKeyPress = (num: string) => {
    if (num === 'del') {
      setCodigo(prev => prev.slice(0, -1));
    } else if (codigo.length < 4) {
      setCodigo(prev => prev + num);
    }
  };

const verificarCodigoFinal = () => {
    if (codigo.length !== 4) return Alert.alert('Error', 'Completa los 4 dígitos');
    if (codigoExpirado) return Alert.alert('Error', 'El código ha expirado');
    
    const codigosValidos = ['3591', '8492', '4280', '9118', '7948'];

    if (codigosValidos.includes(codigo)) {
      // Agregamos al estudiante directamente al almacén global
      agregarEstudiante({
        id: Date.now(),
        nombre: 'Valentina Fajardo',
        correo: email,
        mascota: 'Porky',
        nivel: 2,
        salud: 90,
        koink: 1250
      });

      Alert.alert('¡Éxito!', 'Estudiante vinculado correctamente');
      router.replace('/(tabs)/menu'); 
    } else {
      Alert.alert('Error', 'Código incorrecto o no coincide con el estudiante');
    }
  };

  const formatoTiempo = () => {
    const min = Math.floor(tiempoRestante / 60);
    const sec = tiempoRestante % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Sección Superior: Correo */}
        <Text style={styles.title}>Registrar estudiantes</Text>
        <Text style={styles.subtitle}>Ingresa el correo electrónico del estudiante</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="estudiante@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!emailValido}
          />
          {!emailValido && (
            <TouchableOpacity style={styles.checkBtn} onPress={verificarCorreo}>
              <Text style={styles.checkBtnText}>✓</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sección Inferior: Verificación (Solo visible si el correo es válido) */}
        {emailValido && (
          <View style={styles.verifySection}>
            <Text style={styles.title}>Verificar usuario</Text>
            <Text style={styles.subtitle}>Ingresa el codigo de 4 dígitos{'\n'}enviado al usuario</Text>
            
            {/* Display de 4 dígitos */}
            <View style={styles.codeDisplay}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={styles.codeSlot}>
                  <Text style={styles.codeDigit}>{codigo[i] || ''}</Text>
                </View>
              ))}
            </View>

            {/* Temporizador o Botón de reenvío */}
            {codigoExpirado ? (
              <TouchableOpacity onPress={generarNuevoCodigo} style={{ marginBottom: 20 }}>
                <Text style={styles.resendText}>Generar nuevo código</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>Expira en: {formatoTiempo()}</Text>
            )}

            {/* Teclado Numérico */}
            <View style={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', ''].map((key, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.keyBtn, key === '' && { backgroundColor: 'transparent' }]}
                  onPress={() => key !== '' && handleKeyPress(key)}
                  disabled={key === '' || codigoExpirado}
                >
                  <Text style={styles.keyText}>{key === 'del' ? '⌫' : key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botón Verde Inferior */}
            <TouchableOpacity style={styles.verifyBtn} onPress={verificarCodigoFinal}>
              <Text style={styles.verifyBtnText}>verificar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pinkLight || '#FFD6E0' },
  container: { flex: 1, padding: Spacing.xl, alignItems: 'center', paddingTop: 60 },
  title: { fontFamily: Fonts.black, fontSize: Typography.xl, color: Colors.pinkDeep, marginBottom: Spacing.sm },
  subtitle: { fontFamily: Fonts.semiBold, fontSize: Typography.sm, color: Colors.pinkDeep, textAlign: 'center', marginBottom: Spacing.lg },
  
  inputRow: { flexDirection: 'row', width: '100%', gap: 10 },
  input: { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.full, paddingHorizontal: 20, height: 50, fontFamily: Fonts.semiBold },
  checkBtn: { backgroundColor: Colors.success || '#06D6A0', width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  checkBtnText: { color: Colors.white, fontSize: 24, fontWeight: 'bold' },

  verifySection: { flex: 1, width: '100%', alignItems: 'center', marginTop: 40 },
  codeDisplay: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  codeSlot: { width: 50, height: 60, borderBottomWidth: 4, borderBottomColor: Colors.pinkDeep, alignItems: 'center', justifyContent: 'center' },
  codeDigit: { fontFamily: Fonts.black, fontSize: 32, color: Colors.pinkDeep },
  
  timerText: { fontFamily: Fonts.bold, color: Colors.pinkDeep, marginBottom: 20 },
  resendText: { fontFamily: Fonts.black, color: Colors.pinkDeep, textDecorationLine: 'underline', fontSize: Typography.md },

  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 260, gap: 10, marginBottom: 30 },
  keyBtn: { width: 70, height: 60, backgroundColor: Colors.white, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: Fonts.black, fontSize: 28, color: Colors.pinkDeep },

  verifyBtn: { backgroundColor: Colors.success || '#06D6A0', paddingVertical: 15, paddingHorizontal: 60, borderRadius: Radii.full },
  verifyBtnText: { fontFamily: Fonts.black, color: Colors.white, fontSize: Typography.lg },
});