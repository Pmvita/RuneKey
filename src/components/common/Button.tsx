import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { logger } from '../../utils/logger';
import { useThemeColors } from '../../utils/theme';

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
  const colors = useThemeColors();

  const getButtonStyle = () => {
    const baseStyle: any = {
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled || loading ? 0.6 : 1,
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 8;
        break;
      case 'lg':
        baseStyle.paddingHorizontal = 24;
        baseStyle.paddingVertical = 16;
        break;
      default:
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 12;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    // Variant styles
    if (disabled || loading) {
      baseStyle.backgroundColor = colors.backgroundSecondary;
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.border;
    } else {
      switch (variant) {
        case 'glass':
          baseStyle.backgroundColor = colors.glass;
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.border;
          break;
        case 'frost':
          baseStyle.backgroundColor = colors.primaryLight + '20';
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.primary + '40';
          break;
        case 'ice':
          baseStyle.backgroundColor = colors.accentLight + '20';
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.accent + '40';
          break;
        case 'secondary':
          baseStyle.backgroundColor = colors.backgroundSecondary;
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.border;
          break;
        case 'outline':
          baseStyle.backgroundColor = 'transparent';
          baseStyle.borderWidth = 2;
          baseStyle.borderColor = colors.primary;
          break;
        case 'danger':
          baseStyle.backgroundColor = colors.error;
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.errorLight;
          break;
        default:
          baseStyle.backgroundColor = colors.primary;
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.primaryDark;
          baseStyle.shadowColor = colors.shadow;
          baseStyle.shadowOffset = { width: 0, height: 4 };
          baseStyle.shadowOpacity = 0.2;
          baseStyle.shadowRadius = 8;
          baseStyle.elevation = 4;
      }
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any = {
      fontWeight: '600',
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.fontSize = 14;
        break;
      case 'lg':
        baseStyle.fontSize = 18;
        break;
      default:
        baseStyle.fontSize = 16;
    }

    // Color styles
    if (disabled || loading) {
      baseStyle.color = colors.textTertiary;
    } else {
      switch (variant) {
        case 'glass':
        case 'frost':
        case 'ice':
        case 'secondary':
          baseStyle.color = colors.textPrimary;
          break;
        case 'outline':
          baseStyle.color = colors.primary;
          break;
        case 'danger':
          baseStyle.color = colors.textInverse;
          break;
        default:
          baseStyle.color = colors.textInverse;
      }
    }

    return baseStyle;
  };

  const handlePress = () => {
    logger.logButtonPress(title, 'pressed', { variant, size, disabled, loading });
    onPress();
  };

  const buttonStyle = getButtonStyle();
  const textStyle = getTextStyle();

  return (
    <TouchableOpacity
      style={[buttonStyle, fullWidth && { width: '100%' }]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={textStyle.color || colors.textInverse} 
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon ? (
            <View style={{ marginRight: 8 }}>
              {icon}
            </View>
          ) : null}
          <Text style={textStyle}>
            {title || 'Button'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};