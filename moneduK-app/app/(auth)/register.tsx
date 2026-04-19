import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input }  from '../../components/ui/Input';
import { Colors, FontSizes, Spacing, Radii } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', contrasena: '', confirmar: '',
  });
  const [rol,     setRol]     = useState<1 | 2>(1); // 1=estudiante, 2=tutor
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const set = (key: string) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim())    e.nombre    = 'El nombre es requerido';
    if (!form.apellido.trim())  e.apellido  = 'El apellido es requerido';
    if (!form.email.includes('@')) e.email  = 'Correo inválido';
    if (form.contrasena.length < 6) e.contrasena = 'Mínimo 6 caracteres';
    if (form.contrasena !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        nombre:    form.nombre.trim(),
        apellido:  form.apellido.trim(),
        email:     form.email.trim().toLowerCase(),
        contrasena: form.contrasena,
        id_rol:    rol,
      });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const msg = JSON.stringify(err.response?.data) || err.message || 'Error al registrarse';
console.log('ERROR COMPLETO:', JSON.stringify(err));
      Alert.alert('Ups 😕', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>✨</Text>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>¡Tu cerdito te espera!</Text>
          </View>

          {/* Selector de rol */}
          <View style={styles.rolContainer}>
            {([
              { id: 1, label: '👧 Soy estudiante', desc: '9 a 16 años' },
              { id: 2, label: '👨‍👩‍👧 Soy tutor',    desc: 'Padre / Madre' },
            ] as const).map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.rolBtn, rol === r.id && styles.rolBtnActive]}
                onPress={() => setRol(r.id)}
              >
                <Text style={[styles.rolLabel, rol === r.id && styles.rolLabelActive]}>{r.label}</Text>
                <Text style={[styles.rolDesc,  rol === r.id && styles.rolDescActive]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input label="Nombre" placeholder="Sofía" value={form.nombre}
                  onChangeText={set('nombre')} error={errors.nombre} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Apellido" placeholder="Ramírez" value={form.apellido}
                  onChangeText={set('apellido')} error={errors.apellido} />
              </View>
            </View>

            <Input label="Correo electrónico" placeholder="tu@correo.com"
              icon="mail-outline" keyboardType="email-address"
              value={form.email} onChangeText={set('email')} error={errors.email} />

            <Input label="Contraseña" placeholder="Mínimo 6 caracteres"
              icon="lock-closed-outline" isPassword
              value={form.contrasena} onChangeText={set('contrasena')} error={errors.contrasena} />

            <Input label="Confirmar contraseña" placeholder="Repite tu contraseña"
              icon="shield-checkmark-outline" isPassword
              value={form.confirmar} onChangeText={set('confirmar')} error={errors.confirmar} />

            <Button
              label="Crear mi cuenta 🐷"
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
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

  backBtn:  { marginTop: Spacing.md, marginBottom: Spacing.md },
  backText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: Spacing.lg },
  emoji:    { fontSize: 48, marginBottom: Spacing.xs },
  title:    { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.pinkDark },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 4 },

  rolContainer: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  rolBtn: {
    flex: 1, borderRadius: Radii.md, padding: Spacing.md, alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border,
  },
  rolBtnActive:   { borderColor: Colors.pinkMid, backgroundColor: Colors.pinkLight },
  rolLabel:       { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textMuted },
  rolLabelActive: { color: Colors.pinkDark },
  rolDesc:        { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  rolDescActive:  { color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.white, borderRadius: Radii.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  row: { flexDirection: 'row' },

  loginRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  loginText: { fontSize: FontSizes.sm, color: Colors.textMuted },
  loginLink: { fontSize: FontSizes.sm, color: Colors.pinkMid, fontWeight: '700' },
});
