import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input }  from '../../components/ui/Input';
import { Logo }   from '../../components/ui/Logo';
import { Colors, Fonts, FontSizes, Spacing, Radii } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email,      setEmail]      = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState<{ email?: string; contrasena?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())           e.email      = 'El correo es requerido';
    else if (!email.includes('@')) e.email    = 'Correo inválido';
    if (!contrasena)               e.contrasena = 'La contraseña es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), contrasena);
      router.replace('/(tabs)/menu');
    } catch (err: any) {
      Alert.alert('Ups 😕', err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>← Volver</Text>
            </TouchableOpacity>
            <Logo size="sm" />
          </View>

          {/* Título */}
          <View style={styles.titleSection}>
            <Text style={styles.emoji}>🐷</Text>
            <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
            <Text style={styles.subtitle}>Tu cerdito te extrañó 💕</Text>
          </View>

          {/* Formulario */}
          <View style={styles.card}>
            <Input
              label="Correo electrónico"
              placeholder="tu@correo.com"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              error={errors.email}
            />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              icon="lock-closed-outline"
              isPassword
              value={contrasena}
              onChangeText={setContrasena}
              error={errors.contrasena}
            />
            <Button label="Iniciar sesión" onPress={handleLogin} loading={loading} style={{ marginTop: Spacing.sm }} />
          </View>

          {/* Registro */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.xl },
  back:      { fontFamily: Fonts.bold, fontSize: FontSizes.sm, color: Colors.textSecondary },

  titleSection: { alignItems: 'center', marginBottom: Spacing.xl },
  emoji:        { fontSize: 64, marginBottom: Spacing.sm },
  title:        { fontFamily: Fonts.black, fontSize: FontSizes.xxl, color: Colors.pinkDark, letterSpacing: -0.3 },
  subtitle:     { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 4 },

  card: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },

  registerRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  registerText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, color: Colors.textMuted },
  registerLink: { fontFamily: Fonts.black, fontSize: FontSizes.sm, color: Colors.pinkMid },
});
