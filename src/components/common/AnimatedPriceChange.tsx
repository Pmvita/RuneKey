import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledText = styled(Text);

interface AnimatedPriceChangeProps {
  value: number;
  previousValue?: number;
  duration?: number;
  className?: string;
}

export const AnimatedPriceChange: React.FC<AnimatedPriceChangeProps> = ({
  value,
  previousValue = 0,
  duration = 500,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1); // Start visible

  useEffect(() => {
    // Animate the value change
    const startValue = previousValue;
    const endValue = value;
    const startTime = Date.now();
    
    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };
    
    animateValue();

    // Trigger scale animation when value changes
    if (value !== previousValue) {
      console.log('🎯 ANIMATION: Price change indicator scaled to ' + value.toFixed(2) + '%');
      // Scale up
      setScale(1.2);
      setOpacity(1);
      
      // Reset scale after animation
      setTimeout(() => {
        setScale(1);
        // Don't fade out - keep it visible
        // setTimeout(() => {
        //   setOpacity(0);
        // }, 200);
      }, 300);
    }
  }, [value, previousValue, duration]);

  const isPositive = value >= 0;
  const iconName = isPositive ? 'trending-up' : 'trending-down';
  const color = isPositive ? '#16a34a' : '#dc2626';

  return (
    <StyledView
      className={`flex-row items-center px-3 py-2 rounded-lg ${
        isPositive ? 'bg-green-100' : 'bg-red-100'
      } ${className}`}
      style={{
        transform: [{ scale }],
        opacity: opacity,
      }}
    >
      <Ionicons name={iconName as any} size={16} color={color} />
      <StyledText 
        className={`ml-1 font-semibold ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {`${isPositive ? '+' : ''}${displayValue.toFixed(2)}%`}
      </StyledText>
    </StyledView>
  );
}; 