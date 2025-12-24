// RuneKey/src/components/common/AnimatedSectionHeader.tsx
import React, { useEffect } from 'react';
import { Text, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { useThemeColors } from '../../utils/theme';

interface AnimatedSectionHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  delay?: number;
}

export const AnimatedSectionHeader: React.FC<AnimatedSectionHeaderProps> = ({
  title,
  subtitle,
  delay = 0,
  style,
  ...props
}) => {
  const colors = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400 }));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[animatedStyle, { marginBottom: 16 }, style]}
      {...props}
    >
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: subtitle ? 4 : 0,
      }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}>
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );
};

