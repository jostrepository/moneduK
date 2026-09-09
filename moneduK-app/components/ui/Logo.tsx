//Muestra el logotipo de MoneduK en 3 tamaños.

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

    interface LogoProps {
      size?: 'sm' | 'md' | 'lg';
  }

    const HEIGHTS = { sm: 30, md: 38, lg: 52 };

    export const Logo = ({ size = 'md' }: LogoProps) => {
      const h = HEIGHTS[size];

      return (
        <View style={styles.wrapper}>

      {/* Cerdito con birrete — imagen real */}

          <Image
            source={require('../../assets/images/logocerditomoneduk.png')}
            style={{ width: h * 2.1, height: h * 2, borderRadius: 6 }}
            resizeMode="cover"/>

      {/* Tipografía MoneduK — imagen real */}

          <Image
            source={require('../../assets/images/logotipografiamoneduk(1).png')}
            style={{ height: h*0.9 , width: h*3.8 }}
            resizeMode="cover"/>
        </View>
      );
  };



  const styles = StyleSheet.create({
  
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, },

});
