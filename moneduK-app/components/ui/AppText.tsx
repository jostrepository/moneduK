import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Fonts, Colors, FontSizes } from '../../constants/theme';

/**
 * AppText — reemplaza el <Text> de React Native.
 * Aplica Nunito automáticamente según el peso (fontWeight) indicado.
 *
 * Uso:
 *   <AppText>Texto normal</AppText>
 *   <AppText weight="bold">Texto en negrita</AppText>
 *   <AppText weight="black" size="xl">Título grande</AppText>
 */

type Weight = 'regular' | 'semiBold' | 'bold' | 'extraBold' | 'black';

interface AppTextProps extends TextProps {
  weight?: Weight;
  size?:   number;
  color?:  string;
}

const FONT_MAP: Record<Weight, string> = {
  regular:   Fonts.regular,
  semiBold:  Fonts.semiBold,
  bold:      Fonts.bold,
  extraBold: Fonts.extraBold,
  black:     Fonts.black,
};

export const AppText = ({
  weight = 'regular',
  size,
  color,
  style,
  children,
  ...props
}: AppTextProps) => (
  <Text
    style={[
      { fontFamily: FONT_MAP[weight], fontSize: size, color: color ?? Colors.textPrimary },
      style,
    ]}
    {...props}
  >
    {children}
  </Text>
);

// ─── Variantes predefinidas ───────────────────────────────

export const Heading1 = (props: AppTextProps) => (
  <AppText weight="black" size={FontSizes.hero} {...props} />
);

export const Heading2 = (props: AppTextProps) => (
  <AppText weight="black" size={FontSizes.xxl} {...props} />
);

export const Heading3 = (props: AppTextProps) => (
  <AppText weight="extraBold" size={FontSizes.xl} {...props} />
);

export const Heading4 = (props: AppTextProps) => (
  <AppText weight="bold" size={FontSizes.lg} {...props} />
);

export const BodyText = (props: AppTextProps) => (
  <AppText weight="regular" size={FontSizes.md} {...props} />
);

export const Caption = (props: AppTextProps) => (
  <AppText weight="semiBold" size={FontSizes.sm} color={Colors.textMuted} {...props} />
);

export const Label = (props: AppTextProps) => (
  <AppText weight="bold" size={FontSizes.sm} {...props} />
);
