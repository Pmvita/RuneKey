import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../stores/app/useAppStore';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  icon: string;
  title: string;
  description: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    icon: 'shield-checkmark',
    title: 'Secure & Private',
    description: 'Your private keys are stored securely on your device. We never have access to your funds or personal information.',
  },
  {
    id: 2,
    icon: 'globe',
    title: 'Multi-Chain Support',
    description: 'Access Ethereum, Polygon, BSC, Avalanche, and more blockchains all from one wallet.',
  },
  {
    id: 3,
    icon: 'swap-horizontal',
    title: 'Easy Token Swaps',
    description: 'Swap tokens across different networks with the best rates from leading DEX aggregators.',
  },
  {
    id: 4,
    icon: 'bar-chart',
    title: 'Portfolio Tracking',
    description: 'Track your portfolio value, price changes, and transaction history all in one place.',
  },
];

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setFirstLaunch } = useAppStore();

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setFirstLaunch(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    setFirstLaunch(false);
    onComplete();
  };

  return (
    <SafeAreaView className="flex-1 bg-ice-200 dark:bg-ice-950">
      {/* Icy blue background overlay */}
      <View 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
        }}
      />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center p-6">
          <Text className="text-primary-500 font-medium">
            {currentSlide + 1} of {onboardingSlides.length}
          </Text>
          {currentSlide < onboardingSlides.length - 1 && (
            <Button
              title="Skip"
              onPress={handleSkip}
              variant="outline"
              size="sm"
            />
          )}
        </View>

        {/* Progress Bar */}
        <View className="px-6 mb-8">
          <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <View 
              className="h-2 bg-primary-500 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentSlide + 1) / onboardingSlides.length) * 100}%` 
              }}
            />
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-6">
          <View className="items-center justify-center flex-1">
            {/* Icon */}
            <View className="w-32 h-32 bg-glass-white dark:bg-glass-dark border-2 border-glass-frost dark:border-ice-700/50 rounded-full items-center justify-center mb-8 shadow-lg">
              <Image
                source={require('../../../assets/icon.png')}
                className="w-16 h-16"
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
              {onboardingSlides[currentSlide].title}
            </Text>

            {/* Description */}
            <Text className="text-lg text-gray-600 dark:text-gray-400 text-center leading-relaxed">
              {onboardingSlides[currentSlide].description}
            </Text>
          </View>
        </View>

        {/* Navigation */}
        <View className="p-6">
          <Button
            title={currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};