import React from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { logger } from '../../utils/logger';
import { useThemeColors } from '../../utils/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'frost' | 'ice';
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const colors = useThemeColors();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 16,
      padding: 16,
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
      case 'frost':
        return {
          ...baseStyle,
          backgroundColor: colors.primaryLight + '15',
          borderWidth: 1,
          borderColor: colors.primary + '30',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'ice':
        return {
          ...baseStyle,
          backgroundColor: colors.accentLight + '15',
          borderWidth: 1,
          borderColor: colors.accent + '30',
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: colors.backgroundCard,
          borderWidth: 1,
          borderColor: colors.border,
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
        };
    }
  };

  const cardStyle = [getCardStyle(), { opacity: disabled ? 0.6 : 1 }, style];

  if (onPress) {
    const handlePress = () => {
      if (disabled) return;
      logger.logButtonPress('Card', 'pressed', { variant, disabled });
      onPress();
    };

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        android_ripple={disabled ? undefined : { color: 'rgba(15, 23, 42, 0.08)' }}
        style={({ pressed }) => [
          ...cardStyle,
          // Web + iOS press feedback; Android uses ripple
          pressed && !disabled ? { opacity: 0.85 } : null,
        ]}
      >
        {/* box-none lets presses on empty space hit Pressable; children can opt out */}
        <View pointerEvents="box-none">{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};
