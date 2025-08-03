import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { logger } from '../../utils/logger';

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'frost' | 'ice';
  className?: string;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  className = '',
  disabled = false,
}) => {
  const getCardClasses = () => {
    let classes = 'rounded-xl p-4';

    switch (variant) {
      case 'glass':
        classes += ' bg-glass-white dark:bg-glass-dark border border-glass-white dark:border-glass-light';
        break;
      case 'frost':
        classes += ' bg-glass-blue-light border border-glass-frost';
        break;
      case 'ice':
        classes += ' bg-ice-200/10 dark:bg-ice-950/10 border border-ice-300/30 dark:border-ice-700/30';
        break;
      case 'outlined':
        classes += ' border border-glass-frost dark:border-ice-700/50 bg-glass-white dark:bg-glass-dark';
        break;
      case 'elevated':
        classes += ' bg-white/90 dark:bg-gray-800/90 border border-glass-white dark:border-glass-light shadow-lg';
        break;
      default:
        classes += ' bg-glass-blue-light dark:bg-glass-dark border border-glass-blue dark:border-ice-700/40';
    }

    if (disabled) {
      classes += ' opacity-60';
    }

    return classes;
  };

  if (onPress) {
    const handlePress = () => {
      logger.logButtonPress('Card', 'pressed', { variant, disabled });
      onPress();
    };

    return (
      <StyledTouchableOpacity
        className={`${getCardClasses()} ${className}`}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {children}
      </StyledTouchableOpacity>
    );
  }

  return (
    <StyledView className={`${getCardClasses()} ${className}`}>
      {children}
    </StyledView>
  );
};