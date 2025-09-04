import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
interface AnimatedProgressBarProps {
  progress: number; // 0-100
  duration?: number;
  height?: number;
  variant?: 'linear' | 'circular';
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  duration = 1000,
  height = 8,
  variant = 'linear',
  showPercentage = true,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  className,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const startProgress = animatedProgress;
    const endProgress = Math.max(0, Math.min(100, progress));
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progressRatio, 4);
      const currentProgress = startProgress + (endProgress - startProgress) * easeOutQuart;
      
      setAnimatedProgress(currentProgress);
      
      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [progress, duration]);

  if (variant === 'circular') {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

    return (
      <View className={`items-center justify-center ${className}`}>
        <View className="relative">
          {/* Background circle */}
          <View
            className="absolute"
            style={{
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderWidth: 8,
              borderColor: backgroundColor,
            }}
          />
          {/* Progress circle */}
          <View
            className="absolute"
            style={{
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderWidth: 8,
              borderColor: color,
              borderLeftColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [{ rotate: '-90deg' }],
            }}
          />
          {/* Percentage text */}
          {showPercentage && (
            <Text className="text-lg font-bold text-gray-700">
              {Math.round(animatedProgress)}%
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={`${className}`}>
      {/* Background bar */}
      <View
        className="rounded-full"
        style={{
          height,
          backgroundColor,
        }}
      >
        {/* Progress bar */}
        <View
          className="rounded-full"
          style={{
            height,
            width: `${animatedProgress}%`,
            backgroundColor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </View>
      
      {/* Percentage text */}
      {showPercentage && (
        <Text className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(animatedProgress)}%
        </Text>
      )}
    </View>
  );
}; 