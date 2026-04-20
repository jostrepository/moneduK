import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes, Radii, Spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?:      string;
  error?:      string;
  icon?:       keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export const Input = ({ label, error, icon, isPassword = false, ...props }: InputProps) => {
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error ? styles.containerError : null]}>
        {icon && (
          <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPass}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Ionicons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper:   { marginBottom: Spacing.md },
  label:     { fontFamily: Fonts.bold, fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: 6 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pinkLight,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 54,
  },
  containerError: { borderColor: Colors.error },
  icon:   { marginRight: Spacing.sm },
  input:  { flex: 1, fontFamily: Fonts.semiBold, fontSize: FontSizes.md, color: Colors.textPrimary },
  eyeBtn: { padding: 4 },
  error:  { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, color: Colors.error, marginTop: 4 },
});
