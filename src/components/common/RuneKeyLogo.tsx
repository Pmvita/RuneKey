/**
 * RuneKey Logo - CSS-style Logo Component
 * Designed with premium Indigo to Amber gradient
 * SVG-based with CSS-like styling for crisp rendering
 */

import React from 'react';
import { View, StyleSheet, Text, Animated, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../utils/theme';

export interface RuneKeyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  showText?: boolean;
  showDot?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  style?: any;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 64,
  xxl: 96,
};

export const RuneKeyLogo: React.FC<RuneKeyLogoProps> = ({
  size = 'md',
  showText = true,
  showDot = true,
  color = 'primary',
  style,
}) => {
  const themeColors = useThemeColors();
  const scale = useSharedValue(1);

  const getSize = () => sizeMap[size];
  const getColor = () => {
    switch (color) {
      case 'primary':
        return themeColors.logoPrimary;
      case 'secondary':
        return themeColors.logoSecondary;
      case 'accent':
        return themeColors.accent;
      case 'white':
        return '#FFFFFF';
      default:
        return themeColors.logoPrimary;
    }
  };

  return (
    <View style={[styles.container, { width: getSize(), height: getSize() }, style]}>
      <LinearGradient
        colors={themeColors.gradient}
        style={[
          styles.gradient,
          {
            width: getSize(),
            height: getSize(),
          },
          style,
        ]}
      >
        {/* RuneKey Logo - SVG-style rune symbol */}
        <View
          style={[
            styles.rune,
            {
              width: getSize() * 0.6,
              height: getSize() * 0.6,
            },
          ]}
        >
          {/* Inner glow */}
          <View
            style={[
              styles.runeInner,
              {
                width: getSize() * 0.4,
                height: getSize() * 0.4,
              },
            ]}
          />
          {/* Outer ring */}
          <View
            style={[
              styles.runeRing,
              {
                width: getSize() * 0.5,
                height: getSize() * 0.5,
              },
            ]}
          />
        </View>
      </LinearGradient>
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              width: getSize() * 0.15,
              height: getSize() * 0.15,
            },
          ]}
        >
          <View
            style={[
              styles.dotInner,
              {
                width: getSize() * 0.08,
                height: getSize() * 0.08,
              },
            ]}
          />
        </View>
      )}
      {showText && (
        <Text
          style={[
            styles.text,
            {
              fontSize: size === 'sm' ? 10 : size === 'md' ? 14 : size === 'lg' ? 18 : size === 'xl' ? 22 : 28,
              fontWeight: '600',
            },
          ]}
        >
          RuneKey
        </Text>
      )}
    </View>
  );
};

// Animated version with scale animation
export const RuneKeyLogoAnimated: React.FC<RuneKeyLogoProps> = ({
  size = 'md',
  showText = true,
  showDot = true,
  color = 'primary',
  style,
}) => {
  const scale = useSharedValue(1);
  const themeColors = useThemeColors();

  React.useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.08, { duration: 2000, easing: Easing.out(Easing.quad) }),
      -1,
      true
    );
  }, [scale]);

  const getSize = () => sizeMap[size];

  return (
    <View style={[styles.container, { width: getSize(), height: getSize() }, style]}>
      <LinearGradient
        colors={themeColors.gradient}
        style={[
          styles.gradient,
          {
            width: getSize(),
            height: getSize(),
          },
          style,
        ]}
      >
        <Animated.View
          style={[
            styles.rune,
            {
              width: getSize() * 0.6,
              height: getSize() * 0.6,
            },
            {
              transform: [{ scale: scale }],
            },
          ]}
        >
          <View
            style={[
              styles.runeInner,
              {
                width: getSize() * 0.4,
                height: getSize() * 0.4,
              },
            ]}
          />
          <View
            style={[
              styles.runeRing,
              {
                width: getSize() * 0.5,
                height: getSize() * 0.5,
              },
            ]}
          />
        </Animated.View>
      </LinearGradient>
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              width: getSize() * 0.15,
              height: getSize() * 0.15,
            },
          ]}
        >
          <View
            style={[
              styles.dotInner,
              {
                width: getSize() * 0.08,
                height: getSize() * 0.08,
              },
            ]}
          />
        </View>
      )}
      {showText && (
        <Text
          style={[
            styles.text,
            {
              fontSize: size === 'sm' ? 10 : size === 'md' ? 14 : size === 'lg' ? 18 : size === 'xl' ? 22 : 28,
              fontWeight: '600',
            },
          ]}
        >
          RuneKey
        </Text>
      )}
    </View>
  );
};

// Pure CSS-style logo component (for web/desktop)
export const RuneKeyLogoCSS: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  showText?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  style?: any;
}> = ({ size = 'md', showText = true, color = 'primary', style }) => {
  const themeColors = useThemeColors();
  const getSize = () => sizeMap[size];
  const getColor = () => {
    switch (color) {
      case 'primary':
        return themeColors.logoPrimary;
      case 'secondary':
        return themeColors.logoSecondary;
      case 'accent':
        return themeColors.accent;
      case 'white':
        return '#FFFFFF';
      default:
        return themeColors.logoPrimary;
    }
  };

  const gradientColors = themeColors.gradient;

  return (
    <View style={[styles.container, { width: getSize(), height: getSize() }, style]}>
      <LinearGradient colors={gradientColors} style={[styles.gradient, { width: getSize(), height: getSize() }]}>
        {/* CSS-style rune symbol */}
        <View style={[styles.rune, { width: getSize() * 0.6, height: getSize() * 0.6 }]}>
          <View style={[styles.runeInner, { width: getSize() * 0.4, height: getSize() * 0.4 }]} />
          <View style={[styles.runeRing, { width: getSize() * 0.5, height: getSize() * 0.5 }]} />
        </View>
      </LinearGradient>
      {showDot && (
        <View style={[styles.dot, { width: getSize() * 0.15, height: getSize() * 0.15 }]}>
          <View style={[styles.dotInner, { width: getSize() * 0.08, height: getSize() * 0.08 }]} />
        </View>
      )}
      {showText && (
        <Text style={[styles.text, { fontSize: size === 'sm' ? 10 : size === 'md' ? 14 : size === 'lg' ? 18 : size === 'xl' ? 22 : 28 }]}>
          RuneKey
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  rune: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  runeInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    position: 'absolute',
    top: 2,
    left: 2,
  },
  runeRing: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    position: 'absolute',
    top: 1,
    left: 1,
  },
  dot: {
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: -12,
    right: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dotInner: {
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'Space Grotesk, Inter, sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    ...Platform.select({
      ios: { fontFamily: 'Space Grotesk', fontSize: 14 },
      android: { fontFamily: 'Inter', fontSize: 14 },
    }),
  },
});
