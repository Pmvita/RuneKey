import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../stores/app/useAppStore';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);

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
      <StyledView 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.03)',
        }}
      />
      <StyledScrollView className="flex-1">
        {/* Header */}
        <StyledView className="flex-row justify-between items-center p-6">
          <StyledText className="text-primary-500 font-medium">
            {currentSlide + 1} of {onboardingSlides.length}
          </StyledText>
          {currentSlide < onboardingSlides.length - 1 && (
            <Button
              title="Skip"
              onPress={handleSkip}
              variant="outline"
              size="sm"
            />
          )}
        </StyledView>

        {/* Progress Bar */}
        <StyledView className="px-6 mb-8">
          <StyledView className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <StyledView 
              className="h-2 bg-primary-500 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentSlide + 1) / onboardingSlides.length) * 100}%` 
              }}
            />
          </StyledView>
        </StyledView>

        {/* Content */}
        <StyledView className="flex-1 px-6">
          <StyledView className="items-center justify-center flex-1">
            {/* Icon */}
            <StyledView className="w-32 h-32 bg-glass-white dark:bg-glass-dark border-2 border-glass-frost dark:border-ice-700/50 rounded-full items-center justify-center mb-8 shadow-lg">
              <StyledImage
                source={require('../../../assets/icon.png')}
                className="w-16 h-16"
                resizeMode="contain"
              />
            </StyledView>

            {/* Title */}
            <StyledText className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
              {onboardingSlides[currentSlide].title}
            </StyledText>

            {/* Description */}
            <StyledText className="text-lg text-gray-600 dark:text-gray-400 text-center leading-relaxed">
              {onboardingSlides[currentSlide].description}
            </StyledText>
          </StyledView>
        </StyledView>

        {/* Navigation */}
        <StyledView className="p-6">
          <Button
            title={currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            fullWidth
          />
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};