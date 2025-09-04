import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { logger } from '../../utils/logger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'glass' | 'frost' | 'ice';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  className = '',
}) => {
  const getBaseClasses = () => {
    let classes = 'rounded-lg flex-row items-center justify-center';
    
    // Size classes
    switch (size) {
      case 'sm':
        classes += ' px-3 py-2';
        break;
      case 'lg':
        classes += ' px-6 py-4';
        break;
      default:
        classes += ' px-4 py-3';
    }

    // Full width
    if (fullWidth) {
      classes += ' w-full';
    }

    return classes;
  };

  const getVariantClasses = () => {
    if (disabled || loading) {
      return 'bg-glass-white dark:bg-glass-dark border border-glass-white dark:border-glass-light opacity-60';
    }

    switch (variant) {
      case 'glass':
        return 'bg-glass-white dark:bg-glass-dark border border-glass-white dark:border-glass-light';
      case 'frost':
        return 'bg-glass-blue-light border border-glass-frost';
      case 'ice':
        return 'bg-ice-200/20 dark:bg-ice-950/20 border border-ice-300/40 dark:border-ice-700/40';
      case 'secondary':
        return 'bg-glass-light dark:bg-glass-dark-medium border border-glass-white dark:border-glass-light';
      case 'outline':
        return 'border-2 border-frost-400 dark:border-frost-300 bg-glass-blue-light';
      case 'danger':
        return 'bg-red-500 border border-red-400/50 shadow-lg';
      default:
        return 'bg-frost-500 border border-frost-400/50 shadow-lg';
    }
  };

  const getTextClasses = () => {
    let classes = 'font-semibold';

    // Size classes
    switch (size) {
      case 'sm':
        classes += ' text-sm';
        break;
      case 'lg':
        classes += ' text-lg';
        break;
      default:
        classes += ' text-base';
    }

    // Color classes
    if (disabled || loading) {
      classes += ' text-ice-400 dark:text-ice-500';
    } else {
      switch (variant) {
        case 'glass':
          classes += ' text-ice-800 dark:text-ice-100';
          break;
        case 'frost':
          classes += ' text-frost-800 dark:text-frost-100';
          break;
        case 'ice':
          classes += ' text-ice-700 dark:text-ice-200';
          break;
        case 'secondary':
          classes += ' text-ice-700 dark:text-ice-200';
          break;
        case 'outline':
          classes += ' text-frost-600 dark:text-frost-300';
          break;
        default:
          classes += ' text-white';
      }
    }

    return classes;
  };

  const handlePress = () => {
    logger.logButtonPress(title, 'pressed', { variant, size, disabled, loading });
    onPress();
  };

  return (
    <TouchableOpacity
      className={`${getBaseClasses()} ${getVariantClasses()} ${className}`}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <View className="flex-row items-center">
          {icon ? (
            <View className="mr-2">
              {icon}
            </View>
          ) : null}
          <Text className={getTextClasses()}>
            {title || 'Button'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};