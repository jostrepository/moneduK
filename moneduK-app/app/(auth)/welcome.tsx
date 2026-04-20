import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Colors, Fonts, FontSizes, Spacing, Radii } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Decoración de fondo */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/images/logocerditomoneduk.png')}
            style={styles.logoCerdito}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/images/logotipografiamoneduk(1).png')}
            style={styles.logoTipo}
            resizeMode="contain"
          />
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Aprende a manejar{'\n'}tu dinero 💰</Text>
          <Text style={styles.heroSubtitle}>
            Cuida a tu cerdito alcancía tomando{'\n'}buenas decisiones financieras
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: '🪙', text: 'Gana KoinK con trabajos y lecciones' },
            { icon: '📈', text: 'Invierte y haz crecer tu dinero' },
            { icon: '🎯', text: 'Completa misiones y logros' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Botones */}
        <View style={styles.buttons}>
          <Button label="¡Comenzar ahora!" onPress={() => router.push('/(auth)/register')} />
          <Button
            label="Ya tengo cuenta"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
            style={{ marginTop: Spacing.sm }}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'space-between', paddingVertical: Spacing.xl },

  circle1: { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: Colors.pink + '28' },
  circle2: { position: 'absolute', top: -30, right: 90, width: 130, height: 130, borderRadius: 65, backgroundColor: Colors.yellow + '35' },

  logoWrap:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg },
  logoCerdito: { width: 44, height: 44, borderRadius: 10 },
  logoTipo:    { height: 26, width: 130 },

  heroSection:  { alignItems: 'center', marginTop: Spacing.lg },
  heroTitle:    { fontFamily: Fonts.black, fontSize: FontSizes.xxl + 2, color: Colors.pinkDark, textAlign: 'center', letterSpacing: -0.5, lineHeight: 36 },
  heroSubtitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },

  features: { gap: Spacing.sm },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radii.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  featureIcon: { fontSize: 22 },
  featureText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, color: Colors.textPrimary, flex: 1 },

  buttons: { paddingBottom: Spacing.md },
});
