import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const HEIGHTS = { sm: 30, md: 28, lg: 52 };

export const Logo = ({ size = 'md' }: LogoProps) => {
  const h = HEIGHTS[size];

  return (
    <View style={styles.wrapper}>
      {/* Cerdito con birrete — imagen real */}
      <Image
        source={require('../../assets/images/logocerditomoneduk.png')}
        style={{ width: h * 2, height: h * 2, borderRadius: 6 }}
        resizeMode="cover"
      />
      {/* Tipografía MoneduK — imagen real */}
      <Image
        source={require('../../assets/images/logotipografiamoneduk.png')}
        style={{ height: h * 4, width: h * 4 }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0.01,
  },
});
