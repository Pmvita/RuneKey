import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { logger } from '../../utils/logger';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'frost' | 'ice';
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  disabled = false,
}) => {
  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: 16,
      padding: 16,
    };

    switch (variant) {
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
        };
      case 'frost':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(56, 189, 248, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(186, 230, 253, 0.3)',
          shadowColor: '#38bdf8',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'ice':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(186, 230, 253, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(186, 230, 253, 0.2)',
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderWidth: 1,
          borderColor: 'rgba(186, 230, 253, 0.3)',
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(56, 189, 248, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(56, 189, 248, 0.2)',
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