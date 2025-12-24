// RuneKey/src/components/common/AnimatedSettingsCard.tsx
import React, { useEffect } from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { useThemeColors } from '../../utils/theme';

interface AnimatedSettingsCardProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  variant?: 'default' | 'glass' | 'elevated';
}

export const AnimatedSettingsCard: React.FC<AnimatedSettingsCardProps> = ({
  children,
  delay = 0,
  variant = 'default',
  style,
  ...props
}) => {
  const colors = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 150 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 120 }));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: 20,
      padding: 0,
      overflow: 'hidden' as const,
    };

    switch (variant) {
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: colors.backgroundCard,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.backgroundCard,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        };
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[animatedStyle, getCardStyle(), style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

