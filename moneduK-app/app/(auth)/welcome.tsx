import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Colors, FontSizes, Spacing, Radii } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header decorativo */}
        <View style={styles.topDecoration}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
        </View>

        {/* Mascota y título */}
        <View style={styles.heroSection}>
          <Text style={styles.pigEmoji}>🐷</Text>
          <Text style={styles.title}>MoneduK</Text>
          <Text style={styles.subtitle}>
            ¡Aprende a manejar tu dinero{'\n'}y cuida a tu cerdito alcancía!
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: '💰', text: 'Gana KoinK con trabajos y lecciones' },
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

  topDecoration: { position: 'absolute', top: 0, right: 0, left: 0, height: 200, overflow: 'hidden' },
  circle1: {
    position: 'absolute', top: -80, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.pink + '30',
  },
  circle2: {
    position: 'absolute', top: -40, right: 80,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: Colors.yellow + '40',
  },

  heroSection: { alignItems: 'center', marginTop: Spacing.xxl },
  pigEmoji:    { fontSize: 90, marginBottom: Spacing.md },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: '900',
    color: Colors.pinkDark,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },

  features: { gap: Spacing.sm, marginVertical: Spacing.lg },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIcon: { fontSize: 24 },
  featureText: { fontSize: FontSizes.sm, color: Colors.textPrimary, fontWeight: '500', flex: 1 },

  buttons: { gap: 0, paddingBottom: Spacing.md },
});
