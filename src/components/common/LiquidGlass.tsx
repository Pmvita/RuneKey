import React, { useCallback, useEffect } from 'react';
import { View, TouchableOpacity, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

interface LiquidGlassProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
  // Glass effect customization
  blurAmount?: number;
  saturation?: number;
  elasticity?: number;
  cornerRadius?: number;
  // Animation settings
  animationDuration?: number;
  springConfig?: {
    damping: number;
    stiffness: number;
  };
  // Interactive effects
  enableTilt?: boolean;
  enablePressEffect?: boolean;
  enableHoverEffect?: boolean;
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  onPress,
  disabled = false,
  className = '',
  style,
  blurAmount = 0.8,
  saturation = 1.2,
  elasticity = 0.15,
  cornerRadius = 16,
  animationDuration = 300,
  springConfig = { damping: 15, stiffness: 150 },
  enableTilt = true,
  enablePressEffect = true,
  enableHoverEffect = true,
}) => {
  // Shared values for animations
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.9);
  const blur = useSharedValue(0);
  const pressProgress = useSharedValue(0);
  const hoverProgress = useSharedValue(0);

  // Note: Tilt effect using gesture handler is disabled due to API compatibility
  // The component now focuses on press effects which work reliably across platforms

  // Press effect animation
  const handlePressIn = useCallback(() => {
    if (enablePressEffect && !disabled) {
      console.log('🎯 LIQUID GLASS: Press in effect triggered');
      scale.value = withSpring(0.95, springConfig);
      pressProgress.value = withSpring(1, springConfig);
      opacity.value = withSpring(1, springConfig);
    }
  }, [enablePressEffect, disabled, scale, pressProgress, opacity, springConfig]);

  const handlePressOut = useCallback(() => {
    if (enablePressEffect && !disabled) {
      scale.value = withSpring(1, springConfig);
      pressProgress.value = withSpring(0, springConfig);
      opacity.value = withSpring(0.9, springConfig);
    }
  }, [enablePressEffect, disabled, scale, pressProgress, opacity, springConfig]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const animatedGlassStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        pressProgress.value,
        [0, 1],
        [0.1, 0.3],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            pressProgress.value,
            [0, 1],
            [1, 1.05],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const animatedBlurStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        hoverProgress.value,
        [0, 1],
        [0.3, 0.6],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            hoverProgress.value,
            [0, 1],
            [1, 1.02],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  // Initialize blur effect
  useEffect(() => {
    blur.value = withTiming(blurAmount, { duration: animationDuration });
  }, [blurAmount, animationDuration]);

  // Add console log to verify component is working
  useEffect(() => {
    console.log('🎯 LIQUID GLASS: Component mounted with props:', {
      blurAmount,
      elasticity,
      cornerRadius,
      enableTilt,
      enablePressEffect
    });
  }, []);

  // Render content based on whether it's pressable
const renderContent = () => {
    const baseContent = (
        <Animated.View style={[animatedContainerStyle, style]}>
            {/* Glass background layer */}
            <Animated.View
            style={[
                {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: cornerRadius,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderWidth: 3,
                borderColor: 'rgba(135, 206, 235, 0.9)',
                shadowColor: '#87CEEB',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 12,
                },
                animatedGlassStyle,
            ]}
            />
            
            {/* Blur overlay layer */}
            <Animated.View
                style={[
                    {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: cornerRadius,
                    backgroundColor: 'white',
                    },
                    animatedBlurStyle,
                ]}
                />
                
                {/* Content */}
                <View style={{ zIndex: 1 }}>{children}</View>
            </Animated.View>
);

    if (onPress && !disabled) {
      return (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{ borderRadius: cornerRadius }}
        >
          {baseContent}
        </TouchableOpacity>
      );
    }

    return baseContent;
  };

  return renderContent();
};
