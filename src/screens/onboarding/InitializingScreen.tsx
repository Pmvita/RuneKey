import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

const StyledView = styled(View);
const StyledText = styled(Text);

interface InitializingScreenProps {
  onComplete: () => void;
}

export const InitializingScreen: React.FC<InitializingScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Simulate initialization process
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0f172a' }}>
      {/* Animated background elements */}
      <StyledView 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          backgroundColor: '#0f172a', // Fallback for React Native
        }}
      />
      
      {/* Floating background circles */}
      <StyledView 
        className="absolute w-96 h-96 rounded-full opacity-10"
        style={{
          top: -150,
          left: -100,
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
        }}
      />
      <StyledView 
        className="absolute w-80 h-80 rounded-full opacity-15"
        style={{
          bottom: -120,
          right: -80,
          backgroundColor: 'rgba(186, 230, 253, 0.1)',
        }}
      />

      {/* Content */}
      <StyledView className="flex-1 justify-center items-center px-6">
        <StyledText className="text-3xl font-bold text-frost-300 mb-2">
          Initializing Wallet
        </StyledText>
        <StyledText className="text-lg text-ice-400 text-center mb-8">
          Setting up your secure environment...
        </StyledText>
        
        <ActivityIndicator size="large" color="#38bdf8" />
        
        <StyledView className="mt-8 space-y-2">
          <StyledText className="text-sm text-ice-500 text-center">
            • Establishing secure connection
          </StyledText>
          <StyledText className="text-sm text-ice-500 text-center">
            • Loading blockchain networks
          </StyledText>
          <StyledText className="text-sm text-ice-500 text-center">
            • Preparing wallet interface
          </StyledText>
        </StyledView>
      </StyledView>
    </SafeAreaView>
  );
};