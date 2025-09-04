import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
}) => {
  const [scale, setScale] = useState(1);
  const [ripple, setRipple] = useState({ x: 0, y: 0, active: false });
  const [rotation, setRotation] = useState(0);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      setScale(0.95);
      setRipple({ x: 0, y: 0, active: true });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      setScale(1);
      setTimeout(() => setRipple({ x: 0, y: 0, active: false }), 200);
    }
  };

  // Loading animation
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setRotation(prev => prev + 10);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setRotation(0);
    }
  }, [loading]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'secondary':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'md':
        return 'px-4 py-3 text-base';
      case 'lg':
        return 'px-6 py-4 text-lg';
      default:
        return 'px-4 py-3 text-base';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      className={`rounded-lg font-semibold ${getVariantStyles()} ${getSizeStyles()} ${className} ${
        disabled ? 'opacity-50' : ''
      }`}
      style={{
        transform: [{ scale }],
      }}
    >
      <View className="flex-row items-center justify-center">
        {loading ? (
          <View 
            className="mr-2"
            style={{ transform: [{ rotate: `${rotation}deg` }] }}
          >
            <Ionicons name="refresh" size={16} color="white" />
          </View>
        ) : icon ? (
          <Ionicons name={icon as any} size={16} color="white" className="mr-2" />
        ) : null}
        <Text className="text-white font-semibold">
          {loading ? 'Loading...' : title}
        </Text>
      </View>
      
      {/* Ripple effect */}
      {ripple.active && (
        <View
          className="absolute bg-white opacity-30 rounded-full"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            transform: [{ scale: 0 }],
          }}
        />
      )}
    </TouchableOpacity>
  );
}; 