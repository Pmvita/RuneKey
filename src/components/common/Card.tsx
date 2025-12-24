import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { logger } from '../../utils/logger';
import { useThemeColors } from '../../utils/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'frost' | 'ice';
  disabled?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  disabled = false,
  className = '',
}) => {
  const colors = useThemeColors();

  const getCardStyle = () => {
    const baseStyle = {
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

  if (onPress) {
    const handlePress = () => {
      logger.logButtonPress('Card', 'pressed', { variant, disabled });
      onPress();
    };

    return (
      <TouchableOpacity
        style={[getCardStyle(), { opacity: disabled ? 0.6 : 1 }]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), { opacity: disabled ? 0.6 : 1 }]}>
      {children}
    </View>
  );
};