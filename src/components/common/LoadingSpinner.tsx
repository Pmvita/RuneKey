import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  speed?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color = '#3B82F6',
  strokeWidth = 4,
  speed = 1000,
}) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: speed,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const containerStyle = {
    width: size,
    height: size,
  };

  const spinnerStyle = {
    width: size,
    height: size,
    borderWidth: strokeWidth,
    borderColor: `${color}20`, // 20% opacity for background
    borderTopColor: color,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.spinner, spinnerStyle, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderRadius: 50,
  },
});
