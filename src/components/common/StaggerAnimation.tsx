import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);

interface StaggerAnimationProps {
  children: React.ReactNode[];
  delay?: number;
  duration?: number;
  animation?: 'fadeIn' | 'slideUp' | 'scaleIn' | 'slideInLeft';
  className?: string;
}

export const StaggerAnimation: React.FC<StaggerAnimationProps> = ({
  children,
  delay = 100,
  duration = 500,
  animation = 'fadeIn',
  className,
}) => {
  const [animatedItems, setAnimatedItems] = useState<boolean[]>([]);

  useEffect(() => {
    const animateItems = () => {
      children.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedItems(prev => {
            const newItems = [...prev];
            newItems[index] = true;
            return newItems;
          });
        }, index * delay);
      });
    };

    animateItems();
  }, [children, delay]);

  const getAnimationStyle = (index: number) => {
    const isAnimated = animatedItems[index];
    
    switch (animation) {
      case 'fadeIn':
        return {
          opacity: isAnimated ? 1 : 0,
          transform: [{ scale: isAnimated ? 1 : 0.8 }],
        };
      case 'slideUp':
        return {
          opacity: isAnimated ? 1 : 0,
          transform: [{ translateY: isAnimated ? 0 : 50 }],
        };
      case 'scaleIn':
        return {
          opacity: isAnimated ? 1 : 0,
          transform: [{ scale: isAnimated ? 1 : 0 }],
        };
      case 'slideInLeft':
        return {
          opacity: isAnimated ? 1 : 0,
          transform: [{ translateX: isAnimated ? 0 : -50 }],
        };
      default:
        return {
          opacity: isAnimated ? 1 : 0,
        };
    }
  };

  return (
    <StyledView className={className}>
      {children.map((child, index) => (
        <StyledView
          key={index}
          style={{
            ...getAnimationStyle(index),
            transition: `all ${duration}ms ease-out`,
          }}
        >
          {child}
        </StyledView>
      ))}
    </StyledView>
  );
}; 