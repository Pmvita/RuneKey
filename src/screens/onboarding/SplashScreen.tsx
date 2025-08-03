import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/app/useAppStore';
import { useWalletStore } from '../../stores/wallet/useWalletStore';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

interface SplashScreenProps {
  onComplete: (destination: 'onboarding' | 'auth' | 'main') => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { isFirstLaunch } = useAppStore();
  const { isConnected } = useWalletStore();

  useEffect(() => {
    const initializeApp = async () => {
      // Simulate app initialization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Determine where to navigate
      if (isFirstLaunch) {
        onComplete('onboarding');
      } else if (!isConnected) {
        onComplete('auth');
      } else {
        onComplete('main');
      }
    };

    initializeApp();
  }, [isFirstLaunch, isConnected, onComplete]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0f172a' }}>
      {/* Icy Blue Gradient Background */}
      <StyledView 
        className="flex-1 items-center justify-center px-6"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #38bdf8 100%)',
          backgroundColor: '#0f172a', // Fallback for React Native
        }}
      >
        {/* Animated Background Effects */}
        <StyledView 
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
          }}
        />
        <StyledView 
          className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20"
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.3)',
          }}
        />
        <StyledView 
          className="absolute bottom-40 right-8 w-24 h-24 rounded-full opacity-15"
          style={{
            backgroundColor: 'rgba(186, 230, 253, 0.4)',
          }}
        />

        {/* App Logo */}
        <StyledView className="items-center mb-8 z-10">
          <StyledView className="w-32 h-32 bg-white/90 dark:bg-gray-800/90 border-2 border-glass-frost rounded-full items-center justify-center mb-6 shadow-lg">
            <StyledImage
              source={require('../../../assets/icon.png')}
              className="w-20 h-20"
            />
          </StyledView>
          <StyledText className="text-5xl font-bold text-frost-100 mb-3">
            RuneKey
          </StyledText>
          <StyledText className="text-lg text-frost-200 text-center opacity-90">
            Your gateway to the decentralized world
          </StyledText>
        </StyledView>

        {/* Loading Indicator */}
        <StyledView className="items-center z-10">
          <ActivityIndicator size="large" color="#38bdf8" />
          <StyledText className="text-frost-200 mt-4 text-base">
            Initializing your wallet...
          </StyledText>
        </StyledView>

        {/* Version */}
        <StyledView className="absolute bottom-8 z-10">
          <StyledText className="text-ice-400 text-sm">
            Version 1.0.0
          </StyledText>
        </StyledView>
      </StyledView>
    </SafeAreaView>
  );
};