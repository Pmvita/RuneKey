// RuneKey/src/components/common/AnimatedSwitch.tsx
import React from 'react';
import { Switch, SwitchProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '../../utils/theme';

interface AnimatedSwitchProps extends SwitchProps {
  delay?: number;
}

export const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({
  value,
  onValueChange,
  delay = 0,
  ...props
}) => {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, delay });
  }, [delay]);

  React.useEffect(() => {
    if (value !== undefined) {
      scale.value = withSpring(1.1, { damping: 10, stiffness: 200 }, () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      });
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.borderDark,
          true: colors.primary,
        }}
        thumbColor={colors.textInverse}
        ios_backgroundColor={colors.borderDark}
        {...props}
      />
    </Animated.View>
  );
};

