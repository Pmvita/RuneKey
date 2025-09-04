import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  className,
}) => {
  const [opacity, setOpacity] = useState(0.3);

  useEffect(() => {
    let direction = 1;
    let currentOpacity = 0.3;
    
    const animate = () => {
      if (direction === 1) {
        currentOpacity += 0.02;
        if (currentOpacity >= 0.7) {
          direction = -1;
        }
      } else {
        currentOpacity -= 0.02;
        if (currentOpacity <= 0.3) {
          direction = 1;
        }
      }
      
      setOpacity(currentOpacity);
    };
    
    const interval = setInterval(animate, 50);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View
      className={`bg-gray-200 ${className}`}
      style={[
        {
          width,
          height,
          borderRadius,
          opacity,
        },
      ]}
    />
  );
};

// Predefined skeleton components for common use cases
export const TokenSkeleton: React.FC = () => (
  <View className="flex-row items-center p-4 border-b border-gray-100">
    <SkeletonLoader width={40} height={40} borderRadius={20} className="mr-3" />
    <View className="flex-1">
      <SkeletonLoader width="60%" height={16} className="mb-2" />
      <SkeletonLoader width="40%" height={12} />
    </View>
    <View className="items-end">
      <SkeletonLoader width={80} height={16} className="mb-2" />
      <SkeletonLoader width={60} height={12} />
    </View>
  </View>
);

export const PortfolioSkeleton: React.FC = () => (
  <View className="p-6 border border-gray-200 rounded-xl">
    <SkeletonLoader width="40%" height={14} className="mb-2" />
    <SkeletonLoader width="70%" height={32} className="mb-4" />
    <SkeletonLoader width="30%" height={12} />
  </View>
); 