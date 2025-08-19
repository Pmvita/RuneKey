import React, { useCallback, useEffect } from 'react';
import { View, TouchableOpacity, ViewStyle, Pressable } from 'react-native';
import { styled } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledPressable = styled(Pressable);

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
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);
  const opacity = useSharedValue(0.9);
  const blur = useSharedValue(0);
  const pressProgress = useSharedValue(0);
  const hoverProgress = useSharedValue(0);

  // Gesture handler for tilt effect
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (enableTilt) {
        hoverProgress.value = withSpring(1, springConfig);
      }
    },
    onActive: (event) => {
      if (enableTilt) {
        // Calculate rotation based on touch position
        const maxRotation = 15;
        rotationX.value = withSpring(
          interpolate(
            event.y,
            [-100, 100],
            [maxRotation, -maxRotation],
            Extrapolate.CLAMP
          ),
          springConfig
        );
        rotationY.value = withSpring(
          interpolate(
            event.x,
            [-100, 100],
            [-maxRotation, maxRotation],
            Extrapolate.CLAMP
          ),
          springConfig
        );
      }
    },
    onEnd: () => {
      if (enableTilt) {
        rotationX.value = withSpring(0, springConfig);
        rotationY.value = withSpring(0, springConfig);
        hoverProgress.value = withSpring(0, springConfig);
      }
    },
  });

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
        { rotateX: `${rotationX.value}deg` },
        { rotateY: `${rotationY.value}deg` },
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
        <GestureHandlerRootView>
            <PanGestureHandler onGestureEvent={gestureHandler} enabled={enableTilt}>
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
                    backgroundColor: '#4e6a71',
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
            </PanGestureHandler>
        </GestureHandlerRootView>
);

    if (onPress && !disabled) {
      return (
        <StyledTouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{ borderRadius: cornerRadius }}
        >
          {baseContent}
        </StyledTouchableOpacity>
      );
    }

    return baseContent;
  };

  return renderContent();
};
