import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomLoadingAnimationProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'fullscreen' | 'inline' | 'overlay';
  backgroundColor?: string;
  spinnerColor?: string;
}

// Generate random positions for floating circles
const generateCirclePositions = (count: number) => {
  return Array.from({ length: count }, () => ({
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    size: Math.random() * 120 + 20,
    opacity: Math.random() * 0.3 + 0.1,
    delay: Math.random() * 2000,
  }));
};

const FloatingCircle: React.FC<{
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
}> = ({ x, y, size, opacity, delay }) => {
  const scale = useSharedValue(0.8);
  const opacityAnim = useSharedValue(0);

  useEffect(() => {
    // Delayed start
    const startTimer = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, {
            duration: 3000 + Math.random() * 2000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.8, {
            duration: 3000 + Math.random() * 2000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );

      opacityAnim.value = withRepeat(
        withSequence(
          withTiming(opacity, {
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(opacity * 0.5, {
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacityAnim.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderWidth: 1,
          borderColor: 'rgba(59, 130, 246, 0.2)',
        },
        animatedStyle,
      ]}
    />
  );
};

const LoadingSpinner: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: size * 0.1,
            borderColor: `${color}30`,
            borderTopColor: color,
            borderRightColor: color,
          },
          spinnerStyle,
        ]}
      />
    </View>
  );
};

export const CustomLoadingAnimation: React.FC<CustomLoadingAnimationProps> = ({
  message = 'Loading...',
  size = 'medium',
  variant = 'fullscreen',
  backgroundColor = '#0F172A',
  spinnerColor = '#3B82F6',
}) => {
  const [circles] = React.useState(() => generateCirclePositions(15));

  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80,
  };

  const spinnerSize = sizeMap[size];

  const containerStyle = [
    styles.container,
    variant === 'fullscreen' && styles.fullscreen,
    variant === 'overlay' && styles.overlay,
    variant === 'inline' && styles.inline,
    { backgroundColor },
  ];

  return (
    <View style={containerStyle}>
      {/* Floating circles background */}
      {variant === 'fullscreen' || variant === 'overlay' ? (
        <>
          {circles.map((circle, index) => (
            <FloatingCircle key={index} {...circle} />
          ))}
        </>
      ) : null}

      {/* Loading content */}
      <View style={styles.content}>
        <LoadingSpinner size={spinnerSize} color={spinnerColor} />
        {message && (
          <Text style={[styles.message, { color: '#FFFFFF' }]}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 1000,
  },
  inline: {
    padding: 40,
    minHeight: 200,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

