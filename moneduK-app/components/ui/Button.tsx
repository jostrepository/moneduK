//Botón con 4 variantes visuales (primary, secondary, outline, danger), estado de carga con spinner, y estado deshabilitado.

import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Fonts, FontSizes, Radii, Shadows } from '../../constants/theme';

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
          ]} >
          {loading
            ? <ActivityIndicator color={variant === 'outline' ? Colors.pinkMid : Colors.white} />
            : <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{label}</Text>
          }
        </TouchableOpacity>
      );
  };



const styles = StyleSheet.create({

  base: {
    height: 54,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    ...Shadows.md, },

  fullWidth: { width: '100%' },

  primary: { backgroundColor: Colors.pinkMid },
  secondary: { backgroundColor: Colors.yellowMid },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.pinkMid, elevation: 0, shadowOpacity: 0 },
  danger: { backgroundColor: Colors.error },
  disabled: { opacity: 0.5 },

  text: { fontFamily: Fonts.black, fontSize: FontSizes.md, letterSpacing: 0.3 },
  primaryText: { color: Colors.white },
  secondaryText: { color: Colors.yellowDark },
  outlineText: { color: Colors.pinkMid },
  dangerText: { color: Colors.white },
  
});
