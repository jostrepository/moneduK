// Diseño del sistema en general: paleta de colores (rosa y amarillo principalmente como identidad de nuestra marca + colores semánticos por módulo), 
// fuentes, tamaños tipográficos, FontWeights, espaciados, radios de borde y sombras predefinidas. Todas las pantallas importan el diseño de este 
// apartado para mantener una consistencia visual.

// Paleta MoneduK

    export const Colors = {
        pink:          '#F472B6',
        pinkLight:     '#FDF2F8',
        pinkMid:       '#EC4899',
        pinkDark:      '#BE185D',
        pinkDeep:      '#9D174D',

        yellow:        '#FBBF24',
        yellowLight:   '#FFFBEB',
        yellowMid:     '#F59E0B',
        yellowDark:    '#B45309',

        background:    '#FFF0F7',
        backgroundAlt: '#FFF8FD',
        card:          '#FFFFFF',
        border:        '#FCE7F3',
        borderMid:     '#F9A8D4',

        textPrimary:   '#1A0A10',
        textSecondary: '#9D174D',
        textMuted:     '#C084B0',
        textLight:     '#F9A8D4',

        excellent:     '#22C55E',
        good:          '#86EFAC',
        regular:       '#FBBF24',
        bad:           '#F97316',
        critical:      '#EF4444',

        trabajos:      '#F59E0B',
        inversiones:   '#6366F1',
        apuestas:      '#F43F5E',
        tienda:        '#10B981',
        misiones:      '#8B5CF6',
        lecciones:     '#3B82F6',

        white:         '#FFFFFF',
        success:       '#22C55E',
        error:         '#EF4444',
        warning:       '#F59E0B',
        info:          '#3B82F6',
        overlay:       'rgba(26,10,16,0.45)',
  };

// Fuente Nunito

    export const Fonts = {
        regular: 'Nunito_400Regular',
        semiBold: 'Nunito_600SemiBold',
        bold: 'Nunito_700Bold',
        extraBold: 'Nunito_800ExtraBold',
        black: 'Nunito_900Black',
  };

// Tamaños de texto

    export const Typography = {
        xs:   11,
        sm:   13,
        md:   15,
        lg:   18,
        xl:   22,
        xxl:  28,
        hero: 38,
  };

// Pesos de fuente (tipados correctamente para TypeScript)

    export const FontWeights = {
        regular: '400' as const,
        medium:  '600' as const,
        bold:    '700' as const,
        black:   '900' as const,
  };

// Alias para compatibilidad con componentes anteriores

    export const FontSizes = Typography;

// Espaciado

    export const Spacing = {
        xs:  4,
        sm:  8,
        md:  16,
        lg:  24,
        xl:  32,
        xxl: 48,
  };

// Bordes redondeados 

    export const Radii = {
        xs:   6,
        sm:   10,
        md:   14,
        lg:   20,
        xl:   28,
        xxl:  36,
        full: 999,
  };

// Sombras

    export const Shadows = {
      sm: {
        shadowColor: '#BE185D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 3,},

      md: {
        shadowColor: '#BE185D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
        elevation: 5, },

      lg: {
        shadowColor: '#BE185D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 9,},

      yellow: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5, },
  };
