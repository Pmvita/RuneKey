import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { logger } from '../../utils/logger';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: 'currency' | 'percentage' | 'number';
  style?: any;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  format = 'currency',
  style,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = 0;
    const endValue = value;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('🎯 ANIMATION: Portfolio value animated to $' + currentValue.toLocaleString());
      }
    };
    
    animate();
  }, [value, duration]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  return (
    <Text
      className={className}
      style={style}
    >
      {formatValue(displayValue)}
    </Text>
  );
}; 