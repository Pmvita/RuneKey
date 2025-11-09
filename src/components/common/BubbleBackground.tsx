import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing,
  interpolate
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  opacity: number;
  color: string;
}

const bubbles: Bubble[] = [
  // Large bubbles - subtle highlights
  { id: 1, size: 150, x: screenWidth * 0.1, y: screenHeight * 0.2, delay: 0, duration: 8000, opacity: 0.4, color: 'rgba(255, 255, 255, 0.12)' },
  { id: 2, size: 100, x: screenWidth * 0.8, y: screenHeight * 0.3, delay: 2000, duration: 10000, opacity: 0.35, color: 'rgba(148, 163, 184, 0.25)' },
  { id: 3, size: 120, x: screenWidth * 0.2, y: screenHeight * 0.7, delay: 4000, duration: 12000, opacity: 0.45, color: 'rgba(226, 232, 240, 0.18)' },

  // Medium bubbles
  { id: 4, size: 80, x: screenWidth * 0.7, y: screenHeight * 0.1, delay: 1000, duration: 9000, opacity: 0.5, color: 'rgba(59, 130, 246, 0.18)' },
  { id: 5, size: 70, x: screenWidth * 0.3, y: screenHeight * 0.5, delay: 3000, duration: 11000, opacity: 0.4, color: 'rgba(148, 163, 184, 0.2)' },
  { id: 6, size: 90, x: screenWidth * 0.9, y: screenHeight * 0.6, delay: 5000, duration: 13000, opacity: 0.35, color: 'rgba(14, 116, 144, 0.2)' },

  // Small bubbles
  { id: 7, size: 50, x: screenWidth * 0.5, y: screenHeight * 0.2, delay: 1500, duration: 7000, opacity: 0.45, color: 'rgba(148, 163, 184, 0.3)' },
  { id: 8, size: 40, x: screenWidth * 0.1, y: screenHeight * 0.8, delay: 2500, duration: 8500, opacity: 0.4, color: 'rgba(226, 232, 240, 0.2)' },
  { id: 9, size: 60, x: screenWidth * 0.6, y: screenHeight * 0.4, delay: 3500, duration: 9500, opacity: 0.35, color: 'rgba(59, 130, 246, 0.2)' },
  { id: 10, size: 55, x: screenWidth * 0.4, y: screenHeight * 0.9, delay: 4500, duration: 10500, opacity: 0.4, color: 'rgba(226, 232, 240, 0.18)' },

  // Extra small bubbles for detail
  { id: 11, size: 35, x: screenWidth * 0.85, y: screenHeight * 0.15, delay: 600, duration: 6000, opacity: 0.5, color: 'rgba(255, 255, 255, 0.18)' },
  { id: 12, size: 30, x: screenWidth * 0.15, y: screenHeight * 0.35, delay: 1800, duration: 7200, opacity: 0.45, color: 'rgba(148, 163, 184, 0.25)' },
  { id: 13, size: 25, x: screenWidth * 0.75, y: screenHeight * 0.75, delay: 3200, duration: 8800, opacity: 0.55, color: 'rgba(59, 130, 246, 0.22)' },
  { id: 14, size: 45, x: screenWidth * 0.25, y: screenHeight * 0.25, delay: 4800, duration: 10400, opacity: 0.4, color: 'rgba(226, 232, 240, 0.22)' },
  { id: 15, size: 20, x: screenWidth * 0.95, y: screenHeight * 0.45, delay: 2800, duration: 7600, opacity: 0.55, color: 'rgba(255, 255, 255, 0.24)' },
];

const BubbleBackground: React.FC = () => {
  const animatedValues = bubbles.map(() => useSharedValue(0));

  useEffect(() => {
    // Start with static bubbles first to ensure visibility
    bubbles.forEach((bubble, index) => {
      // Set initial opacity to make bubbles visible immediately
      animatedValues[index].value = 0.5;
      
      // Then start the animation after a short delay
      setTimeout(() => {
        animatedValues[index].value = withDelay(
          bubble.delay,
          withRepeat(
            withTiming(1, {
              duration: bubble.duration,
              easing: Easing.inOut(Easing.ease),
            }),
            -1,
            false
          )
        );
      }, 1000);
    });
  }, []);

  const renderBubble = (bubble: Bubble, index: number) => {
    const animatedStyle = useAnimatedStyle(() => {
      const progress = animatedValues[index].value;
      
      // Floating animation - move up and down
      const translateY = interpolate(
        progress,
        [0, 0.5, 1],
        [0, -30, 0]
      );
      
      // Scale animation - subtle breathing effect
      const scale = interpolate(
        progress,
        [0, 0.5, 1],
        [1, 1.1, 1]
      );
      
      // Opacity animation - fade in and out
      const opacity = interpolate(
        progress,
        [0, 0.3, 0.7, 1],
        [0, bubble.opacity, bubble.opacity, 0]
      );

      return {
        transform: [
          { translateY },
          { scale },
        ],
        opacity,
      };
    });

    return (
      <Animated.View
        key={bubble.id}
        style={[
          styles.bubble,
          {
            width: bubble.size,
            height: bubble.size,
            left: bubble.x,
            top: bubble.y,
            backgroundColor: bubble.color,
          },
          animatedStyle,
        ]}
      />
    );
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#020617', '#0b1120', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      {bubbles.map((bubble, index) => renderBubble(bubble, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 1000, // Large value to ensure perfect circles
    shadowColor: 'rgba(15, 118, 110, 0.6)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
});

export default BubbleBackground;
