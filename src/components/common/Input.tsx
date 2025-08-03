import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledTextInput = styled(TextInput);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

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

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const getContainerClasses = () => {
    let classes = 'border rounded-lg px-3 py-3 bg-glass-white dark:bg-glass-dark';
    
    if (error) {
      classes += ' border-red-400/60 bg-red-50/10 dark:bg-red-900/10';
    } else if (isFocused) {
      classes += ' border-frost-400 bg-glass-blue-light shadow-sm';
    } else {
      classes += ' border-glass-frost dark:border-ice-700/50';
    }

    if (disabled) {
      classes += ' bg-glass-white dark:bg-glass-dark opacity-60';
    }

    return classes;
  };

  const getInputClasses = () => {
    let classes = 'flex-1 text-ice-800 dark:text-ice-100 text-base bg-transparent';
    
    if (disabled) {
      classes += ' text-ice-400 dark:text-ice-500';
    }

    return classes;
  };

  return (
    <StyledView className={`${className}`}>
      {label && (
        <StyledText className="text-sm font-medium text-ice-700 dark:text-ice-300 mb-2">
          {label}
        </StyledText>
      )}
      
      <StyledView className={getContainerClasses()}>
        <StyledView className="flex-row items-center">
          {leftElement && (
            <StyledView className="mr-3">
              {leftElement}
            </StyledView>
          )}
          
          <StyledTextInput
            className={getInputClasses()}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
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
          />
          
          {rightElement && (
            <StyledView className="ml-3">
              {rightElement}
            </StyledView>
          )}
        </StyledView>
      </StyledView>
      
      {error && (
        <StyledText className="text-red-500 text-sm mt-1">
          {error}
        </StyledText>
      )}
      
      {helperText && !error && (
        <StyledText className="text-ice-500 dark:text-ice-400 text-sm mt-1">
          {helperText}
        </StyledText>
      )}
    </StyledView>
  );
};