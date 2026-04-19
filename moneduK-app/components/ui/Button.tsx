import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Radii, FontSizes, Shadows } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button = ({
  label, onPress, variant = 'primary',
  loading = false, disabled = false,
  style, textStyle, fullWidth = true,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'outline' ? Colors.pinkMid : Colors.white} />
        : <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    ...Shadows.md,
  },
  fullWidth: { width: '100%' },

  // Variantes
  primary:   { backgroundColor: Colors.pinkMid },
  secondary: { backgroundColor: Colors.yellow },
  outline:   { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.pinkMid, elevation: 0, shadowOpacity: 0 },
  danger:    { backgroundColor: Colors.error },

  disabled:  { opacity: 0.5 },

  // Textos
  text:          { fontSize: FontSizes.md, fontWeight: '700', letterSpacing: 0.3 },
  primaryText:   { color: Colors.white },
  secondaryText: { color: Colors.yellowDark },
  outlineText:   { color: Colors.pinkMid },
  dangerText:    { color: Colors.white },
});
