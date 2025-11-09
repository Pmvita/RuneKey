import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  rightElement,
  leftElement,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  onFocus,
  onBlur,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderWidth = useSharedValue(1);
  const scale = useSharedValue(1);

  const handleFocus = () => {
    setIsFocused(true);
    borderWidth.value = withTiming(2, { duration: 200, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(1.02, { duration: 200, easing: Easing.out(Easing.quad) });
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderWidth.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
    onBlur?.();
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyle = () => {
    const baseStyle = {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: 'rgba(30, 41, 59, 0.8)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    };

    if (error) {
      return {
        ...baseStyle,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      };
    } else if (isFocused) {
      return {
        ...baseStyle,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        shadowColor: '#38bdf8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      };
    } else {
      return {
        ...baseStyle,
        borderColor: 'rgba(148, 163, 184, 0.3)',
      };
    }
  };

  const getInputStyle = () => {
    return {
      flex: 1,
      color: '#f1f5f9',
      fontSize: 16,
      backgroundColor: 'transparent',
      paddingVertical: 0,
      paddingHorizontal: 0,
    };
  };

  const getLabelStyle = () => {
    return {
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#cbd5e1',
      marginBottom: 8,
      letterSpacing: 0.5,
    };
  };

  const getErrorStyle = () => {
    return {
      color: '#ef4444',
      fontSize: 12,
      marginTop: 4,
      fontWeight: '500' as const,
    };
  };

  const getHelperStyle = () => {
    return {
      color: '#94a3b8',
      fontSize: 12,
      marginTop: 4,
    };
  };

  return (
    <View style={{ marginBottom: 4 }}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
        </Text>
      )}
      
      <Animated.View style={[getContainerStyle(), containerAnimatedStyle]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftElement && (
            <View style={{ marginRight: 12, opacity: 0.7 }}>
              {leftElement}
            </View>
          )}
          
          <TextInput
            style={getInputStyle()}
            placeholder={placeholder}
            placeholderTextColor="#64748b"
            value={value}
            onChangeText={onChangeText}
            editable={!disabled}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor="#38bdf8"
            cursorColor="#38bdf8"
          />
          
          {rightElement && (
            <View style={{ marginLeft: 12 }}>
              {rightElement}
            </View>
          )}
        </View>
      </Animated.View>
      
      {error && (
        <Text style={getErrorStyle()}>
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text style={getHelperStyle()}>
          {helperText}
        </Text>
      )}
    </View>
  );
};