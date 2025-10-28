import React from 'react';
import { View, StyleSheet, ViewStyle, Image } from 'react-native';

export type LogoVariant = 'circle' | 'full';

interface LogoProps {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export default function Logo({ 
  variant = 'circle', 
  width, 
  height, 
  style 
}: LogoProps) {
  // Default dimensions based on variant
  const defaultWidth = variant === 'circle' ? 100 : 200;
  const defaultHeight = variant === 'circle' ? 100 : 70;
  
  const logoWidth = width || defaultWidth;
  const logoHeight = height || defaultHeight;

  // PNG sources
  const logoSources = {
    circle: require('../../assets/logo-circle3.png'),
    full: require('../../assets/logo-full.png'),
  };

  return (
    <View style={[styles.container, { width: logoWidth, height: logoHeight }, style]}>
      <Image
        source={logoSources[variant]}
        style={{ width: logoWidth, height: logoHeight }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
